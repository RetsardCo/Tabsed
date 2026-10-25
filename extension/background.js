// Tabsed Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  console.log('Tabsed Extension installed successfully.');
});

// Listener for popup messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveTabs') {
    handleSaveTabs(request)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep asynchronous channel open
  }
});

async function handleSaveTabs(request) {
  const { tabs, collectionId, captureThumbnails, closeAfterSave } = request;
  
  if (!tabs || tabs.length === 0) {
    return { success: false, error: 'No tabs provided' };
  }

  const stagedTabs = [];

  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    const url = tab.url || '';
    
    // Skip internal browser schemes where scripting/capture is forbidden
    const isRestricted = url.startsWith('chrome://') || 
                         url.startsWith('edge://') || 
                         url.startsWith('about:') ||
                         url.startsWith('chrome-extension://');

    let domain = '';
    try {
      if (url && !isRestricted) {
        domain = new URL(url).hostname.replace(/^www\./, '');
      }
    } catch (e) {
      domain = '';
    }

    let thumbnailDataUrl = tab.thumbnail || null;
    if (!thumbnailDataUrl && captureThumbnails && !isRestricted && tab.active) {
      try {
        const captureOpts = { format: 'jpeg', quality: 80 };
        if (typeof tab.windowId === 'number') {
          try {
            thumbnailDataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, captureOpts);
          } catch (winErr) {
            thumbnailDataUrl = await chrome.tabs.captureVisibleTab(captureOpts);
          }
        } else {
          thumbnailDataUrl = await chrome.tabs.captureVisibleTab(captureOpts);
        }
      } catch (e) {
        console.warn(`Thumbnail capture blocked or unavailable for tab ${tab.id}:`, e);
      }
    }

    // Cascade favicon: tab.favIconUrl -> Google S2 favicon service (64px) -> null (desktop UI uses logo-32/squircle)
    const resolvedFavicon = tab.favIconUrl || (domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` : null);

    // Rich preview metadata for background tabs or when screenshot is unavailable
    const richPreviewMetadata = {
      domain: domain,
      isBackgroundTab: !tab.active,
      hasScreenshot: !!thumbnailDataUrl,
      previewType: thumbnailDataUrl ? 'screenshot' : 'rich_preview',
      status: tab.status || 'complete',
      audible: !!tab.audible,
      discarded: !!tab.discarded,
      pinned: !!tab.pinned
    };

    stagedTabs.push({
      tabId: tab.id,
      windowId: tab.windowId,
      url: url,
      title: tab.title || 'Untitled',
      domain: domain,
      favIconUrl: resolvedFavicon,
      pinned: tab.pinned || false,
      orderIndex: tab.index,
      groupId: tab.groupId || null,
      thumbnail: thumbnailDataUrl,
      previewMetadata: richPreviewMetadata,
      collectionId: collectionId || 'inbox',
      browserFamily: navigator.userAgent.includes('Edg') ? 'Edge' : 'Chrome',
      capturedAt: new Date().toISOString(),
      saveAsIndividual: request.saveAsIndividual ?? true
    });
  }

  // Transaction Step: Send staged tabs via Chrome/Edge Native Messaging to Tabsed Desktop
  let commitResult = null;
  try {
    commitResult = await new Promise((resolve, reject) => {
      if (typeof chrome.runtime.sendNativeMessage === 'function') {
        chrome.runtime.sendNativeMessage('com.tabsed.app', {
          type: 'saveTabs',
          payload: {
            tabs: stagedTabs,
            saveAsIndividual: request.saveAsIndividual ?? true
          },
          timestamp: new Date().toISOString()
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response || { success: true, committedTabIds: stagedTabs.map(t => t.tabId) });
          }
        });
      } else {
        reject(new Error('Native messaging unavailable'));
      }
    });
  } catch (err) {
    console.warn('Native messaging host unreachable. Falling back to local extension storage cache:', err.message);
    // Fallback: save to chrome.storage.local so Tabsed desktop can sync upon launch
    await saveToLocalStorage(stagedTabs);
    commitResult = {
      success: true,
      committedTabIds: stagedTabs.map(t => t.tabId),
      failedTabIds: [],
      storageMode: 'extension-cache'
    };
  }

  // Safety Gate: Close ONLY successfully committed tabs
  let closedCount = 0;
  if (closeAfterSave && commitResult && commitResult.success) {
    const committedIds = commitResult.committedTabIds || [];
    for (const rawId of committedIds) {
      const tabId = typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;
      if (!Number.isNaN(tabId)) {
        try {
          await chrome.tabs.remove(tabId);
          closedCount++;
        } catch (removeErr) {
          console.error(`Failed to close committed tab ${tabId}:`, removeErr);
        }
      }
    }
  }

  return {
    success: commitResult.success,
    savedCount: commitResult.committedTabIds?.length || stagedTabs.length,
    closedCount: closedCount,
    failedCount: commitResult.failedTabIds?.length || 0,
    storageMode: commitResult.storageMode || 'desktop-vault'
  };
}

async function saveToLocalStorage(tabs) {
  const existing = await chrome.storage.local.get(['tabsed_pending_saves']);
  const list = existing.tabsed_pending_saves || [];
  list.push({
    batchId: 'batch_' + Date.now(),
    timestamp: new Date().toISOString(),
    tabs: tabs
  });
  await chrome.storage.local.set({ tabsed_pending_saves: list });
}

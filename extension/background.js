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
    
    // Skip internal browser schemes where scripting/capture is forbidden
    const isRestricted = tab.url.startsWith('chrome://') || 
                         tab.url.startsWith('edge://') || 
                         tab.url.startsWith('about:') ||
                         tab.url.startsWith('chrome-extension://');

    let thumbnailDataUrl = null;
    if (captureThumbnails && !isRestricted && tab.active) {
      try {
        thumbnailDataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
          format: 'jpeg',
          quality: 60
        });
      } catch (e) {
        console.warn(`Thumbnail capture blocked or unavailable for tab ${tab.id}:`, e);
      }
    }

    stagedTabs.push({
      tabId: tab.id,
      windowId: tab.windowId,
      url: tab.url,
      title: tab.title || 'Untitled',
      favIconUrl: tab.favIconUrl || null,
      pinned: tab.pinned || false,
      orderIndex: tab.index,
      groupId: tab.groupId || null,
      thumbnail: thumbnailDataUrl,
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

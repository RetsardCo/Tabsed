// Tabsed Background Service Worker (Manifest V3)

const DESKTOP_BRIDGE_URL = 'http://127.0.0.1:39201/api/save';

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
      capturedAt: new Date().toISOString()
    });
  }

  // Transaction Step: Send staged tabs to local Tabsed Desktop Service or Local Storage
  let commitResult = null;
  try {
    const res = await fetch(DESKTOP_BRIDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'commitSave',
        tabs: stagedTabs
      })
    });
    
    if (res.ok) {
      commitResult = await res.json();
    } else {
      throw new Error(`Desktop service returned HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn('Direct desktop bridge unreachable. Falling back to local storage cache:', err.message);
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
    for (const tabId of committedIds) {
      try {
        await chrome.tabs.remove(tabId);
        closedCount++;
      } catch (removeErr) {
        console.error(`Failed to close committed tab ${tabId}:`, removeErr);
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

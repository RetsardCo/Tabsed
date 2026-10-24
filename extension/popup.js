// Tabsed Extension Popup Controller

let currentTabs = [];

document.addEventListener('DOMContentLoaded', async () => {
  const tabCountEl = document.getElementById('tab-count');
  const collectionSelect = document.getElementById('collection-select');
  const captureThumbnailsEl = document.getElementById('capture-thumbnails');
  const excludePinnedEl = document.getElementById('exclude-pinned');
  const saveCurrentTabBtn = document.getElementById('save-current-tab');
  const saveWindowBtn = document.getElementById('save-window');
  const saveAndCloseBtn = document.getElementById('save-and-close-window');
  const resultMessageEl = document.getElementById('result-message');
  const openDesktopLink = document.getElementById('open-desktop');

  // Query current window tabs
  try {
    currentTabs = await chrome.tabs.query({ currentWindow: true });
    // Filter private/incognito tabs by default (FR-016)
    const normalTabs = currentTabs.filter(t => !t.incognito);
    const pinnedCount = normalTabs.filter(t => t.pinned).length;
    
    tabCountEl.textContent = `${normalTabs.length} tabs open (${pinnedCount} pinned)`;
  } catch (err) {
    tabCountEl.textContent = 'Could not read tabs: ' + err.message;
  }

  function showMessage(msg, isError = false) {
    resultMessageEl.textContent = msg;
    resultMessageEl.className = 'result-message ' + (isError ? 'error' : 'success');
    resultMessageEl.classList.remove('hidden');
    setTimeout(() => {
      resultMessageEl.classList.add('hidden');
    }, 4000);
  }

  // Handle Save Active Tab
  saveCurrentTabBtn.addEventListener('click', async () => {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.url) {
        showMessage('No active tab found.', true);
        return;
      }
      if (activeTab.incognito) {
        showMessage('Private tabs are excluded by default.', true);
        return;
      }

      saveCurrentTabBtn.disabled = true;
      saveCurrentTabBtn.textContent = 'Saving...';

      const response = await chrome.runtime.sendMessage({
        action: 'saveTabs',
        tabs: [activeTab],
        collectionId: collectionSelect.value,
        captureThumbnails: captureThumbnailsEl.checked,
        closeAfterSave: false
      });

      if (response && response.success) {
        showMessage('Saved "' + (activeTab.title || 'Tab') + '" to Tabsed.');
      } else {
        showMessage(response?.error || 'Save failed. Source tab left open.', true);
      }
    } catch (err) {
      showMessage('Error: ' + err.message, true);
    } finally {
      saveCurrentTabBtn.disabled = false;
      saveCurrentTabBtn.textContent = 'Save Active Tab';
    }
  });

  // Handle Save Window
  saveWindowBtn.addEventListener('click', async () => {
    await executeWindowSave(false);
  });

  // Handle Save & Close Window
  saveAndCloseBtn.addEventListener('click', async () => {
    if (!confirm('Tabsed will save your tabs before closing them. Any tabs that fail to save will stay open. Proceed?')) {
      return;
    }
    await executeWindowSave(true);
  });

  async function executeWindowSave(closeAfterSave) {
    const btn = closeAfterSave ? saveAndCloseBtn : saveWindowBtn;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Processing...';

    try {
      let tabsToSave = currentTabs.filter(t => !t.incognito);
      if (excludePinnedEl.checked) {
        tabsToSave = tabsToSave.filter(t => !t.pinned);
      }

      if (tabsToSave.length === 0) {
        showMessage('No eligible tabs to save.', true);
        return;
      }

      const response = await chrome.runtime.sendMessage({
        action: 'saveTabs',
        tabs: tabsToSave,
        collectionId: collectionSelect.value,
        captureThumbnails: captureThumbnailsEl.checked,
        closeAfterSave: closeAfterSave
      });

      if (response && response.success) {
        showMessage(`Successfully saved ${response.savedCount} tabs!`);
        if (closeAfterSave) {
          // If all saved tabs were closed, close popup
          setTimeout(() => window.close(), 1000);
        }
      } else {
        showMessage(response?.error || 'Save operation failed. No tabs were closed.', true);
      }
    } catch (err) {
      showMessage('Save failed: ' + err.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  openDesktopLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'http://localhost:3000' });
  });
});

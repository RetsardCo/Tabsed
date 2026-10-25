// Tabsed Extension Popup Controller - Professional UI/UX Redesign

let allWindowTabs = [];
let activeTab = null;
let selectedTabIds = new Set();
let currentMode = 'active'; // 'active' | 'select' | 'all'

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const statusBadge = document.getElementById('status-badge');
  const statusText = document.getElementById('status-text');
  
  // Hero Active Card
  const activeFavicon = document.getElementById('active-tab-favicon');
  const activeGlobe = document.getElementById('active-tab-globe');
  const activeTitle = document.getElementById('active-tab-title');
  const activeDomain = document.getElementById('active-tab-domain');
  const quickSaveActiveBtn = document.getElementById('quick-save-active-btn');
  
  // Segment Buttons
  const modeTabActive = document.getElementById('mode-tab-active');
  const modeTabSelect = document.getElementById('mode-tab-select');
  const modeTabAll = document.getElementById('mode-tab-all');
  const selectModeCountPill = document.getElementById('select-mode-count-pill');
  const allModeCountPill = document.getElementById('all-mode-count-pill');
  
  // Mode Views
  const viewActiveMode = document.getElementById('view-active-mode');
  const viewSelectMode = document.getElementById('view-select-mode');
  const viewAllMode = document.getElementById('view-all-mode');
  
  // Mode 1: Active Tab Buttons
  const saveCurrentTabBtn = document.getElementById('save-current-tab');
  const saveAndCloseCurrentTabBtn = document.getElementById('save-and-close-current-tab');
  
  // Mode 2: Select Tabs
  const tabSearchInput = document.getElementById('tab-search-input');
  const selectAllBtn = document.getElementById('select-all-btn');
  const deselectAllBtn = document.getElementById('deselect-all-btn');
  const tabChecklist = document.getElementById('tab-checklist');
  const saveSelectedTabsBtn = document.getElementById('save-selected-tabs-btn');
  const saveAndCloseSelectedBtn = document.getElementById('save-and-close-selected-btn');
  
  // Mode 3: All Tabs
  const allTabsLargeCount = document.getElementById('all-tabs-large-count');
  const saveWindowBtn = document.getElementById('save-window');
  const saveAndCloseWindowBtn = document.getElementById('save-and-close-window');
  
  // Settings & Status
  const collectionSelect = document.getElementById('collection-select');
  const captureThumbnailsEl = document.getElementById('capture-thumbnails');
  const excludePinnedEl = document.getElementById('exclude-pinned');
  const excludePinnedText = document.getElementById('exclude-pinned-text');
  const resultMessageEl = document.getElementById('result-message');
  const openDesktopLink = document.getElementById('open-desktop');

  // Query window tabs
  try {
    const rawTabs = await chrome.tabs.query({ currentWindow: true });
    allWindowTabs = rawTabs.filter(t => !t.incognito);
    activeTab = allWindowTabs.find(t => t.active) || allWindowTabs[0] || null;

    // Default select all tabs for the checklist
    selectedTabIds = new Set(allWindowTabs.map(t => t.id));

    // Update Counts & Badges
    const pinnedCount = allWindowTabs.filter(t => t.pinned).length;
    allModeCountPill.textContent = allWindowTabs.length;
    selectModeCountPill.textContent = selectedTabIds.size;
    allTabsLargeCount.textContent = allWindowTabs.length;

    if (excludePinnedText) {
      excludePinnedText.textContent = pinnedCount > 0
        ? `Exclude pinned tabs (${pinnedCount} pinned)`
        : 'Exclude pinned tabs';
    }

    // Populate Active Tab Hero Card
    if (activeTab) {
      activeTitle.textContent = activeTab.title || 'Active Tab';
      try {
        const u = new URL(activeTab.url);
        activeDomain.textContent = u.hostname.replace(/^www\./, '');
      } catch {
        activeDomain.textContent = activeTab.url || 'Web';
      }

      if (activeTab.favIconUrl) {
        activeFavicon.src = activeTab.favIconUrl;
        activeFavicon.style.display = 'block';
        activeGlobe.style.display = 'none';
        activeFavicon.onerror = () => {
          activeFavicon.style.display = 'none';
          activeGlobe.style.display = 'block';
        };
      } else {
        activeFavicon.style.display = 'none';
        activeGlobe.style.display = 'block';
      }
    } else {
      activeTitle.textContent = 'No tab active';
      activeDomain.textContent = '';
    }

    renderChecklist();
  } catch (err) {
    activeTitle.textContent = 'Error loading tabs';
    activeDomain.textContent = err.message;
  }

  // Segment Tab Navigation
  function switchMode(newMode) {
    currentMode = newMode;
    modeTabActive.classList.toggle('active', newMode === 'active');
    modeTabSelect.classList.toggle('active', newMode === 'select');
    modeTabAll.classList.toggle('active', newMode === 'all');

    viewActiveMode.classList.toggle('hidden', newMode !== 'active');
    viewSelectMode.classList.toggle('hidden', newMode !== 'select');
    viewAllMode.classList.toggle('hidden', newMode !== 'all');
  }

  modeTabActive.addEventListener('click', () => switchMode('active'));
  modeTabSelect.addEventListener('click', () => switchMode('select'));
  modeTabAll.addEventListener('click', () => switchMode('all'));

  // Render Checkbox list for Mode 2
  function renderChecklist(filterText = '') {
    tabChecklist.innerHTML = '';
    const q = filterText.toLowerCase().trim();

    const filtered = allWindowTabs.filter(t => {
      if (!q) return true;
      return (t.title && t.title.toLowerCase().includes(q)) ||
             (t.url && t.url.toLowerCase().includes(q));
    });

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.style.padding = '12px';
      empty.style.textAlign = 'center';
      empty.style.color = 'var(--text-muted)';
      empty.style.fontSize = '12px';
      empty.textContent = 'No matching open tabs.';
      tabChecklist.appendChild(empty);
      return;
    }

    for (const tab of filtered) {
      const item = document.createElement('label');
      item.className = 'tab-checklist-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = selectedTabIds.has(tab.id);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          selectedTabIds.add(tab.id);
        } else {
          selectedTabIds.delete(tab.id);
        }
        updateSelectModeUI();
      });

      const fav = document.createElement('img');
      fav.className = 'tab-check-fav';
      fav.src = tab.favIconUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
      fav.onerror = () => {
        fav.style.display = 'none';
      };

      const titleSpan = document.createElement('span');
      titleSpan.className = 'tab-check-text';
      titleSpan.textContent = tab.title || tab.url || 'Untitled Tab';
      titleSpan.title = `${tab.title}\n${tab.url}`;

      item.appendChild(checkbox);
      item.appendChild(fav);
      item.appendChild(titleSpan);
      tabChecklist.appendChild(item);
    }

    updateSelectModeUI();
  }

  function updateSelectModeUI() {
    selectModeCountPill.textContent = selectedTabIds.size;
    saveSelectedTabsBtn.textContent = `Save ${selectedTabIds.size} Selected Tab${selectedTabIds.size === 1 ? '' : 's'}`;
    saveSelectedTabsBtn.disabled = selectedTabIds.size === 0;
    saveAndCloseSelectedBtn.disabled = selectedTabIds.size === 0;
  }

  // Search filter
  tabSearchInput.addEventListener('input', (e) => {
    renderChecklist(e.target.value);
  });

  // Select All / Deselect All
  selectAllBtn.addEventListener('click', () => {
    allWindowTabs.forEach(t => selectedTabIds.add(t.id));
    renderChecklist(tabSearchInput.value);
  });

  deselectAllBtn.addEventListener('click', () => {
    selectedTabIds.clear();
    renderChecklist(tabSearchInput.value);
  });

  function showMessage(msg, isError = false) {
    resultMessageEl.textContent = msg;
    resultMessageEl.className = 'result-message ' + (isError ? 'error' : 'success');
    resultMessageEl.classList.remove('hidden');
    setTimeout(() => {
      resultMessageEl.classList.add('hidden');
    }, 4500);
  }

  // Save Execution Handler
  async function executeSave(tabsToSave, closeAfterSave, btnElement) {
    if (!tabsToSave || tabsToSave.length === 0) {
      showMessage('No tabs selected to save.', true);
      return;
    }

    const originalText = btnElement ? btnElement.textContent : 'Saving...';
    if (btnElement) {
      btnElement.disabled = true;
      btnElement.textContent = 'Saving individual cards...';
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'saveTabs',
        tabs: tabsToSave,
        collectionId: collectionSelect.value,
        captureThumbnails: captureThumbnailsEl.checked,
        closeAfterSave: closeAfterSave,
        saveAsIndividual: true
      });

      if (response && response.success) {
        const count = response.savedCount || tabsToSave.length;
        const msg = count === 1
          ? `✓ Saved 1 tab to ${collectionSelect.options[collectionSelect.selectedIndex].text}!`
          : `✓ Saved ${count} individual tab cards to ${collectionSelect.options[collectionSelect.selectedIndex].text}!`;
        showMessage(msg);

        if (closeAfterSave) {
          setTimeout(() => window.close(), 1200);
        }
      } else {
        showMessage(response?.error || 'Save failed. Tabs were kept open.', true);
      }
    } catch (err) {
      showMessage('Error: ' + err.message, true);
    } finally {
      if (btnElement) {
        btnElement.disabled = false;
        btnElement.textContent = originalText;
      }
    }
  }

  // 1. Quick Save Active Tab
  quickSaveActiveBtn.addEventListener('click', () => {
    if (activeTab) executeSave([activeTab], false, quickSaveActiveBtn);
  });

  // 2. Mode 1 Buttons
  saveCurrentTabBtn.addEventListener('click', () => {
    if (activeTab) executeSave([activeTab], false, saveCurrentTabBtn);
  });

  saveAndCloseCurrentTabBtn.addEventListener('click', () => {
    if (activeTab) {
      if (confirm(`Save and close "${activeTab.title || 'this tab'}"?`)) {
        executeSave([activeTab], true, saveAndCloseCurrentTabBtn);
      }
    }
  });

  // 3. Mode 2 Buttons (Selected Tabs)
  saveSelectedTabsBtn.addEventListener('click', () => {
    const tabsToSave = allWindowTabs.filter(t => selectedTabIds.has(t.id));
    executeSave(tabsToSave, false, saveSelectedTabsBtn);
  });

  saveAndCloseSelectedBtn.addEventListener('click', () => {
    const tabsToSave = allWindowTabs.filter(t => selectedTabIds.has(t.id));
    if (confirm(`Tabsed will save ${tabsToSave.length} selected tabs before closing them. Proceed?`)) {
      executeSave(tabsToSave, true, saveAndCloseSelectedBtn);
    }
  });

  // 4. Mode 3 Buttons (All Open Tabs)
  saveWindowBtn.addEventListener('click', () => {
    let tabsToSave = allWindowTabs;
    if (excludePinnedEl.checked) {
      tabsToSave = tabsToSave.filter(t => !t.pinned);
    }
    executeSave(tabsToSave, false, saveWindowBtn);
  });

  saveAndCloseWindowBtn.addEventListener('click', () => {
    let tabsToSave = allWindowTabs;
    if (excludePinnedEl.checked) {
      tabsToSave = tabsToSave.filter(t => !t.pinned);
    }
    if (confirm(`Tabsed will save all ${tabsToSave.length} tabs as individual cards before closing the window. Any tab that fails to save stays open. Proceed?`)) {
      executeSave(tabsToSave, true, saveAndCloseWindowBtn);
    }
  });

  openDesktopLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'http://localhost:3000' });
  });
});

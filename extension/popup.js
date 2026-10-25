// Tabsed Extension Popup Controller - Elite UI/UX Architecture

let allWindowTabs = [];
let activeTab = null;
let selectedTabIds = new Set();
let currentMode = 'active'; // 'active' | 'select' | 'all'

document.addEventListener('DOMContentLoaded', async () => {
  // Brand / Header Elements
  const statusBadge = document.getElementById('status-badge');
  const statusText = document.getElementById('status-text');

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

  // Mode 1: Active Tab Elements
  const activeFavicon = document.getElementById('active-tab-favicon');
  const activeGlobe = document.getElementById('active-tab-globe');
  const activeTitle = document.getElementById('active-tab-title');
  const activeDomain = document.getElementById('active-tab-domain');
  const collectionSelectActive = document.getElementById('collection-select-active');
  const captureThumbnailsActive = document.getElementById('capture-thumbnails-active');
  const closeAfterSaveActive = document.getElementById('close-after-save-active');
  const saveActiveTabBtn = document.getElementById('save-active-tab-btn');
  const saveActiveText = document.getElementById('save-active-text');

  // Mode 2: Select Tabs Elements
  const tabSearchInput = document.getElementById('tab-search-input');
  const selectAllBtn = document.getElementById('select-all-btn');
  const deselectAllBtn = document.getElementById('deselect-all-btn');
  const selectedCounterText = document.getElementById('selected-counter-text');
  const tabChecklist = document.getElementById('tab-checklist');
  const collectionSelectSelect = document.getElementById('collection-select-select');
  const captureThumbnailsSelect = document.getElementById('capture-thumbnails-select');
  const closeAfterSaveSelect = document.getElementById('close-after-save-select');
  const saveSelectedTabsBtn = document.getElementById('save-selected-tabs-btn');
  const saveSelectedText = document.getElementById('save-selected-text');

  // Mode 3: All Tabs Elements
  const allTabsLargeCount = document.getElementById('all-tabs-large-count');
  const collectionSelectAll = document.getElementById('collection-select-all');
  const excludePinnedEl = document.getElementById('exclude-pinned');
  const excludePinnedText = document.getElementById('exclude-pinned-text');
  const captureThumbnailsAll = document.getElementById('capture-thumbnails-all');
  const closeAfterSaveAll = document.getElementById('close-after-save-all');
  const saveAllTabsBtn = document.getElementById('save-all-tabs-btn');
  const saveAllText = document.getElementById('save-all-text');

  // Global / Shared Elements
  const resultMessageEl = document.getElementById('result-message');
  const openDesktopLink = document.getElementById('open-desktop');

  // Keep collection selections in sync across modes
  const collectionDropdowns = [collectionSelectActive, collectionSelectSelect, collectionSelectAll];
  collectionDropdowns.forEach(dropdown => {
    dropdown?.addEventListener('change', (e) => {
      const val = e.target.value;
      collectionDropdowns.forEach(d => { if (d && d !== e.target) d.value = val; });
    });
  });

  // Query window tabs
  try {
    const rawTabs = await chrome.tabs.query({ currentWindow: true });
    allWindowTabs = (rawTabs || []).filter(t => !t.incognito);
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

    // Populate Active Tab Preview
    if (activeTab) {
      activeTitle.textContent = activeTab.title || 'Active Tab';
      activeTitle.title = activeTab.title || 'Active Tab';
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
      activeTitle.textContent = 'No active tab detected';
      activeDomain.textContent = '';
      saveActiveTabBtn.disabled = true;
    }

    renderChecklist();
    updateModeButtonLabels();
  } catch (err) {
    activeTitle.textContent = 'Error loading tabs';
    activeDomain.textContent = err.message;
  }

  // Segment Tab Navigation
  function switchMode(newMode) {
    currentMode = newMode;
    modeTabActive.classList.toggle('active', newMode === 'active');
    modeTabActive.setAttribute('aria-selected', newMode === 'active' ? 'true' : 'false');

    modeTabSelect.classList.toggle('active', newMode === 'select');
    modeTabSelect.setAttribute('aria-selected', newMode === 'select' ? 'true' : 'false');

    modeTabAll.classList.toggle('active', newMode === 'all');
    modeTabAll.setAttribute('aria-selected', newMode === 'all' ? 'true' : 'false');

    viewActiveMode.classList.toggle('hidden', newMode !== 'active');
    viewSelectMode.classList.toggle('hidden', newMode !== 'select');
    viewAllMode.classList.toggle('hidden', newMode !== 'all');

    updateModeButtonLabels();
  }

  modeTabActive.addEventListener('click', () => switchMode('active'));
  modeTabSelect.addEventListener('click', () => switchMode('select'));
  modeTabAll.addEventListener('click', () => switchMode('all'));

  // Update Dynamic Button Labels based on options
  function updateModeButtonLabels() {
    // Mode 1: Active
    if (closeAfterSaveActive.checked) {
      saveActiveText.textContent = 'Save & Close Current Tab';
    } else {
      saveActiveText.textContent = 'Save Current Tab';
    }

    // Mode 2: Select
    const count = selectedTabIds.size;
    selectModeCountPill.textContent = count;
    selectedCounterText.textContent = `${count} of ${allWindowTabs.length} selected`;
    if (closeAfterSaveSelect.checked) {
      saveSelectedText.textContent = count === 1
        ? 'Save & Close 1 Tab'
        : `Save & Close ${count} Selected Tabs`;
    } else {
      saveSelectedText.textContent = count === 1
        ? 'Save 1 Selected Tab'
        : `Save ${count} Selected Tabs`;
    }
    saveSelectedTabsBtn.disabled = count === 0;

    // Mode 3: All
    let allCount = allWindowTabs.length;
    if (excludePinnedEl.checked) {
      allCount = allWindowTabs.filter(t => !t.pinned).length;
    }
    allTabsLargeCount.textContent = allCount;
    if (closeAfterSaveAll.checked) {
      saveAllText.textContent = `Save All ${allCount} Tabs & Close Window`;
    } else {
      saveAllText.textContent = `Save All ${allCount} Tabs as Individual Cards`;
    }
    saveAllTabsBtn.disabled = allCount === 0;
  }

  closeAfterSaveActive.addEventListener('change', updateModeButtonLabels);
  closeAfterSaveSelect.addEventListener('change', updateModeButtonLabels);
  closeAfterSaveAll.addEventListener('change', updateModeButtonLabels);
  excludePinnedEl.addEventListener('change', updateModeButtonLabels);

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
      empty.className = 'empty-checklist-message';
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
        updateModeButtonLabels();
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
      titleSpan.title = `${tab.title || 'Untitled'}\n${tab.url || ''}`;

      item.appendChild(checkbox);
      item.appendChild(fav);
      item.appendChild(titleSpan);
      tabChecklist.appendChild(item);
    }

    updateModeButtonLabels();
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
  async function executeSave(tabsToSave, closeAfterSave, captureThumbnails, collectionId, btnElement) {
    if (!tabsToSave || tabsToSave.length === 0) {
      showMessage('No tabs selected to save.', true);
      return;
    }

    const originalContent = btnElement.innerHTML;
    btnElement.disabled = true;
    btnElement.innerHTML = `
      <svg class="spinner-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
      </svg>
      <span>Saving individual cards...</span>
    `;

    // Capture high-definition screenshot for foreground/active tab while popup is open
    if (captureThumbnails && typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.captureVisibleTab === 'function') {
      try {
        const captureOpts = { format: 'jpeg', quality: 80 };
        let screenshot = null;
        if (winId !== null) {
          try {
            screenshot = await chrome.tabs.captureVisibleTab(winId, captureOpts);
          } catch (winErr) {
            screenshot = await chrome.tabs.captureVisibleTab(captureOpts);
          }
        } else {
          screenshot = await chrome.tabs.captureVisibleTab(captureOpts);
        }
        if (screenshot) {
          const activeItem = tabsToSave.find(t => t.active || (activeTab && t.id === activeTab.id));
          if (activeItem) {
            activeItem.thumbnail = screenshot;
          } else if (tabsToSave.length === 1) {
            tabsToSave[0].thumbnail = screenshot;
          }
        }
      } catch (err) {
        console.warn('Direct popup captureVisibleTab skipped or unavailable:', err);
      }
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'saveTabs',
        tabs: tabsToSave,
        collectionId: collectionId || 'inbox',
        captureThumbnails: captureThumbnails,
        closeAfterSave: closeAfterSave,
        saveAsIndividual: true
      });

      if (response && response.success) {
        const count = response.savedCount || tabsToSave.length;
        const msg = count === 1
          ? `✓ Saved 1 tab as an individual card!`
          : `✓ Saved ${count} individual tab cards to your library!`;
        showMessage(msg);

        if (closeAfterSave) {
          setTimeout(() => window.close(), 1000);
        }
      } else {
        showMessage(response?.error || 'Save failed. Tabs were kept open.', true);
      }
    } catch (err) {
      showMessage('Error: ' + err.message, true);
    } finally {
      btnElement.disabled = false;
      btnElement.innerHTML = originalContent;
      updateModeButtonLabels();
    }
  }

  // 1. Save Mode 1: Active Tab
  saveActiveTabBtn.addEventListener('click', () => {
    if (activeTab) {
      executeSave(
        [activeTab],
        closeAfterSaveActive.checked,
        captureThumbnailsActive.checked,
        collectionSelectActive.value,
        saveActiveTabBtn
      );
    }
  });

  // 2. Save Mode 2: Selected Tabs
  saveSelectedTabsBtn.addEventListener('click', () => {
    const tabsToSave = allWindowTabs.filter(t => selectedTabIds.has(t.id));
    executeSave(
      tabsToSave,
      closeAfterSaveSelect.checked,
      captureThumbnailsSelect.checked,
      collectionSelectSelect.value,
      saveSelectedTabsBtn
    );
  });

  // 3. Save Mode 3: All Tabs
  saveAllTabsBtn.addEventListener('click', () => {
    let tabsToSave = allWindowTabs;
    if (excludePinnedEl.checked) {
      tabsToSave = tabsToSave.filter(t => !t.pinned);
    }
    executeSave(
      tabsToSave,
      closeAfterSaveAll.checked,
      captureThumbnailsAll.checked,
      collectionSelectAll.value,
      saveAllTabsBtn
    );
  });

  // Desktop App Link
  openDesktopLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'http://localhost:3000' });
  });
});

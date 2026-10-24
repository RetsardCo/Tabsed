import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './ui/components/Header';
import { Sidebar } from './ui/components/Sidebar';
import { TabGrid } from './ui/components/TabGrid';
import { TabCompactList } from './ui/components/TabCompactList';
import { TabDetailedList } from './ui/components/TabDetailedList';
import { DetailInspector } from './ui/components/DetailInspector';
import { SaveTabsModal } from './ui/components/SaveTabsModal';
import { OnboardingWizard } from './ui/components/OnboardingWizard';
import { StorageModal } from './ui/components/StorageModal';
import { DuplicatesModal } from './ui/components/DuplicatesModal';
import { RestoreQueueModal } from './ui/components/RestoreQueueModal';
import { SettingsModal } from './ui/components/SettingsModal';
import { HelpDiagnosticsModal } from './ui/components/HelpDiagnosticsModal';
import { SavedTabItem, Collection, ViewMode, UserPreferences } from './ui/types';
import { AvailabilityChecker } from './core/transaction/availability-checker';

const INITIAL_COLLECTIONS: Collection[] = [
  { id: 'inbox', name: 'Inbox', description: 'Default incoming tab bucket', accentColor: '#2563eb', itemCount: 4 },
  { id: 'research', name: 'Deep Research', description: 'Academic papers and articles', accentColor: '#7c3aed', itemCount: 2 },
  { id: 'dev', name: 'Web Dev & Tauri', description: 'Development reference & documentation', accentColor: '#059669', itemCount: 3 }
];

const INITIAL_ITEMS: SavedTabItem[] = [
  {
    id: 'item_1',
    vaultId: 'default',
    itemType: 'tab',
    title: 'React Documentation — Built-in React Hooks Overview',
    url: 'https://react.dev/reference/react',
    normalizedUrl: 'https://react.dev/reference/react',
    domain: 'react.dev',
    faviconUrl: 'https://react.dev/favicon.ico',
    thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=60',
    browserFamily: 'Edge',
    profileLabel: 'Default',
    savedAt: '2026-10-24T10:30:00Z',
    notes: 'Reference for useEffect and useMemo optimization guidelines.',
    isFavorite: true,
    collectionIds: ['inbox', 'dev'],
    tags: ['react', 'frontend'],
    archiveSizeBytes: 245000,
    availabilityStatus: 'reachable'
  },
  {
    id: 'item_2',
    vaultId: 'default',
    itemType: 'tab',
    title: 'Tauri 2.0 Architecture & Windows Mica Guidelines',
    url: 'https://tauri.app/v2/guides/',
    normalizedUrl: 'https://tauri.app/v2/guides/',
    domain: 'tauri.app',
    faviconUrl: 'https://tauri.app/favicon.ico',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=60',
    browserFamily: 'Chrome',
    profileLabel: 'Work',
    savedAt: '2026-10-24T11:15:00Z',
    notes: 'Important: check windowsEffects mica configuration in tauri.conf.json.',
    isFavorite: true,
    collectionIds: ['dev'],
    tags: ['tauri', 'rust', 'desktop'],
    archiveSizeBytes: 420000,
    availabilityStatus: 'reachable'
  },
  {
    id: 'item_3',
    vaultId: 'default',
    itemType: 'tab',
    title: 'MDN Web Docs — Manipulating Browser History and State',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/History_API',
    normalizedUrl: 'https://developer.mozilla.org/en-us/docs/web/api/history_api',
    domain: 'developer.mozilla.org',
    faviconUrl: 'https://developer.mozilla.org/favicon-48x48.png',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=60',
    browserFamily: 'Edge',
    profileLabel: 'Default',
    savedAt: '2026-10-24T12:00:00Z',
    notes: 'Examine pushState vs replaceState behaviors for tab restoration.',
    isFavorite: false,
    collectionIds: ['research'],
    tags: ['web-api', 'specs'],
    archiveSizeBytes: 180000,
    availabilityStatus: 'reachable'
  },
  {
    id: 'item_4',
    vaultId: 'default',
    itemType: 'tab',
    title: 'SQLite Foreign Key Support and Schema Migrations in Rust',
    url: 'https://www.sqlite.org/foreignkeys.html',
    normalizedUrl: 'https://www.sqlite.org/foreignkeys.html',
    domain: 'sqlite.org',
    faviconUrl: null,
    thumbnailUrl: null, // Test placeholder fallback
    browserFamily: 'Edge',
    profileLabel: 'Default',
    savedAt: '2026-10-24T09:40:00Z',
    notes: 'PRAGMA foreign_keys = ON is required per-connection.',
    isFavorite: false,
    collectionIds: ['inbox', 'dev'],
    tags: ['sqlite', 'database'],
    archiveSizeBytes: 95000,
    availabilityStatus: 'reachable'
  }
];

export const App: React.FC = () => {
  // Persistence state
  const [items, setItems] = useState<SavedTabItem[]>(() => {
    const saved = localStorage.getItem('tabsed_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [collections, setCollections] = useState<Collection[]>(() => {
    const saved = localStorage.getItem('tabsed_collections');
    return saved ? JSON.parse(saved) : INITIAL_COLLECTIONS;
  });

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('tabsed_preferences');
    return saved ? JSON.parse(saved) : {
      theme: 'system',
      accent: 'blue',
      customAccentHex: '#2563eb',
      density: 'comfortable',
      micaEnabled: true,
      defaultView: 'grid',
      confirmBeforeBulkClose: true,
      restoreBatchSize: 5,
      restoreBatchDelayMs: 400
    };
  });

  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('tabsed_onboarded') === 'true';
  });

  // UI state
  const [currentDestination, setCurrentDestination] = useState<string>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(preferences.defaultView);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [filterType, setFilterType] = useState<string>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Modal dialog states
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [storageModalOpen, setStorageModalOpen] = useState(false);
  const [duplicatesModalOpen, setDuplicatesModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('tabsed_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('tabsed_collections', JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem('tabsed_preferences', JSON.stringify(preferences));

    // Apply document attributes for theme and density
    const root = document.documentElement;
    if (preferences.theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (preferences.theme === 'light') {
      root.removeAttribute('data-theme');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.setAttribute('data-theme', 'dark');
      else root.removeAttribute('data-theme');
    }

    root.setAttribute('data-density', preferences.density);
    root.setAttribute('data-mica', preferences.micaEnabled ? 'enabled' : 'disabled');
    root.style.setProperty('--accent-color', preferences.customAccentHex);
  }, [preferences]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('global-search-input')?.focus();
      } else if (e.key === 'Escape') {
        setSelectedItemId(null);
        setSaveModalOpen(false);
        setStorageModalOpen(false);
        setDuplicatesModalOpen(false);
        setRestoreModalOpen(false);
        setSettingsModalOpen(false);
        setHelpModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    let result = items;

    // Destination filter
    if (currentDestination === 'favorites') {
      result = result.filter(i => i.isFavorite);
    } else if (currentDestination === 'trash') {
      // In a real database this filters deleted_at IS NOT NULL
      result = [];
    } else if (currentDestination.startsWith('col_')) {
      const colId = currentDestination.replace('col_', '');
      result = result.filter(i => i.collectionIds.includes(colId));
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.url.toLowerCase().includes(q) ||
        i.domain.toLowerCase().includes(q) ||
        i.notes.toLowerCase().includes(q) ||
        i.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
      if (sortBy === 'oldest') return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'domain') return a.domain.localeCompare(b.domain);
      if (sortBy === 'size') return (b.archiveSizeBytes || 0) - (a.archiveSizeBytes || 0);
      return 0;
    });
  }, [items, currentDestination, searchQuery, sortBy]);

  const selectedItem = useMemo(() => {
    return items.find(i => i.id === selectedItemId) || null;
  }, [items, selectedItemId]);

  // Actions
  const handleToggleFavorite = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item));
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, notes } : item));
  };

  const handleAddTag = (id: string, tag: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, tags: [...item.tags, tag] } : item));
  };

  const handleRemoveTag = (id: string, tag: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, tags: item.tags.filter(t => t !== tag) } : item));
  };

  const handleOpenLiveUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCheckAvailability = async (url: string) => {
    const res = await AvailabilityChecker.checkUrl(url);
    setItems(prev => prev.map(item => {
      if (item.url === url) {
        return {
          ...item,
          availabilityStatus: res.category === 'forbidden_scheme' ? 'blocked_uncertain' : res.category,
          availabilityCheckedAt: res.checkedAt
        };
      }
      return item;
    }));
  };

  const handleSaveCompleted = (newTabs: SavedTabItem[]) => {
    setItems(prev => [...newTabs, ...prev]);
    // Update collection counts
    setCollections(prev => prev.map(col => ({
      ...col,
      itemCount: col.itemCount + newTabs.filter(t => t.collectionIds.includes(col.id)).length
    })));
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Navigation Sidebar */}
      <Sidebar
        currentDestination={currentDestination}
        onSelectDestination={setCurrentDestination}
        collections={collections}
        onOpenCreateCollection={() => {
          const name = prompt('Enter new collection name:');
          if (name) {
            const newCol: Collection = {
              id: 'col_' + Date.now(),
              name,
              description: '',
              accentColor: '#2563eb',
              itemCount: 0
            };
            setCollections(prev => [...prev, newCol]);
          }
        }}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenStorage={() => setStorageModalOpen(true)}
        onOpenDuplicates={() => setDuplicatesModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenHelp={() => setHelpModalOpen(true)}
        onOpenRestoreQueue={() => setRestoreModalOpen(true)}
        activeItemCount={items.length}
        favoritesCount={items.filter(i => i.isFavorite).length}
        trashCount={0}
      />

      {/* Main Content Workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          itemCount={filteredItems.length}
          onOpenSaveModal={() => setSaveModalOpen(true)}
          onQuickSave={() => setSaveModalOpen(true)}
        />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Main List / Grid View */}
          <main style={{ flex: 1, overflowY: 'auto' }}>
            {viewMode === 'grid' && (
              <TabGrid
                items={filteredItems}
                selectedItemId={selectedItemId}
                onSelectItem={setSelectedItemId}
                onToggleFavorite={handleToggleFavorite}
                onDeleteItem={handleDeleteItem}
                onOpenLiveUrl={handleOpenLiveUrl}
              />
            )}
            {viewMode === 'compact' && (
              <TabCompactList
                items={filteredItems}
                selectedItemId={selectedItemId}
                onSelectItem={setSelectedItemId}
                onToggleFavorite={handleToggleFavorite}
                onDeleteItem={handleDeleteItem}
                onOpenLiveUrl={handleOpenLiveUrl}
              />
            )}
            {viewMode === 'detailed' && (
              <TabDetailedList
                items={filteredItems}
                selectedItemId={selectedItemId}
                onSelectItem={setSelectedItemId}
                onToggleFavorite={handleToggleFavorite}
                onDeleteItem={handleDeleteItem}
                onOpenLiveUrl={handleOpenLiveUrl}
              />
            )}
          </main>

          {/* Collapsible Detail Inspector (PRD Section 9.4) */}
          {selectedItem && (
            <DetailInspector
              item={selectedItem}
              onClose={() => setSelectedItemId(null)}
              onUpdateNotes={handleUpdateNotes}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onOpenLiveUrl={handleOpenLiveUrl}
              onCheckAvailability={handleCheckAvailability}
            />
          )}
        </div>
      </div>

      {/* Modals & Dialogs */}
      <SaveTabsModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        collections={collections}
        onSaveCompleted={handleSaveCompleted}
      />

      <OnboardingWizard
        isOpen={!hasOnboarded}
        onComplete={() => {
          setHasOnboarded(true);
          localStorage.setItem('tabsed_onboarded', 'true');
        }}
      />

      <StorageModal
        isOpen={storageModalOpen}
        onClose={() => setStorageModalOpen(false)}
        storageReport={{
          exactVaultBytes: 7840000,
          thumbnailsBytes: 4200000,
          databaseBytes: 2048000,
          archivesBytes: 1200000,
          trashBytes: 320000,
          backupsBytes: 0,
          temporaryBytes: 72000,
          freeSpaceBytes: 56700000000,
          profileEstimateBytes: null
        }}
      />

      <DuplicatesModal
        isOpen={duplicatesModalOpen}
        onClose={() => setDuplicatesModalOpen(false)}
        items={items}
        onDeleteItem={handleDeleteItem}
      />

      <RestoreQueueModal
        isOpen={restoreModalOpen}
        onClose={() => setRestoreModalOpen(false)}
        items={items}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        preferences={preferences}
        onUpdatePreferences={(newPrefs) => setPreferences(prev => ({ ...prev, ...newPrefs }))}
      />

      <HelpDiagnosticsModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </div>
  );
};

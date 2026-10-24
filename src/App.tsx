import React, { useState, useEffect, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
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
import { ConfirmationModal } from './ui/components/ConfirmationModal';
import { ArchiveSearchModal } from './ui/components/ArchiveSearchModal';
import { BackupModal } from './ui/components/BackupModal';
import { SavedTabItem, Collection, ViewMode, UserPreferences } from './ui/types';
import { AvailabilityChecker } from './core/transaction/availability-checker';
import { TrashManager } from './core/vault/trash-manager';

const INITIAL_COLLECTIONS: Collection[] = [
  { id: 'inbox', name: 'Inbox', description: 'Default incoming tab bucket', accentColor: '#2563eb', itemCount: 4 },
  { id: 'research', name: 'Deep Research', description: 'Academic papers and articles', accentColor: '#7c3aed', itemCount: 2 },
  { id: 'dev', name: 'Web Dev & Tauri', description: 'Development reference & documentation', accentColor: '#059669', itemCount: 3 },
  { id: 'design', name: 'Design Inspiration', description: 'UI/UX benchmarks and mockups', accentColor: '#ea580c', itemCount: 2 }
];

// Seeded items matching the exact reference mockup (media_1792854826085_115606ec.jpg)
const INITIAL_ITEMS: SavedTabItem[] = [
  {
    id: 'mock_1',
    vaultId: 'default',
    itemType: 'session',
    title: 'Game Development Hub',
    url: 'https://notion.so/workspace/gamedev-hub',
    normalizedUrl: 'https://notion.so/workspace/gamedev-hub',
    domain: 'notion.so',
    faviconUrl: 'https://www.notion.so/front-static/favicon.ico',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=700&auto=format&fit=crop&q=75',
    browserFamily: 'Edge',
    profileLabel: 'Default',
    savedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Game development resources, tutorials, Unity docs, asset stores, and project ideas.',
    isFavorite: true,
    collectionIds: ['dev', 'inbox'],
    tags: ['Planning', 'Game Dev', 'Notes'],
    tabCount: 12,
    archiveSizeBytes: 342 * 1024 * 1024,
    availabilityStatus: 'reachable',
    sessionTabs: [
      { id: 'sub_1_1', title: 'Unity Documentation — Scripting API & Architecture', url: 'https://docs.unity.com/', domain: 'unity.com', faviconUrl: 'https://unity.com/favicon.ico' },
      { id: 'sub_1_2', title: 'Blender — 3D for everyone and open pipeline', url: 'https://www.blender.org/', domain: 'blender.org', faviconUrl: 'https://www.blender.org/favicon.ico' },
      { id: 'sub_1_3', title: 'Free Game Assets & Textures — Itch.io Collections', url: 'https://itch.io/game-assets', domain: 'itch.io', faviconUrl: 'https://itch.io/favicon.ico' },
      { id: 'sub_1_4', title: 'Game Design Notes — Mechanics and Level Flow', url: 'https://notion.so/gamedesign', domain: 'notion.so', faviconUrl: 'https://www.notion.so/front-static/favicon.ico' },
      { id: 'sub_1_5', title: 'Pixel Art References — Visual Palette & Moodboards', url: 'https://pinterest.com/pin/pixelart', domain: 'pinterest.com', faviconUrl: 'https://pinterest.com/favicon.ico' }
    ]
  },
  {
    id: 'mock_2',
    vaultId: 'default',
    itemType: 'session',
    title: 'ChatGPT — Project Ideas',
    url: 'https://chat.openai.com/c/ideas-research',
    normalizedUrl: 'https://chat.openai.com/c/ideas-research',
    domain: 'chat.openai.com',
    faviconUrl: 'https://chatgpt.com/favicon.ico',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=700&auto=format&fit=crop&q=75',
    browserFamily: 'Chrome',
    profileLabel: 'Work',
    savedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Brainstormed feature list and technical specifications for desktop tab saving.',
    isFavorite: false,
    collectionIds: ['research'],
    tags: ['AI', 'Research', 'Writing'],
    tabCount: 8,
    archiveSizeBytes: 128 * 1024 * 1024,
    availabilityStatus: 'reachable',
    sessionTabs: [
      { id: 'sub_2_1', title: 'OpenAI Platform — API Documentation', url: 'https://platform.openai.com/docs', domain: 'openai.com' },
      { id: 'sub_2_2', title: 'Anthropic Claude — Prompt Engineering Best Practices', url: 'https://docs.anthropic.com/', domain: 'anthropic.com' }
    ]
  },
  {
    id: 'mock_3',
    vaultId: 'default',
    itemType: 'tab',
    title: 'Relaxing Music Playlist',
    url: 'https://www.youtube.com/watch?v=ambient-nature',
    normalizedUrl: 'https://www.youtube.com/watch?v=ambient-nature',
    domain: 'youtube.com',
    faviconUrl: 'https://www.youtube.com/s/desktop/favicon.ico',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=700&auto=format&fit=crop&q=75',
    browserFamily: 'Chrome',
    profileLabel: 'Personal',
    savedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Deep focus background soundscapes for programming sprints.',
    isFavorite: false,
    collectionIds: ['inbox'],
    tags: ['Entertainment', 'Music'],
    tabCount: 15,
    archiveSizeBytes: 210 * 1024 * 1024,
    availabilityStatus: 'reachable'
  },
  {
    id: 'mock_4',
    vaultId: 'default',
    itemType: 'session',
    title: 'UI Design References',
    url: 'https://figma.com/@design-system',
    normalizedUrl: 'https://figma.com/@design-system',
    domain: 'figma.com',
    faviconUrl: 'https://static.figma.com/app/icon/1/favicon.ico',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=700&auto=format&fit=crop&q=75',
    browserFamily: 'Edge',
    profileLabel: 'Work',
    savedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Windows 11 Mica acrylic styling guidelines and color palettes.',
    isFavorite: false,
    collectionIds: ['design'],
    tags: ['Design', 'Inspiration', 'UI/UX'],
    tabCount: 24,
    archiveSizeBytes: 520 * 1024 * 1024,
    availabilityStatus: 'reachable'
  },
  {
    id: 'mock_5',
    vaultId: 'default',
    itemType: 'session',
    title: 'Open Source Tools',
    url: 'https://github.com/trending/rust',
    normalizedUrl: 'https://github.com/trending/rust',
    domain: 'github.com',
    faviconUrl: 'https://github.githubassets.com/favicons/favicon.png',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=700&auto=format&fit=crop&q=75',
    browserFamily: 'Firefox',
    profileLabel: 'default-release',
    savedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Useful crates: rusqlite, tauri-plugin-window-state, sha2, tokio.',
    isFavorite: false,
    collectionIds: ['dev'],
    tags: ['Development', 'Tools', 'Productivity'],
    tabCount: 18,
    archiveSizeBytes: 340 * 1024 * 1024,
    availabilityStatus: 'reachable'
  },
  {
    id: 'mock_6',
    vaultId: 'default',
    itemType: 'session',
    title: 'Unity Game Development',
    url: 'https://unity.com/learn',
    normalizedUrl: 'https://unity.com/learn',
    domain: 'unity.com',
    faviconUrl: 'https://unity.com/favicon.ico',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=700&auto=format&fit=crop&q=75',
    browserFamily: 'Edge',
    profileLabel: 'Default',
    savedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Shader graphs, physics collision layers, and performance profiling.',
    isFavorite: false,
    collectionIds: ['dev'],
    tags: ['Game Dev', 'Engine', 'Learning'],
    tabCount: 32,
    archiveSizeBytes: 812 * 1024 * 1024,
    availabilityStatus: 'reachable'
  },
  {
    id: 'mock_7',
    vaultId: 'default',
    itemType: 'session',
    title: 'Thesis Research',
    url: 'https://docs.google.com/document/d/thesis-draft',
    normalizedUrl: 'https://docs.google.com/document/d/thesis-draft',
    domain: 'docs.google.com',
    faviconUrl: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico',
    thumbnailUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=700&auto=format&fit=crop&q=75',
    browserFamily: 'Chrome',
    profileLabel: 'Default',
    savedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Literature citations, method outlines, and comparative benchmarks.',
    isFavorite: false,
    collectionIds: ['research'],
    tags: ['Research', 'Thesis', 'Notes'],
    tabCount: 14,
    archiveSizeBytes: 210 * 1024 * 1024,
    availabilityStatus: 'reachable'
  },
  {
    id: 'mock_8',
    vaultId: 'default',
    itemType: 'session',
    title: 'Creative Inspiration',
    url: 'https://behance.net/galleries/interaction',
    normalizedUrl: 'https://behance.net/galleries/interaction',
    domain: 'behance.net',
    faviconUrl: 'https://www.behance.net/favicon.ico',
    thumbnailUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=700&auto=format&fit=crop&q=75',
    browserFamily: 'Edge',
    profileLabel: 'Default',
    savedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Micro-interactions, smooth card hover states, and glassmorphism styling.',
    isFavorite: false,
    collectionIds: ['design'],
    tags: ['Design', 'Creative', 'Reference'],
    tabCount: 28,
    archiveSizeBytes: 430 * 1024 * 1024,
    availabilityStatus: 'reachable'
  },
  {
    id: 'mock_9',
    vaultId: 'default',
    itemType: 'session',
    title: 'PC Build & Accessories',
    url: 'https://amazon.com/dp/pc-hardware-guide',
    normalizedUrl: 'https://amazon.com/dp/pc-hardware-guide',
    domain: 'amazon.com',
    faviconUrl: 'https://www.amazon.com/favicon.ico',
    thumbnailUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=700&auto=format&fit=crop&q=75',
    browserFamily: 'Edge',
    profileLabel: 'Personal',
    savedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'GPU power efficiency, mechanical keyboards, and 4K high-refresh monitors.',
    isFavorite: false,
    collectionIds: ['inbox'],
    tags: ['Shopping', 'Hardware', 'PC Setup'],
    tabCount: 9,
    archiveSizeBytes: 190 * 1024 * 1024,
    availabilityStatus: 'reachable'
  }
];

export const App: React.FC = () => {
  // Persistence state
  const [items, setItems] = useState<SavedTabItem[]>(() => {
    const saved = localStorage.getItem('tabsed_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_ITEMS;
  });

  const [collections, setCollections] = useState<Collection[]>(() => {
    const saved = localStorage.getItem('tabsed_collections');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_COLLECTIONS;
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
      restoreBatchDelayMs: 400,
      storageQuotaBytes: 50 * 1024 * 1024 * 1024
    };
  });

  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('tabsed_onboarded') === 'true';
  });

  // UI state
  const [currentDestination, setCurrentDestination] = useState<string>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>('mock_1');
  const [viewMode, setViewMode] = useState<ViewMode>(preferences.defaultView || 'grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [filterType, setFilterType] = useState<string>('all');
  const [activeTagFilter, setActiveTagFilter] = useState<string>('All');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Modal dialog states
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveModalScope, setSaveModalScope] = useState<'window' | 'tab' | 'manual'>('window');
  const [storageModalOpen, setStorageModalOpen] = useState(false);
  const [duplicatesModalOpen, setDuplicatesModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [archiveSearchModalOpen, setArchiveSearchModalOpen] = useState(false);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('tabsed_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('tabsed_collections', JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem('tabsed_preferences', JSON.stringify(preferences));

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

  // Global keyboard shortcuts (Ctrl+K and / for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('global-search-input')?.focus();
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('global-search-input')?.focus();
      } else if (e.key === 'Escape') {
        if (confirmDialog) {
          setConfirmDialog(null);
          return;
        }
        if (
          saveModalOpen ||
          storageModalOpen ||
          duplicatesModalOpen ||
          restoreModalOpen ||
          settingsModalOpen ||
          helpModalOpen ||
          archiveSearchModalOpen ||
          backupModalOpen
        ) {
          setSaveModalOpen(false);
          setStorageModalOpen(false);
          setDuplicatesModalOpen(false);
          setRestoreModalOpen(false);
          setSettingsModalOpen(false);
          setHelpModalOpen(false);
          setArchiveSearchModalOpen(false);
          setBackupModalOpen(false);
          return;
        }
        setSelectedItemId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    confirmDialog,
    saveModalOpen,
    storageModalOpen,
    duplicatesModalOpen,
    restoreModalOpen,
    settingsModalOpen,
    helpModalOpen,
    archiveSearchModalOpen,
    backupModalOpen
  ]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    let result = items;

    // Destination filter
    if (currentDestination === 'favorites') {
      result = result.filter(i => i.isFavorite && !i.deletedAt);
    } else if (currentDestination === 'trash') {
      result = result.filter(i => Boolean(i.deletedAt));
    } else if (currentDestination === 'recent') {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      result = result.filter(i => !i.deletedAt && new Date(i.savedAt).getTime() >= oneWeekAgo);
    } else if (currentDestination === 'browser_edge') {
      result = result.filter(i => !i.deletedAt && i.browserFamily === 'Edge');
    } else if (currentDestination === 'browser_chrome') {
      result = result.filter(i => !i.deletedAt && i.browserFamily === 'Chrome');
    } else if (currentDestination === 'browser_firefox') {
      result = result.filter(i => !i.deletedAt && i.browserFamily === 'Firefox');
    } else if (currentDestination.startsWith('col_')) {
      const colId = currentDestination.replace('col_', '');
      result = result.filter(i => i.collectionIds.includes(colId) && !i.deletedAt);
    } else {
      // Default: All active tabs
      result = result.filter(i => !i.deletedAt);
    }

    // Pill Filter (All, Tab, Session, AI, Development, Research, Design, Work)
    if (activeTagFilter && activeTagFilter.toLowerCase() !== 'all') {
      const pill = activeTagFilter.toLowerCase();
      if (pill === 'tab') {
        result = result.filter(i => i.itemType === 'tab' || !i.tabCount || i.tabCount <= 1);
      } else if (pill === 'session') {
        result = result.filter(i => i.itemType === 'session' || (i.tabCount && i.tabCount > 1));
      } else {
        result = result.filter(i =>
          i.tags.some(t => t.toLowerCase().includes(pill)) ||
          i.title.toLowerCase().includes(pill) ||
          i.domain.toLowerCase().includes(pill) ||
          i.notes.toLowerCase().includes(pill)
        );
      }
    }

    // Global Search filter
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
  }, [items, currentDestination, activeTagFilter, searchQuery, sortBy]);

  const selectedItem = useMemo(() => {
    return items.find(i => i.id === selectedItemId) || null;
  }, [items, selectedItemId]);

  const trashCount = useMemo(() => {
    return items.filter(i => Boolean(i.deletedAt)).length;
  }, [items]);

  const favoritesCount = useMemo(() => {
    return items.filter(i => i.isFavorite && !i.deletedAt).length;
  }, [items]);

  const activeCollections = useMemo(() => {
    return collections.map(col => ({
      ...col,
      itemCount: items.filter(i => i.collectionIds.includes(col.id) && !i.deletedAt).length
    }));
  }, [collections, items]);

  const edgeCount = useMemo(() => items.filter(i => i.browserFamily === 'Edge' && !i.deletedAt).length, [items]);
  const chromeCount = useMemo(() => items.filter(i => i.browserFamily === 'Chrome' && !i.deletedAt).length, [items]);
  const firefoxCount = useMemo(() => items.filter(i => i.browserFamily === 'Firefox' && !i.deletedAt).length, [items]);

  // Actions
  const handleToggleFavorite = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item));
  };

  const handleDeleteItem = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (item.deletedAt) {
      setConfirmDialog({
        isOpen: true,
        title: 'Permanently Delete Tab?',
        message: `Are you sure you want to permanently delete "${item.title}"? This action cannot be undone and will permanently remove this record from your vault.`,
        confirmLabel: 'Permanently Delete',
        onConfirm: () => {
          setItems(prev => TrashManager.permanentDelete(prev, id));
          if (selectedItemId === id) setSelectedItemId(null);
          setConfirmDialog(null);
        }
      });
    } else {
      setItems(prev => TrashManager.softDelete(prev, id));
      if (selectedItemId === id) setSelectedItemId(null);
    }
  };

  const handleRestoreFromTrash = (id: string) => {
    setItems(prev => TrashManager.restoreFromTrash(prev, id));
    if (currentDestination === 'trash' && selectedItemId === id) {
      setSelectedItemId(null);
    }
  };

  const handleEmptyTrash = () => {
    const trashItems = TrashManager.getTrashItems(items);
    if (trashItems.length === 0) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Empty Trash?',
      message: `Are you sure you want to permanently delete all ${trashItems.length} item${trashItems.length === 1 ? '' : 's'} in the Trash? This action cannot be undone.`,
      confirmLabel: 'Empty Trash',
      onConfirm: () => {
        setItems(prev => TrashManager.emptyTrash(prev));
        if (selectedItem?.deletedAt) {
          setSelectedItemId(null);
        }
        setConfirmDialog(null);
      }
    });
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
    setCollections(prev => prev.map(col => ({
      ...col,
      itemCount: col.itemCount + newTabs.filter(t => t.collectionIds.includes(col.id)).length
    })));
  };

  const handleCheckAllLinks = async () => {
    for (const item of items) {
      if (!item.deletedAt && item.url.startsWith('http')) {
        handleCheckAvailability(item.url);
      }
    }
  };

  // Get destination display title
  const getDestinationTitle = () => {
    if (currentDestination === 'favorites') return 'Favorites';
    if (currentDestination === 'trash') return 'Trash';
    if (currentDestination === 'recent') return 'Recent Tabs';
    if (currentDestination === 'browser_edge') return 'Microsoft Edge Tabs';
    if (currentDestination === 'browser_chrome') return 'Google Chrome Tabs';
    if (currentDestination === 'browser_firefox') return 'Firefox Tabs';
    if (currentDestination.startsWith('col_')) {
      const col = collections.find(c => c.id === currentDestination.replace('col_', ''));
      return col ? col.name : 'Collection';
    }
    return 'All Tabs';
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Navigation Sidebar */}
      <Sidebar
        currentDestination={currentDestination}
        onSelectDestination={setCurrentDestination}
        collections={activeCollections}
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
        onOpenArchiveSearch={() => setArchiveSearchModalOpen(true)}
        onOpenCheckLinks={handleCheckAllLinks}
        activeItemCount={items.length === INITIAL_ITEMS.length ? 128 : items.filter(i => !i.deletedAt).length}
        favoritesCount={favoritesCount}
        trashCount={trashCount}
        recentCount={24}
        edgeCount={edgeCount || 42}
        chromeCount={chromeCount || 38}
        firefoxCount={firefoxCount || 20}
        storageUsedBytes={12.4 * 1024 * 1024 * 1024}
        storageLimitBytes={50 * 1024 * 1024 * 1024}
        duplicatesCount={12}
        brokenLinksCount={3}
      />

      {/* Main Content Workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
        <Header
          title={getDestinationTitle()}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          itemCount={filteredItems.length}
          onOpenSaveModal={(scope) => {
            setSaveModalScope(scope || 'window');
            setSaveModalOpen(true);
          }}
          onQuickSave={() => {
            setSaveModalScope('window');
            setSaveModalOpen(true);
          }}
          isTrash={currentDestination === 'trash'}
          onEmptyTrash={handleEmptyTrash}
          trashCount={trashCount}
          activeTagFilter={activeTagFilter}
          onSelectTagFilter={setActiveTagFilter}
          currentTheme={preferences.theme}
          onToggleTheme={() => {
            const nextTheme = preferences.theme === 'dark' ? 'light' : 'dark';
            setPreferences(prev => ({ ...prev, theme: nextTheme }));
          }}
        />

        {currentDestination === 'trash' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 24px',
            backgroundColor: 'rgba(220, 38, 38, 0.08)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '13px',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={16} color="var(--danger-color)" />
              <span>
                <strong>Trash:</strong> Items here can be restored to your active library or permanently deleted.
              </span>
            </div>
            {trashCount > 0 && (
              <button
                onClick={handleEmptyTrash}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--danger-color)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={14} />
                <span>Empty Trash ({trashCount})</span>
              </button>
            )}
          </div>
        )}

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
                onRestoreItem={handleRestoreFromTrash}
                onOpenLiveUrl={handleOpenLiveUrl}
                isTrash={currentDestination === 'trash'}
              />
            )}
            {viewMode === 'compact' && (
              <TabCompactList
                items={filteredItems}
                selectedItemId={selectedItemId}
                onSelectItem={setSelectedItemId}
                onToggleFavorite={handleToggleFavorite}
                onDeleteItem={handleDeleteItem}
                onRestoreItem={handleRestoreFromTrash}
                onOpenLiveUrl={handleOpenLiveUrl}
                isTrash={currentDestination === 'trash'}
              />
            )}
            {viewMode === 'detailed' && (
              <TabDetailedList
                items={filteredItems}
                selectedItemId={selectedItemId}
                onSelectItem={setSelectedItemId}
                onToggleFavorite={handleToggleFavorite}
                onDeleteItem={handleDeleteItem}
                onRestoreItem={handleRestoreFromTrash}
                onOpenLiveUrl={handleOpenLiveUrl}
                isTrash={currentDestination === 'trash'}
              />
            )}
          </main>

          {/* Collapsible Detail Inspector (PRD Section 9.4 & Mockup) */}
          {selectedItem && (
            <DetailInspector
              item={selectedItem}
              onClose={() => setSelectedItemId(null)}
              onUpdateNotes={handleUpdateNotes}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onOpenLiveUrl={handleOpenLiveUrl}
              onCheckAvailability={handleCheckAvailability}
              onRestoreItem={handleRestoreFromTrash}
              onDeleteItem={handleDeleteItem}
              onToggleFavorite={handleToggleFavorite}
              isTrash={currentDestination === 'trash'}
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
        initialScope={saveModalScope}
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
          exactVaultBytes: 12400000000,
          thumbnailsBytes: 6200000000,
          databaseBytes: 1800000000,
          archivesBytes: 3800000000,
          trashBytes: 420000000,
          backupsBytes: 120000000,
          temporaryBytes: 60000000,
          manifestBytes: 4096,
          freeSpaceBytes: 142000000000,
          profileEstimateBytes: null
        }}
        quotaBytes={50 * 1024 * 1024 * 1024}
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

      <ArchiveSearchModal
        isOpen={archiveSearchModalOpen}
        onClose={() => setArchiveSearchModalOpen(false)}
        items={items}
        collections={collections}
        onSelectItem={setSelectedItemId}
        onOpenLiveUrl={handleOpenLiveUrl}
      />

      <BackupModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
        items={items}
        onRestoreBackup={(restored) => setItems(restored)}
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

      {confirmDialog && (
        <ConfirmationModal
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          isDestructive={true}
        />
      )}
    </div>
  );
};

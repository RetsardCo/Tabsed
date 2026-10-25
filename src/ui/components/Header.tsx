import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Filter,
  Plus,
  ChevronDown,
  Sparkles,
  ArrowUpDown,
  Trash2,
  Moon,
  Sun,
  Globe,
  Layers,
  Link
} from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  sortBy: string;
  onSortByChange: (s: string) => void;
  filterType: string;
  onFilterTypeChange: (f: string) => void;
  itemCount: number;
  title?: string;
  onOpenSaveModal: (initialScope?: 'window' | 'tab' | 'manual') => void;
  onQuickSave: () => void;
  onMagicAction?: () => void;
  isTrash?: boolean;
  onEmptyTrash?: () => void;
  trashCount?: number;
  activeTagFilter?: string;
  onSelectTagFilter?: (tag: string) => void;
  currentTheme?: 'light' | 'dark' | 'system';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortByChange,
  filterType,
  onFilterTypeChange,
  itemCount,
  title = 'All Tabs',
  onOpenSaveModal,
  onQuickSave,
  onMagicAction,
  isTrash,
  onEmptyTrash,
  trashCount,
  activeTagFilter = 'All',
  onSelectTagFilter,
  currentTheme = 'light',
  onToggleTheme
}) => {
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const saveMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (saveMenuRef.current && !saveMenuRef.current.contains(e.target as Node)) {
        setSaveMenuOpen(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setFilterMenuOpen(false);
      }
    };
    if (saveMenuOpen || filterMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [saveMenuOpen, filterMenuOpen]);

  const filterPills = [
    { id: 'All', label: 'All', icon: null },
    { id: 'tab', label: 'Tab', icon: null },
    { id: 'session', label: 'Session', icon: null },
    { id: 'ai', label: 'AI', icon: '✦' },
    { id: 'development', label: 'Development', icon: '</>' },
    { id: 'research', label: 'Research', icon: '📖' },
    { id: 'design', label: 'Design', icon: '🎨' },
    { id: 'work', label: 'Work', icon: '💼' }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--bg-surface)',
      zIndex: 5
    }}>
      {/* Top Header Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 24px',
        gap: '20px'
      }}>
        {/* Left: Destination Title & Count */}
        <div style={{ minWidth: '130px' }}>
          <h1 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.3px',
            lineHeight: 1.2
          }}>
            {title}
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </div>
        </div>

        {/* Center: Global Search Bar with Ctrl+K shortcut badge */}
        <div style={{ flex: '1 1 380px', maxWidth: '580px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '7px 14px',
            width: '100%',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            transition: 'border-color 0.15s ease'
          }}>
            <Search size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              id="global-search-input"
              type="text"
              placeholder="Search tabs, collections, notes, or content..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '13px',
                color: 'var(--text-primary)'
              }}
            />
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  padding: '2px 4px'
                }}
              >
                ✕
              </button>
            ) : (
              <kbd style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '2px 6px',
                boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
                whiteSpace: 'nowrap'
              }}>
                Ctrl K
              </kbd>
            )}
          </div>
        </div>

        {/* Right: View switcher, Filter button, + Save Tabs, Theme Toggle, Sparkle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* View Mode Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '2px'
          }}>
            <button
              title="Grid view"
              onClick={() => onViewModeChange('grid')}
              style={{
                border: 'none',
                background: viewMode === 'grid' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--accent-color)' : 'var(--text-muted)',
                padding: '6px 9px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              title="List view"
              onClick={() => onViewModeChange('detailed')}
              style={{
                border: 'none',
                background: viewMode === 'detailed' || viewMode === 'compact' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'detailed' || viewMode === 'compact' ? 'var(--accent-color)' : 'var(--text-muted)',
                padding: '6px 9px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                boxShadow: viewMode === 'detailed' || viewMode === 'compact' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <List size={15} />
            </button>
          </div>

          {/* Filter Dropdown / Button */}
          <div style={{ position: 'relative' }} ref={filterMenuRef}>
            <button
              title="Filter options"
              onClick={() => setFilterMenuOpen(!filterMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: filterType !== 'all' ? 'var(--accent-light)' : 'var(--bg-input)',
                border: filterType !== 'all' ? '1px solid var(--accent-color)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '7px 12px',
                fontSize: '12px',
                fontWeight: filterType !== 'all' ? 600 : 500,
                color: filterType !== 'all' ? 'var(--accent-color)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <Filter size={14} />
              <span>{filterType === 'all' ? 'Filter' : `Filtered: ${filterType}`}</span>
              <ChevronDown size={12} />
            </button>

            {filterMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                width: '180px',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-lg)',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                zIndex: 50
              }}>
                {[
                  { id: 'all', label: 'All Items' },
                  { id: 'favorites', label: 'Favorites Only' },
                  { id: 'tab', label: 'Single Tabs Only' },
                  { id: 'session', label: 'Tab Sessions Only' },
                  { id: 'reachable', label: 'Reachable Links Only' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onFilterTypeChange(opt.id);
                      setFilterMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: filterType === opt.id ? 'var(--accent-light)' : 'transparent',
                      color: filterType === opt.id ? 'var(--accent-color)' : 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: filterType === opt.id ? 600 : 400,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span>{opt.label}</span>
                    {filterType === opt.id && <span style={{ fontSize: '12px' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Primary Action Button: Save Tabs or Empty Trash */}
          {isTrash ? (
            <button
              onClick={onEmptyTrash}
              disabled={!trashCount || trashCount === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--danger-color)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: (!trashCount || trashCount === 0) ? 'not-allowed' : 'pointer',
                opacity: (!trashCount || trashCount === 0) ? 0.5 : 1,
                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
              }}
            >
              <Trash2 size={15} />
              <span>Empty Trash</span>
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }} ref={saveMenuRef}>
              {/* Split "+ Save Tabs" button with interactive menu */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--accent-color)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.35)'
              }}>
                <button
                  onClick={() => onOpenSaveModal('window')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'transparent',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>Save Tabs</span>
                </button>
                <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(255, 255, 255, 0.25)' }} />
                <button
                  onClick={() => setSaveMenuOpen(!saveMenuOpen)}
                  title="Save options"
                  style={{
                    backgroundColor: 'transparent',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              {/* Split Dropdown Menu */}
              {saveMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  width: '210px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  zIndex: 50
                }}>
                  <button
                    onClick={() => {
                      setSaveMenuOpen(false);
                      onOpenSaveModal('window');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <Layers size={14} color="var(--accent-color)" />
                    <span>Save Current Window</span>
                  </button>
                  <button
                    onClick={() => {
                      setSaveMenuOpen(false);
                      onOpenSaveModal('tab');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <Globe size={14} color="var(--accent-color)" />
                    <span>Save Active Tab Only</span>
                  </button>
                  <button
                    onClick={() => {
                      setSaveMenuOpen(false);
                      onOpenSaveModal('manual');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <Link size={14} color="var(--accent-color)" />
                    <span>Save Manually by URL</span>
                  </button>
                </div>
              )}

              {/* Sparkle / Magic Button */}
              <button
                onClick={onMagicAction || (() => onOpenSaveModal('window'))}
                title="Smart Organize & Group Tabs"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s ease'
                }}
              >
                <Sparkles size={16} />
              </button>

              {/* Instant Theme Toggle (Sun / Moon) */}
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  title={currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: currentTheme === 'dark' ? '#fbbf24' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {currentTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar / Pills Row (aligned to exact mockup) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 24px 12px 24px',
        gap: '12px',
        overflowX: 'auto'
      }}>
        {/* Left: Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
          {filterPills.map((pill) => {
            const isSelected = activeTagFilter.toLowerCase() === pill.id.toLowerCase();
            return (
              <button
                key={pill.id}
                onClick={() => onSelectTagFilter && onSelectTagFilter(pill.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '12px',
                  fontWeight: isSelected ? 600 : 500,
                  backgroundColor: isSelected ? 'var(--accent-color)' : 'var(--bg-input)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid var(--accent-color)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {pill.icon && <span>{pill.icon}</span>}
                <span>{pill.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => {
              const customTag = prompt('Enter tag to filter by:');
              if (customTag && onSelectTagFilter) {
                onSelectTagFilter(customTag);
              }
            }}
            title="Add Filter Tag"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Right: Sort By Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sort by</span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '4px 10px'
          }}>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              style={{
                fontSize: '12px',
                fontWeight: 500,
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="newest">Saved date</option>
              <option value="oldest">Oldest date</option>
              <option value="title">Title (A-Z)</option>
              <option value="domain">Domain</option>
              <option value="size">Size</option>
            </select>
            <ArrowUpDown size={12} color="var(--text-muted)" />
          </div>
        </div>
      </div>
    </div>
  );
};

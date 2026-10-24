import React from 'react';
import { Search, LayoutGrid, List, Table, ArrowUpDown, Filter, Plus, ShieldCheck } from 'lucide-react';
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
  onOpenSaveModal: () => void;
  onQuickSave: () => void;
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
  onOpenSaveModal,
  onQuickSave
}) => {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--bg-surface)',
      gap: '16px',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 300px', maxWidth: '500px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--bg-app)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 12px',
          width: '100%',
          position: 'relative'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Search saved tabs, URLs, tags, or notes... (Press '/' to focus)"
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
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '11px',
                padding: '2px 4px'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-app)',
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
              color: viewMode === 'grid' ? 'var(--accent-color)' : 'var(--text-secondary)',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            title="Compact list view"
            onClick={() => onViewModeChange('compact')}
            style={{
              border: 'none',
              background: viewMode === 'compact' ? 'var(--bg-surface)' : 'transparent',
              color: viewMode === 'compact' ? 'var(--accent-color)' : 'var(--text-secondary)',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              boxShadow: viewMode === 'compact' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <Table size={15} />
          </button>
          <button
            title="Detailed list view"
            onClick={() => onViewModeChange('detailed')}
            style={{
              border: 'none',
              background: viewMode === 'detailed' ? 'var(--bg-surface)' : 'transparent',
              color: viewMode === 'detailed' ? 'var(--accent-color)' : 'var(--text-secondary)',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              boxShadow: viewMode === 'detailed' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <List size={15} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            style={{
              fontSize: '12px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="title">Sort: Title (A-Z)</option>
            <option value="domain">Sort: Domain (A-Z)</option>
            <option value="size">Sort: Archive Size</option>
          </select>
        </div>

        <button
          onClick={onOpenSaveModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--accent-color)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '7px 14px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Plus size={16} />
          <span>Save Tabs</span>
        </button>
      </div>
    </header>
  );
};

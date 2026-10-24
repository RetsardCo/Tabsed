import React from 'react';
import {
  Layers,
  Clock,
  Star,
  Trash2,
  Folder,
  Copy,
  CheckCircle2,
  HardDrive,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Collection } from '../types';

interface SidebarProps {
  currentDestination: string;
  onSelectDestination: (dest: string) => void;
  collections: Collection[];
  onOpenCreateCollection: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenStorage: () => void;
  onOpenDuplicates: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenRestoreQueue: () => void;
  activeItemCount: number;
  favoritesCount: number;
  trashCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentDestination,
  onSelectDestination,
  collections,
  onOpenCreateCollection,
  isCollapsed,
  onToggleCollapse,
  onOpenStorage,
  onOpenDuplicates,
  onOpenSettings,
  onOpenHelp,
  onOpenRestoreQueue,
  activeItemCount,
  favoritesCount,
  trashCount
}) => {
  const sidebarWidth = isCollapsed ? '64px' : '240px';

  const navItemStyle = (isSelected: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
    fontWeight: isSelected ? 600 : 400,
    color: isSelected ? 'var(--accent-color)' : 'var(--text-primary)',
    backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    textAlign: 'left' as const,
    transition: 'background-color 0.1s ease',
    textDecoration: 'none'
  });

  return (
    <aside style={{
      width: sidebarWidth,
      minWidth: sidebarWidth,
      backgroundColor: 'var(--bg-sidebar)',
      backdropFilter: 'var(--backdrop-filter)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      transition: 'width 0.2s ease',
      userSelect: 'none'
    }}>
      {/* Brand Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        padding: '16px 14px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              backgroundColor: 'var(--accent-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Layers size={16} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.2px' }}>Tabsed</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            padding: '4px',
            borderRadius: '4px'
          }}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <button
          onClick={() => onSelectDestination('all')}
          style={navItemStyle(currentDestination === 'all')}
          title="All Tabs"
        >
          <Layers size={18} />
          {!isCollapsed && (
            <span style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
              All Tabs
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{activeItemCount}</span>
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectDestination('favorites')}
          style={navItemStyle(currentDestination === 'favorites')}
          title="Favorites"
        >
          <Star size={18} />
          {!isCollapsed && (
            <span style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
              Favorites
              {favoritesCount > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{favoritesCount}</span>}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectDestination('trash')}
          style={navItemStyle(currentDestination === 'trash')}
          title="Trash"
        >
          <Trash2 size={18} />
          {!isCollapsed && (
            <span style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
              Trash
              {trashCount > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{trashCount}</span>}
            </span>
          )}
        </button>

        {/* Collections Header */}
        {!isCollapsed && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 10px 4px 10px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            <span>Collections</span>
            <button
              onClick={onOpenCreateCollection}
              title="New Collection"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <Plus size={14} />
            </button>
          </div>
        )}

        {collections.map(col => (
          <button
            key={col.id}
            onClick={() => onSelectDestination(`col_${col.id}`)}
            style={navItemStyle(currentDestination === `col_${col.id}`)}
            title={col.name}
          >
            <Folder size={18} color={col.accentColor || 'var(--accent-color)'} />
            {!isCollapsed && (
              <span style={{ flex: 1, display: 'flex', justifyContent: 'space-between', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {col.name}
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{col.itemCount}</span>
              </span>
            )}
          </button>
        ))}

        {/* Tools Section */}
        {!isCollapsed && (
          <div style={{
            padding: '14px 10px 4px 10px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Tools &amp; Vault
          </div>
        )}

        <button
          onClick={onOpenDuplicates}
          style={navItemStyle(false)}
          title="Duplicate URLs"
        >
          <Copy size={18} />
          {!isCollapsed && <span>Duplicate URLs</span>}
        </button>

        <button
          onClick={onOpenRestoreQueue}
          style={navItemStyle(false)}
          title="Restore Sessions"
        >
          <Clock size={18} />
          {!isCollapsed && <span>Restore Sessions</span>}
        </button>

        <button
          onClick={onOpenStorage}
          style={navItemStyle(false)}
          title="Storage Explorer"
        >
          <HardDrive size={18} />
          {!isCollapsed && <span>Storage Explorer</span>}
        </button>
      </div>

      {/* Footer Settings & Help */}
      <div style={{
        padding: '12px 8px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <button
          onClick={onOpenSettings}
          style={navItemStyle(false)}
          title="Settings"
        >
          <Settings size={18} />
          {!isCollapsed && <span>Settings</span>}
        </button>

        <button
          onClick={onOpenHelp}
          style={navItemStyle(false)}
          title="Help &amp; Diagnostics"
        >
          <HelpCircle size={18} />
          {!isCollapsed && <span>Help &amp; Diagnostics</span>}
        </button>
      </div>
    </aside>
  );
};

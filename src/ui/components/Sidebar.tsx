import React from 'react';
import {
  Layers,
  Clock,
  Star,
  Trash2,
  Folder,
  Copy,
  Link2,
  Search,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreVertical,
  RotateCcw
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
  onOpenArchiveSearch?: () => void;
  onOpenCheckLinks?: () => void;
  activeItemCount: number;
  favoritesCount: number;
  trashCount: number;
  recentCount?: number;
  storageUsedBytes?: number;
  storageLimitBytes?: number;
  duplicatesCount?: number;
  brokenLinksCount?: number;
  edgeCount?: number;
  chromeCount?: number;
  firefoxCount?: number;
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
  onOpenArchiveSearch,
  onOpenCheckLinks,
  activeItemCount,
  favoritesCount,
  trashCount,
  recentCount = 24,
  storageUsedBytes = 12.4 * 1024 * 1024 * 1024,
  storageLimitBytes = 50 * 1024 * 1024 * 1024,
  duplicatesCount = 12,
  brokenLinksCount = 3,
  edgeCount = 42,
  chromeCount = 38,
  firefoxCount = 20
}) => {
  const sidebarWidth = isCollapsed ? '64px' : '260px';

  const formatGb = (bytes: number) => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1);
  };

  const navItemStyle = (isSelected: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
    fontWeight: isSelected ? 600 : 500,
    color: isSelected ? 'var(--accent-color)' : 'var(--text-secondary)',
    backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
    cursor: 'pointer',
    border: isSelected ? '1px solid rgba(37, 99, 235, 0.15)' : '1px solid transparent',
    width: '100%',
    textAlign: 'left' as const,
    transition: 'all 0.15s ease',
    textDecoration: 'none',
    boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.03)' : 'none'
  });

  const sectionHeaderStyle = {
    padding: '16px 12px 6px 12px',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const badgeStyle = {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    padding: '1px 6px',
    borderRadius: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.04)'
  };

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
      transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      userSelect: 'none',
      zIndex: 10
    }}>
      {/* Brand Header (aligned to exact mockup) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        padding: '16px 16px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        {!isCollapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
              flexShrink: 0
            }}>
              <Layers size={18} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                Tabsed
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400, marginTop: '1px' }}>
                Your tabs, thoughtfully put away.
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <Layers size={16} />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {!isCollapsed && (
            <button
              title="More options"
              onClick={onOpenSettings}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '4px',
                borderRadius: '6px'
              }}
            >
              <MoreVertical size={16} />
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>

      {/* Scrollable Navigation Sections */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>
        {/* Section 1: LIBRARY */}
        {!isCollapsed && (
          <div style={sectionHeaderStyle}>
            <span>Library</span>
          </div>
        )}

        <button
          onClick={() => onSelectDestination('all')}
          style={navItemStyle(currentDestination === 'all')}
          title="All Tabs"
        >
          <Layers size={17} />
          {!isCollapsed && (
            <span style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>All Tabs</span>
              <span style={badgeStyle}>{activeItemCount}</span>
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectDestination('collections')}
          style={navItemStyle(currentDestination === 'collections' || currentDestination.startsWith('col_'))}
          title="Collections"
        >
          <Folder size={17} />
          {!isCollapsed && (
            <span style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Collections</span>
              <span style={badgeStyle}>{collections.length}</span>
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectDestination('recent')}
          style={navItemStyle(currentDestination === 'recent')}
          title="Recent"
        >
          <Clock size={17} />
          {!isCollapsed && (
            <span style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Recent</span>
              <span style={badgeStyle}>{recentCount}</span>
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectDestination('favorites')}
          style={navItemStyle(currentDestination === 'favorites')}
          title="Favorites"
        >
          <Star size={17} />
          {!isCollapsed && (
            <span style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Favorites</span>
              <span style={badgeStyle}>{favoritesCount}</span>
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectDestination('trash')}
          style={navItemStyle(currentDestination === 'trash')}
          title="Trash"
        >
          <Trash2 size={17} />
          {!isCollapsed && (
            <span style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Trash</span>
              <span style={badgeStyle}>{trashCount}</span>
            </span>
          )}
        </button>

        {/* Section 2: BROWSERS */}
        {!isCollapsed && (
          <div style={sectionHeaderStyle}>
            <span>Browsers</span>
          </div>
        )}

        <button
          onClick={() => onSelectDestination('browser_edge')}
          style={navItemStyle(currentDestination === 'browser_edge')}
          title="Microsoft Edge"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M21.94 13.11c-.26-1.55-1.2-3.15-2.7-4.11-1.39-.89-3.08-1.2-4.73-1.01.27-.47.63-.88 1.05-1.22 1.48-1.18 3.51-1.3 5.09-.43l.86-.96C19.67 4.15 17.06 4 15.17 5.08c-.76.43-1.42 1.05-1.92 1.8-.75-.12-1.52-.15-2.28-.08-3.4.31-6.18 2.5-7.25 5.75-.41 1.25-.51 2.6-.28 3.91.43 2.45 2.11 4.54 4.47 5.56 2.37 1.02 5.2.78 7.37-.62 2.76-1.78 4.29-4.83 4.29-8.08 0-.07 0-.14-.01-.21h.38z" fill="#0078D7"/>
            <path d="M12.44 19.8c-3.13 0-5.78-2.03-6.66-4.9-.22-.72-.31-1.47-.28-2.22.46-1.1 1.34-1.97 2.43-2.45 1.09-.48 2.34-.52 3.52-.16 2.05.62 3.58 2.27 4.04 4.34.07.31.11.63.11.95 0 2.45-1.41 4.44-3.16 4.44z" fill="#00BCF2"/>
          </svg>
          {!isCollapsed && (
            <span style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Microsoft Edge</span>
              <span style={badgeStyle}>{edgeCount}</span>
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectDestination('browser_chrome')}
          style={navItemStyle(currentDestination === 'browser_chrome')}
          title="Google Chrome"
        >
          <svg width="17" height="17" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#EA4335"/>
            <circle cx="12" cy="12" r="5" fill="#FFFFFF"/>
            <circle cx="12" cy="12" r="4" fill="#4285F4"/>
            <path d="M12 2A10 10 0 0 1 21.6 8.5H12V2z" fill="#34A853"/>
            <path d="M2.4 15.5A10 10 0 0 1 2 12c0-3.3 1.6-6.2 4.1-8L10 10.5l-7.6 5z" fill="#FBBC05"/>
          </svg>
          {!isCollapsed && (
            <span style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Google Chrome</span>
              <span style={badgeStyle}>{chromeCount}</span>
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectDestination('browser_firefox')}
          style={navItemStyle(currentDestination === 'browser_firefox')}
          title="Firefox"
        >
          <svg width="17" height="17" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#FF7139"/>
            <path d="M12 2a10 10 0 0 0-7.8 16.3A8 8 0 0 1 12 7c2 0 3.7.8 5 2l1.5-1.5A10 10 0 0 0 12 2z" fill="#FF9400"/>
            <circle cx="12" cy="12" r="5" fill="#0060DF"/>
          </svg>
          {!isCollapsed && (
            <span style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Firefox</span>
              <span style={badgeStyle}>{firefoxCount}</span>
            </span>
          )}
        </button>

        {!isCollapsed && (
          <button
            onClick={onOpenSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              color: 'var(--accent-color)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              marginTop: '2px'
            }}
          >
            <Plus size={14} />
            <span>Connect Browser</span>
          </button>
        )}

        {/* Section 3: TOOLS */}
        {!isCollapsed && (
          <div style={sectionHeaderStyle}>
            <span>Tools</span>
          </div>
        )}

        <button
          onClick={onOpenArchiveSearch}
          style={navItemStyle(false)}
          title="Search in Archives"
        >
          <Search size={17} />
          {!isCollapsed && <span>Search in Archives</span>}
        </button>

        <button
          onClick={onOpenDuplicates}
          style={navItemStyle(false)}
          title="Duplicates"
        >
          <Copy size={17} />
          {!isCollapsed && (
            <span style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Duplicates</span>
              <span style={badgeStyle}>{duplicatesCount}</span>
            </span>
          )}
        </button>

        <button
          onClick={onOpenCheckLinks}
          style={navItemStyle(false)}
          title="Check Links"
        >
          <Link2 size={17} />
          {!isCollapsed && (
            <span style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Check Links</span>
              {brokenLinksCount > 0 && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#ffffff',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--danger-color)'
                }}>
                  {brokenLinksCount}
                </span>
              )}
            </span>
          )}
        </button>

        <button
          onClick={onOpenRestoreQueue}
          style={navItemStyle(false)}
          title="Restore Sessions"
        >
          <RotateCcw size={17} />
          {!isCollapsed && <span>Restore Sessions</span>}
        </button>
      </div>

      {/* Section 4: STORAGE (Exact mockup representation) */}
      {!isCollapsed && (
        <div style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(0, 0, 0, 0.01)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '6px'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Storage
            </span>
            <button
              onClick={onOpenStorage}
              title="Storage Settings"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '2px'
              }}
            >
              <Settings size={14} />
            </button>
          </div>

          {/* Progress bar */}
          <div
            onClick={onOpenStorage}
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'var(--border-subtle)',
              borderRadius: '3px',
              overflow: 'hidden',
              cursor: 'pointer',
              marginBottom: '6px'
            }}
          >
            <div style={{
              width: `${Math.min(100, (storageUsedBytes / storageLimitBytes) * 100)}%`,
              height: '100%',
              backgroundColor: 'var(--accent-color)',
              borderRadius: '3px'
            }} />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            fontWeight: 500
          }}>
            <span>{formatGb(storageUsedBytes)} GB of {formatGb(storageLimitBytes)} GB</span>
          </div>
        </div>
      )}

      {/* Bottom Section: Settings & Help */}
      <div style={{
        padding: '10px 10px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>
        <button
          onClick={onOpenSettings}
          style={navItemStyle(false)}
          title="Settings"
        >
          <Settings size={17} />
          {!isCollapsed && <span>Settings</span>}
        </button>

        <button
          onClick={onOpenHelp}
          style={navItemStyle(false)}
          title="Help & Feedback"
        >
          <HelpCircle size={17} />
          {!isCollapsed && <span>Help &amp; Feedback</span>}
        </button>
      </div>
    </aside>
  );
};

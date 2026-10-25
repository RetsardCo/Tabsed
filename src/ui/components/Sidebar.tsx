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
import { EdgeIcon, ChromeIcon, FirefoxIcon } from './BrandIcons';

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
  onOpenPortableVault?: () => void;
  onOpenConnectBrowser?: () => void;
  activeItemCount: number;
  favoritesCount: number;
  trashCount: number;
  collectionsCount?: number;
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
  onOpenPortableVault,
  onOpenConnectBrowser,
  activeItemCount,
  favoritesCount,
  trashCount,
  collectionsCount = 0,
  recentCount = 0,
  storageUsedBytes = 0,
  storageLimitBytes = 50 * 1024 * 1024 * 1024,
  duplicatesCount = 0,
  brokenLinksCount = 0,
  edgeCount = 0,
  chromeCount = 0,
  firefoxCount = 0
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
    border: isSelected ? '1px solid var(--accent-color)' : '1px solid transparent',
    width: '100%',
    textAlign: 'left' as const,
    transition: 'all 0.15s ease',
    textDecoration: 'none',
    boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
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
    backgroundColor: 'rgba(148, 163, 184, 0.14)'
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: 'drop-shadow(0 2px 8px rgba(37, 99, 235, 0.35)) drop-shadow(0 0 6px rgba(56, 189, 248, 0.25))',
              flexShrink: 0
            }}>
              <img
                src="/logo-32.png"
                srcSet="/logo-32.png 1x, /logo-64.png 2x, /logo.png 3x"
                alt="Tabsed"
                style={{
                  width: '32px',
                  height: '32px',
                  objectFit: 'contain',
                  imageRendering: '-webkit-optimize-contrast'
                }}
              />
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 2px 6px rgba(37, 99, 235, 0.35)) drop-shadow(0 0 4px rgba(56, 189, 248, 0.25))'
          }}>
            <img
              src="/logo-32.png"
              srcSet="/logo-32.png 1x, /logo-64.png 2x, /logo.png 3x"
              alt="Tabsed"
              style={{
                width: '30px',
                height: '30px',
                objectFit: 'contain',
                imageRendering: '-webkit-optimize-contrast'
              }}
            />
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
          style={navItemStyle(currentDestination === 'collections')}
          title="Collections"
        >
          <Folder size={17} />
          {!isCollapsed && (
            <span style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Collections</span>
              <span style={badgeStyle}>{collectionsCount}</span>
            </span>
          )}
        </button>

        {/* Sub-items for each individual collection */}
        {!isCollapsed && collections.map(col => {
          const isSelected = currentDestination === `col_${col.id}`;
          return (
            <button
              key={col.id}
              onClick={() => onSelectDestination(`col_${col.id}`)}
              style={{
                ...navItemStyle(isSelected),
                paddingLeft: '28px',
                fontSize: '12px'
              }}
              title={col.name}
            >
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: col.accentColor || 'var(--accent-color)',
                flexShrink: 0
              }} />
              <span style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.name}</span>
                <span style={badgeStyle}>{col.itemCount || 0}</span>
              </span>
            </button>
          );
        })}

        {!isCollapsed && (
          <button
            onClick={onOpenCreateCollection}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px 4px 28px',
              fontSize: '11px',
              color: 'var(--accent-color)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              textAlign: 'left',
              marginBottom: '2px'
            }}
          >
            <Plus size={12} />
            <span>New Collection</span>
          </button>
        )}

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
          <EdgeIcon size={17} />
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
          <ChromeIcon size={17} />
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
          <FirefoxIcon size={17} />
          {!isCollapsed && (
            <span style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Firefox</span>
              <span style={badgeStyle}>{firefoxCount}</span>
            </span>
          )}
        </button>

        {!isCollapsed && (
          <button
            onClick={onOpenConnectBrowser || onOpenSettings}
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
              fontWeight: 600,
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

        {onOpenPortableVault && (
          <button
            onClick={onOpenPortableVault}
            style={navItemStyle(false)}
            title="Portable Vault"
          >
            <Folder size={17} />
            {!isCollapsed && <span>Portable Vault</span>}
          </button>
        )}
      </div>

      {/* Section 4: STORAGE (Exact mockup representation) */}
      {!isCollapsed && (
        <div style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(0, 0, 0, 0.02)'
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

import React, { useState, useCallback, useMemo } from 'react';
import {
  Star,
  Trash2,
  Globe,
  MoreHorizontal,
  RotateCcw,
  Layers,
  ExternalLink,
  Copy,
  Plus,
  Link,
  ArrowRight,
  Clipboard,
  FolderPlus,
  FileText,
  Inbox
} from 'lucide-react';
import { SavedTabItem } from '../types';
import { SmartFavicon, ChromeIcon, FirefoxIcon, EdgeIcon } from './BrandIcons';
import { SmartBrandThumbnail } from './SmartBrandThumbnail';

interface TabGridProps {
  items: SavedTabItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onOpenLiveUrl: (url: string) => void;
  onRestoreItem?: (id: string) => void;
  isTrash?: boolean;
  onQuickAddUrl?: (url: string) => void;
  groupMode?: 'individual' | 'session';
  onGroupTabs?: (sourceTabId: string, targetTabId: string) => void;
  onAddToGroup?: (tabId: string) => void;
  gridColumns?: 'auto' | 2 | 3 | 4 | 5 | 6;
  cardSize?: 'compact' | 'medium' | 'large';
  currentDestination?: string;
  onOpenConnectBrowser?: () => void;
  searchQuery?: string;
}

const formatSize = (bytes?: number | null) => {
  if (!bytes) return '128 KB';
  if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(0) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
};

const formatRelativeDate = (dateStr: string) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
  return new Date(dateStr).toLocaleDateString();
};

const getTagColors = (tag: string) => {
  const t = tag.toLowerCase();
  if (t.includes('plan') || t.includes('work') || t.includes('dev')) {
    return { bg: 'rgba(37, 99, 235, 0.16)', text: '#3b82f6' };
  }
  if (t.includes('game') || t.includes('engine')) {
    return { bg: 'rgba(124, 58, 237, 0.16)', text: '#8b5cf6' };
  }
  if (t.includes('note') || t.includes('writ')) {
    return { bg: 'rgba(244, 63, 94, 0.16)', text: '#f43f5e' };
  }
  if (t.includes('ai') || t.includes('learn')) {
    return { bg: 'rgba(14, 165, 233, 0.16)', text: '#38bdf8' };
  }
  if (t.includes('design') || t.includes('creative') || t.includes('insp')) {
    return { bg: 'rgba(79, 70, 229, 0.16)', text: '#818cf8' };
  }
  if (t.includes('music') || t.includes('entertain') || t.includes('video')) {
    return { bg: 'rgba(245, 158, 11, 0.16)', text: '#fbbf24' };
  }
  if (t.includes('shop') || t.includes('hard') || t.includes('tool')) {
    return { bg: 'rgba(16, 185, 129, 0.16)', text: '#34d399' };
  }
  return { bg: 'rgba(148, 163, 184, 0.16)', text: 'var(--text-secondary)' };
};

interface TabCardProps {
  item: SavedTabItem;
  isSelected: boolean;
  isBeingDragged: boolean;
  isDropTarget: boolean;
  activeMenuId: string | null;
  isTrash?: boolean;
  thumbHeight: string;
  bodyPadding: string;
  onSelectItem: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onRestoreItem?: (id: string) => void;
  onOpenLiveUrl: (url: string) => void;
  onAddToGroup?: (id: string) => void;
  onToggleMenu: (id: string, e: React.MouseEvent) => void;
  onCloseMenu: () => void;
  onDragStart: (id: string, e: React.DragEvent) => void;
  onDragOver: (id: string, e: React.DragEvent) => void;
  onDragLeave: (id: string, e: React.DragEvent) => void;
  onDrop: (id: string, e: React.DragEvent) => void;
  onDragEnd: () => void;
}

const TabCard = React.memo<TabCardProps>(({
  item,
  isSelected,
  isBeingDragged,
  isDropTarget,
  activeMenuId,
  isTrash,
  thumbHeight,
  bodyPadding,
  onSelectItem,
  onToggleFavorite,
  onDeleteItem,
  onRestoreItem,
  onOpenLiveUrl,
  onAddToGroup,
  onToggleMenu,
  onCloseMenu,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd
}) => {
  const isMenuOpen = activeMenuId === item.id;
  const isSession = item.itemType === 'session' && (item.tabCount ? item.tabCount > 1 : false);
  const tabCount = item.tabCount || (item.sessionTabs ? item.sessionTabs.length : 1);

  return (
    <div
      onClick={() => onSelectItem(item.id)}
      draggable={!isTrash}
      onDragStart={(e) => onDragStart(item.id, e)}
      onDragOver={(e) => onDragOver(item.id, e)}
      onDragLeave={(e) => onDragLeave(item.id, e)}
      onDrop={(e) => onDrop(item.id, e)}
      onDragEnd={onDragEnd}
      className="tab-card"
      style={{
        backgroundColor: isSelected ? 'var(--bg-card-selected)' : 'var(--bg-card)',
        border: isDropTarget
          ? '2px solid var(--accent-color)'
          : `1px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-card)'}`,
        borderRadius: 'var(--radius-lg)',
        overflow: activeMenuId === item.id ? 'visible' : 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        opacity: isBeingDragged ? 0.45 : 1,
        transform: isDropTarget ? 'scale(1.03)' : (isBeingDragged ? 'scale(0.98)' : 'none'),
        boxShadow: isDropTarget
          ? '0 0 0 4px rgba(37, 99, 235, 0.45), 0 14px 32px rgba(37, 99, 235, 0.35)'
          : (isSelected
            ? 'var(--shadow-md), var(--card-highlight), 0 0 0 1px var(--accent-color)'
            : 'var(--shadow-sm), var(--card-highlight)'),
        position: 'relative',
        zIndex: activeMenuId === item.id ? 45 : (isSelected ? 5 : 1),
        contain: 'content',
        willChange: 'transform'
      }}
    >
      {/* Visual Drop to Group Glow Indicator */}
      {isDropTarget && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(37, 99, 235, 0.25)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            zIndex: 20,
            pointerEvents: 'none',
            border: '2px dashed #ffffff',
            boxShadow: 'inset 0 0 20px rgba(37, 99, 235, 0.5)'
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-color)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)'
            }}
          >
            <FolderPlus size={22} strokeWidth={2.5} />
          </div>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#ffffff',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              padding: '3px 12px',
              borderRadius: '12px'
            }}
          >
            Drop to group tabs
          </span>
        </div>
      )}

      {/* Top Thumbnail Section with SmartBrandThumbnail fallback */}
      <div style={{
        height: thumbHeight,
        backgroundColor: 'var(--bg-app)',
        position: 'relative',
        overflow: 'hidden',
        borderTopLeftRadius: 'calc(var(--radius-lg) - 1px)',
        borderTopRightRadius: 'calc(var(--radius-lg) - 1px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <SmartBrandThumbnail
          domain={item.domain}
          url={item.url}
          title={item.title}
          faviconUrl={item.faviconUrl}
          thumbnailUrl={item.thumbnailUrl}
        />

        {/* Favicon Overlay Badge */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          width: '28px',
          height: '28px',
          borderRadius: '7px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          zIndex: 2
        }}>
          <SmartFavicon
            domain={item.domain}
            url={item.url}
            faviconUrl={item.faviconUrl}
            size={16}
          />
        </div>

        {/* Favorite Star Button (Top Right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(item.id);
          }}
          title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: item.isFavorite ? '#f59e0b' : '#64748b',
            zIndex: 2
          }}
        >
          <Star size={15} fill={item.isFavorite ? '#f59e0b' : 'none'} strokeWidth={item.isFavorite ? 2 : 2.2} />
        </button>
      </div>

      {/* Card Body */}
      <div style={{ padding: bodyPadding, display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {/* Title */}
        <h3 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.2px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.3
        }}>
          {item.title}
        </h3>

        {/* Domain with icon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          <Globe size={13} style={{ flexShrink: 0 }} />
          <span>{item.domain || 'web'}</span>
        </div>

        {/* Tag Chips Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
          {(item.tags || []).slice(0, 3).map(tag => {
            const colors = getTagColors(tag);
            return (
              <span
                key={tag}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: colors.bg,
                  color: colors.text
                }}
              >
                {tag}
              </span>
            );
          })}
          {(item.tags || []).length > 3 && (
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 7px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(148, 163, 184, 0.15)',
              color: 'var(--text-muted)'
            }}>
              +{(item.tags || []).length - 3}
            </span>
          )}
        </div>

        {/* Note Snippet on Tab Card */}
        {item.notes && item.notes.trim() && (
          <div
            title={`Note: ${item.notes.trim()}`}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
              border: '1px solid rgba(37, 99, 235, 0.22)',
              fontSize: '11px',
              color: 'var(--text-primary)',
              lineHeight: 1.4,
              marginTop: '4px'
            }}
          >
            <FileText size={12} color="var(--accent-color)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word',
              fontWeight: 500
            }}>
              {item.notes.trim()}
            </span>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '12px',
        color: 'var(--text-muted)',
        backgroundColor: 'rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Type Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-light)',
              color: 'var(--accent-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {isSession ? <Layers size={11} /> : <Globe size={11} />}
            </div>
            <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
              {isSession ? `${tabCount} tabs` : 'Tab'}
            </span>
          </div>

          <span style={{ color: 'var(--text-muted)' }}>{formatSize(item.archiveSizeBytes)}</span>
          <span style={{ color: 'var(--text-muted)' }}>{formatRelativeDate(item.savedAt)}</span>
        </div>

        {/* Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isTrash ? (
            <>
              {onRestoreItem && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestoreItem(item.id);
                  }}
                  title="Restore from Trash"
                  aria-label="Restore from Trash"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--accent-color)',
                    padding: '4px'
                  }}
                >
                  <RotateCcw size={15} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item.id);
                }}
                title="Permanently Delete"
                aria-label="Permanently Delete"
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--danger-color)',
                  padding: '4px'
                }}
              >
                <Trash2 size={15} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item.id);
                }}
                title="Move to Trash"
                aria-label="Move to Trash"
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Trash2 size={15} />
              </button>
              {onAddToGroup && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToGroup(item.id);
                  }}
                  title="Add to group"
                  aria-label="Add to group"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <FolderPlus size={15} />
                </button>
              )}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={(e) => onToggleMenu(item.id, e)}
                  title="Tab actions"
                  aria-label="Tab actions"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: isMenuOpen ? 'var(--accent-color)' : 'var(--text-muted)',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <MoreHorizontal size={16} />
                </button>

                {isMenuOpen && (
                  <div
                    className="glass-popover"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      right: 0,
                      marginBottom: '6px',
                      width: '180px',
                      backgroundColor: 'var(--bg-popover)',
                      backdropFilter: 'var(--backdrop-filter-popover)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-popover)',
                      boxShadow: 'var(--shadow-popover)',
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      zIndex: 40
                    }}
                  >
                    <button
                      onClick={() => {
                        onCloseMenu();
                        onOpenLiveUrl(item.url);
                      }}
                      className="glass-menu-item"
                    >
                      <ExternalLink size={13} color="var(--accent-color)" />
                      <span>Open Live Website</span>
                    </button>
                    <button
                      onClick={() => {
                        onCloseMenu();
                        try { navigator.clipboard.writeText(item.url); } catch {}
                      }}
                      className="glass-menu-item"
                    >
                      <Copy size={13} color="var(--accent-color)" />
                      <span>Copy Link</span>
                    </button>
                    {isSession && (
                      <button
                        onClick={() => {
                          onCloseMenu();
                          onSelectItem(item.id);
                        }}
                        className="glass-menu-item"
                      >
                        <Layers size={13} color="var(--accent-color)" />
                        <span>View All Tabs</span>
                      </button>
                    )}
                    {onAddToGroup && (
                      <button
                        onClick={() => {
                          onCloseMenu();
                          onAddToGroup(item.id);
                        }}
                        className="glass-menu-item"
                      >
                        <FolderPlus size={13} color="var(--accent-color)" />
                        <span>Add to Group...</span>
                      </button>
                    )}
                    <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '2px 0' }} />
                    <button
                      onClick={() => {
                        onCloseMenu();
                        onDeleteItem(item.id);
                      }}
                      className="glass-menu-item glass-menu-item-danger"
                    >
                      <Trash2 size={13} />
                      <span>Move to Trash</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export const TabGrid: React.FC<TabGridProps> = ({
  items,
  selectedItemId,
  onSelectItem,
  onToggleFavorite,
  onDeleteItem,
  onOpenLiveUrl,
  onRestoreItem,
  isTrash,
  onQuickAddUrl,
  groupMode = 'individual',
  onGroupTabs,
  onAddToGroup,
  gridColumns = 'auto',
  cardSize = 'medium',
  currentDestination = 'all',
  onOpenConnectBrowser,
  searchQuery = ''
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [quickInput, setQuickInput] = useState('');
  const [quickError, setQuickError] = useState(false);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) {
      setQuickError(true);
      return;
    }
    setQuickError(false);
    if (onQuickAddUrl) {
      onQuickAddUrl(quickInput.trim());
      setQuickInput('');
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setQuickInput(text.trim());
        setQuickError(false);
      }
    } catch {}
  };

  const handleToggleMenu = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(prev => prev === id ? null : id);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setActiveMenuId(null);
  }, []);

  const handleDragStart = useCallback((id: string, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItemId(id);
  }, []);

  const handleDragOver = useCallback((id: string, e: React.DragEvent) => {
    if (!isTrash && draggedItemId && draggedItemId !== id) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverItemId !== id) {
        setDragOverItemId(id);
      }
    }
  }, [isTrash, draggedItemId, dragOverItemId]);

  const handleDragLeave = useCallback((id: string, e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node) && dragOverItemId === id) {
      setDragOverItemId(null);
    }
  }, [dragOverItemId]);

  const handleDrop = useCallback((id: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = draggedItemId || e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== id && onGroupTabs) {
      onGroupTabs(sourceId, id);
    }
    setDraggedItemId(null);
    setDragOverItemId(null);
  }, [draggedItemId, onGroupTabs]);

  const handleDragEnd = useCallback(() => {
    setDraggedItemId(null);
    setDragOverItemId(null);
  }, []);

  const getGridTemplateColumns = () => {
    if (typeof gridColumns === 'number') {
      return `repeat(${gridColumns}, minmax(0, 1fr))`;
    }
    if (cardSize === 'compact') {
      return 'repeat(auto-fill, minmax(240px, 1fr))';
    }
    if (cardSize === 'large') {
      return 'repeat(auto-fill, minmax(360px, 1fr))';
    }
    return 'repeat(auto-fill, minmax(310px, 1fr))';
  };

  const thumbHeight = cardSize === 'compact' ? '118px' : cardSize === 'large' ? '205px' : '154px';
  const bodyPadding = cardSize === 'compact' ? '10px 12px' : cardSize === 'large' ? '16px 18px' : '14px 16px';
  const gapSize = cardSize === 'compact' ? '14px' : cardSize === 'large' ? '24px' : '20px';

  // Empty state for Trash
  if (items.length === 0 && isTrash) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px',
        color: 'var(--text-secondary)',
        textAlign: 'center'
      }}>
        <Trash2 size={48} strokeWidth={1.5} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Trash is empty
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.5 }}>
          Tabs moved to trash will appear here until permanently deleted.
        </p>
      </div>
    );
  }

  // Render contextual empty state banner when items.length === 0
  const renderEmptyState = () => {
    let icon = <Inbox size={42} strokeWidth={1.5} color="var(--text-muted)" />;
    let title = 'No tabs found';
    let description = 'Tabs saved via your browser extension or entered above will appear here.';
    let actionButton: React.ReactNode = null;

    if (currentDestination === 'browser_chrome') {
      icon = <ChromeIcon size={44} />;
      title = 'No tabs from Google Chrome yet';
      description = 'Tabs saved via the Tabsed extension in Google Chrome will automatically sync to this folder.';
      if (onOpenConnectBrowser) {
        actionButton = (
          <button
            onClick={onOpenConnectBrowser}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-color)',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            <Plus size={14} />
            <span>Connect Google Chrome</span>
          </button>
        );
      }
    } else if (currentDestination === 'browser_firefox') {
      icon = <FirefoxIcon size={44} />;
      title = 'No tabs from Mozilla Firefox yet';
      description = 'Tabs saved via the Tabsed add-on in Firefox will automatically sync to this folder.';
      if (onOpenConnectBrowser) {
        actionButton = (
          <button
            onClick={onOpenConnectBrowser}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-color)',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            <Plus size={14} />
            <span>Connect Firefox</span>
          </button>
        );
      }
    } else if (currentDestination === 'browser_edge') {
      icon = <EdgeIcon size={44} />;
      title = 'No tabs from Microsoft Edge yet';
      description = 'Save your active Edge tabs using the Tabsed browser extension icon.';
    } else if (currentDestination === 'favorites') {
      icon = <Star size={42} strokeWidth={1.5} color="#fbbf24" />;
      title = 'No favorite tabs yet';
      description = 'Star your most important tabs to pin them to your favorites for instant access.';
    } else if (currentDestination === 'recent') {
      icon = <Inbox size={42} strokeWidth={1.5} color="var(--accent-color)" />;
      title = 'No tabs saved recently';
      description = 'Tabs saved within the last 7 days will automatically appear here.';
    } else if (currentDestination === 'collections' || currentDestination.startsWith('col_')) {
      icon = <FolderPlus size={42} strokeWidth={1.5} color="var(--accent-color)" />;
      title = 'Collection is empty';
      description = 'Drag tabs into this collection, or use "Manage Group Tabs" in the header to organize.';
    } else if (searchQuery && searchQuery.trim()) {
      title = `No tabs matching "${searchQuery}"`;
      description = 'Try searching with different keywords, tags, or domain names.';
    }

    return (
      <div style={{
        gridColumn: '1 / -1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '50px 20px',
        textAlign: 'center',
        gap: '10px'
      }}>
        {icon}
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', lineHeight: 1.5, margin: 0 }}>
          {description}
        </p>
        {actionButton}
      </div>
    );
  };

  const isSpecialEmptyView = items.length === 0 && (currentDestination.startsWith('browser_') || currentDestination === 'favorites');
  const showQuickAdd = !isTrash && Boolean(onQuickAddUrl) && !isSpecialEmptyView;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: getGridTemplateColumns(),
      gap: gapSize,
      padding: '24px'
    }}>
      {/* Inline Quick Add Card (active view only) */}
      {showQuickAdd && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-sm), var(--card-highlight)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            minHeight: '260px',
            contain: 'content'
          }}
        >
          {/* Quick Add Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(255, 255, 255, 0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} color="var(--accent-color)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Quick Add Tab</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Paste URL or text</span>
          </div>

          {/* Quick Add Form Body */}
          <form
            onSubmit={handleQuickSubmit}
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              flex: 1,
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-app)',
                border: `1px solid ${quickError ? 'var(--danger-color)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '0 10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <Link size={14} />
                </div>
                <input
                  type="text"
                  placeholder="Paste link or type URL to save as individual card..."
                  value={quickInput}
                  onChange={(e) => {
                    setQuickInput(e.target.value);
                    if (quickError) setQuickError(false);
                  }}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    padding: '8px 8px 8px 0',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>

              {quickError && (
                <span style={{ fontSize: '11px', color: 'var(--danger-color)' }}>
                  Please enter a valid URL.
                </span>
              )}
            </div>

            {/* Quick Add Form Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '8px'
            }}>
              <button
                type="button"
                onClick={handlePasteClipboard}
                title="Paste from clipboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 10px',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'color 0.15s ease'
                }}
              >
                <Clipboard size={13} />
                <span>Paste</span>
              </button>

              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--accent-color)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
                }}
              >
                <span>Save</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Render Items or Empty State */}
      {items.length === 0 ? (
        renderEmptyState()
      ) : (
        items.map(item => (
          <TabCard
            key={item.id}
            item={item}
            isSelected={item.id === selectedItemId}
            isBeingDragged={draggedItemId === item.id}
            isDropTarget={!isTrash && draggedItemId !== null && draggedItemId !== item.id && dragOverItemId === item.id}
            activeMenuId={activeMenuId}
            isTrash={isTrash}
            thumbHeight={thumbHeight}
            bodyPadding={bodyPadding}
            onSelectItem={onSelectItem}
            onToggleFavorite={onToggleFavorite}
            onDeleteItem={onDeleteItem}
            onRestoreItem={onRestoreItem}
            onOpenLiveUrl={onOpenLiveUrl}
            onAddToGroup={onAddToGroup}
            onToggleMenu={handleToggleMenu}
            onCloseMenu={handleCloseMenu}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        ))
      )}
    </div>
  );
};

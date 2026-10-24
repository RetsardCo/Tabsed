import React from 'react';
import {
  Star,
  Trash2,
  Globe,
  MoreHorizontal,
  ExternalLink,
  Layers,
  RotateCcw
} from 'lucide-react';
import { SavedTabItem } from '../types';

interface TabGridProps {
  items: SavedTabItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onOpenLiveUrl: (url: string) => void;
  onRestoreItem?: (id: string) => void;
  isTrash?: boolean;
}

export const TabGrid: React.FC<TabGridProps> = ({
  items,
  selectedItemId,
  onSelectItem,
  onToggleFavorite,
  onDeleteItem,
  onOpenLiveUrl,
  onRestoreItem,
  isTrash
}) => {
  if (items.length === 0) {
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
        {isTrash ? (
          <Trash2 size={48} strokeWidth={1.5} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
        ) : (
          <Globe size={48} strokeWidth={1.5} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
        )}
        <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
          {isTrash ? 'Trash is empty' : 'No saved tabs in this view'}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.5 }}>
          {isTrash
            ? 'Tabs moved to trash will appear here until permanently deleted.'
            : 'Tabs saved from Microsoft Edge, Google Chrome, or imported manually will appear here with rich previews, favicons, and session groups.'}
        </p>
      </div>
    );
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
      return { bg: 'rgba(37, 99, 235, 0.12)', text: '#2563eb' };
    }
    if (t.includes('game') || t.includes('engine')) {
      return { bg: 'rgba(124, 58, 237, 0.12)', text: '#7c3aed' };
    }
    if (t.includes('note') || t.includes('writ')) {
      return { bg: 'rgba(244, 63, 94, 0.12)', text: '#e11d48' };
    }
    if (t.includes('ai') || t.includes('learn')) {
      return { bg: 'rgba(14, 165, 233, 0.12)', text: '#0284c7' };
    }
    if (t.includes('design') || t.includes('creative') || t.includes('insp')) {
      return { bg: 'rgba(79, 70, 229, 0.12)', text: '#4f46e5' };
    }
    if (t.includes('music') || t.includes('entertain') || t.includes('video')) {
      return { bg: 'rgba(245, 158, 11, 0.14)', text: '#d97706' };
    }
    if (t.includes('shop') || t.includes('hard') || t.includes('tool')) {
      return { bg: 'rgba(16, 185, 129, 0.12)', text: '#059669' };
    }
    return { bg: 'rgba(100, 116, 139, 0.12)', text: 'var(--text-secondary)' };
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
      gap: '20px',
      padding: '24px'
    }}>
      {items.map(item => {
        const isSelected = item.id === selectedItemId;
        const tabCount = item.tabCount || (item.sessionTabs ? item.sessionTabs.length : 1);

        return (
          <div
            key={item.id}
            onClick={() => onSelectItem(item.id)}
            style={{
              backgroundColor: isSelected ? 'var(--bg-card-selected)' : 'var(--bg-card)',
              border: `1px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-card)'}`,
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
              position: 'relative'
            }}
          >
            {/* Top Thumbnail Section (aligned to mockup) */}
            <div style={{
              height: '154px',
              backgroundColor: 'var(--bg-app)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-muted)'
                }}>
                  <Globe size={32} strokeWidth={1.5} />
                  <span style={{ fontSize: '11px', fontWeight: 500 }}>Preview snapshot</span>
                </div>
              )}

              {/* Favicon Overlay Badge (Top Left) */}
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                backgroundColor: '#ffffff',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {item.faviconUrl ? (
                  <img
                    src={item.faviconUrl}
                    alt=""
                    style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Globe size={16} color="#475569" />
                )}
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
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.12)',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: item.isFavorite ? '#f59e0b' : '#64748b',
                  transition: 'transform 0.15s ease'
                }}
              >
                <Star size={15} fill={item.isFavorite ? '#f59e0b' : 'none'} strokeWidth={item.isFavorite ? 2 : 2.2} />
              </button>
            </div>

            {/* Card Body */}
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
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
                <span>{item.domain}</span>
              </div>

              {/* Tag Chips Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                {item.tags.slice(0, 3).map(tag => {
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
                {item.tags.length > 3 && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 7px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'rgba(100, 116, 139, 0.1)',
                    color: 'var(--text-muted)'
                  }}>
                    +{item.tags.length - 3}
                  </span>
                )}
              </div>
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
              backgroundColor: 'rgba(0, 0, 0, 0.01)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Author Avatar or Session Icon */}
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
                  {item.authorAvatarUrl ? (
                    <img src={item.authorAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Layers size={11} />
                  )}
                </div>

                <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {tabCount} {tabCount === 1 ? 'tab' : 'tabs'}
                </span>

                <span>•</span>

                <span>{formatSize(item.archiveSizeBytes)}</span>

                <span>•</span>

                <span>{formatRelativeDate(item.savedAt)}</span>
              </div>

              {/* Action Menu button */}
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
                        borderRadius: '4px'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectItem(item.id);
                      }}
                      title="Tab actions"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: '4px',
                        borderRadius: '4px'
                      }}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

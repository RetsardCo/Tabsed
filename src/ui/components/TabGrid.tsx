import React, { useState } from 'react';
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
  Clipboard
} from 'lucide-react';
import { SavedTabItem } from '../types';
import { SmartFavicon } from './BrandIcons';
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
}

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
  groupMode = 'individual'
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
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

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
      gap: '20px',
      padding: '24px'
    }}>
      {/* Umark-Style Inline Quick Add Card (Top of Grid, active view only) */}
      {!isTrash && onQuickAddUrl && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            backdropFilter: 'var(--backdrop-filter)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-sm), var(--card-highlight)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            minHeight: '260px'
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
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Plus size={14} strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Quick Add
              </span>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--text-muted)'
            }}>
              Web Tab
            </span>
          </div>

          {/* Quick Add Form Body */}
          <form
            onSubmit={handleQuickSubmit}
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              gap: '12px',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <textarea
                value={quickInput}
                onChange={(e) => {
                  setQuickInput(e.target.value);
                  setQuickError(false);
                }}
                placeholder="Paste link or type URL to save as individual card..."
                rows={3}
                style={{
                  width: '100%',
                  height: '100px',
                  backgroundColor: 'var(--bg-input)',
                  border: quickError ? '1px solid var(--danger-color)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  resize: 'none',
                  outline: 'none',
                  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)'
                }}
              />
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

      {/* Item Cards in Grid */}
      {items.map(item => {
        const isSelected = item.id === selectedItemId;
        const isSession = item.itemType === 'session' && (item.tabCount ? item.tabCount > 1 : false);
        const tabCount = item.tabCount || (item.sessionTabs ? item.sessionTabs.length : 1);

        return (
          <div
            key={item.id}
            onClick={() => onSelectItem(item.id)}
            style={{
              backgroundColor: isSelected ? 'var(--bg-card-selected)' : 'var(--bg-card)',
              backdropFilter: 'var(--backdrop-filter)',
              border: `1px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-card)'}`,
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: isSelected
                ? 'var(--shadow-md), var(--card-highlight), 0 0 0 1px var(--accent-color)'
                : 'var(--shadow-sm), var(--card-highlight)',
              position: 'relative'
            }}
          >
            {/* Top Thumbnail Section with SmartBrandThumbnail fallback */}
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
              <SmartBrandThumbnail
                domain={item.domain}
                url={item.url}
                title={item.title}
                faviconUrl={item.faviconUrl}
                thumbnailUrl={item.thumbnailUrl}
              />

              {/* Favicon Overlay Badge (Top Left - frosted glass pill) */}
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
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: item.isFavorite ? '#f59e0b' : '#64748b',
                  transition: 'transform 0.15s ease',
                  zIndex: 2
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
                <span>{item.domain || 'web'}</span>
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
                    backgroundColor: 'rgba(148, 163, 184, 0.15)',
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
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === item.id ? null : item.id);
                        }}
                        title="Tab actions"
                        aria-label="Tab actions"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: activeMenuId === item.id ? 'var(--accent-color)' : 'var(--text-muted)',
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {activeMenuId === item.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: 'absolute',
                            bottom: '100%',
                            right: 0,
                            marginBottom: '6px',
                            width: '170px',
                            backgroundColor: 'var(--bg-surface)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            boxShadow: 'var(--shadow-lg)',
                            padding: '6px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            zIndex: 40
                          }}
                        >
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onOpenLiveUrl(item.url);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '7px 10px',
                              borderRadius: 'var(--radius-sm)',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-primary)',
                              fontSize: '12px',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <ExternalLink size={13} color="var(--accent-color)" />
                            <span>Open Live Website</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              try { navigator.clipboard.writeText(item.url); } catch {}
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '7px 10px',
                              borderRadius: 'var(--radius-sm)',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-primary)',
                              fontSize: '12px',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <Copy size={13} color="var(--accent-color)" />
                            <span>Copy Link</span>
                          </button>
                          {isSession && (
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onSelectItem(item.id);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '7px 10px',
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                            >
                              <Layers size={13} color="var(--accent-color)" />
                              <span>View All Tabs</span>
                            </button>
                          )}
                          <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '2px 0' }} />
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onDeleteItem(item.id);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '7px 10px',
                              borderRadius: 'var(--radius-sm)',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--danger-color)',
                              fontSize: '12px',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
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
      })}
    </div>
  );
};

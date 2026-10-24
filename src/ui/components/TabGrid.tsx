import React from 'react';
import { ExternalLink, Star, Trash2, Globe, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { SavedTabItem } from '../types';

interface TabGridProps {
  items: SavedTabItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onOpenLiveUrl: (url: string) => void;
}

export const TabGrid: React.FC<TabGridProps> = ({
  items,
  selectedItemId,
  onSelectItem,
  onToggleFavorite,
  onDeleteItem,
  onOpenLiveUrl
}) => {
  if (items.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        color: 'var(--text-secondary)',
        textAlign: 'center'
      }}>
        <Globe size={48} strokeWidth={1.5} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
          No saved tabs in this view
        </h3>
        <p style={{ fontSize: '13px', maxWidth: '420px', marginBottom: '16px' }}>
          Tabs saved from Microsoft Edge, Google Chrome, or imported manually will appear here with previews and metadata.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '16px',
      padding: '20px'
    }}>
      {items.map(item => {
        const isSelected = item.id === selectedItemId;

        return (
          <div
            key={item.id}
            onClick={() => onSelectItem(item.id)}
            style={{
              backgroundColor: isSelected ? 'var(--bg-card-selected)' : 'var(--bg-card)',
              border: `1px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
              position: 'relative'
            }}
          >
            {/* Thumbnail Preview Area */}
            <div style={{
              height: '140px',
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
                  <Globe size={28} />
                  <span style={{ fontSize: '11px' }}>Preview unavailable</span>
                </div>
              )}

              {/* Top overlay badge for browser or availability */}
              <div style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                display: 'flex',
                gap: '6px'
              }}>
                <span style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(4px)',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 500,
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {item.browserFamily}
                </span>

                {item.availabilityStatus && (
                  <span style={{
                    backgroundColor: item.availabilityStatus === 'reachable' ? 'rgba(22, 163, 74, 0.85)' : 'rgba(220, 38, 38, 0.85)',
                    color: '#ffffff',
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {item.availabilityStatus}
                  </span>
                )}
              </div>

              {/* Favorite Toggle Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(item.id);
                }}
                title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  border: 'none',
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: '50%',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: item.isFavorite ? '#fbbf24' : '#ffffff'
                }}
              >
                <Star size={14} fill={item.isFavorite ? '#fbbf24' : 'none'} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {item.faviconUrl ? (
                  <img src={item.faviconUrl} alt="" style={{ width: '16px', height: '16px', borderRadius: '3px' }} />
                ) : (
                  <Globe size={16} color="var(--text-muted)" />
                )}
                <h4 style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {item.title}
                </h4>
              </div>

              <div style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {item.domain}
              </div>

              {item.notes && (
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-app)',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: '1.4'
                }}>
                  {item.notes}
                </div>
              )}

              {/* Tags Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: 'auto' }}>
                {item.tags.slice(0, 2).map(tag => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    #{tag}
                  </span>
                ))}
                {item.tags.length > 2 && (
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    +{item.tags.length - 2}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 14px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '11px',
              color: 'var(--text-muted)'
            }}>
              <span>{new Date(item.savedAt).toLocaleDateString()}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLiveUrl(item.url);
                  }}
                  title="Open live website in browser"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--accent-color)',
                    padding: '2px'
                  }}
                >
                  <ExternalLink size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem(item.id);
                  }}
                  title="Move to trash"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--danger-color)',
                    padding: '2px'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

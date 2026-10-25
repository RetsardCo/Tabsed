import React from 'react';
import { ExternalLink, Star, Trash2, Globe, Clock, Tag, RotateCcw } from 'lucide-react';
import { SavedTabItem } from '../types';
import { SmartBrandThumbnail } from './SmartBrandThumbnail';
import { SmartFavicon } from './BrandIcons';

interface TabDetailedListProps {
  items: SavedTabItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onOpenLiveUrl: (url: string) => void;
  onRestoreItem?: (id: string) => void;
  isTrash?: boolean;
}

export const TabDetailedList: React.FC<TabDetailedListProps> = ({
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
        padding: '60px 20px',
        color: 'var(--text-secondary)',
        textAlign: 'center'
      }}>
        {isTrash ? (
          <Trash2 size={48} strokeWidth={1.5} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
        ) : (
          <Globe size={48} strokeWidth={1.5} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
        )}
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
          {isTrash ? 'Trash is empty' : 'No saved tabs in this view'}
        </h3>
        <p style={{ fontSize: '13px', maxWidth: '420px', marginBottom: '16px' }}>
          {isTrash
            ? 'Tabs moved to trash will appear here until permanently deleted.'
            : 'Tabs saved from Microsoft Edge, Google Chrome, or imported manually will appear here with previews and metadata.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px' }}>
      {items.map(item => {
        const isSelected = item.id === selectedItemId;

        return (
          <div
            key={item.id}
            onClick={() => onSelectItem(item.id)}
            style={{
              display: 'flex',
              gap: '14px',
              padding: '12px 16px',
              backgroundColor: isSelected ? 'var(--bg-card-selected)' : 'var(--bg-card)',
              border: `1px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              alignItems: 'center',
              boxShadow: isSelected ? 'var(--shadow-sm)' : 'none'
            }}
          >
            {/* Thumbnail preview */}
            <div style={{
              width: '108px',
              height: '70px',
              minWidth: '108px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-subtle)',
              position: 'relative'
            }}>
              <SmartBrandThumbnail
                domain={item.domain}
                url={item.url}
                title={item.title}
                faviconUrl={item.faviconUrl}
                thumbnailUrl={item.thumbnailUrl}
              />
            </div>

            {/* Content Details */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SmartFavicon domain={item.domain} url={item.url} faviconUrl={item.faviconUrl} size={15} />
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                  {item.title}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>— {item.domain}</span>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.url}
              </div>

              {item.notes && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {item.notes}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                <span>Saved: {new Date(item.savedAt).toLocaleDateString()}</span>
                <span>Browser: {item.browserFamily}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {item.tabCount || (item.sessionTabs ? item.sessionTabs.length : 1)} tabs
                </span>
                {item.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {item.tags.map(t => (
                      <span key={t} style={{ color: 'var(--accent-color)' }}>#{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(item.id);
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: item.isFavorite ? '#fbbf24' : 'var(--text-muted)',
                  padding: '4px'
                }}
              >
                <Star size={16} fill={item.isFavorite ? '#fbbf24' : 'none'} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLiveUrl(item.url);
                }}
                title="Open live URL"
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--accent-color)',
                  padding: '4px'
                }}
              >
                <ExternalLink size={16} />
              </button>
              {(isTrash || Boolean(item.deletedAt)) && onRestoreItem && (
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
                  <RotateCcw size={16} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item.id);
                }}
                title={isTrash || Boolean(item.deletedAt) ? 'Permanently Delete' : 'Move to Trash'}
                aria-label={isTrash || Boolean(item.deletedAt) ? 'Permanently Delete' : 'Move to Trash'}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--danger-color)',
                  padding: '4px'
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

import React from 'react';
import { ExternalLink, Star, Trash2, Globe } from 'lucide-react';
import { SavedTabItem } from '../types';

interface TabCompactListProps {
  items: SavedTabItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onOpenLiveUrl: (url: string) => void;
}

export const TabCompactList: React.FC<TabCompactListProps> = ({
  items,
  selectedItemId,
  onSelectItem,
  onToggleFavorite,
  onDeleteItem,
  onOpenLiveUrl
}) => {
  return (
    <div style={{ padding: '16px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{
            borderBottom: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            textAlign: 'left'
          }}>
            <th style={{ padding: '8px 12px', width: '32px' }}></th>
            <th style={{ padding: '8px 12px' }}>Title &amp; Page</th>
            <th style={{ padding: '8px 12px' }}>Domain</th>
            <th style={{ padding: '8px 12px' }}>Tags</th>
            <th style={{ padding: '8px 12px', width: '110px' }}>Saved</th>
            <th style={{ padding: '8px 12px', width: '80px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const isSelected = item.id === selectedItemId;
            return (
              <tr
                key={item.id}
                onClick={() => onSelectItem(item.id)}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: isSelected ? 'var(--bg-card-selected)' : 'transparent',
                  cursor: 'pointer'
                }}
              >
                <td style={{ padding: '8px 12px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item.id);
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: item.isFavorite ? '#fbbf24' : 'var(--text-muted)'
                    }}
                  >
                    <Star size={14} fill={item.isFavorite ? '#fbbf24' : 'none'} />
                  </button>
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.faviconUrl ? (
                      <img src={item.faviconUrl} alt="" style={{ width: '14px', height: '14px', borderRadius: '2px' }} />
                    ) : (
                      <Globe size={14} color="var(--text-muted)" />
                    )}
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.title}</span>
                  </div>
                </td>
                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                  {item.domain}
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {item.tags.map(t => (
                      <span key={t} style={{
                        fontSize: '10px',
                        padding: '1px 5px',
                        backgroundColor: 'var(--bg-app)',
                        borderRadius: '3px',
                        color: 'var(--text-secondary)'
                      }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                  {new Date(item.savedAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenLiveUrl(item.url);
                      }}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-color)' }}
                    >
                      <ExternalLink size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(item.id);
                      }}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger-color)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

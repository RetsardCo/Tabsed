import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Star, Trash2, Globe, Clock, Check, AlertCircle, RotateCcw } from 'lucide-react';
import { SavedTabItem } from '../types';

interface DetailInspectorProps {
  item: SavedTabItem | null;
  onClose: () => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
  onOpenLiveUrl: (url: string) => void;
  onCheckAvailability: (url: string) => void;
  onRestoreItem?: (id: string) => void;
  onDeleteItem?: (id: string) => void;
  isTrash?: boolean;
}

export const DetailInspector: React.FC<DetailInspectorProps> = ({
  item,
  onClose,
  onUpdateNotes,
  onAddTag,
  onRemoveTag,
  onOpenLiveUrl,
  onCheckAvailability,
  onRestoreItem,
  onDeleteItem,
  isTrash
}) => {
  if (!item) return null;

  const inTrash = isTrash || Boolean(item.deletedAt);
  const [notesText, setNotesText] = useState(item.notes);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    setNotesText(item.notes);
    setSaveStatus('saved');
  }, [item.id, item.notes]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotesText(val);
    setSaveStatus('dirty');
  };

  // Debounced auto-save for notes (PRD FR-033)
  useEffect(() => {
    if (saveStatus !== 'dirty') return;

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      onUpdateNotes(item.id, notesText);
      setSaveStatus('saved');
    }, 600);

    return () => clearTimeout(timer);
  }, [notesText, saveStatus, item.id, onUpdateNotes]);

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newTagInput.trim();
    if (tag && !item.tags.includes(tag)) {
      onAddTag(item.id, tag);
      setNewTagInput('');
    }
  };

  return (
    <aside style={{
      width: '320px',
      minWidth: '320px',
      backgroundColor: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <span style={{ fontSize: '13px', fontWeight: 600 }}>Tab Details</span>
        <button
          onClick={onClose}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Preview image */}
        <div style={{
          width: '100%',
          height: '160px',
          backgroundColor: 'var(--bg-app)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border-subtle)'
        }}>
          {item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <Globe size={32} />
              <div style={{ fontSize: '11px', marginTop: '6px' }}>Thumbnail unavailable</div>
            </div>
          )}
        </div>

        {/* Title and URL */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {item.title}
          </h3>
          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            wordBreak: 'break-all',
            backgroundColor: 'var(--bg-app)',
            padding: '6px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}>
            {item.url}
          </div>
        </div>

        {/* Trash Status Banner if item is in trash */}
        {inTrash && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            color: 'var(--danger-color)'
          }}>
            <Trash2 size={16} />
            <span>This tab is currently in the Trash.</span>
          </div>
        )}

        {/* Action Buttons: Open Live URL, Restore from Trash, Delete */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => onOpenLiveUrl(item.url)}
            title="Open live website in browser"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: 'var(--accent-color)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <ExternalLink size={15} />
            <span>Open Live Page in Browser</span>
          </button>

          {inTrash && onRestoreItem && (
            <button
              onClick={() => onRestoreItem(item.id)}
              title="Restore from Trash"
              aria-label="Restore from Trash"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--accent-color)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={15} />
              <span>Restore from Trash</span>
            </button>
          )}

          {onDeleteItem && (
            <button
              onClick={() => onDeleteItem(item.id)}
              title={inTrash ? 'Permanently Delete' : 'Move to Trash'}
              aria-label={inTrash ? 'Permanently Delete' : 'Move to Trash'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                color: 'var(--danger-color)',
                border: inTrash ? '1px solid var(--danger-color)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={15} />
              <span>{inTrash ? 'Permanently Delete' : 'Move to Trash'}</span>
            </button>
          )}
        </div>

        {/* Metadata grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          fontSize: '11px',
          backgroundColor: 'var(--bg-app)',
          padding: '10px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Browser:</span>
            <div style={{ fontWeight: 500 }}>{item.browserFamily}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Saved:</span>
            <div style={{ fontWeight: 500 }}>{new Date(item.savedAt).toLocaleDateString()}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Domain:</span>
            <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.domain}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Archive:</span>
            <div style={{ fontWeight: 500 }}>
              {item.archiveSizeBytes ? `${Math.round(item.archiveSizeBytes / 1024)} KB` : 'Snapshot'}
            </div>
          </div>
        </div>

        {/* Availability Check status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          padding: '8px 10px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: item.availabilityStatus === 'reachable' ? 'rgba(22, 163, 74, 0.1)' : 'var(--bg-app)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Check size={14} color={item.availabilityStatus === 'reachable' ? 'var(--success-color)' : 'var(--text-muted)'} />
            <span>Link Check: {item.availabilityStatus || 'Unchecked'}</span>
          </div>
          <button
            onClick={() => onCheckAvailability(item.url)}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--accent-color)',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Check Now
          </button>
        </div>

        {/* Notes Editor with Autosave Status (PRD FR-033) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Personal Notes
            </label>
            <span style={{ fontSize: '10px', color: saveStatus === 'saved' ? 'var(--success-color)' : 'var(--text-muted)' }}>
              {saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? 'Saving...' : 'Editing'}
            </span>
          </div>
          <textarea
            value={notesText}
            onChange={handleNotesChange}
            placeholder="Add notes about why you saved this tab or follow-up tasks..."
            rows={4}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              resize: 'vertical',
              outline: 'none'
            }}
          />
        </div>

        {/* Tags Section */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Tags
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
            {item.tags.map(tag => (
              <span
                key={tag}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  padding: '2px 8px',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  color: 'var(--text-secondary)'
                }}
              >
                #{tag}
                <button
                  onClick={() => onRemoveTag(item.id, tag)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '10px' }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddTagSubmit} style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="Add a tag..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
                fontSize: '11px',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '4px 10px',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Add
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
};

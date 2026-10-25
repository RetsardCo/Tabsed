import React, { useState, useEffect } from 'react';
import { X, Copy, ExternalLink, Trash2, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { SavedTabItem } from '../types';
import { UrlNormalizer, DuplicateGroup } from '../../core/transaction/duplicate-detector';

interface DuplicatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SavedTabItem[];
  onDeleteItem: (id: string) => void;
}

export const DuplicatesModal: React.FC<DuplicatesModalProps> = ({ isOpen, onClose, items, onDeleteItem }) => {
  const [stripTracking, setStripTracking] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  const duplicateGroups: DuplicateGroup<SavedTabItem>[] = UrlNormalizer.findDuplicates(items, {
    stripTrackingParams: stripTracking
  });

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="glass-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1500,
        padding: '20px'
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicates-modal-title"
        className="glass-modal-dialog"
        style={{
          width: '640px',
          maxWidth: '92vw',
          maxHeight: '85vh',
          backgroundColor: 'var(--bg-popover)',
          backdropFilter: 'var(--backdrop-filter-popover)',
          WebkitBackdropFilter: 'var(--backdrop-filter-popover)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-popover)',
          boxShadow: 'var(--shadow-popover), 0 20px 40px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header - Fixed */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Copy size={18} color="var(--accent-color)" />
            <span id="duplicates-modal-title" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Duplicate URL Resolver
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            title="Close (Esc)"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease, color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-app)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Subheader / Settings - Fixed */}
        <div style={{
          padding: '12px 20px',
          backgroundColor: 'var(--bg-app)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          flexShrink: 0
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={stripTracking}
              onChange={e => setStripTracking(e.target.checked)}
            />
            <span>Strip UTM/tracking parameters during normalization</span>
          </label>
          <span style={{ color: 'var(--text-muted)' }}>
            {duplicateGroups.length} duplicate groups identified
          </span>
        </div>

        {/* Content Body - Scrollable */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
          {duplicateGroups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <Copy size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>No duplicates found</h4>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                All saved tabs have unique URLs under current normalization rules.
              </p>
            </div>
          ) : (
            duplicateGroups.map((group, gIdx) => (
              <div
                key={gIdx}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-app)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Normalized Target:</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                    {group.normalizedUrl}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--accent-color)', marginTop: '2px' }}>
                    Rule: {group.matchingRule}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {group.items.map(item => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title}
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>
                          Saved: {new Date(item.savedAt).toLocaleDateString()} · Browser: {item.browserFamily}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          title="Delete this copy"
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '4px',
                            color: 'var(--danger-color)',
                            cursor: 'pointer',
                            fontSize: '10px'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Safety rule disclosure */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            padding: '8px 12px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <ShieldCheck size={16} color="var(--success-color)" />
            <span>Tabsed never automatically deletes duplicates. All resolutions require explicit user action.</span>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-app)',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Press Esc or click outside to dismiss
          </span>
          <button
            onClick={onClose}
            aria-label="Close duplicate resolver"
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-color)',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

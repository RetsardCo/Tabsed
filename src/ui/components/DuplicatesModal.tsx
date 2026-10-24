import React, { useState } from 'react';
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
  if (!isOpen) return null;

  const [stripTracking, setStripTracking] = useState(false);

  const duplicateGroups: DuplicateGroup<SavedTabItem>[] = UrlNormalizer.findDuplicates(items, {
    stripTrackingParams: stripTracking
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1500
    }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicates-modal-title"
        style={{
        width: '620px',
        maxHeight: '85vh',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-lg)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Copy size={18} color="var(--accent-color)" />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>Duplicate URL Resolver</span>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Subheader / Settings */}
        <div style={{
          padding: '12px 20px',
          backgroundColor: 'var(--bg-app)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px'
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

        {/* Content Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '12px 20px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-app)'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-color)',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

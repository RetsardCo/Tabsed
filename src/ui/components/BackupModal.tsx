import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Download, Upload, CheckCircle2, AlertTriangle, FileArchive } from 'lucide-react';
import { SavedTabItem, BackupManifest } from '../types';
import { BackupManager, BackupResult } from '../../core/vault/backup-manager';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SavedTabItem[];
  onRestoreBackup: (items: SavedTabItem[]) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  items,
  onRestoreBackup
}) => {
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

  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'create' | 'restore'>('create');
  const [createdBackup, setCreatedBackup] = useState<BackupResult | null>(null);
  const [restoreText, setRestoreText] = useState('');
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  const handleCreate = () => {
    const res = BackupManager.createBackup(items);
    setCreatedBackup(res);
  };

  const handleDownloadBackup = () => {
    if (!createdBackup) return;
    // Export full bundle with manifest & items
    const exportBundle = {
      manifest: createdBackup.manifest,
      items: JSON.parse(createdBackup.backupBlobJson)
    };
    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tabsed-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreSubmit = () => {
    setRestoreError(null);
    setRestoreSuccess(null);
    try {
      if (!restoreText.trim()) {
        setRestoreError('Please paste your backup JSON file content');
        return;
      }
      const parsed = JSON.parse(restoreText);

      // Support full bundle format { manifest, items }
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.manifest && Array.isArray(parsed.items)) {
        const serialized = JSON.stringify(parsed.items, null, 2);
        const isValid = BackupManager.verifyBackup(serialized, parsed.manifest);
        if (!isValid) {
          setRestoreError('Cryptographic integrity check failed: SHA-256 hash does not match manifest');
          return;
        }
        onRestoreBackup(parsed.items);
        setRestoreSuccess(`Verified & restored ${parsed.items.length} tab items (SHA-256 integrity passed)!`);
        return;
      }

      // Support raw array format
      if (Array.isArray(parsed)) {
        onRestoreBackup(parsed);
        setRestoreSuccess(`Successfully restored ${parsed.length} tab items to your vault!`);
        return;
      }

      setRestoreError('Invalid backup file format: expected an array of tab items or a verified backup bundle');
    } catch (e: any) {
      setRestoreError('Failed to parse backup JSON: ' + e.message);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
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
        aria-labelledby="backup-modal-title"
        style={{
          width: '580px',
          maxWidth: '92vw',
          maxHeight: '85vh',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg), 0 20px 40px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header - Fixed */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 22px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-color)'
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 id="backup-modal-title" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, margin: 0 }}>
                Vault Backup &amp; Integrity
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Verifiable cryptographic snapshots (PRD Epic 2.5)
              </span>
            </div>
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
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs - Fixed */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-app)', flexShrink: 0 }}>
          <button
            onClick={() => setActiveTab('create')}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: activeTab === 'create' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'create' ? 'var(--accent-color)' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: activeTab === 'create' ? '2px solid var(--accent-color)' : 'none',
              cursor: 'pointer'
            }}
          >
            Create Backup Snapshot
          </button>
          <button
            onClick={() => setActiveTab('restore')}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: activeTab === 'restore' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'restore' ? 'var(--accent-color)' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: activeTab === 'restore' ? '2px solid var(--accent-color)' : 'none',
              cursor: 'pointer'
            }}
          >
            Restore from Backup
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '22px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeTab === 'create' ? (
            <>
              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                fontSize: '13px',
                lineHeight: 1.5,
                color: 'var(--text-secondary)'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Cryptographic Snapshot
                </div>
                Take a complete, SHA-256 verified snapshot of all {items.length} tab items, collections, notes, and session relationships.
              </div>

              {!createdBackup ? (
                <button
                  onClick={handleCreate}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '11px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--accent-color)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  <FileArchive size={16} />
                  <span>Generate Backup Snapshot Now</span>
                </button>
              ) : (
                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-color)', fontWeight: 700, fontSize: '13px' }}>
                    <CheckCircle2 size={18} />
                    <span>Backup Verified and Created Successfully</span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px', wordBreak: 'break-all' }}>
                    <div><strong style={{ color: 'var(--text-primary)' }}>SHA-256 Hash:</strong> {createdBackup.manifest.sha256}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Items Saved:</strong> {createdBackup.manifest.itemCount}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Snapshot Size:</strong> {(createdBackup.manifest.totalSizeBytes / 1024).toFixed(1)} KB</div>
                  </div>

                  <button
                    onClick={handleDownloadBackup}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '11px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--accent-color)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
                    }}
                  >
                    <Download size={16} />
                    <span>Download Backup File (.json)</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Paste the contents of a previously exported Tabsed backup JSON file below:
              </div>

              <textarea
                value={restoreText}
                onChange={(e) => setRestoreText(e.target.value)}
                placeholder='{"manifest": {...}, "items": [...]}'
                rows={8}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  outline: 'none'
                }}
              />

              {restoreError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger-color)', fontSize: '12px', fontWeight: 500 }}>
                  <AlertTriangle size={15} />
                  <span>{restoreError}</span>
                </div>
              )}

              {restoreSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-color)', fontSize: '12px', fontWeight: 600 }}>
                  <CheckCircle2 size={15} />
                  <span>{restoreSuccess}</span>
                </div>
              )}

              <button
                onClick={handleRestoreSubmit}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '11px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-color)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
                }}
              >
                <Upload size={16} />
                <span>Verify SHA-256 and Restore Items</span>
              </button>
            </>
          )}
        </div>

        {/* Footer - Fixed */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 22px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Press Esc or click outside to dismiss
          </span>
          <button
            onClick={onClose}
            aria-label="Close backup dialog"
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-color)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

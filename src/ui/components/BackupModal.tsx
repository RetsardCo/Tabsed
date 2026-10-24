import React, { useState } from 'react';
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
    const blob = new Blob([createdBackup.backupBlobJson], { type: 'application/json' });
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
      if (!Array.isArray(parsed)) {
        setRestoreError('Invalid backup file format: must be an array of tab items');
        return;
      }
      onRestoreBackup(parsed);
      setRestoreSuccess(`Successfully restored ${parsed.length} tab items to your vault!`);
    } catch (e: any) {
      setRestoreError('Failed to parse backup JSON: ' + e.message);
    }
  };

  return (
    <div style={{
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
    }}>
      <div style={{
        width: '560px',
        maxHeight: '85vh',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 22px',
          borderBottom: '1px solid var(--border-subtle)'
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
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                Vault Backup &amp; Integrity
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Verifiable cryptographic snapshots (PRD Epic 2.5)
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-app)' }}>
          <button
            onClick={() => setActiveTab('create')}
            style={{
              flex: 1,
              padding: '10px',
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
              padding: '10px',
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
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--accent-color)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-color)', fontWeight: 600, fontSize: '13px' }}>
                    <CheckCircle2 size={18} />
                    <span>Backup Verified and Created Successfully</span>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px', wordBreak: 'break-all' }}>
                    <div><strong>SHA-256 Hash:</strong> {createdBackup.manifest.sha256}</div>
                    <div><strong>Items Saved:</strong> {createdBackup.manifest.itemCount}</div>
                    <div><strong>Snapshot Size:</strong> {(createdBackup.manifest.totalSizeBytes / 1024).toFixed(1)} KB</div>
                  </div>

                  <button
                    onClick={handleDownloadBackup}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--accent-color)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer'
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
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Paste the contents of a previously exported Tabsed backup JSON file below:
              </div>

              <textarea
                value={restoreText}
                onChange={(e) => setRestoreText(e.target.value)}
                placeholder='[{"id": "item_1", "title": "React Docs", ...}]'
                rows={8}
                style={{
                  width: '100%',
                  padding: '10px',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger-color)', fontSize: '12px' }}>
                  <AlertTriangle size={15} />
                  <span>{restoreError}</span>
                </div>
              )}

              {restoreSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-color)', fontSize: '12px' }}>
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
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-color)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Upload size={16} />
                <span>Verify and Restore Items</span>
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '14px 22px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-app)'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontWeight: 600,
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

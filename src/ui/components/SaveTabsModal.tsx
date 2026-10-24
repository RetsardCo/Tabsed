import React, { useState } from 'react';
import { X, Layers, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Collection } from '../types';
import { SaveTransactionSession } from '../../core/transaction/save-and-close';
import { MockBrowserConnector } from '../../core/connector/mock-connector';

interface SaveTabsModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  onSaveCompleted: (newTabs: any[]) => void;
  initialScope?: 'window' | 'tab' | 'manual';
}

export const SaveTabsModal: React.FC<SaveTabsModalProps> = ({
  isOpen,
  onClose,
  collections,
  onSaveCompleted,
  initialScope = 'window'
}) => {
  if (!isOpen) return null;

  const [scope, setScope] = useState<'window' | 'tab' | 'manual'>(initialScope);

  React.useEffect(() => {
    if (initialScope) setScope(initialScope);
  }, [initialScope, isOpen]);
  const [selectedCollectionId, setSelectedCollectionId] = useState(collections[0]?.id || 'inbox');
  const [captureThumbnails, setCaptureThumbnails] = useState(true);
  const [closeAfterSave, setCloseAfterSave] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [manualTitle, setManualTitle] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressState, setProgressState] = useState<string>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleStartSave = async () => {
    setIsProcessing(true);
    setProgressState('validating');
    setStatusMessage('Validating tabs and enforcing safety rules...');

    const connector = new MockBrowserConnector('Edge');
    const allTabs = await connector.listTabs({ excludeIncognito: true });

    let candidateTabs = allTabs;
    if (scope === 'tab') {
      candidateTabs = allTabs.slice(0, 1);
    } else if (scope === 'manual') {
      if (!manualUrl) {
        setStatusMessage('Please enter a valid URL.');
        setIsProcessing(false);
        return;
      }
      candidateTabs = [{
        tabId: 'manual_' + Date.now(),
        windowId: 1,
        url: manualUrl,
        title: manualTitle || manualUrl,
        pinned: false,
        orderIndex: 0,
        incognito: false,
        active: true
      }];
    }

    try {
      const session = new SaveTransactionSession();

      // 1. Validation
      setProgressState('validated');
      session.validate(candidateTabs.map(t => ({
        tabId: t.tabId,
        url: t.url,
        title: t.title,
        pinned: t.pinned,
        incognito: t.incognito,
        thumbnailDataUrl: captureThumbnails ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' : null
      })), { closeAfterSave });

      // 2. Staging
      setProgressState('staging');
      setStatusMessage('Staging tab metadata and thumbnail previews...');
      await new Promise(r => setTimeout(r, 400));
      session.stage();

      // 3. Persistence
      setProgressState('persisting');
      setStatusMessage('Writing records to SQLite vault database...');
      await new Promise(r => setTimeout(r, 400));
      session.persist(records => ({
        persisted: records,
        failed: []
      }));

      // 4. Verification
      setProgressState('verifying');
      setStatusMessage('Verifying written hashes and database integrity...');
      await new Promise(r => setTimeout(r, 300));
      session.verifyAndCommit(records => records.map(r => r.tabId));

      // 5. Source Tab Closure (Only if requested and committed)
      if (closeAfterSave) {
        setProgressState('closing-tabs');
        setStatusMessage('Safely closing successfully committed source tabs...');
        await new Promise(r => setTimeout(r, 400));
        session.executeTabClosure((tabId) => {
          connector.closeTabs([tabId]);
          return true;
        });
      }

      setProgressState('complete');
      setStatusMessage(`Successfully saved ${candidateTabs.length} tabs!`);

      // Construct UI items
      const newItems = session.getStagedRecords().map((st, idx) => ({
        id: st.id,
        vaultId: 'default',
        itemType: 'tab' as const,
        title: st.title,
        url: st.url,
        normalizedUrl: st.normalizedUrl,
        domain: st.domain,
        faviconUrl: `https://${st.domain}/favicon.ico`,
        thumbnailUrl: captureThumbnails ? st.stagedThumbnailPath || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' : null,
        browserFamily: 'Edge' as const,
        savedAt: new Date().toISOString(),
        notes: '',
        isFavorite: false,
        collectionIds: [selectedCollectionId],
        tags: ['saved-session']
      }));

      onSaveCompleted(newItems);
      setTimeout(() => {
        setIsProcessing(false);
        onClose();
      }, 900);
    } catch (err: any) {
      setProgressState('error');
      setStatusMessage('Transaction error: ' + err.message + '. Source tabs remained open.');
      setIsProcessing(false);
    }
  };

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
      zIndex: 1000
    }}>
      <div style={{
        width: '460px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
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
            <Layers size={18} color="var(--accent-color)" />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>Save Tabs to Vault</span>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Scope selection */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Capture Scope
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setScope('window')}
                style={{
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${scope === 'window' ? 'var(--accent-color)' : 'var(--border-subtle)'}`,
                  backgroundColor: scope === 'window' ? 'var(--accent-light)' : 'var(--bg-app)',
                  color: scope === 'window' ? 'var(--accent-color)' : 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Full Window
              </button>
              <button
                type="button"
                onClick={() => setScope('tab')}
                style={{
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${scope === 'tab' ? 'var(--accent-color)' : 'var(--border-subtle)'}`,
                  backgroundColor: scope === 'tab' ? 'var(--accent-light)' : 'var(--bg-app)',
                  color: scope === 'tab' ? 'var(--accent-color)' : 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Active Tab Only
              </button>
              <button
                type="button"
                onClick={() => setScope('manual')}
                style={{
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${scope === 'manual' ? 'var(--accent-color)' : 'var(--border-subtle)'}`,
                  backgroundColor: scope === 'manual' ? 'var(--accent-light)' : 'var(--bg-app)',
                  color: scope === 'manual' ? 'var(--accent-color)' : 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Manual URL
              </button>
            </div>
          </div>

          {scope === 'manual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="url"
                placeholder="https://example.com"
                value={manualUrl}
                onChange={e => setManualUrl(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-app)',
                  fontSize: '12px',
                  color: 'var(--text-primary)'
                }}
              />
              <input
                type="text"
                placeholder="Optional Title"
                value={manualTitle}
                onChange={e => setManualTitle(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-app)',
                  fontSize: '12px',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          )}

          {/* Collection select */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Save To Collection
            </label>
            <select
              value={selectedCollectionId}
              onChange={e => setSelectedCollectionId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                fontSize: '12px'
              }}
            >
              {collections.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={captureThumbnails}
                onChange={e => setCaptureThumbnails(e.target.checked)}
              />
              <span>Capture visual thumbnails where permitted</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={closeAfterSave}
                onChange={e => setCloseAfterSave(e.target.checked)}
              />
              <span style={{ color: closeAfterSave ? 'var(--danger-color)' : 'var(--text-primary)', fontWeight: closeAfterSave ? 600 : 400 }}>
                Close source tabs after successful save
              </span>
            </label>
          </div>

          {/* Safety Guarantee Notice (PRD Appendix A) */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 12px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '11px',
            color: 'var(--text-secondary)'
          }}>
            <ShieldCheck size={18} color="var(--accent-color)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Save-and-Close Safety:</strong> Tabsed saves and verifies all records and preview assets before closing any original tabs. If saving fails, your tabs will stay open.
            </div>
          </div>

          {/* Progress / Status display */}
          {statusMessage && (
            <div style={{
              fontSize: '12px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: progressState === 'error' ? 'var(--danger-light)' : 'var(--accent-light)',
              color: progressState === 'error' ? 'var(--danger-color)' : 'var(--accent-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {progressState === 'complete' ? <CheckCircle2 size={16} /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />}
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '10px',
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-app)'
        }}>
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              padding: '8px 14px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleStartSave}
            disabled={isProcessing}
            style={{
              padding: '8px 18px',
              backgroundColor: closeAfterSave ? 'var(--danger-color)' : 'var(--accent-color)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: isProcessing ? 'not-allowed' : 'pointer'
            }}
          >
            {isProcessing ? 'Saving...' : closeAfterSave ? 'Save & Close Tabs' : 'Save Tabs'}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Play, Pause, Square, RefreshCw, CheckCircle2, Clock, Globe } from 'lucide-react';
import { SavedTabItem } from '../types';
import { RestoreQueue, RestoreItem } from '../../core/transaction/restore-queue';

interface RestoreQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SavedTabItem[];
}

export const RestoreQueueModal: React.FC<RestoreQueueModalProps> = ({ isOpen, onClose, items }) => {
  if (!isOpen) return null;

  const [batchSize, setBatchSize] = useState<number>(3);
  const [delayMs, setDelayMs] = useState<number>(400);
  const [targetBrowser, setTargetBrowser] = useState<string>('Microsoft Edge (Default)');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const [restoreItems, setRestoreItems] = useState<RestoreItem[]>(() =>
    items.slice(0, 8).map((it, idx) => ({
      id: it.id,
      url: it.url,
      title: it.title,
      pinned: false,
      orderIndex: idx,
      status: 'queued'
    }))
  );

  const handleStartQueue = async () => {
    setIsRunning(true);
    setIsPaused(false);

    const queue = new RestoreQueue(restoreItems, { batchSize, delayMs });

    while (true) {
      if (queue.getStatus().isCancelled) break;
      const res = await queue.processNextBatch(async (item) => {
        await new Promise(r => setTimeout(r, delayMs));
        return true;
      });

      setRestoreItems(queue.getItems());

      if (!res.hasMore) break;
      await new Promise(r => setTimeout(r, delayMs));
    }

    setIsRunning(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleCancel = () => {
    setIsRunning(false);
    setIsPaused(false);
    setRestoreItems(prev => prev.map(i => i.status === 'queued' ? { ...i, status: 'skipped' } : i));
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
      zIndex: 1500
    }}>
      <div style={{
        width: '560px',
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
            <Clock size={18} color="var(--accent-color)" />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>Bounded Session Restore Queue</span>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Controls */}
        <div style={{ padding: '16px 20px', backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Target Browser &amp; Profile:
            </label>
            <select
              value={targetBrowser}
              onChange={e => setTargetBrowser(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
                fontSize: '12px'
              }}
            >
              <option>Microsoft Edge (Default Profile)</option>
              <option>Google Chrome (Default Profile)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                Batch Size: {batchSize} tabs
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={batchSize}
                onChange={e => setBatchSize(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                Delay Between Batches: {delayMs} ms
              </label>
              <input
                type="range"
                min={100}
                max={1500}
                step={50}
                value={delayMs}
                onChange={e => setDelayMs(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              onClick={handleStartQueue}
              disabled={isRunning && !isPaused}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-color)',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              <Play size={14} />
              <span>{isPaused ? 'Resume' : 'Start Restore'}</span>
            </button>

            {isRunning && !isPaused && (
              <button
                onClick={handlePause}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <Pause size={14} />
                <span>Pause</span>
              </button>
            )}

            {isRunning && (
              <button
                onClick={handleCancel}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--danger-color)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <Square size={14} />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Item List */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Restoration Queue ({restoreItems.length} tabs)
          </div>

          {restoreItems.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-app)',
                fontSize: '11px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                <span style={{ color: 'var(--text-muted)' }}>#{idx + 1}</span>
                <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.title}
                </span>
              </div>

              <div style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600,
                fontSize: '10px',
                textTransform: 'uppercase',
                backgroundColor: item.status === 'opened' ? 'rgba(22, 163, 74, 0.15)' :
                                 item.status === 'opening' ? 'rgba(37, 99, 235, 0.15)' :
                                 item.status === 'failed' ? 'rgba(220, 38, 38, 0.15)' :
                                 'var(--bg-surface)',
                color: item.status === 'opened' ? 'var(--success-color)' :
                       item.status === 'opening' ? 'var(--accent-color)' :
                       item.status === 'failed' ? 'var(--danger-color)' :
                       'var(--text-muted)'
              }}>
                {item.status}
              </div>
            </div>
          ))}
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

import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Square, RefreshCw, CheckCircle2, Clock, Globe } from 'lucide-react';
import { SavedTabItem } from '../types';
import { RestoreQueue, RestoreItem } from '../../core/transaction/restore-queue';

interface RestoreQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SavedTabItem[];
}

export const RestoreQueueModal: React.FC<RestoreQueueModalProps> = ({ isOpen, onClose, items }) => {
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

  const [batchSize, setBatchSize] = useState<number>(3);
  const [delayMs, setDelayMs] = useState<number>(400);
  const [targetBrowser, setTargetBrowser] = useState<string>('Microsoft Edge (Default Profile)');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const queueRef = React.useRef<RestoreQueue | null>(null);
  const pauseRequestedRef = React.useRef<boolean>(false);

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
    pauseRequestedRef.current = false;

    if (!queueRef.current) {
      queueRef.current = new RestoreQueue(restoreItems, { batchSize, delayMs });
    } else {
      queueRef.current.resume();
    }

    const queue = queueRef.current;

    while (true) {
      if (pauseRequestedRef.current) {
        setIsPaused(true);
        setIsRunning(false);
        break;
      }
      if (queue.getStatus().isCancelled) {
        setIsRunning(false);
        break;
      }

      const res = await queue.processNextBatch(async () => {
        await new Promise(r => setTimeout(r, delayMs));
        return true;
      });

      setRestoreItems(queue.getItems());

      if (!res.hasMore) {
        setIsRunning(false);
        break;
      }
      if (pauseRequestedRef.current) {
        setIsPaused(true);
        setIsRunning(false);
        break;
      }
      await new Promise(r => setTimeout(r, delayMs));
    }
  };

  const handlePause = () => {
    pauseRequestedRef.current = true;
    if (queueRef.current) {
      queueRef.current.pause();
    }
    setIsPaused(true);
  };

  const handleCancel = () => {
    pauseRequestedRef.current = false;
    setIsRunning(false);
    setIsPaused(false);
    if (queueRef.current) {
      queueRef.current.cancel();
      setRestoreItems(queueRef.current.getItems());
    } else {
      setRestoreItems(prev => prev.map(i => i.status === 'queued' ? { ...i, status: 'skipped' } : i));
    }
  };

  const handleRetryFailed = () => {
    if (queueRef.current) {
      queueRef.current.retryFailed();
      setRestoreItems(queueRef.current.getItems());
    } else {
      setRestoreItems(prev => prev.map(i => (i.status === 'failed' || i.status === 'skipped') ? { ...i, status: 'queued' } : i));
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
        aria-labelledby="restore-queue-modal-title"
        style={{
          width: '600px',
          maxWidth: '92vw',
          maxHeight: '85vh',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg), 0 20px 40px rgba(0, 0, 0, 0.4)',
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
              <Clock size={18} />
            </div>
            <div>
              <h2 id="restore-queue-modal-title" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
                Bounded Session Restore Queue
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Rate-limited tab restore without browser freezing (PRD Epic 3.1)
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

        {/* Scrollable Content Container */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Controls */}
        <div style={{
          padding: '18px 22px',
          backgroundColor: 'var(--bg-app)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Target Browser &amp; Profile:
            </label>
            <select
              value={targetBrowser}
              onChange={e => setTargetBrowser(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option>Microsoft Edge (Default Profile)</option>
              <option>Google Chrome (Default Profile)</option>
              <option>Mozilla Firefox (default-release)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Batch Size: <span style={{ color: 'var(--accent-color)' }}>{batchSize} tabs</span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={batchSize}
                onChange={e => setBatchSize(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Delay Between Batches: <span style={{ color: 'var(--accent-color)' }}>{delayMs} ms</span>
              </label>
              <input
                type="range"
                min={100}
                max={1500}
                step={50}
                value={delayMs}
                onChange={e => setDelayMs(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={handleStartQueue}
              disabled={isRunning && !isPaused}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-color)',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600,
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
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
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
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
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--danger-color)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Square size={14} />
                <span>Cancel</span>
              </button>
            )}

            {restoreItems.some(i => i.status === 'failed' || i.status === 'skipped') && !isRunning && (
              <button
                onClick={handleRetryFailed}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={14} />
                <span>Retry Failed</span>
              </button>
            )}
          </div>
        </div>

        {/* Item List */}
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Restoration Queue ({restoreItems.length} tabs)
          </div>

          {restoreItems.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-card)',
                fontSize: '12px',
                border: '1px solid var(--border-card)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>#{idx + 1}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.title}
                </span>
              </div>

              <div style={{
                padding: '3px 9px',
                borderRadius: 'var(--radius-pill)',
                fontWeight: 700,
                fontSize: '10px',
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
                backgroundColor: item.status === 'opened' ? 'rgba(22, 163, 74, 0.18)' :
                                 item.status === 'opening' ? 'rgba(37, 99, 235, 0.18)' :
                                 item.status === 'failed' ? 'rgba(220, 38, 38, 0.18)' :
                                 'rgba(148, 163, 184, 0.16)',
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
            aria-label="Close restoration queue"
            style={{
              padding: '8px 18px',
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

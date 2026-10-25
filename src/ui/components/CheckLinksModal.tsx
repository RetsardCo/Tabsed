import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  X,
  Link2,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Trash2,
  Filter,
  Play,
  Pause,
  Globe
} from 'lucide-react';
import { SavedTabItem } from '../types';
import { AvailabilityChecker, AvailabilityCategory } from '../../core/transaction/availability-checker';

export interface CheckLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SavedTabItem[];
  onOpenLiveUrl: (url: string) => void;
  onDeleteItem?: (id: string) => void;
  onBatchCheckUrls?: (results: { url: string; status: AvailabilityCategory; checkedAt: string }[]) => void;
}

export const CheckLinksModal: React.FC<CheckLinksModalProps> = ({
  isOpen,
  onClose,
  items,
  onOpenLiveUrl,
  onDeleteItem,
  onBatchCheckUrls
}) => {
  // Modal dismissal listeners (aligns with PRD Epic 2.3 & test suite)
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

  // Local state for checking status
  const [filterMode, setFilterMode] = useState<'all' | 'broken' | 'reachable' | 'unchecked'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [checkingUrl, setCheckingUrl] = useState<string | null>(null);
  const abortScanRef = useRef(false);

  // Filter to active items that have valid URLs
  const checkableItems = useMemo(() => {
    return items.filter(i => !i.deletedAt && Boolean(i.url));
  }, [items]);

  // Status counts (aligned with Sidebar brokenLinksCount)
  const reachableCount = useMemo(() => {
    return checkableItems.filter(i => i.availabilityStatus === 'reachable').length;
  }, [checkableItems]);

  const brokenCount = useMemo(() => {
    return checkableItems.filter(i => i.availabilityStatus === 'network_error' || i.availabilityStatus === 'timeout').length;
  }, [checkableItems]);

  const uncheckedCount = useMemo(() => {
    return checkableItems.filter(i => !i.availabilityCheckedAt).length;
  }, [checkableItems]);

  // Filtered links list
  const filteredLinks = useMemo(() => {
    let result = checkableItems;

    if (filterMode === 'broken') {
      result = result.filter(i => i.availabilityStatus === 'network_error' || i.availabilityStatus === 'timeout');
    } else if (filterMode === 'reachable') {
      result = result.filter(i => i.availabilityStatus === 'reachable');
    } else if (filterMode === 'unchecked') {
      result = result.filter(i => !i.availabilityCheckedAt);
    }

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      result = result.filter(i =>
        (i.title || '').toLowerCase().includes(q) ||
        (i.url || '').toLowerCase().includes(q) ||
        (i.domain || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [checkableItems, filterMode, searchFilter]);

  // Bulk scan runner with bounded concurrency (3 concurrent) to prevent network freezes
  const handleRunBulkScan = async () => {
    if (isScanning) {
      abortScanRef.current = true;
      setIsScanning(false);
      return;
    }

    setIsScanning(true);
    abortScanRef.current = false;
    const targetItems = [...checkableItems];
    setScanProgress({ current: 0, total: targetItems.length });

    const batchSize = 3;
    const accumulatedResults: { url: string; status: AvailabilityCategory; checkedAt: string }[] = [];

    for (let i = 0; i < targetItems.length; i += batchSize) {
      if (abortScanRef.current) break;

      const batch = targetItems.slice(i, i + batchSize);
      const batchPromises = batch.map(async (item) => {
        setCheckingUrl(item.url);
        try {
          const res = await AvailabilityChecker.checkUrl(item.url, undefined, 4000);
          const mappedStatus: AvailabilityCategory = res.category === 'forbidden_scheme' ? 'blocked_uncertain' : res.category;
          return { url: item.url, status: mappedStatus, checkedAt: res.checkedAt };
        } catch {
          return { url: item.url, status: 'network_error' as AvailabilityCategory, checkedAt: new Date().toISOString() };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      accumulatedResults.push(...batchResults);

      setScanProgress({ current: Math.min(i + batchSize, targetItems.length), total: targetItems.length });

      // Dispatch periodic batch updates to parent
      if (onBatchCheckUrls && accumulatedResults.length >= 10) {
        onBatchCheckUrls([...accumulatedResults]);
      }
    }

    if (onBatchCheckUrls && accumulatedResults.length > 0) {
      onBatchCheckUrls(accumulatedResults);
    }

    setCheckingUrl(null);
    setIsScanning(false);
  };

  // Single link check
  const handleCheckSingle = async (url: string) => {
    setCheckingUrl(url);
    try {
      const res = await AvailabilityChecker.checkUrl(url, undefined, 4000);
      const mappedStatus: AvailabilityCategory = res.category === 'forbidden_scheme' ? 'blocked_uncertain' : res.category;
      if (onBatchCheckUrls) {
        onBatchCheckUrls([{ url, status: mappedStatus, checkedAt: res.checkedAt }]);
      }
    } catch {
      if (onBatchCheckUrls) {
        onBatchCheckUrls([{ url, status: 'network_error', checkedAt: new Date().toISOString() }]);
      }
    } finally {
      setCheckingUrl(null);
    }
  };

  const getStatusBadge = (status?: AvailabilityCategory, checkedAt?: string | null) => {
    if (!checkedAt) {
      return (
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: 'rgba(148, 163, 184, 0.16)',
          color: 'var(--text-muted)'
        }}>
          Unchecked
        </span>
      );
    }

    if (status === 'reachable') {
      return (
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: 'rgba(22, 163, 74, 0.14)',
          color: 'var(--success-color)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <CheckCircle2 size={12} />
          <span>Reachable</span>
        </span>
      );
    }

    if (status === 'redirect') {
      return (
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: 'rgba(59, 130, 246, 0.14)',
          color: '#3b82f6',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>Redirect</span>
        </span>
      );
    }

    if (status === 'timeout') {
      return (
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: 'rgba(217, 119, 6, 0.14)',
          color: 'var(--warning-color)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Clock size={12} />
          <span>Timed Out</span>
        </span>
      );
    }

    if (status === 'auth_required') {
      return (
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: 'rgba(147, 51, 234, 0.14)',
          color: '#9333ea'
        }}>
          Auth Required
        </span>
      );
    }

    if (status === 'blocked_uncertain' || status === 'forbidden_scheme') {
      return (
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: 'rgba(148, 163, 184, 0.16)',
          color: 'var(--text-secondary)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>{status === 'forbidden_scheme' ? 'Internal Scheme' : 'Blocked / Protected'}</span>
        </span>
      );
    }

    return (
      <span style={{
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 'var(--radius-pill)',
        backgroundColor: 'rgba(220, 38, 38, 0.14)',
        color: 'var(--danger-color)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <AlertTriangle size={12} />
        <span>Broken / Unreachable</span>
      </span>
    );
  };

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
        aria-labelledby="check-links-modal-title"
        className="glass-modal-dialog"
        style={{
          width: '700px',
          maxWidth: '92vw',
          maxHeight: '86vh',
          backgroundColor: 'var(--bg-popover)',
          backdropFilter: 'var(--backdrop-filter-popover)',
          WebkitBackdropFilter: 'var(--backdrop-filter-popover)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-popover)',
          boxShadow: 'var(--shadow-popover), 0 20px 40px rgba(0, 0, 0, 0.4)',
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
          padding: '16px 22px',
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
              <Link2 size={18} />
            </div>
            <div>
              <h2 id="check-links-modal-title" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
                Link Availability &amp; Health Checker
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Verify online reachability and detect broken URLs (PRD FR-070 to FR-076)
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

        {/* Overview Stats Bar - Fixed */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          padding: '14px 22px',
          backgroundColor: 'var(--bg-app)',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0
        }}>
          <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Links</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{checkableItems.length}</div>
          </div>
          <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '10px', color: 'var(--success-color)', fontWeight: 600, textTransform: 'uppercase' }}>Reachable</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success-color)' }}>{reachableCount}</div>
          </div>
          <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '10px', color: 'var(--danger-color)', fontWeight: 600, textTransform: 'uppercase' }}>Broken / Errors</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--danger-color)' }}>{brokenCount}</div>
          </div>
          <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Pending Check</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-muted)' }}>{uncheckedCount}</div>
          </div>
        </div>

        {/* Controls & Filter Bar - Fixed */}
        <div style={{
          padding: '12px 22px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          backgroundColor: 'var(--bg-surface)',
          flexShrink: 0
        }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'broken', 'reachable', 'unchecked'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterMode(tab)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-pill)',
                  border: filterMode === tab ? '1px solid var(--accent-color)' : '1px solid var(--border-subtle)',
                  backgroundColor: filterMode === tab ? 'var(--accent-light)' : 'transparent',
                  color: filterMode === tab ? 'var(--accent-color)' : 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: filterMode === tab ? 600 : 500,
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'broken' ? `Errors (${brokenCount})` : tab}
              </button>
            ))}
          </div>

          {/* Bulk Check Action */}
          <button
            onClick={handleRunBulkScan}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isScanning ? 'var(--warning-color)' : 'var(--accent-color)',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
            }}
          >
            <RefreshCw size={13} className={isScanning ? 'animate-spin' : undefined} />
            <span>{isScanning ? `Pause Scan (${scanProgress.current}/${scanProgress.total})` : 'Check All Links'}</span>
          </button>
        </div>

        {/* Scan Progress Bar (when active) */}
        {isScanning && (
          <div style={{ width: '100%', height: '3px', backgroundColor: 'var(--border-subtle)', flexShrink: 0 }}>
            <div style={{
              width: `${scanProgress.total > 0 ? (scanProgress.current / scanProgress.total) * 100 : 0}%`,
              height: '100%',
              backgroundColor: 'var(--accent-color)',
              transition: 'width 0.2s ease'
            }} />
          </div>
        )}

        {/* Links List - Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredLinks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <Link2 size={36} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {filterMode === 'broken' ? 'No broken links detected' : 'No links match the current filter'}
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                {filterMode === 'broken' ? 'All checked URLs responded without network or HTTP failure.' : 'Try selecting "All" or running a link availability scan.'}
              </div>
            </div>
          ) : (
            filteredLinks.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  gap: '12px'
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </span>
                    {getStatusBadge(item.availabilityStatus, item.availabilityCheckedAt)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.url}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleCheckSingle(item.url)}
                    disabled={checkingUrl === item.url}
                    title="Check availability now"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      cursor: checkingUrl === item.url ? 'wait' : 'pointer'
                    }}
                  >
                    <RefreshCw size={11} className={checkingUrl === item.url ? 'animate-spin' : undefined} />
                    <span>Check</span>
                  </button>

                  <button
                    onClick={() => onOpenLiveUrl(item.url)}
                    title="Open in browser"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '5px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--accent-color)',
                      cursor: 'pointer'
                    }}
                  >
                    <ExternalLink size={12} />
                  </button>

                  {onDeleteItem && (
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      title="Move to trash"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '5px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--danger-color)',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Safety Disclaimer and Footer - Fixed */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 22px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="var(--success-color)" />
            <span>Safe SSRF-protected checks with conservative 4-second timeouts.</span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close link checker"
            style={{
              padding: '6px 18px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-color)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

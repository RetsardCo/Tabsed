import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  ExternalLink,
  RotateCcw,
  Edit3,
  FolderPlus,
  MoreHorizontal,
  Globe,
  Trash2,
  Check,
  Plus,
  Layers,
  ChevronDown,
  User,
  Copy,
  Search,
  Folder
} from 'lucide-react';
import { SavedTabItem, SessionTab, Collection } from '../types';
import { SmartFavicon, EdgeIcon, ChromeIcon, FirefoxIcon } from './BrandIcons';

interface DetailInspectorProps {
  item: SavedTabItem | null;
  collections?: Collection[];
  onClose: () => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onUpdateTitle?: (id: string, title: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
  onOpenLiveUrl: (url: string) => void;
  onCheckAvailability: (url: string) => void;
  onRestoreItem?: (id: string) => void;
  onDeleteItem?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onDeleteSubTab?: (parentId: string, subTabId: string) => void;
  onMoveToCollection?: (itemId: string, collectionId: string) => void;
  isTrash?: boolean;
}

export const DetailInspector: React.FC<DetailInspectorProps> = ({
  item,
  collections,
  onClose,
  onUpdateNotes,
  onUpdateTitle,
  onAddTag,
  onRemoveTag,
  onOpenLiveUrl,
  onCheckAvailability,
  onRestoreItem,
  onDeleteItem,
  onToggleFavorite,
  onDeleteSubTab,
  onMoveToCollection,
  isTrash
}) => {
  if (!item) return null;

  const inTrash = isTrash || Boolean(item.deletedAt);
  const [notesText, setNotesText] = useState(item.notes);
  const [titleText, setTitleText] = useState(item.title);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isOpenMenuOpen, setIsOpenMenuOpen] = useState(false);
  const [subTabSearch, setSubTabSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setNotesText(item.notes);
    setTitleText(item.title);
    setIsEditing(false);
    setIsEditingNotes(false);
  }, [item.id, item.notes, item.title]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopy = (text: string, id: string = 'main') => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast('Copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast('Could not copy to clipboard.');
    }
  };

  const handleSaveNotes = () => {
    onUpdateNotes(item.id, notesText);
    setIsEditingNotes(false);
  };

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newTagInput.trim();
    if (tag && !item.tags.includes(tag)) {
      onAddTag(item.id, tag);
      setNewTagInput('');
      setShowTagInput(false);
    }
  };

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return '128 KB';
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(0) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  const sessionTabs: SessionTab[] = React.useMemo(() => {
    if (item.sessionTabs && item.sessionTabs.length > 0) {
      return item.sessionTabs;
    }
    const count = item.tabCount && item.tabCount > 1 ? item.tabCount : 1;
    if (count > 1) {
      return Array.from({ length: count }, (_, idx) => ({
        id: `synth_${item.id}_${idx + 1}`,
        title: `${item.title} — Tab ${idx + 1}`,
        url: `${item.url}${item.url.includes('?') ? '&' : '?'}tab=${idx + 1}`,
        domain: item.domain,
        faviconUrl: item.faviconUrl
      }));
    }
    return [
      {
        id: `sub_${item.id}_1`,
        title: item.title,
        url: item.url,
        domain: item.domain,
        faviconUrl: item.faviconUrl
      }
    ];
  }, [item]);

  const isSessionGroup = item.itemType === 'session' || (item.tabCount && item.tabCount > 1) || sessionTabs.length > 1;
  const tabCount = item.tabCount || sessionTabs.length;

  const handleOpenAllTabs = () => {
    const tabsToOpen = sessionTabs.length > 0 ? sessionTabs : [{ url: item.url }];
    tabsToOpen.forEach((t, i) => {
      setTimeout(() => {
        onOpenLiveUrl(t.url);
      }, i * 120);
    });
    showToast(`Opening ${tabsToOpen.length} tab${tabsToOpen.length === 1 ? '' : 's'} in browser...`);
  };

  const handleCopyAllTabs = () => {
    const allUrls = sessionTabs.map(t => t.url).join('\n');
    handleCopy(allUrls, 'all');
    showToast(`Copied ${sessionTabs.length} URLs to clipboard!`);
  };

  const quickActionBtnStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 4px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-app)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-secondary)',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    flex: 1,
    transition: 'all 0.15s ease'
  };

  const renderBrowserBadge = () => {
    if (item.browserFamily === 'Chrome') {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ChromeIcon size={14} /> Google Chrome
        </span>
      );
    }
    if (item.browserFamily === 'Firefox') {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FirefoxIcon size={14} /> Mozilla Firefox
        </span>
      );
    }
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <EdgeIcon size={14} /> Microsoft Edge
      </span>
    );
  };

  return (
    <aside style={{
      width: '360px',
      minWidth: '360px',
      backgroundColor: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflowY: 'auto',
      zIndex: 10
    }}>
      {/* Top Preview Image with close & star controls (Mockup image 4) */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '190px',
        backgroundColor: 'var(--bg-app)',
        borderBottom: '1px solid var(--border-subtle)',
        overflow: 'hidden'
      }}>
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted)'
          }}>
            <Globe size={40} strokeWidth={1.5} />
            <span style={{ fontSize: '12px', marginTop: '8px' }}>Thumbnail snapshot</span>
          </div>
        )}

        {/* Top Controls Overlay */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 3
        }}>
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(item.id)}
              title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                border: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: item.isFavorite ? '#f59e0b' : '#64748b'
              }}
            >
              <Star size={16} fill={item.isFavorite ? '#f59e0b' : 'none'} strokeWidth={item.isFavorite ? 2 : 2.2} />
            </button>
          )}

          <button
            onClick={onClose}
            title="Close inspector"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              border: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#334155'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Inspector Details Content */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Title and Domain Header */}
        <div>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={titleText}
                onChange={(e) => setTitleText(e.target.value)}
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--accent-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  width: '100%'
                }}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => {
                    if (onUpdateTitle && titleText.trim()) {
                      onUpdateTitle(item.id, titleText.trim());
                    }
                    if (isEditingNotes) handleSaveNotes();
                    setIsEditing(false);
                    showToast('Changes saved!');
                  }}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: 'var(--accent-color)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setTitleText(item.title);
                    setNotesText(item.notes);
                    setIsEditing(false);
                  }}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <h2 style={{
              fontSize: '17px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px',
              lineHeight: 1.3,
              marginBottom: '6px'
            }}>
              {item.title}
            </h2>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SmartFavicon domain={item.domain} url={item.url} faviconUrl={item.faviconUrl} size={16} />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {item.domain}
            </span>
          </div>
        </div>

        {/* Trash Status Banner if item is in trash */}
        {inTrash && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: 'rgba(220, 38, 38, 0.12)',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            color: 'var(--danger-color)',
            fontWeight: 600
          }}>
            <Trash2 size={16} />
            <span>This tab is currently in the Trash.</span>
          </div>
        )}

        {/* Big Blue "Open" Split Button (Exact mockup element) */}
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--accent-color)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)'
          }}>
            <button
              onClick={() => onOpenLiveUrl(item.url)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: 'none',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span>Open</span>
            </button>
            <div style={{ width: '1px', height: '22px', backgroundColor: 'rgba(255, 255, 255, 0.25)' }} />
            <button
              onClick={() => setIsOpenMenuOpen(!isOpenMenuOpen)}
              title="Open options"
              style={{
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: 'none',
                padding: '10px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ChevronDown size={16} />
            </button>
          </div>

          {isOpenMenuOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '6px',
              width: '180px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-lg)',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              zIndex: 30
            }}>
              <button
                onClick={() => {
                  setIsOpenMenuOpen(false);
                  onOpenLiveUrl(item.url);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <ExternalLink size={14} color="var(--accent-color)" />
                <span>Open in Browser</span>
              </button>
              <button
                onClick={() => {
                  setIsOpenMenuOpen(false);
                  handleCopy(item.url, 'main');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Copy size={14} color="var(--accent-color)" />
                <span>Copy URL</span>
              </button>
              <button
                onClick={() => {
                  setIsOpenMenuOpen(false);
                  onCheckAvailability(item.url);
                  showToast('Checking link availability...');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Globe size={14} color="var(--accent-color)" />
                <span>Check Link Status</span>
              </button>
            </div>
          )}
        </div>

        {/* 5 Quick Action Buttons (Aligned to Mockup: Open All, Restore, Edit, Move, More) */}
        {inTrash ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {onRestoreItem && (
              <button
                onClick={() => {
                  onRestoreItem(item.id);
                  showToast('Restored tab from Trash');
                }}
                title="Restore from Trash"
                aria-label="Restore from Trash"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px 14px',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--accent-color)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={15} />
                <span>Restore from Trash</span>
              </button>
            )}
            {onDeleteItem && (
              <button
                onClick={() => {
                  onDeleteItem(item.id);
                }}
                title="Permanently Delete"
                aria-label="Permanently Delete"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px 14px',
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  color: 'var(--danger-color)',
                  border: '1px solid var(--danger-color)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={15} />
                <span>Permanently Delete</span>
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* 1. Open All */}
            <button
              onClick={handleOpenAllTabs}
              style={quickActionBtnStyle}
              title="Open All Tabs in Browser"
            >
              <ExternalLink size={15} />
              <span>Open All</span>
            </button>

            {/* 2. Restore / Reopen */}
            <button
              onClick={() => {
                handleOpenAllTabs();
                showToast('Reopening tabs in browser...');
              }}
              style={quickActionBtnStyle}
              title="Reopen / Restore Tabs"
            >
              <RotateCcw size={15} />
              <span>Restore</span>
            </button>

            {/* 3. Edit */}
            <button
              onClick={() => {
                setIsEditing(!isEditing);
                setIsEditingNotes(!isEditingNotes);
              }}
              style={{
                ...quickActionBtnStyle,
                color: isEditing ? 'var(--accent-color)' : 'var(--text-secondary)',
                borderColor: isEditing ? 'var(--accent-color)' : 'var(--border-subtle)'
              }}
              title="Edit Title and Notes"
            >
              <Edit3 size={15} />
              <span>{isEditing ? 'Done' : 'Edit'}</span>
            </button>

            {/* 4. Move */}
            <button
              onClick={() => setIsMoveOpen(true)}
              style={quickActionBtnStyle}
              title="Move to Collection"
            >
              <FolderPlus size={15} />
              <span>Move</span>
            </button>

            {/* 5. Trash */}
            <button
              onClick={() => {
                if (onDeleteItem) onDeleteItem(item.id);
              }}
              style={{ ...quickActionBtnStyle, color: 'var(--danger-color)' }}
              title="Move to Trash"
              aria-label="Move to Trash"
            >
              <Trash2 size={15} />
              <span>Trash</span>
            </button>
          </div>
        )}

        {/* Move to Collection Dialog */}
        {isMoveOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '320px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-lg)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Move to Collection</span>
                <button
                  onClick={() => setIsMoveOpen(false)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                {collections && collections.length > 0 ? (
                  collections.map(col => {
                    const isCol = item.collectionIds.includes(col.id);
                    return (
                      <button
                        key={col.id}
                        onClick={() => {
                          if (onMoveToCollection) {
                            onMoveToCollection(item.id, col.id);
                            showToast(`Moved to ${col.name}`);
                          }
                          setIsMoveOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-md)',
                          border: isCol ? '1px solid var(--accent-color)' : '1px solid var(--border-subtle)',
                          backgroundColor: isCol ? 'var(--accent-light)' : 'var(--bg-app)',
                          color: isCol ? 'var(--accent-color)' : 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Folder size={14} color={col.accentColor || 'var(--accent-color)'} />
                          <span>{col.name}</span>
                        </div>
                        {isCol && <Check size={14} />}
                      </button>
                    );
                  })
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>
                    No collections available.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section: Details Table (Exact Mockup) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Details
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '12px',
            backgroundColor: 'var(--bg-app)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tabs</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tabCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Size</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatSize(item.archiveSizeBytes)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Saved On</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {new Date(item.savedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Browser</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {renderBrowserBadge()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Profile</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <User size={12} color="var(--text-muted)" />
                {item.profileLabel || 'Default'}
              </span>
            </div>
          </div>
        </div>

        {/* Section: Offline Page Archive (PRD Epic 3.4 & Section 12.3 Sandboxed) */}
        {(item.archiveHtml || item.archiveContent) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Offline Archive (Sandboxed)
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Isolated iframe (PRD 12.3)
              </span>
            </div>
            <div style={{
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-app)'
            }}>
              <iframe
                title="Offline Archive Sandbox"
                sandbox="allow-scripts"
                srcDoc={item.archiveHtml || `<!DOCTYPE html><html><body style="font-family: sans-serif; font-size: 12px; color: #334155; padding: 12px;"><h3>Cached Page Text</h3><pre style="white-space: pre-wrap;">${item.archiveContent}</pre></body></html>`}
                style={{
                  width: '100%',
                  height: '160px',
                  border: 'none',
                  display: 'block'
                }}
              />
            </div>
          </div>
        )}

        {/* Section: Tags */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Tags
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {item.tags.map(tag => (
              <span
                key={tag}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--accent-light)',
                  color: 'var(--accent-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {tag}
                <button
                  onClick={() => onRemoveTag(item.id, tag)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--accent-color)',
                    fontSize: '11px',
                    padding: 0
                  }}
                >
                  ✕
                </button>
              </span>
            ))}

            {showTagInput ? (
              <form onSubmit={handleAddTagSubmit} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="text"
                  placeholder="Tag name"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  autoFocus
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--accent-color)',
                    outline: 'none',
                    width: '90px'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    border: 'none',
                    backgroundColor: 'var(--accent-color)',
                    color: '#ffffff',
                    borderRadius: 'var(--radius-pill)',
                    padding: '3px 7px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Add
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowTagInput(true)}
                title="Add tag"
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '1px dashed var(--border-subtle)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Plus size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Section: Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Notes</span>
            <button
              onClick={() => {
                if (isEditingNotes) handleSaveNotes();
                else setIsEditingNotes(true);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--accent-color)',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Edit3 size={12} />
              <span>{isEditingNotes ? 'Done' : 'Edit'}</span>
            </button>
          </div>

          {isEditingNotes ? (
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add your personal notes or context..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '12px',
                lineHeight: 1.5,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--accent-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          ) : (
            <div style={{
              fontSize: '12px',
              lineHeight: 1.5,
              color: item.notes ? 'var(--text-secondary)' : 'var(--text-muted)',
              backgroundColor: 'var(--bg-app)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontStyle: item.notes ? 'normal' : 'italic'
            }}>
              {item.notes || 'No notes added for this tab.'}
            </div>
          )}
        </div>

        {/* Section: Tabs in this Session (or Single Tab Details) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isSessionGroup ? 'Tabs in this Session' : 'Saved Tab Link'}
              </span>
              {isSessionGroup && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '1px 6px'
                }}>
                  {sessionTabs.length}
                </span>
              )}
            </div>
            {isSessionGroup && (
              <button
                onClick={() => setIsViewAllOpen(true)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--accent-color)',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                View All ({sessionTabs.length})
              </button>
            )}
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden'
          }}>
            {sessionTabs.slice(0, 6).map((subTab) => (
              <div
                key={subTab.id}
                onClick={() => onOpenLiveUrl(subTab.url)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'background-color 0.1s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1, minWidth: 0 }}>
                  <SmartFavicon domain={subTab.domain} url={subTab.url} faviconUrl={subTab.faviconUrl} size={15} />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {subTab.title}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {subTab.domain}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(subTab.url, subTab.id);
                    }}
                    title="Copy URL"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: copiedId === subTab.id ? 'var(--success-color)' : 'var(--text-muted)',
                      padding: '3px'
                    }}
                  >
                    {copiedId === subTab.id ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLiveUrl(subTab.url);
                    }}
                    title="Open in browser"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: '3px'
                    }}
                  >
                    <ExternalLink size={13} />
                  </button>
                  {onDeleteSubTab && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSubTab(item.id, subTab.id);
                        showToast('Removed tab from session');
                      }}
                      title="Remove from session"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: 'var(--danger-color)',
                        padding: '3px'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {sessionTabs.length > 6 && (
              <button
                onClick={() => setIsViewAllOpen(true)}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--accent-color)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                + {sessionTabs.length - 6} more tabs — View All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full "View All Session Tabs" Modal */}
      {isViewAllOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-tabs-modal-title"
            style={{
              width: '640px',
              maxHeight: '85vh',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--accent-light)',
                  color: 'var(--accent-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Layers size={18} />
                </div>
                <div>
                  <h3 id="session-tabs-modal-title" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Session Tabs ({sessionTabs.length})
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {item.title}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleOpenAllTabs}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    backgroundColor: 'var(--accent-color)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <ExternalLink size={13} />
                  <span>Open All</span>
                </button>
                <button
                  onClick={handleCopyAllTabs}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  <Copy size={13} />
                  <span>Copy All</span>
                </button>
                <button
                  onClick={() => setIsViewAllOpen(false)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '4px'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Search filter in modal */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-app)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px'
              }}>
                <Search size={14} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Filter tabs in this session by title, URL or domain..."
                  value={subTabSearch}
                  onChange={(e) => setSubTabSearch(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    width: '100%',
                    fontSize: '12px',
                    color: 'var(--text-primary)'
                  }}
                />
                {subTabSearch && (
                  <button
                    onClick={() => setSubTabSearch('')}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '11px' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Modal Tabs List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {sessionTabs
                .filter(st => {
                  if (!subTabSearch.trim()) return true;
                  const q = subTabSearch.toLowerCase();
                  return st.title.toLowerCase().includes(q) || st.url.toLowerCase().includes(q) || (st.domain && st.domain.toLowerCase().includes(q));
                })
                .map((tab, idx) => (
                  <div
                    key={tab.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: 'var(--bg-app)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      gap: '12px',
                      transition: 'all 0.1s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '20px', textAlign: 'right' }}>
                        {idx + 1}.
                      </span>
                      <SmartFavicon domain={tab.domain} url={tab.url} faviconUrl={tab.faviconUrl} size={18} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {tab.title}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {tab.url}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => onOpenLiveUrl(tab.url)}
                        title="Open tab in browser"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          backgroundColor: 'var(--accent-light)',
                          color: 'var(--accent-color)',
                          border: '1px solid var(--accent-color)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <ExternalLink size={12} />
                        <span>Open</span>
                      </button>

                      <button
                        onClick={() => handleCopy(tab.url, tab.id)}
                        title="Copy Link"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          backgroundColor: copiedId === tab.id ? 'rgba(22, 163, 74, 0.1)' : 'var(--bg-surface)',
                          color: copiedId === tab.id ? 'var(--success-color)' : 'var(--text-secondary)',
                          border: copiedId === tab.id ? '1px solid var(--success-color)' : '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        {copiedId === tab.id ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedId === tab.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      {onDeleteSubTab && (
                        <button
                          onClick={() => {
                            onDeleteSubTab(item.id, tab.id);
                            showToast('Removed tab from session');
                          }}
                          title="Delete from this session"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '26px',
                            height: '26px',
                            backgroundColor: 'transparent',
                            color: 'var(--danger-color)',
                            border: '1px solid transparent',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-app)',
              fontSize: '12px',
              color: 'var(--text-muted)'
            }}>
              <span>Total: {sessionTabs.length} tabs in this session</span>
              <button
                onClick={() => setIsViewAllOpen(false)}
                style={{
                  padding: '6px 16px',
                  backgroundColor: 'var(--accent-color)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#1e293b',
          color: '#ffffff',
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          fontSize: '12px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 2000
        }}>
          <Check size={15} color="#22c55e" />
          <span>{toastMessage}</span>
        </div>
      )}
    </aside>
  );
};

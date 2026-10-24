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
  User
} from 'lucide-react';
import { SavedTabItem, SessionTab } from '../types';
import { SmartFavicon, EdgeIcon, ChromeIcon, FirefoxIcon } from './BrandIcons';

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
  onToggleFavorite?: (id: string) => void;
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
  onToggleFavorite,
  isTrash
}) => {
  if (!item) return null;

  const inTrash = isTrash || Boolean(item.deletedAt);
  const [notesText, setNotesText] = useState(item.notes);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  useEffect(() => {
    setNotesText(item.notes);
    setIsEditingNotes(false);
  }, [item.id, item.notes]);

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

  const sessionTabs: SessionTab[] = item.sessionTabs && item.sessionTabs.length > 0
    ? item.sessionTabs
    : [
        {
          id: 'sub_1',
          title: item.title,
          url: item.url,
          domain: item.domain,
          faviconUrl: item.faviconUrl
        }
      ];

  const tabCount = item.tabCount || sessionTabs.length;

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
            onClick={() => onOpenLiveUrl(item.url)}
            title="Open in new window"
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

        {/* 5 Quick Action Buttons (Aligned to Mockup: Open All, Restore, Edit, Move, More) */}
        {inTrash ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {onRestoreItem && (
              <button
                onClick={() => onRestoreItem(item.id)}
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
                onClick={() => onDeleteItem(item.id)}
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
              onClick={() => onOpenLiveUrl(item.url)}
              style={quickActionBtnStyle}
              title="Open All Tabs"
            >
              <ExternalLink size={15} />
              <span>Open All</span>
            </button>

            {/* 2. Restore */}
            <button
              onClick={() => onRestoreItem ? onRestoreItem(item.id) : onCheckAvailability(item.url)}
              style={quickActionBtnStyle}
              title="Restore / Batch"
            >
              <RotateCcw size={15} />
              <span>Restore</span>
            </button>

            {/* 3. Edit */}
            <button
              onClick={() => setIsEditingNotes(!isEditingNotes)}
              style={quickActionBtnStyle}
              title="Edit Notes"
            >
              <Edit3 size={15} />
              <span>Edit</span>
            </button>

            {/* 4. Move */}
            <button
              onClick={() => {
                const newTag = prompt('Add tag to tab:');
                if (newTag) onAddTag(item.id, newTag);
              }}
              style={quickActionBtnStyle}
              title="Move / Tag"
            >
              <FolderPlus size={15} />
              <span>Move</span>
            </button>

            {/* 5. More */}
            <button
              onClick={() => onDeleteItem ? onDeleteItem(item.id) : null}
              style={{ ...quickActionBtnStyle, color: 'var(--danger-color)' }}
              title="Move to Trash"
              aria-label="Move to Trash"
            >
              <Trash2 size={15} />
              <span>Trash</span>
            </button>
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

        {/* Section: Tabs in this Session (Exact mockup layout) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Tabs in this Session
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '1px 6px'
              }}>
                {tabCount}
              </span>
            </div>
            <button
              onClick={() => onOpenLiveUrl(item.url)}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--accent-color)',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              View All
            </button>
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
            {sessionTabs.map((subTab) => (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
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
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

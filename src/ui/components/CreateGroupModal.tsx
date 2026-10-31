import React, { useState, useEffect, useMemo } from 'react';
import { X, FolderPlus, Check, Search, Globe, CheckSquare, Square } from 'lucide-react';
import { SavedTabItem } from '../types';
import { SmartFavicon } from './BrandIcons';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceTab: SavedTabItem | null;
  targetTab: SavedTabItem | null;
  allTabs: SavedTabItem[];
  onCreateGroup: (name: string, selectedTabIds: string[], accentColor: string, description?: string) => void;
}

const PRESET_COLORS = [
  '#2563eb', // Blue
  '#7c3aed', // Violet
  '#059669', // Emerald
  '#ea580c', // Orange
  '#f43f5e', // Rose
  '#0ea5e9', // Sky
  '#f59e0b', // Amber
  '#64748b'  // Slate
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  sourceTab,
  targetTab,
  allTabs,
  onCreateGroup
}) => {
  const [groupName, setGroupName] = useState('');
  const [accentColor, setAccentColor] = useState('#2563eb');
  const [selectedTabIds, setSelectedTabIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-populate when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Determine initial group name
    let defaultName = 'New Group';
    if (sourceTab?.domain && targetTab?.domain && sourceTab.domain === targetTab.domain) {
      defaultName = `${sourceTab.domain} Group`;
    } else if (targetTab?.domain) {
      defaultName = `${targetTab.domain} Group`;
    } else if (sourceTab?.domain) {
      defaultName = `${sourceTab.domain} Group`;
    }
    setGroupName(defaultName);
    setAccentColor('#2563eb');
    setSearchQuery('');

    // Pre-select source and target tabs (including expanding session tabs if dropping a session group)
    const initialIds: string[] = [];
    if (sourceTab) {
      if (sourceTab.sessionTabs && sourceTab.sessionTabs.length > 0) {
        sourceTab.sessionTabs.forEach(st => {
          if (!initialIds.includes(st.id)) initialIds.push(st.id);
        });
      }
      if (!initialIds.includes(sourceTab.id)) initialIds.push(sourceTab.id);
    }
    if (targetTab) {
      if (targetTab.sessionTabs && targetTab.sessionTabs.length > 0) {
        targetTab.sessionTabs.forEach(st => {
          if (!initialIds.includes(st.id)) initialIds.push(st.id);
        });
      }
      if (!initialIds.includes(targetTab.id)) initialIds.push(targetTab.id);
    }
    setSelectedTabIds(initialIds);
  }, [isOpen, sourceTab, targetTab]);

  // Escape key handler for safety
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

  // Filter tabs for the picker (excluding deleted tabs)
  const activeTabs = useMemo(() => {
    return allTabs.filter(t => !t.deletedAt);
  }, [allTabs]);

  const filteredTabs = useMemo(() => {
    if (!searchQuery.trim()) return activeTabs;
    const query = searchQuery.toLowerCase();
    return activeTabs.filter(t =>
      (t.title || '').toLowerCase().includes(query) ||
      (t.domain && t.domain.toLowerCase().includes(query)) ||
      (t.url && t.url.toLowerCase().includes(query)) ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  }, [activeTabs, searchQuery]);

  const handleToggleTab = (tabId: string) => {
    setSelectedTabIds(prev =>
      prev.includes(tabId) ? prev.filter(id => id !== tabId) : [...prev, tabId]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredTabs.map(t => t.id);
    setSelectedTabIds(prev => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleDeselectAllFiltered = () => {
    const filteredIds = new Set(filteredTabs.map(t => t.id));
    setSelectedTabIds(prev => prev.filter(id => !filteredIds.has(id)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedTabIds.length === 0) return;
    onCreateGroup(groupName.trim(), selectedTabIds, accentColor);
    onClose();
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
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-group-title"
    >
      <div
        className="glass-modal-dialog"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '88vh',
          backgroundColor: 'var(--bg-popover)',
          backdropFilter: 'var(--backdrop-filter-popover)',
          WebkitBackdropFilter: 'var(--backdrop-filter-popover)',
          borderRadius: 'var(--radius-xl, 16px)',
          border: '1px solid var(--border-popover)',
          boxShadow: 'var(--shadow-popover), 0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeInScale 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header - Fixed */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-card)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: `${accentColor}18`,
                color: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <FolderPlus size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h2
                id="create-group-title"
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: 0
                }}
              >
                Create Tab Group
              </h2>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  margin: '2px 0 0 0'
                }}
              >
                Drop to group tabs into a new organized collection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <form
          id="create-group-form"
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          {/* Group Name & Color Row */}
          <div>
            <label
              htmlFor="group-name-input"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}
            >
              Group Name
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                id="group-name-input"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Research Papers, Dev Tools, Notion Hub..."
                required
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Accent Color Swatches */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '8px'
              }}
            >
              Collection Color
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAccentColor(color)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: accentColor === color ? '2px solid #ffffff' : 'none',
                    boxShadow: accentColor === color ? `0 0 0 2px ${color}` : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  {accentColor === color && <Check size={14} color="#ffffff" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Add Tabs to Group Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)'
                }}
              >
                Add Tabs to Group ({selectedTabIds.length} selected)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '11px',
                    color: 'var(--accent-color)',
                    cursor: 'pointer',
                    padding: '2px 4px'
                  }}
                >
                  Select All
                </button>
                <span style={{ color: 'var(--border-subtle)' }}>|</span>
                <button
                  type="button"
                  onClick={handleDeselectAllFiltered}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px 4px'
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Tab Search Filter */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tabs by title, domain, or tag..."
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  fontSize: '12px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>

            {/* Tab List with Checkboxes */}
            <div
              style={{
                maxHeight: '220px',
                overflowY: 'auto',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {filteredTabs.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '12px'
                  }}
                >
                  No tabs match your search.
                </div>
              ) : (
                filteredTabs.map(tab => {
                  const isChecked = selectedTabIds.includes(tab.id);
                  return (
                    <div
                      key={tab.id}
                      onClick={() => handleToggleTab(tab.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        backgroundColor: isChecked ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <div
                        style={{
                          color: isChecked ? 'var(--accent-color)' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          flexShrink: 0
                        }}
                      >
                        {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>

                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '5px',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                      >
                        <SmartFavicon
                          domain={tab.domain}
                          url={tab.url}
                          faviconUrl={tab.faviconUrl}
                          size={14}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {tab.title}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {tab.domain || 'web'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </form>

        {/* Footer - Fixed */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-card)',
            flexShrink: 0
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {selectedTabIds.length} {selectedTabIds.length === 1 ? 'tab' : 'tabs'} will be grouped
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-group-form"
              disabled={!groupName.trim() || selectedTabIds.length === 0}
              style={{
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: !groupName.trim() || selectedTabIds.length === 0 ? 'var(--text-muted)' : accentColor,
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: !groupName.trim() || selectedTabIds.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              Create Group
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

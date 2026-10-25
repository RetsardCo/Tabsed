import React, { useState, useEffect, useMemo } from 'react';
import { X, FolderCog, Search, CheckSquare, Square, Save } from 'lucide-react';
import { Collection, SavedTabItem } from '../types';
import { SmartFavicon } from './BrandIcons';

interface ManageGroupTabsModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection | null;
  allTabs: SavedTabItem[];
  onSaveGroupTabs: (collectionId: string, selectedTabIds: string[]) => void;
}

export const ManageGroupTabsModal: React.FC<ManageGroupTabsModalProps> = ({
  isOpen,
  onClose,
  collection,
  allTabs,
  onSaveGroupTabs
}) => {
  const [selectedTabIds, setSelectedTabIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Populate selected tabs when opened or collection changes
  useEffect(() => {
    if (!isOpen || !collection) return;
    const initialIds = allTabs
      .filter(t => !t.deletedAt && t.collectionIds && t.collectionIds.includes(collection.id))
      .map(t => t.id);
    setSelectedTabIds(initialIds);
    setSearchQuery('');
  }, [isOpen, collection, allTabs]);

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activeTabs = useMemo(() => {
    return allTabs.filter(t => !t.deletedAt);
  }, [allTabs]);

  const filteredTabs = useMemo(() => {
    if (!searchQuery.trim()) return activeTabs;
    const query = searchQuery.toLowerCase();
    return activeTabs.filter(t =>
      t.title.toLowerCase().includes(query) ||
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collection) return;
    onSaveGroupTabs(collection.id, selectedTabIds);
    onClose();
  };

  if (!isOpen || !collection) return null;

  const accentColor = collection.accentColor || '#2563eb';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-group-title"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: '88vh',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xl)',
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
              <FolderCog size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h2
                id="manage-group-title"
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: 0
                }}
              >
                Manage Group Tabs: {collection.name}
              </h2>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  margin: '2px 0 0 0'
                }}
              >
                Add or remove tabs from this collection
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
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Selected: {selectedTabIds.length} tabs
            </span>
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
                Select All Filtered
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
                Clear Filtered
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
              placeholder="Search library tabs..."
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                fontSize: '12px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>

          {/* Tab Checklist */}
          <div
            style={{
              maxHeight: '340px',
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
                  padding: '32px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '13px'
                }}
              >
                No tabs found matching &ldquo;{searchQuery}&rdquo;.
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
                      gap: '12px',
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      backgroundColor: isChecked ? `${accentColor}12` : 'transparent',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div
                      style={{
                        color: isChecked ? accentColor : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0
                      }}
                    >
                      {isChecked ? <CheckSquare size={17} /> : <Square size={17} />}
                    </div>

                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
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
                        size={15}
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
            {selectedTabIds.length} {selectedTabIds.length === 1 ? 'tab' : 'tabs'} in this group
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
              type="button"
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: accentColor,
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Save size={14} />
              <span>Save Group Tabs</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

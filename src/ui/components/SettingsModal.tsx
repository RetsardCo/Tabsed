import React, { useState } from 'react';
import { X, Palette, Monitor, Shield, HardDrive, Check } from 'lucide-react';
import { UserPreferences, ThemeMode, DensityMode, AccentPreset } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
}

const ACCENT_PRESETS: { key: AccentPreset; name: string; hex: string }[] = [
  { key: 'blue', name: 'Blue (Default)', hex: '#2563eb' },
  { key: 'violet', name: 'Violet', hex: '#7c3aed' },
  { key: 'mint', name: 'Mint', hex: '#059669' },
  { key: 'rose', name: 'Rose', hex: '#e11d48' },
  { key: 'amber', name: 'Amber', hex: '#d97706' },
  { key: 'graphite', name: 'Graphite', hex: '#4b5563' }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'appearance' | 'browsers' | 'privacy'>('appearance');

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
        width: '580px',
        maxHeight: '85vh',
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
          <span style={{ fontSize: '15px', fontWeight: 600 }}>Tabsed Preferences</span>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '10px 20px',
          backgroundColor: 'var(--bg-app)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '12px'
        }}>
          <button
            onClick={() => setActiveTab('appearance')}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'appearance' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'appearance' ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'appearance' ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            Appearance
          </button>
          <button
            onClick={() => setActiveTab('browsers')}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'browsers' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'browsers' ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'browsers' ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            Browsers &amp; Connectors
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'privacy' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'privacy' ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'privacy' ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            Privacy &amp; Vault
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeTab === 'appearance' && (
            <>
              {/* Theme Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Theme Mode
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {(['system', 'light', 'dark'] as ThemeMode[]).map(t => (
                    <button
                      key={t}
                      onClick={() => onUpdatePreferences({ theme: t })}
                      style={{
                        padding: '8px',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${preferences.theme === t ? 'var(--accent-color)' : 'var(--border-subtle)'}`,
                        backgroundColor: preferences.theme === t ? 'var(--accent-light)' : 'var(--bg-app)',
                        color: preferences.theme === t ? 'var(--accent-color)' : 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Windows Mica Toggle */}
              <div style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>Windows Mica Backdrop</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Subtle native translucency on Windows 11. Disable for solid high-contrast mode.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.micaEnabled}
                  onChange={e => onUpdatePreferences({ micaEnabled: e.target.checked })}
                  style={{ width: '16px', height: '16px' }}
                />
              </div>

              {/* Accent Color Presets (PRD FR-131) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Accent Color
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {ACCENT_PRESETS.map(preset => {
                    const isSelected = preferences.accent === preset.key;
                    return (
                      <button
                        key={preset.key}
                        onClick={() => onUpdatePreferences({ accent: preset.key, customAccentHex: preset.hex })}
                        title={preset.name}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: preset.hex,
                          border: `2px solid ${isSelected ? '#ffffff' : 'transparent'}`,
                          outline: isSelected ? `2px solid ${preset.hex}` : 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff'
                        }}
                      >
                        {isSelected && <Check size={16} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Density Controls (PRD FR-134) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Content Density
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {(['compact', 'comfortable', 'spacious'] as DensityMode[]).map(d => (
                    <button
                      key={d}
                      onClick={() => onUpdatePreferences({ density: d })}
                      style={{
                        padding: '8px',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${preferences.density === d ? 'var(--accent-color)' : 'var(--border-subtle)'}`,
                        backgroundColor: preferences.density === d ? 'var(--accent-light)' : 'var(--bg-app)',
                        color: preferences.density === d ? 'var(--accent-color)' : 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'browsers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px'
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Microsoft Edge Extension</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status: Active (Native Messaging Bridge Connected)</div>
                </div>
                <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>Ready</span>
              </div>

              <div style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px'
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Google Chrome Extension</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status: Detected (Protocol v1.0.0)</div>
                </div>
                <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>Ready</span>
              </div>

              <div style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px'
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Mozilla Firefox Connector</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status: Planned for Phase 3</div>
                </div>
                <span style={{ color: 'var(--text-muted)' }}>Inactive</span>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                fontSize: '12px',
                lineHeight: '1.5'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Zero Credential Harvesting Principle
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                  Tabsed never reads, exports, or stores cookies, saved passwords, authentication tokens, or active login sessions. Private/incognito tabs are strictly excluded from automated saves.
                </p>
              </div>

              <div style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>Exclude Private/Incognito Tabs</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Protect temporary or sensitive browsing windows
                  </div>
                </div>
                <input type="checkbox" checked={true} readOnly style={{ width: '16px', height: '16px' }} />
              </div>
            </div>
          )}
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
              padding: '6px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-color)',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

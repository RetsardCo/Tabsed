import React, { useState, useEffect } from 'react';
import { X, Palette, Monitor, Shield, HardDrive, Check, Key, EyeOff, Play, Clock, Bell } from 'lucide-react';
import { UserPreferences, ThemeMode, DensityMode, AccentPreset } from '../types';
import { DEFAULT_REDACTION_RULES } from '../../core/vault/privacy-manager';
import { DEFAULT_PROTECTION_RULES, DEFAULT_AUTOMATION_RULES, AutomationEngine } from '../../core/automation/automation-engine';

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

  const [activeTab, setActiveTab] = useState<'appearance' | 'browsers' | 'privacy' | 'automation' | 'tray'>('appearance');

  // Phase 4 states
  const [privateTabsOptIn, setPrivateTabsOptIn] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [generatedRecoveryKey, setGeneratedRecoveryKey] = useState<string | null>(null);
  const [recoveryWarningShown, setRecoveryWarningShown] = useState(false);

  // Automation states
  const [automationRules, setAutomationRules] = useState(DEFAULT_AUTOMATION_RULES);
  const [protectionRules, setProtectionRules] = useState(DEFAULT_PROTECTION_RULES);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  // Tray states
  const [minimizeToTray, setMinimizeToTray] = useState(true);
  const [redactNotificationTitles, setRedactNotificationTitles] = useState(true);

  const handleGenerateRecoveryKey = () => {
    const bytes = new Uint8Array(16);
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const key = `TABSED-${hex.substring(0, 4)}-${hex.substring(4, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}`;
    setGeneratedRecoveryKey(key);
    setRecoveryWarningShown(true);
  };

  const handleRunSimulation = () => {
    const dummyTabs = [
      { id: 'tab_1', title: 'GitHub PR #42 Review', url: 'https://github.com/org/repo/pull/42', domain: 'github.com', pinned: false, lastActiveMinutesAgo: 120 },
      { id: 'tab_2', title: 'AWS Cloud Console', url: 'https://console.aws.amazon.com', domain: 'console.aws.amazon.com', pinned: false, lastActiveMinutesAgo: 95 },
      { id: 'tab_3', title: 'Work Jira Dashboard', url: 'https://work.atlassian.net', domain: 'work.atlassian.net', pinned: true, lastActiveMinutesAgo: 140 },
      { id: 'tab_4', title: 'Private Research', url: 'https://scholar.google.com', domain: 'scholar.google.com', isPrivate: true, lastActiveMinutesAgo: 70 }
    ];

    const sim = AutomationEngine.simulate(dummyTabs, { ...automationRules[0], enabled: true }, protectionRules);
    setSimulationResult(
      `Simulation evaluated 4 tabs:\n` +
      `• Would Save: ${sim.wouldSave.length} (${sim.wouldSave.map(t => t.title).join(', ') || 'None'})\n` +
      `• Would Close: ${sim.wouldClose.length}\n` +
      `• Protected: ${sim.protected.length} (${sim.protected.map(p => `${p.tab.title}: ${p.reason}`).join('; ')})`
    );
  };

  if (!isOpen) return null;

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
        backdropFilter: 'blur(6px)',
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
        aria-labelledby="settings-modal-title"
        style={{
          width: '640px',
          maxWidth: '92vw',
          maxHeight: '88vh',
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
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          flexShrink: 0
        }}>
          <span id="settings-modal-title" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Tabsed Preferences</span>
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

        {/* Tab navigation - Fixed */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '10px 20px',
          backgroundColor: 'var(--bg-app)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '12px',
          overflowX: 'auto',
          flexShrink: 0
        }}>
          {(['appearance', 'browsers', 'privacy', 'automation', 'tray'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeTab === tab ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === tab ? 'var(--accent-color)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: 'pointer',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap'
              }}
            >
              {tab === 'privacy' ? 'Privacy & Encryption' : tab === 'tray' ? 'System Tray' : tab}
            </button>
          ))}
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

              {/* Accent Color Presets */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Accent Color
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {ACCENT_PRESETS.map(p => (
                    <button
                      key={p.key}
                      onClick={() => onUpdatePreferences({ accent: p.key, customAccentHex: p.hex })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${preferences.accent === p.key ? 'var(--accent-color)' : 'var(--border-subtle)'}`,
                        backgroundColor: preferences.accent === p.key ? 'var(--accent-light)' : 'var(--bg-app)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: p.hex }} />
                      <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Layout Preferences */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Grid Columns
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                  {([
                    { val: 'auto' as const, label: 'Auto' },
                    { val: 2 as const, label: '2' },
                    { val: 3 as const, label: '3' },
                    { val: 4 as const, label: '4' },
                    { val: 5 as const, label: '5' },
                    { val: 6 as const, label: '6' }
                  ]).map(col => {
                    const isSelected = (preferences.gridColumns || 'auto') === col.val;
                    return (
                      <button
                        key={col.label}
                        type="button"
                        onClick={() => onUpdatePreferences({ gridColumns: col.val })}
                        style={{
                          padding: '7px 4px',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-subtle)'}`,
                          backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--bg-app)',
                          color: isSelected ? 'var(--accent-color)' : 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: isSelected ? 600 : 500,
                          cursor: 'pointer'
                        }}
                      >
                        {col.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card Density / Size Preferences */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Tab Card Size
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {([
                    { key: 'compact' as const, label: 'Compact', desc: 'Smaller cards, fit more' },
                    { key: 'medium' as const, label: 'Medium', desc: 'Balanced default' },
                    { key: 'large' as const, label: 'Large', desc: 'Large preview screenshots' }
                  ]).map(size => {
                    const isSelected = (preferences.cardSize || 'medium') === size.key;
                    return (
                      <button
                        key={size.key}
                        type="button"
                        onClick={() => onUpdatePreferences({ cardSize: size.key })}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '8px',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-subtle)'}`,
                          backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--bg-app)',
                          color: isSelected ? 'var(--accent-color)' : 'var(--text-primary)',
                          cursor: 'pointer',
                          gap: '2px'
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{size.label}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{size.desc}</span>
                      </button>
                    );
                  })}
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
                  <div style={{ fontWeight: 600 }}>Microsoft Edge Connector</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Native Messaging Host v1.0.0</div>
                </div>
                <span style={{ color: '#10b981', fontWeight: 600 }}>Connected</span>
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
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Native Messaging Host v1.0.0</div>
                </div>
                <span style={{ color: '#10b981', fontWeight: 600 }}>Connected</span>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
              {/* Sensitive Domain Preview Redaction (Epic 4.3) */}
              <div style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, marginBottom: '4px' }}>
                  <EyeOff size={16} style={{ color: 'var(--accent-color)' }} />
                  <span>Sensitive Domain Preview Redaction (PRD FR-125)</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Automatically masks and sanitizes tab previews before persisting to storage for sensitive banking and health portals.
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {DEFAULT_REDACTION_RULES.map(r => (
                    <span
                      key={r.id}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '11px'
                      }}
                    >
                      {r.pattern} ({r.mode})
                    </span>
                  ))}
                </div>
              </div>

              {/* Private Tab Opt-in (Epic 4.3) */}
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
                  <div style={{ fontWeight: 600 }}>Allow Private / Incognito Tab Capture</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Disabled by default (PRD FR-121). Private tabs are purged on application exit.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privateTabsOptIn}
                  onChange={e => setPrivateTabsOptIn(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
              </div>

              {/* AES-256-GCM Encryption & Recovery Key (Epic 4.2) */}
              <div style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, marginBottom: '4px' }}>
                  <Key size={16} style={{ color: 'var(--accent-color)' }} />
                  <span>AES-256-GCM Archive Encryption (PRD FR-123)</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Hardware-accelerated AES-256-GCM with scrypt key derivation and tamper detection.
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {encryptionEnabled ? 'Encryption active for new archives' : 'Encryption optional'}
                  </span>
                  <button
                    onClick={handleGenerateRecoveryKey}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--accent-light)',
                      color: 'var(--accent-color)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Generate Recovery Key
                  </button>
                </div>

                {generatedRecoveryKey && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--text-primary)',
                    fontSize: '11px'
                  }}>
                    <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>
                      Recovery Key: {generatedRecoveryKey}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                      Loss of this key and your password will make encrypted data permanently unrecoverable (PRD FR-124).
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'automation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
              <div style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Automation rules run on configured thresholds. Pinned tabs, allowlisted domains, and user collections are strictly protected.
              </div>

              {/* Protected Tabs */}
              <div style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontWeight: 600, marginBottom: '6px' }}>Protected Tab Invariants (PRD Epic 4.4)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      checked={protectionRules.protectPinnedTabs}
                      onChange={e => setProtectionRules(p => ({ ...p, protectPinnedTabs: e.target.checked }))}
                    />
                    <span>Protect pinned tabs from automated closure</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      checked={protectionRules.excludePrivateTabs}
                      onChange={e => setProtectionRules(p => ({ ...p, excludePrivateTabs: e.target.checked }))}
                    />
                    <span>Exclude private/incognito tabs by default</span>
                  </label>
                  <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                    Allowlisted domains: {protectionRules.allowlistedDomains.join(', ')}
                  </div>
                </div>
              </div>

              {/* Simulation button */}
              <div>
                <button
                  onClick={handleRunSimulation}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--accent-color)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Play size={14} />
                  Simulate Inactivity Vaulting Rule
                </button>
              </div>

              {simulationResult && (
                <div style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  whiteSpace: 'pre-wrap',
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}>
                  {simulationResult}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tray' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
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
                  <div style={{ fontWeight: 600 }}>Minimize to System Tray</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Keep Tabsed running in the Windows notification area for quick tab capture
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={minimizeToTray}
                  onChange={e => setMinimizeToTray(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
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
                  <div style={{ fontWeight: 600 }}>Redact Notification Titles (PRD FR-126)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Mask sensitive URLs and page titles in Windows notification popups
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={redactNotificationTitles}
                  onChange={e => setRedactNotificationTitles(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
              </div>

              <div style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                fontSize: '11px',
                color: 'var(--text-muted)'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Available Quick Actions:
                </div>
                <div>• Open Tabsed</div>
                <div>• Save Current Window (Gated on browser connector availability)</div>
                <div>• Search Vault</div>
                <div>• Restore Recent Session</div>
                <div>• Pause / Resume Automation</div>
                <div>• Exit</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-app)',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Press Esc or click outside to dismiss
          </span>
          <button
            onClick={onClose}
            aria-label="Close settings"
            style={{
              padding: '8px 20px',
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
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

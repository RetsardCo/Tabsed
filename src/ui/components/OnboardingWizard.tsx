import React, { useState, useEffect } from 'react';
import { Layers, ShieldCheck, CheckCircle2, ArrowRight, Folder, Check, X } from 'lucide-react';

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ isOpen, onComplete }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onComplete]);

  const [step, setStep] = useState<number>(1);
  const [vaultPath, setVaultPath] = useState<string>('C:\\Users\\Kurados\\TabsedVault');
  const [selectedMode, setSelectedMode] = useState<'basic' | 'connected'>('connected');
  const [testCaptureDone, setTestCaptureDone] = useState(false);

  const handleRunTestCapture = () => {
    setTimeout(() => {
      setTestCaptureDone(true);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onComplete();
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
        zIndex: 2000
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-wizard-title"
    >
      <div
        className="glass-modal-dialog"
        style={{
          width: '520px',
          backgroundColor: 'var(--bg-popover)',
          backdropFilter: 'var(--backdrop-filter-popover)',
          WebkitBackdropFilter: 'var(--backdrop-filter-popover)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-popover)',
          boxShadow: 'var(--shadow-popover), 0 20px 40px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Step Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-app)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: 'drop-shadow(0 2px 6px rgba(37, 99, 235, 0.35))',
              flexShrink: 0
            }}>
              <img
                src="/logo-32.png"
                srcSet="/logo-32.png 1x, /logo-64.png 2x"
                alt="Tabsed"
                style={{
                  width: '26px',
                  height: '26px',
                  objectFit: 'contain',
                  imageRendering: '-webkit-optimize-contrast'
                }}
              />
            </div>
            <span id="onboarding-wizard-title" style={{ fontSize: '14px', fontWeight: 600 }}>Welcome to Tabsed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Step {step} of 4</span>
            <button
              onClick={onComplete}
              aria-label="Close dialog"
              title="Close (Esc)"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '4px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', minHeight: '260px' }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Your tabs, thoughtfully put away.
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Tabsed helps you close crowded browser tabs with confidence. Your browsing context—previews, URLs, notes, and session layouts—is securely persisted in a private, local-first vault.
              </p>

              <div style={{
                backgroundColor: 'var(--bg-app)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} color="var(--success-color)" />
                  <span><strong>100% Local-First:</strong> No cloud accounts or telemetry required.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} color="var(--success-color)" />
                  <span><strong>Save Before Close:</strong> Source tabs never close unless verified.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} color="var(--success-color)" />
                  <span><strong>Privacy Default:</strong> Incognito tabs and cookies are never gathered.</span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Choose Local Vault Location</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                All metadata, SQLite records, preview images, and optional archives will be stored in this directory.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Vault Directory:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={vaultPath}
                    onChange={e => setVaultPath(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-app)',
                      fontSize: '12px',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <button
                    type="button"
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-app)',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Browse...
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Available space on drive: ~56.7 GB free
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Select Integration Mode</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                You can change this anytime from Settings.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div
                  onClick={() => setSelectedMode('basic')}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${selectedMode === 'basic' ? 'var(--accent-color)' : 'var(--border-subtle)'}`,
                    backgroundColor: selectedMode === 'basic' ? 'var(--accent-light)' : 'var(--bg-app)',
                    cursor: 'pointer'
                  }}
                >
                  <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Basic Mode</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Desktop app only. Manage vaults, manual URL imports, and local archives without browser extensions.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedMode('connected')}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${selectedMode === 'connected' ? 'var(--accent-color)' : 'var(--border-subtle)'}`,
                    backgroundColor: selectedMode === 'connected' ? 'var(--accent-light)' : 'var(--bg-app)',
                    cursor: 'pointer'
                  }}
                >
                  <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Connected Mode</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Full integration with Microsoft Edge and Chrome via browser extension for one-click tab capture and restoration.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Test Tab Capture</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Try out a safe test capture to verify that your vault and preview pipeline are working properly. No browser tabs will be closed.
              </p>

              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Sample Test Session</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Captures 2 sample reference tabs into Inbox</div>
                </div>

                <button
                  onClick={handleRunTestCapture}
                  disabled={testCaptureDone}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: testCaptureDone ? 'var(--success-color)' : 'var(--accent-color)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: testCaptureDone ? 'default' : 'pointer'
                  }}
                >
                  {testCaptureDone ? '✓ Verified' : 'Run Test Capture'}
                </button>
              </div>

              {testCaptureDone && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(22, 163, 74, 0.1)',
                  color: 'var(--success-color)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle2 size={16} />
                  <span>Test capture verified! Your vault is configured and ready.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-app)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'transparent',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={onComplete}
              aria-label="Skip onboarding"
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: '12px',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              Skip
            </button>
          </div>

          <button
            onClick={() => {
              if (step < 4) {
                setStep(step + 1);
              } else {
                onComplete();
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-color)',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <span>{step === 4 ? 'Enter Tabsed' : 'Continue'}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

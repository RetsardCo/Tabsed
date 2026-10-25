import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
  isModal?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Tabsed ErrorBoundary] Uncaught React error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      const isModal = this.props.isModal ?? true;
      const content = (
        <div
          role="alert"
          className={isModal ? 'glass-modal-dialog' : undefined}
          style={{
            width: isModal ? '100%' : 'auto',
            maxWidth: isModal ? '460px' : 'none',
            padding: '24px 28px',
            margin: isModal ? '0' : '16px',
            backgroundColor: 'var(--bg-popover, #ffffff)',
            backdropFilter: 'var(--backdrop-filter-popover)',
            WebkitBackdropFilter: 'var(--backdrop-filter-popover)',
            border: '1px solid var(--border-popover, #e2e8f0)',
            borderRadius: 'var(--radius-lg, 12px)',
            boxShadow: 'var(--shadow-popover, 0 10px 15px -3px rgba(0,0,0,0.1))',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '12px',
            position: 'relative',
            zIndex: 10000
          }}
        >
          {isModal && (
            <button
              onClick={this.handleReset}
              title="Close and dismiss"
              aria-label="Close error dialog"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-muted, #64748b)',
                padding: '4px',
                borderRadius: '6px'
              }}
            >
              <X size={18} />
            </button>
          )}
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary, #0f172a)', margin: 0 }}>
            {this.props.fallbackTitle || 'Something went wrong in this panel'}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', margin: 0, maxWidth: '420px', lineHeight: 1.5 }}>
            {this.state.error?.message || 'An unexpected rendering error occurred. You can safely dismiss it without restarting Tabsed.'}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--accent-color, #2563eb)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)'
            }}
          >
            <RefreshCw size={14} />
            <span>Dismiss &amp; Recover</span>
          </button>
        </div>
      );

      if (isModal) {
        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={this.props.fallbackTitle || 'Error Dialog'}
            onClick={(e) => {
              if (e.target === e.currentTarget) this.handleReset();
            }}
            className="glass-modal-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.72)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '20px'
            }}
          >
            {content}
          </div>
        );
      }

      return content;
    }

    return this.props.children;
  }
}

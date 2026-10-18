import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';
import { StorageService } from '../persistence/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[NothingDesk Error Boundary]', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleSafeReset = () => {
    StorageService.resetAll();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-pure-black)',
            color: 'var(--text-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            fontFamily: 'var(--font-primary)',
            zIndex: 999999,
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(215, 25, 33, 0.12)',
              border: '1px solid var(--accent-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <AlertTriangle size={32} color="var(--accent-red)" />
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '8px' }}>
            Desktop Shell Interrupted
          </h2>

          <p
            style={{
              color: 'var(--text-secondary)',
              maxWidth: '420px',
              fontSize: '13px',
              lineHeight: 1.6,
              marginBottom: '20px',
            }}
          >
            Nothing Desk encountered an unexpected rendering error. Your Android apps and personal files remain completely safe.
          </p>

          {this.state.error && (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--status-danger)',
                maxWidth: '480px',
                marginBottom: '20px',
                textAlign: 'left',
                overflowX: 'auto',
              }}
            >
              {this.state.error.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'var(--accent-red)',
                color: '#ffffff',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 500,
                fontSize: '13px',
              }}
            >
              <RefreshCw size={14} /> Reload Workspace
            </button>

            <button
              type="button"
              onClick={this.handleSafeReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--glass-border-focus)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
              }}
            >
              <ShieldAlert size={14} /> Safe Settings Reset
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

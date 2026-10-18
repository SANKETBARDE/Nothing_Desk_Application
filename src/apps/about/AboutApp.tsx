import React, { useState } from 'react';
import { ShieldCheck, Copy, Check } from 'lucide-react';
import { platformAdapter } from '../../platform/nativeAdapter';

export const AboutApp: React.FC<{ windowId: string }> = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyDiagnostics = async () => {
    const caps = await platformAdapter.getCapabilities();
    const diagnosticReport = {
      product: 'Nothing Desk',
      version: '1.0.0-mvp',
      buildDate: '2026-10-17',
      operatingMode: platformAdapter.getOperatingMode(),
      capabilities: caps,
      viewport: {
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
        pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      },
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      storageState: 'LocalStorage / Schema v1',
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnosticReport, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ padding: '20px', height: '100%', overflowY: 'auto', color: 'var(--text-primary)', fontSize: '13px' }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
        <img
          src="/nothing_dex.svg"
          alt="Nothing Desk Icon"
          style={{
            width: '46px',
            height: '46px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--accent-red)',
            boxShadow: '0 0 16px var(--accent-red-subtle)',
            objectFit: 'contain',
          }}
        />

        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600 }}>NOTHING DESK</h2>
          <div style={{ color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            VERSION 1.0.0 • MVP SPEC
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Core Philosophy */}
        <div
          style={{
            padding: '12px 14px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-sm)',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: 'var(--text-pure-white)' }}>Core Architectural Principle:</strong>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Build a polished desktop shell and reliable built-in windows. Do not promise OS-level behavior that an ordinary app cannot control. Android owns third-party app processes and system-wide controls; Nothing Desk provides a clean, responsive workspace.
          </p>
        </div>

        {/* Privacy & Permissions */}
        <div
          style={{
            padding: '12px 14px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-success)' }}>
            <ShieldCheck size={16} />
            <strong style={{ fontFamily: 'var(--font-display)' }}>Privacy & Permissions</strong>
          </div>
          <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Zero root, bootloader, or custom ROM requirements.</li>
            <li>No accessibility service keystroke tracking.</li>
            <li>No telemetry or cloud tracking by default.</li>
            <li>Scoped file operations only with explicit user selection.</li>
          </ul>
        </div>

        {/* Diagnostics Button */}
        <div>
          <button
            type="button"
            onClick={handleCopyDiagnostics}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--glass-border-focus)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
            }}
          >
            {copied ? <Check size={14} color="var(--status-success)" /> : <Copy size={14} />}
            {copied ? 'Sanitized Diagnostics Copied' : 'Copy Sanitized Diagnostics'}
          </button>
        </div>
      </div>
    </div>
  );
};

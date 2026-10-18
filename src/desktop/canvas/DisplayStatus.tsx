import React from 'react';
import { Monitor, Smartphone, Cast } from 'lucide-react';
import type { OperatingMode } from '../../platform/capabilities';

interface DisplayStatusProps {
  mode: OperatingMode;
  hasExternalDisplay?: boolean;
}

export const DisplayStatus: React.FC<DisplayStatusProps> = ({ mode, hasExternalDisplay }) => {
  // Only display badge if external display or non-default mode
  if (mode === 'PHONE_TOUCH' && !hasExternalDisplay) {
    return null;
  }

  const getModeLabel = () => {
    switch (mode) {
      case 'PHONE_POINTER':
        return 'Pointer Connected';
      case 'EXTERNAL_MIRROR':
        return 'Screen Mirror Active';
      case 'EXTERNAL_DESKTOP':
        return 'External Desktop Surface';
      default:
        return 'Handheld Desk';
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(var(--safe-top) + 12px)',
        right: 'calc(var(--safe-right) + 16px)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        background: 'rgba(18, 18, 22, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-full)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        zIndex: 5,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      }}
      title="Hardware Display & Peripheral Status"
    >
      {mode === 'EXTERNAL_MIRROR' ? (
        <Cast size={13} color="var(--accent-red)" />
      ) : mode === 'EXTERNAL_DESKTOP' ? (
        <Monitor size={13} color="var(--status-success)" />
      ) : (
        <Smartphone size={13} color="var(--accent-red)" />
      )}
      <span>{getModeLabel()}</span>
    </div>
  );
};

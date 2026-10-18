import React, { useEffect, useRef } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import type { WindowMode } from '../types';

interface WindowMenuProps {
  mode: WindowMode;
  allowMaximize?: boolean;
  onRestore: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  onDismiss: () => void;
}

export const WindowMenu: React.FC<WindowMenuProps> = ({
  mode,
  allowMaximize = true,
  onRestore,
  onMinimize,
  onMaximize,
  onClose,
  onDismiss,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onDismiss();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [onDismiss]);

  return (
    <div
      ref={menuRef}
      className="anim-slide-up"
      style={{
        position: 'absolute',
        top: '36px',
        left: '8px',
        zIndex: 100,
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--glass-border-focus)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--glass-shadow)',
        minWidth: '160px',
        padding: '4px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
      role="menu"
      aria-label="Window Options"
    >
      <button
        type="button"
        role="menuitem"
        disabled={mode === 'normal'}
        onClick={() => {
          onRestore();
          onDismiss();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px',
          borderRadius: 'var(--radius-xs)',
          fontSize: '12px',
          opacity: mode === 'normal' ? 0.4 : 1,
          justifyContent: 'flex-start',
          color: 'var(--text-primary)',
        }}
      >
        <Copy size={13} /> Restore
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onMinimize();
          onDismiss();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px',
          borderRadius: 'var(--radius-xs)',
          fontSize: '12px',
          justifyContent: 'flex-start',
          color: 'var(--text-primary)',
        }}
      >
        <Minus size={13} /> Minimize
      </button>

      {allowMaximize && (
        <button
          type="button"
          role="menuitem"
          disabled={mode === 'maximized'}
          onClick={() => {
            onMaximize();
            onDismiss();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '12px',
            opacity: mode === 'maximized' ? 0.4 : 1,
            justifyContent: 'flex-start',
            color: 'var(--text-primary)',
          }}
        >
          <Square size={13} /> Maximize
        </button>
      )}

      <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClose();
          onDismiss();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px',
          borderRadius: 'var(--radius-xs)',
          fontSize: '12px',
          justifyContent: 'flex-start',
          color: 'var(--status-danger)',
        }}
      >
        <X size={13} /> Close (Alt+F4)
      </button>
    </div>
  );
};

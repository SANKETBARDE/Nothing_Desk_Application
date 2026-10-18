import React, { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [onClose]);

  // Adjust coordinates if menu overflows viewport
  const menuWidth = 180;
  const menuHeight = items.length * 32 + 16;
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 8);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 8);

  return (
    <div
      ref={menuRef}
      className="anim-slide-up"
      style={{
        position: 'fixed',
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
        width: `${menuWidth}px`,
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--glass-border-focus)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--glass-shadow)',
        padding: '4px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
      role="menu"
    >
      {items.map((item, idx) => {
        if (item.separator) {
          return (
            <div
              key={idx}
              style={{
                height: '1px',
                background: 'rgba(255, 255, 255, 0.08)',
                margin: '4px 0',
              }}
            />
          );
        }

        return (
          <button
            key={idx}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              item.action();
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-xs)',
              fontSize: '12px',
              color: item.danger ? 'var(--status-danger)' : 'var(--text-primary)',
              opacity: item.disabled ? 0.4 : 1,
              justifyContent: 'flex-start',
              width: '100%',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {item.icon && <span style={{ display: 'flex', flexShrink: 0 }}>{item.icon}</span>}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

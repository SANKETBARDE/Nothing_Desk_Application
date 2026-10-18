import React, { useState, useRef } from 'react';
import * as Icons from 'lucide-react';
import type { IconScale } from '../../persistence/schema';

export interface DesktopShortcut {
  id: string;
  appId: string;
  label: string;
  iconName: string;
  isCustom?: boolean;
}

export const ICON_GRID_CONFIG = {
  small: { cellWidth: 76, cellHeight: 80, icon: 22, capsule: 38, font: 11, labelHeight: 28, gap: 10 },
  medium: { cellWidth: 88, cellHeight: 92, icon: 28, capsule: 46, font: 12, labelHeight: 30, gap: 12 },
  large: { cellWidth: 100, cellHeight: 106, icon: 34, capsule: 54, font: 13, labelHeight: 32, gap: 14 },
};

interface IconItemProps {
  shortcut: DesktopShortcut;
  scale: IconScale;
  isSelected: boolean;
  isPointer: boolean;
  onSelect: (id: string) => void;
  onOpen: (shortcut: DesktopShortcut) => void;
  onContextMenu: (e: React.MouseEvent | React.TouchEvent, shortcut: DesktopShortcut) => void;
  onRename: (id: string, newLabel: string) => void;
}

export const IconItem: React.FC<IconItemProps> = ({
  shortcut,
  scale,
  isSelected,
  isPointer,
  onSelect,
  onOpen,
  onContextMenu,
  onRename,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(shortcut.label);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[shortcut.iconName] || Icons.AppWindow;

  const cfg = ICON_GRID_CONFIG[scale] || ICON_GRID_CONFIG.medium;

  // Touch Long-Press Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    longPressTimerRef.current = setTimeout(() => {
      onContextMenu(e, shortcut);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleRenameSubmit = () => {
    if (editLabel.trim()) {
      onRename(shortcut.id, editLabel.trim());
    } else {
      setEditLabel(shortcut.label);
    }
    setIsEditing(false);
  };

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={shortcut.label}
      onClick={(e) => {
        const pointerType = (e.nativeEvent as PointerEvent)?.pointerType;
        const isTouch = pointerType === 'touch' || !isPointer || isSelected;
        onSelect(shortcut.id);
        if (isTouch) {
          onOpen(shortcut);
        }
      }}
      onDoubleClick={() => {
        onOpen(shortcut);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e, shortcut);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onOpen(shortcut);
        } else if (e.key === 'F2') {
          setIsEditing(true);
        }
      }}
      style={{
        width: `${cfg.cellWidth}px`,
        height: `${cfg.cellHeight}px`,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '4px',
        borderRadius: 'var(--radius-sm)',
        background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
        border: `1px solid ${isSelected ? 'var(--accent-red)' : 'transparent'}`,
        outline: 'none',
        cursor: 'pointer',
        transition: 'background var(--transition-instant)',
      }}
    >
      {/* Icon Capsule */}
      <div
        style={{
          width: `${cfg.capsule}px`,
          height: `${cfg.capsule}px`,
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '4px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
          flexShrink: 0,
        }}
      >
        <IconComponent size={cfg.icon} color="var(--accent-red)" />
      </div>

      {/* Label or Inline Renaming Input */}
      {isEditing ? (
        <input
          type="text"
          value={editLabel}
          autoFocus
          onChange={(e) => setEditLabel(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRenameSubmit();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          style={{
            width: '100%',
            fontSize: `${cfg.font}px`,
            textAlign: 'center',
            background: 'var(--bg-surface-hover)',
            border: '1px solid var(--accent-red)',
            borderRadius: 'var(--radius-xs)',
            color: 'var(--text-primary)',
            outline: 'none',
            padding: '2px',
          }}
        />
      ) : (
        <span
          style={{
            fontSize: `${cfg.font}px`,
            textAlign: 'center',
            color: 'var(--text-primary)',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.85)',
            lineHeight: 1.2,
            wordBreak: 'break-word',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            maxHeight: `${cfg.labelHeight}px`,
            width: '100%',
          }}
        >
          {shortcut.label}
        </span>
      )}
    </div>
  );
};

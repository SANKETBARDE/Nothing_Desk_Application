import React, { useState } from 'react';
import { IconItem, ICON_GRID_CONFIG } from './IconItem';
import type { DesktopShortcut } from './IconItem';
import type { IconScale } from '../../persistence/schema';
import { PlusCircle } from 'lucide-react';

interface IconGridProps {
  shortcuts: DesktopShortcut[];
  scale: IconScale;
  isPointer: boolean;
  onOpenShortcut: (shortcut: DesktopShortcut) => void;
  onContextMenu: (e: React.MouseEvent | React.TouchEvent, shortcut: DesktopShortcut) => void;
  onRenameShortcut: (id: string, newLabel: string) => void;
  onOpenStartMenu: () => void;
}

export const IconGrid: React.FC<IconGridProps> = ({
  shortcuts,
  scale,
  isPointer,
  onOpenShortcut,
  onContextMenu,
  onRenameShortcut,
  onOpenStartMenu,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const cfg = ICON_GRID_CONFIG[scale] || ICON_GRID_CONFIG.medium;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setSelectedId(null);
        }
      }}
      style={{
        position: 'absolute',
        top: 'calc(var(--safe-top) + 16px)',
        left: 'calc(var(--safe-left) + 16px)',
        bottom: 'calc(var(--safe-bottom) + 24px)',
        right: 'calc(var(--safe-right) + 16px)',
        display: 'grid',
        gridAutoFlow: 'column',
        gridTemplateRows: `repeat(auto-fill, ${cfg.cellHeight}px)`,
        gridAutoColumns: `${cfg.cellWidth}px`,
        gap: `${cfg.gap}px`,
        alignContent: 'start',
        justifyContent: 'start',
        overflow: 'hidden',
        zIndex: 1,
      }}
    >
      {shortcuts.length > 0 ? (
        shortcuts.map((shortcut) => (
          <IconItem
            key={shortcut.id}
            shortcut={shortcut}
            scale={scale}
            isSelected={selectedId === shortcut.id}
            isPointer={isPointer}
            onSelect={setSelectedId}
            onOpen={onOpenShortcut}
            onContextMenu={onContextMenu}
            onRename={onRenameShortcut}
          />
        ))
      ) : (
        <div
          style={{
            margin: 'auto',
            padding: '16px 20px',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(16px)',
            border: '1px dashed var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            No shortcuts pinned to desktop.
          </span>
          <button
            type="button"
            onClick={onOpenStartMenu}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'var(--accent-red-subtle)',
              border: '1px solid var(--accent-red)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--accent-red)',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            <PlusCircle size={14} /> Open Start Menu
          </button>
        </div>
      )}
    </div>
  );
};

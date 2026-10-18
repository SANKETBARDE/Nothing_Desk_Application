import React, { useRef, useState, useCallback } from 'react';
import type { WindowInstance, WindowBounds } from './types';
import { WindowControls } from './controls/WindowControls';
import { WindowMenu } from './controls/WindowMenu';
import {
  calculateDragBounds,
  calculateResizeBounds,
} from './pointer';
import type { ResizeDirection } from './pointer';
import { detectSnapZone } from './snapping';
import type { SnapZone } from './snapping';
import * as Icons from 'lucide-react';

interface WindowFrameProps {
  window: WindowInstance;
  workArea: { width: number; height: number };
  children: React.ReactNode;
  onFocus: (id: string) => void;
  onUpdateBounds: (id: string, bounds: WindowInstance['bounds']) => void;
  onMinimize: (id: string) => void;
  onMaximizeToggle: (id: string) => void;
  onClose: (id: string) => void;
  onSnapPreview?: (bounds: WindowBounds | null) => void;
  onSnapApply?: (id: string, zone: SnapZone, bounds: WindowBounds | null) => void;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  window: win,
  workArea,
  children,
  onFocus,
  onUpdateBounds,
  onMinimize,
  onMaximizeToggle,
  onClose,
  onSnapPreview,
  onSnapApply,
}) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const activeSnapZoneRef = useRef<SnapZone>('none');
  const activeSnapBoundsRef = useRef<WindowBounds | null>(null);

  // Dynamic Lucide icon lookup with fallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[win.iconName] || Icons.AppWindow;

  // Titlebar Pointer Dragging
  const handleTitlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Ignore if clicking on control buttons
      if ((e.target as HTMLElement).closest('.window-control-btn') || (e.target as HTMLElement).closest('.window-app-icon-btn')) {
        return;
      }
      if (win.mode === 'maximized') return;

      onFocus(win.id);
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      isDraggingRef.current = true;
      activeSnapZoneRef.current = 'none';
      activeSnapBoundsRef.current = null;

      const startX = e.clientX;
      const startY = e.clientY;
      const initialBounds = { ...win.bounds };

      const onPointerMove = (moveEvent: PointerEvent) => {
        if (!isDraggingRef.current) return;
        const newBounds = calculateDragBounds(
          startX,
          startY,
          moveEvent.clientX,
          moveEvent.clientY,
          initialBounds,
          workArea
        );
        onUpdateBounds(win.id, newBounds);

        // Snap zone detection
        const snap = detectSnapZone(moveEvent.clientX, moveEvent.clientY, workArea);
        activeSnapZoneRef.current = snap.zone;
        activeSnapBoundsRef.current = snap.previewBounds;
        if (onSnapPreview) {
          onSnapPreview(snap.previewBounds);
        }
      };

      const onPointerUp = (upEvent: PointerEvent) => {
        isDraggingRef.current = false;
        if (onSnapPreview) {
          onSnapPreview(null);
        }

        // Apply Snap if active
        if (activeSnapZoneRef.current !== 'none' && onSnapApply) {
          onSnapApply(win.id, activeSnapZoneRef.current, activeSnapBoundsRef.current);
        }

        try {
          target.releasePointerCapture(upEvent.pointerId);
        } catch {
          // ignore
        }
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    },
    [win.id, win.mode, win.bounds, workArea, onFocus, onUpdateBounds, onSnapPreview, onSnapApply]
  );

  // Resize Handle Pointer Handling
  const handleResizePointerDown = useCallback(
    (direction: ResizeDirection, e: React.PointerEvent<HTMLDivElement>) => {
      if (win.mode === 'maximized' || win.allowResize === false) return;
      e.stopPropagation();
      onFocus(win.id);

      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      isResizingRef.current = true;

      const startX = e.clientX;
      const startY = e.clientY;
      const initialBounds = { ...win.bounds };

      const onPointerMove = (moveEvent: PointerEvent) => {
        if (!isResizingRef.current) return;
        const newBounds = calculateResizeBounds(
          direction,
          startX,
          startY,
          moveEvent.clientX,
          moveEvent.clientY,
          initialBounds,
          win.minWidth,
          win.minHeight,
          workArea
        );
        onUpdateBounds(win.id, newBounds);
      };

      const onPointerUp = (upEvent: PointerEvent) => {
        isResizingRef.current = false;
        try {
          target.releasePointerCapture(upEvent.pointerId);
        } catch {
          // ignore
        }
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    },
    [win.id, win.mode, win.allowResize, win.bounds, win.minWidth, win.minHeight, workArea, onFocus, onUpdateBounds]
  );

  // Style positioning based on mode
  const style: React.CSSProperties = {
    zIndex: win.zIndex,
    display: win.mode === 'minimized' ? 'none' : 'flex',
    ...(win.mode === 'maximized'
      ? {
          top: 0,
          left: 0,
          width: '100%',
          height: `${workArea.height}px`,
        }
      : {
          top: `${win.bounds.y}px`,
          left: `${win.bounds.x}px`,
          width: `${win.bounds.width}px`,
          height: `${win.bounds.height}px`,
        }),
  };

  return (
    <div
      ref={frameRef}
      className={`window-frame ${win.isFocused ? 'focused' : ''} ${win.mode === 'maximized' ? 'maximized' : ''}`}
      style={style}
      onPointerDown={() => onFocus(win.id)}
      role="dialog"
      aria-labelledby={`window-title-${win.id}`}
      aria-modal="false"
    >
      {/* Title Bar */}
      <div
        className="window-titlebar"
        onPointerDown={handleTitlePointerDown}
        onDoubleClick={() => win.allowMaximize !== false && onMaximizeToggle(win.id)}
      >
        <div className="window-title-left">
          <button
            type="button"
            className="window-control-btn window-app-icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((prev) => !prev);
            }}
            aria-label="Window menu"
            style={{ width: '24px', height: '24px' }}
          >
            <div className="window-app-icon">
              <IconComponent size={14} color="var(--accent-red)" />
            </div>
          </button>
          <span id={`window-title-${win.id}`} className="window-title-text">
            {win.title}
          </span>
        </div>

        <WindowControls
          mode={win.mode}
          allowMaximize={win.allowMaximize !== false}
          onMinimize={() => onMinimize(win.id)}
          onMaximizeToggle={() => onMaximizeToggle(win.id)}
          onClose={() => onClose(win.id)}
        />
      </div>

      {/* Optional Window Context Menu */}
      {showMenu && (
        <WindowMenu
          mode={win.mode}
          allowMaximize={win.allowMaximize !== false}
          onRestore={() => onMaximizeToggle(win.id)}
          onMinimize={() => onMinimize(win.id)}
          onMaximize={() => onMaximizeToggle(win.id)}
          onClose={() => onClose(win.id)}
          onDismiss={() => setShowMenu(false)}
        />
      )}

      {/* Content Area */}
      <div className="window-content">{children}</div>

      {/* Resize Handles (Only rendered if normal mode and resize allowed) */}
      {win.mode === 'normal' && win.allowResize !== false && (
        <>
          <div className="resize-handle resize-handle-n" onPointerDown={(e) => handleResizePointerDown('n', e)} />
          <div className="resize-handle resize-handle-s" onPointerDown={(e) => handleResizePointerDown('s', e)} />
          <div className="resize-handle resize-handle-w" onPointerDown={(e) => handleResizePointerDown('w', e)} />
          <div className="resize-handle resize-handle-e" onPointerDown={(e) => handleResizePointerDown('e', e)} />
          <div className="resize-handle resize-handle-nw" onPointerDown={(e) => handleResizePointerDown('nw', e)} />
          <div className="resize-handle resize-handle-ne" onPointerDown={(e) => handleResizePointerDown('ne', e)} />
          <div className="resize-handle resize-handle-sw" onPointerDown={(e) => handleResizePointerDown('sw', e)} />
          <div className="resize-handle resize-handle-se" onPointerDown={(e) => handleResizePointerDown('se', e)} />
        </>
      )}
    </div>
  );
};

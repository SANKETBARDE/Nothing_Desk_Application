import type { WindowBounds } from './types';

export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  initialBounds: WindowBounds;
}

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export interface ResizeState {
  isResizing: boolean;
  direction: ResizeDirection;
  startX: number;
  startY: number;
  initialBounds: WindowBounds;
}

/**
 * Calculates new bounds for window dragging, clamped to visible workspace.
 */
export function calculateDragBounds(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  initialBounds: WindowBounds,
  workArea: { width: number; height: number }
): WindowBounds {
  const deltaX = currentX - startX;
  const deltaY = currentY - startY;

  let newX = initialBounds.x + deltaX;
  let newY = initialBounds.y + deltaY;

  const minVisibleWidth = 80;
  newX = Math.max(-initialBounds.width + minVisibleWidth, Math.min(newX, workArea.width - minVisibleWidth));
  newY = Math.max(0, Math.min(newY, workArea.height - 40));

  return {
    ...initialBounds,
    x: Math.round(newX),
    y: Math.round(newY),
  };
}

/**
 * Calculates new bounds for window resize in 8 directions, respecting minimums and workspace.
 */
export function calculateResizeBounds(
  direction: ResizeDirection,
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  initialBounds: WindowBounds,
  minWidth: number,
  minHeight: number,
  workArea: { width: number; height: number }
): WindowBounds {
  const deltaX = currentX - startX;
  const deltaY = currentY - startY;

  let { x, y, width, height } = initialBounds;

  // North / South
  if (direction.includes('n')) {
    const desiredHeight = initialBounds.height - deltaY;
    if (desiredHeight >= minHeight) {
      const desiredY = initialBounds.y + deltaY;
      if (desiredY >= 0) {
        y = desiredY;
        height = desiredHeight;
      }
    } else {
      y = initialBounds.y + (initialBounds.height - minHeight);
      height = minHeight;
    }
  } else if (direction.includes('s')) {
    const desiredHeight = initialBounds.height + deltaY;
    const maxHeight = workArea.height - initialBounds.y;
    height = Math.max(minHeight, Math.min(desiredHeight, maxHeight));
  }

  // West / East
  if (direction.includes('w')) {
    const desiredWidth = initialBounds.width - deltaX;
    if (desiredWidth >= minWidth) {
      x = initialBounds.x + deltaX;
      width = desiredWidth;
    } else {
      x = initialBounds.x + (initialBounds.width - minWidth);
      width = minWidth;
    }
  } else if (direction.includes('e')) {
    const desiredWidth = initialBounds.width + deltaX;
    const maxWidth = workArea.width - initialBounds.x;
    width = Math.max(minWidth, Math.min(desiredWidth, maxWidth));
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  };
}

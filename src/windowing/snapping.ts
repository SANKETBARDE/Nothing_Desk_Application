import type { WindowBounds } from './types';

export type SnapZone = 'none' | 'left' | 'right' | 'top';

export interface SnapTarget {
  zone: SnapZone;
  previewBounds: WindowBounds | null;
}

const SNAP_THRESHOLD_PX = 20;

/**
 * Detects whether the cursor / dragged window is touching an active screen snap zone.
 */
export function detectSnapZone(
  clientX: number,
  clientY: number,
  workArea: { width: number; height: number }
): SnapTarget {
  // If screen is too narrow (e.g. mobile portrait < 500px), disable half-split snap zones
  if (workArea.width < 500) {
    if (clientY <= SNAP_THRESHOLD_PX) {
      return {
        zone: 'top',
        previewBounds: {
          x: 0,
          y: 0,
          width: workArea.width,
          height: workArea.height,
        },
      };
    }
    return { zone: 'none', previewBounds: null };
  }

  // Top Edge: Maximize Snap Zone
  if (clientY <= SNAP_THRESHOLD_PX) {
    return {
      zone: 'top',
      previewBounds: {
        x: 0,
        y: 0,
        width: workArea.width,
        height: workArea.height,
      },
    };
  }

  // Left Edge: Left 50% Split
  if (clientX <= SNAP_THRESHOLD_PX) {
    return {
      zone: 'left',
      previewBounds: {
        x: 0,
        y: 0,
        width: Math.round(workArea.width / 2),
        height: workArea.height,
      },
    };
  }

  // Right Edge: Right 50% Split
  if (clientX >= workArea.width - SNAP_THRESHOLD_PX) {
    const halfWidth = Math.round(workArea.width / 2);
    return {
      zone: 'right',
      previewBounds: {
        x: workArea.width - halfWidth,
        y: 0,
        width: halfWidth,
        height: workArea.height,
      },
    };
  }

  return { zone: 'none', previewBounds: null };
}

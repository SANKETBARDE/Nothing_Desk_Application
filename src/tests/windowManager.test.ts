import { describe, it, expect } from 'vitest';
import { calculateDragBounds, calculateResizeBounds } from '../windowing/pointer';
import { detectSnapZone } from '../windowing/snapping';

describe('Window Manager Pointer & Invariants', () => {
  const workArea = { width: 1280, height: 720 };

  it('clamps window titlebar to remain visible within work area during dragging', () => {
    const initialBounds = { x: 100, y: 100, width: 500, height: 400 };

    // Drag far off to the top
    const draggedTop = calculateDragBounds(100, 100, 100, -200, initialBounds, workArea);
    expect(draggedTop.y).toBeGreaterThanOrEqual(0);

    // Drag far off to the bottom
    const draggedBottom = calculateDragBounds(100, 100, 100, 900, initialBounds, workArea);
    expect(draggedBottom.y).toBeLessThanOrEqual(workArea.height - 40);

    // Drag far off to the left (at least 80px must remain visible)
    const draggedLeft = calculateDragBounds(100, 100, -600, 100, initialBounds, workArea);
    expect(draggedLeft.x).toBeGreaterThanOrEqual(-initialBounds.width + 80);

    // Drag far off to the right
    const draggedRight = calculateDragBounds(100, 100, 1500, 100, initialBounds, workArea);
    expect(draggedRight.x).toBeLessThanOrEqual(workArea.width - 80);
  });

  it('respects minimum dimensions during 8-direction resizing', () => {
    const initialBounds = { x: 200, y: 200, width: 400, height: 300 };
    const minWidth = 320;
    const minHeight = 220;

    // Shrink horizontally past minWidth from east handle
    const resizedE = calculateResizeBounds('e', 600, 200, 100, 200, initialBounds, minWidth, minHeight, workArea);
    expect(resizedE.width).toBeGreaterThanOrEqual(minWidth);

    // Shrink vertically past minHeight from south handle
    const resizedS = calculateResizeBounds('s', 200, 500, 200, 100, initialBounds, minWidth, minHeight, workArea);
    expect(resizedS.height).toBeGreaterThanOrEqual(minHeight);

    // Resize from north-west corner
    const resizedNW = calculateResizeBounds('nw', 200, 200, 450, 450, initialBounds, minWidth, minHeight, workArea);
    expect(resizedNW.width).toBeGreaterThanOrEqual(minWidth);
    expect(resizedNW.height).toBeGreaterThanOrEqual(minHeight);
  });
});

describe('Snap Zone Tiling Engine', () => {
  const workArea = { width: 1280, height: 720 };

  it('detects top snap zone for maximization preview', () => {
    const target = detectSnapZone(400, 10, workArea);
    expect(target.zone).toBe('top');
    expect(target.previewBounds).toEqual({
      x: 0,
      y: 0,
      width: 1280,
      height: 720,
    });
  });

  it('detects left snap zone for 50% split preview', () => {
    const target = detectSnapZone(10, 300, workArea);
    expect(target.zone).toBe('left');
    expect(target.previewBounds).toEqual({
      x: 0,
      y: 0,
      width: 640,
      height: 720,
    });
  });

  it('detects right snap zone for 50% split preview', () => {
    const target = detectSnapZone(1275, 300, workArea);
    expect(target.zone).toBe('right');
    expect(target.previewBounds).toEqual({
      x: 640,
      y: 0,
      width: 640,
      height: 720,
    });
  });

  it('suppresses side splits on narrow smartphone screens (< 500px)', () => {
    const narrowArea = { width: 380, height: 800 };

    // Left edge on narrow screen should return none
    const leftTarget = detectSnapZone(10, 300, narrowArea);
    expect(leftTarget.zone).toBe('none');

    // Top edge on narrow screen is still supported (full maximize)
    const topTarget = detectSnapZone(190, 10, narrowArea);
    expect(topTarget.zone).toBe('top');
  });
});

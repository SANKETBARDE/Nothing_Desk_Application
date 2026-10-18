import { useState, useCallback, useEffect } from 'react';
import type { WindowInstance, WindowBounds, WindowMode } from './types';

export interface UseWindowManagerReturn {
  windows: WindowInstance[];
  activeWindowId: string | null;
  openApp: (
    appId: string,
    title: string,
    iconName: string,
    options?: {
      width?: number;
      height?: number;
      minWidth?: number;
      minHeight?: number;
      packageName?: string;
    }
  ) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximizeWindow: (id: string) => void;
  updateWindowBounds: (id: string, bounds: WindowBounds) => void;
  minimizeAll: () => void;
  cycleWindows: () => void;
  closeActiveWindow: () => void;
}

const DEFAULT_WORK_AREA = { width: 1024, height: 768 };

export function useWindowManager(workArea: { width: number; height: number } = DEFAULT_WORK_AREA): UseWindowManagerReturn {
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [nextZIndex, setNextZIndex] = useState<number>(10);
  const [allMinimizedPreviously, setAllMinimizedPreviously] = useState<boolean>(false);

  // Focus Window
  const focusWindow = useCallback((id: string) => {
    setNextZIndex((prevZ) => {
      const newZ = prevZ + 1;
      setWindows((prev) =>
        prev.map((win) => {
          if (win.id === id) {
            return {
              ...win,
              zIndex: newZ,
              isFocused: true,
              mode: win.mode === 'minimized' ? 'normal' : win.mode,
            };
          }
          return win.isFocused ? { ...win, isFocused: false } : win;
        })
      );
      return newZ;
    });
  }, []);

  // Open App or focus if already open
  const openApp = useCallback(
    (
      appId: string,
      title: string,
      iconName: string,
      options?: {
        width?: number;
        height?: number;
        minWidth?: number;
        minHeight?: number;
        packageName?: string;
      }
    ) => {
      // Check if existing instance is open
      const existing = windows.find((w) => w.appId === appId);
      if (existing) {
        focusWindow(existing.id);
        return existing.id;
      }

      const id = `${appId}-${Date.now()}`;
      const minW = options?.minWidth || 340;
      const minH = options?.minHeight || 260;

      // Smart responsive initial sizing
      const targetW = Math.min(workArea.width * 0.85, options?.width || 560);
      const targetH = Math.min(workArea.height * 0.8, options?.height || 420);

      // Stagger cascade offset
      const cascadeOffset = (windows.length % 6) * 28;
      const initialX = Math.max(16, Math.min(workArea.width - targetW - 16, 40 + cascadeOffset));
      const initialY = Math.max(16, Math.min(workArea.height - targetH - 16, 30 + cascadeOffset));

      const newWindow: WindowInstance = {
        id,
        appId,
        title,
        iconName,
        packageName: options?.packageName,
        mode: 'normal',
        bounds: {
          x: Math.round(initialX),
          y: Math.round(initialY),
          width: Math.round(targetW),
          height: Math.round(targetH),
        },
        prevBounds: {
          x: Math.round(initialX),
          y: Math.round(initialY),
          width: Math.round(targetW),
          height: Math.round(targetH),
        },
        zIndex: nextZIndex + 1,
        isFocused: true,
        minWidth: minW,
        minHeight: minH,
        allowResize: true,
        allowMaximize: true,
      };

      setNextZIndex((z) => z + 1);
      setWindows((prev) => [
        ...prev.map((w) => (w.isFocused ? { ...w, isFocused: false } : w)),
        newWindow,
      ]);

      return id;
    },
    [windows, workArea, nextZIndex, focusWindow]
  );

  // Close Window
  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const remaining = prev.filter((w) => w.id !== id);
      if (remaining.length > 0) {
        const highest = remaining.reduce((max, w) => (w.zIndex > max.zIndex ? w : max), remaining[0]);
        return remaining.map((w) => (w.id === highest.id ? { ...w, isFocused: true } : { ...w, isFocused: false }));
      }
      return remaining;
    });
  }, []);

  // Minimize Window
  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const updated = prev.map((w) => (w.id === id ? { ...w, mode: 'minimized' as WindowMode, isFocused: false } : w));
      const visible = updated.filter((w) => w.mode !== 'minimized');
      if (visible.length > 0) {
        const top = visible.reduce((max, w) => (w.zIndex > max.zIndex ? w : max), visible[0]);
        return updated.map((w) => (w.id === top.id ? { ...w, isFocused: true } : w));
      }
      return updated;
    });
  }, []);

  // Toggle Maximize / Restore
  const toggleMaximizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        if (w.mode === 'maximized') {
          return {
            ...w,
            mode: 'normal',
            bounds: { ...w.prevBounds },
            isFocused: true,
          };
        } else {
          return {
            ...w,
            mode: 'maximized',
            prevBounds: { ...w.bounds },
            isFocused: true,
          };
        }
      })
    );
  }, []);

  // Update bounds during drag or resize
  const updateWindowBounds = useCallback((id: string, bounds: WindowBounds) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, bounds: { ...bounds }, prevBounds: { ...bounds } } : w))
    );
  }, []);

  // Minimize All / Show Desktop (Meta + D)
  const minimizeAll = useCallback(() => {
    setWindows((prev) => {
      const anyVisible = prev.some((w) => w.mode !== 'minimized');
      if (anyVisible) {
        setAllMinimizedPreviously(true);
        return prev.map((w) => ({ ...w, mode: 'minimized' as WindowMode, isFocused: false }));
      } else if (allMinimizedPreviously) {
        setAllMinimizedPreviously(false);
        return prev.map((w) => ({ ...w, mode: 'normal' as WindowMode }));
      }
      return prev;
    });
  }, [allMinimizedPreviously]);

  // Alt + Tab Window Cycling
  const cycleWindows = useCallback(() => {
    setWindows((prev) => {
      const nonMinimized = prev.filter((w) => w.mode !== 'minimized');
      if (nonMinimized.length <= 1) return prev;

      const sorted = [...nonMinimized].sort((a, b) => a.zIndex - b.zIndex);
      const nextWindow = sorted[0];
      const maxZ = Math.max(...prev.map((w) => w.zIndex), 10) + 1;

      return prev.map((w) => {
        if (w.id === nextWindow.id) {
          return { ...w, zIndex: maxZ, isFocused: true };
        }
        return { ...w, isFocused: false };
      });
    });
  }, []);

  // Close currently active window (Alt + F4)
  const closeActiveWindow = useCallback(() => {
    const focused = windows.find((w) => w.isFocused);
    if (focused) {
      closeWindow(focused.id);
    }
  }, [windows, closeWindow]);

  // Screen Rotation & Resize Bounds Clamping
  useEffect(() => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.mode === 'maximized') return w;
        let { x, y, width, height } = w.bounds;
        width = Math.min(width, workArea.width);
        height = Math.min(height, workArea.height);

        x = Math.max(0, Math.min(x, workArea.width - 80));
        y = Math.max(0, Math.min(y, workArea.height - 40));

        return {
          ...w,
          bounds: { x, y, width, height },
        };
      })
    );
  }, [workArea.width, workArea.height]);

  const activeWindowId = windows.find((w) => w.isFocused && w.mode !== 'minimized')?.id || null;

  return {
    windows,
    activeWindowId,
    openApp,
    closeWindow,
    focusWindow,
    minimizeWindow,
    toggleMaximizeWindow,
    updateWindowBounds,
    minimizeAll,
    cycleWindows,
    closeActiveWindow,
  };
}

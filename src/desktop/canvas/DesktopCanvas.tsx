import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Wallpaper } from './Wallpaper';
import { IconGrid } from '../icons/IconGrid';
import type { DesktopShortcut } from '../icons/IconItem';
import { Taskbar } from '../taskbar/Taskbar';
import type { PinnedApp } from '../taskbar/Taskbar';
import { StartMenu } from '../start-menu/StartMenu';
import { QuickPanel } from '../taskbar/QuickPanel';
import { ContextMenu } from '../context-menu/ContextMenu';
import type { ContextMenuItem } from '../context-menu/ContextMenu';
import { WindowFrame } from '../../windowing/WindowFrame';
import { SnapPreview } from '../../windowing/controls/SnapPreview';
import type { WindowBounds } from '../../windowing/types';
import type { SnapZone } from '../../windowing/snapping';
import { DisplayStatus } from './DisplayStatus';
import { useWindowManager } from '../../windowing/manager';
import { resolveAppDefinition } from '../../apps/registry';
import type { DesktopPreferences } from '../../persistence/schema';
import { StorageService } from '../../persistence/storage';
import { useInputMode } from '../../platform/inputMode';
import { useKeyboardShortcuts } from '../../shortcuts/dispatcher';
import {
  Sliders,
  Keyboard,
  Maximize2,
  Trash2,
  Edit3,
  BookmarkPlus,
  RefreshCw,
  AppWindow,
} from 'lucide-react';

export const DesktopCanvas: React.FC = () => {
  const [preferences, setPreferences] = useState<DesktopPreferences>(() =>
    StorageService.loadPreferences()
  );

  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  const { isPointer, mode } = useInputMode();
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isQuickPanelOpen, setIsQuickPanelOpen] = useState(false);
  const [snapPreviewBounds, setSnapPreviewBounds] = useState<WindowBounds | null>(null);
  const [isTaskbarHovered, setIsTaskbarHovered] = useState(false);
  const [isTaskbarTouchRevealed, setIsTaskbarTouchRevealed] = useState(false);
  const touchHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const revealTaskbarOnTouch = useCallback(() => {
    setIsTaskbarTouchRevealed(true);
    if (touchHideTimerRef.current) {
      clearTimeout(touchHideTimerRef.current);
    }
    touchHideTimerRef.current = setTimeout(() => {
      setIsTaskbarTouchRevealed(false);
    }, 5000);
  }, []);

  const hideTaskbarOnTouch = useCallback(() => {
    if (touchHideTimerRef.current) {
      clearTimeout(touchHideTimerRef.current);
    }
    setIsTaskbarTouchRevealed(false);
  }, []);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  // Taskbar behavior: slides when hovered or touched, otherwise remains invisible (permanent default)
  const isTaskbarHidden = !isTaskbarHovered && !isTaskbarTouchRevealed && !isStartOpen && !isQuickPanelOpen;

  const workArea = useMemo(
    () => ({
      width: viewport.width,
      height: viewport.height,
    }),
    [viewport.width, viewport.height]
  );

  const {
    windows,
    openApp,
    closeWindow,
    focusWindow,
    minimizeWindow,
    toggleMaximizeWindow,
    updateWindowBounds,
    minimizeAll,
    cycleWindows,
    closeActiveWindow,
  } = useWindowManager(workArea);

  // Update theme attribute on root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', preferences.theme);
  }, [preferences.theme]);

  // Window resize listener
  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Built-in Apps master catalog
  const builtInCatalog: Record<string, { title: string; iconName: string }> = {
    settings: { title: 'Settings', iconName: 'Sliders' },
    browser: { title: 'Chrome', iconName: 'Globe' },
    chrome: { title: 'Chrome', iconName: 'Globe' },
    camera: { title: 'Camera', iconName: 'Camera' },
    photos: { title: 'Photos', iconName: 'Image' },
    phone: { title: 'Phone', iconName: 'Phone' },
    messages: { title: 'Messages', iconName: 'MessageSquare' },
    calculator: { title: 'Calculator', iconName: 'Calculator' },
    notes: { title: 'Notes', iconName: 'FileText' },
    files: { title: 'File Manager', iconName: 'FolderOpen' },
    help: { title: 'Help & Shortcuts', iconName: 'Keyboard' },
    about: { title: 'About Nothing Desk', iconName: 'Info' },
  };

  // Launch App Handler - In Samsung DeX Mode, EVERY app opens as a desktop window!
  const handleLaunchApp = useCallback(
    (appId: string, title?: string, iconName?: string, packageName?: string) => {
      setIsStartOpen(false);
      setIsQuickPanelOpen(false);

      const appDef = resolveAppDefinition(appId, title, packageName, (newPrefs) => {
        setPreferences(newPrefs);
      });

      const finalIcon = iconName || appDef.iconName;

      return openApp(
        appId,
        appDef.title,
        finalIcon,
        {
          width: appDef.defaultWidth,
          height: appDef.defaultHeight,
          minWidth: appDef.minWidth,
          minHeight: appDef.minHeight,
          packageName,
        }
      );
    },
    [openApp, setPreferences]
  );

  // Snap zone drop handling
  const handleSnapApply = useCallback(
    (id: string, zone: SnapZone, bounds: WindowBounds | null) => {
      if (zone === 'top') {
        const win = windows.find((w) => w.id === id);
        if (win && win.mode !== 'maximized') {
          toggleMaximizeWindow(id);
        }
      } else if (bounds) {
        updateWindowBounds(id, bounds);
      }
    },
    [windows, toggleMaximizeWindow, updateWindowBounds]
  );

  // Shortcuts list derived from preferences
  const [desktopShortcuts, setDesktopShortcuts] = useState<DesktopShortcut[]>(() => {
    const defaults: DesktopShortcut[] = [
      { id: 'sc-phone', appId: 'phone', label: 'Phone', iconName: 'Phone' },
      { id: 'sc-photos', appId: 'photos', label: 'Photos', iconName: 'Image' },
      { id: 'sc-files', appId: 'files', label: 'Files', iconName: 'FolderOpen' },
      { id: 'sc-browser', appId: 'browser', label: 'Chrome', iconName: 'Globe' },
      { id: 'sc-camera', appId: 'camera', label: 'Camera', iconName: 'Camera' },
      { id: 'sc-messages', appId: 'messages', label: 'Messages', iconName: 'MessageSquare' },
      { id: 'sc-calculator', appId: 'calculator', label: 'Calculator', iconName: 'Calculator' },
      { id: 'sc-notes', appId: 'notes', label: 'Notes', iconName: 'FileText' },
      { id: 'sc-settings', appId: 'settings', label: 'Settings', iconName: 'Sliders' },
    ];
    return defaults;
  });

  // Pinned Taskbar Apps
  const pinnedApps: PinnedApp[] = useMemo(() => {
    return preferences.pinnedAppIds.map((id) => {
      const meta = builtInCatalog[id] || { title: id, iconName: 'AppWindow' };
      return {
        id: `pin-${id}`,
        appId: id,
        title: meta.title,
        iconName: meta.iconName,
      };
    });
  }, [preferences.pinnedAppIds]);

  // Rename Shortcut Handler
  const handleRenameShortcut = useCallback((id: string, newLabel: string) => {
    setDesktopShortcuts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, label: newLabel } : s))
    );
  }, []);

  // Remove Shortcut Handler
  const handleRemoveShortcut = useCallback((id: string) => {
    setDesktopShortcuts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Pin/Unpin from Taskbar
  const handleTogglePin = useCallback(
    (appId: string) => {
      const isPinned = preferences.pinnedAppIds.includes(appId);
      const updatedPinned = isPinned
        ? preferences.pinnedAppIds.filter((id) => id !== appId)
        : [...preferences.pinnedAppIds, appId];

      const newPrefs: DesktopPreferences = {
        ...preferences,
        pinnedAppIds: updatedPinned,
      };
      setPreferences(newPrefs);
      StorageService.savePreferences(newPrefs);
    },
    [preferences]
  );

  // Desktop Canvas Right-Click Handler
  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: 'Show Desktop',
          icon: <Maximize2 size={13} />,
          action: minimizeAll,
        },
        {
          label: 'Open Settings',
          icon: <Sliders size={13} />,
          action: () => handleLaunchApp('settings', 'Settings', 'Sliders'),
        },
        {
          label: 'Help & Shortcuts',
          icon: <Keyboard size={13} />,
          action: () => handleLaunchApp('help', 'Help & Shortcuts', 'Keyboard'),
        },
        { separator: true, label: '', action: () => {} },
        {
          label: 'Refresh Desktop',
          icon: <RefreshCw size={13} />,
          action: () => {
            setPreferences(StorageService.loadPreferences());
          },
        },
      ],
    });
  };

  // Icon Right-Click / Long-Press Handler
  const handleIconContextMenu = (
    e: React.MouseEvent | React.TouchEvent,
    shortcut: DesktopShortcut
  ) => {
    let clientX = 0;
    let clientY = 0;
    if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    const isPinned = preferences.pinnedAppIds.includes(shortcut.appId);

    setContextMenu({
      x: clientX,
      y: clientY,
      items: [
        {
          label: 'Open',
          icon: <AppWindow size={13} />,
          action: () => handleLaunchApp(shortcut.appId, shortcut.label, shortcut.iconName),
        },
        {
          label: isPinned ? 'Unpin from Taskbar' : 'Pin to Taskbar',
          icon: <BookmarkPlus size={13} />,
          action: () => handleTogglePin(shortcut.appId),
        },
        {
          label: 'Rename Shortcut',
          icon: <Edit3 size={13} />,
          action: () => {
            const promptVal = window.prompt('Rename shortcut:', shortcut.label);
            if (promptVal && promptVal.trim()) {
              handleRenameShortcut(shortcut.id, promptVal.trim());
            }
          },
        },
        { separator: true, label: '', action: () => {} },
        {
          label: 'Remove from Desktop',
          icon: <Trash2 size={13} />,
          danger: true,
          action: () => handleRemoveShortcut(shortcut.id),
        },
      ],
    });
  };

  // Global Keyboard Shortcuts
  useKeyboardShortcuts({
    onToggleStart: () => {
      setIsStartOpen((prev) => !prev);
      setIsQuickPanelOpen(false);
    },
    onMinimizeAll: minimizeAll,
    onCycleWindows: cycleWindows,
    onCloseActiveWindow: closeActiveWindow,
    onOpenSettings: () => handleLaunchApp('settings', 'Settings', 'Sliders'),
    onOpenFileAccess: () => handleLaunchApp('files', 'File Access', 'FolderOpen'),
    onOpenHelp: () => handleLaunchApp('help', 'Help & Shortcuts', 'Keyboard'),
    onEscape: () => {
      setIsStartOpen(false);
      setIsQuickPanelOpen(false);
      setContextMenu(null);
    },
  });

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--bg-pure-black)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          hideTaskbarOnTouch();
          setIsStartOpen(false);
          setIsQuickPanelOpen(false);
        }
      }}
      onContextMenu={handleCanvasContextMenu}
    >
      {/* Wallpaper Layer */}
      <Wallpaper wallpaperId={preferences.wallpaperId} customUrl={preferences.customWallpaperUrl} />

      {/* Hardware Operating Mode / Display Status Pill */}
      <DisplayStatus mode={mode} />

      {/* Snap Zone Ghost Preview Overlay */}
      <SnapPreview bounds={snapPreviewBounds} />

      {/* Desktop Icon Grid */}
      <IconGrid
        shortcuts={desktopShortcuts}
        scale={preferences.iconScale}
        isPointer={isPointer}
        onOpenShortcut={(sc) => handleLaunchApp(sc.appId, sc.label, sc.iconName)}
        onContextMenu={handleIconContextMenu}
        onRenameShortcut={handleRenameShortcut}
        onOpenStartMenu={() => {
          setIsStartOpen(true);
          setIsQuickPanelOpen(false);
        }}
      />

      {/* Floating Window Frames */}
      {windows.map((win) => {
        const appDef = resolveAppDefinition(win.appId, win.title, win.packageName, (newPrefs) =>
          setPreferences(newPrefs)
        );
        const content = appDef.component({ windowId: win.id });

        return (
          <WindowFrame
            key={win.id}
            window={win}
            workArea={workArea}
            onFocus={focusWindow}
            onUpdateBounds={updateWindowBounds}
            onMinimize={minimizeWindow}
            onMaximizeToggle={toggleMaximizeWindow}
            onClose={closeWindow}
            onSnapPreview={setSnapPreviewBounds}
            onSnapApply={handleSnapApply}
          >
            {content}
          </WindowFrame>
        );
      })}

      {/* Context Menu Overlay */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Start Menu Drawer / Popup */}
      <StartMenu
        isOpen={isStartOpen}
        onClose={() => setIsStartOpen(false)}
        onLaunchApp={handleLaunchApp}
      />

      {/* Nothing OS Quick Settings & Control Center */}
      <QuickPanel
        isOpen={isQuickPanelOpen}
        onClose={() => setIsQuickPanelOpen(false)}
        onOpenSettings={() => handleLaunchApp('settings', 'Settings', 'Sliders')}
      />

      {/* Touch & Hover Bottom Edge Trigger Zone (slides taskbar up) */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '24px',
          zIndex: 8990,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: '4px',
          pointerEvents: isTaskbarHidden ? 'auto' : 'none',
        }}
        onMouseEnter={() => setIsTaskbarHovered(true)}
        onTouchStart={(e) => {
          touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchMove={(e) => {
          if (touchStartPosRef.current) {
            const dy = touchStartPosRef.current.y - e.touches[0].clientY;
            if (dy > 8) {
              revealTaskbarOnTouch();
            }
          }
        }}
        onTouchEnd={() => {
          touchStartPosRef.current = null;
        }}
        onClick={revealTaskbarOnTouch}
      >
        {/* Subtle Minimal Nothing OS Gesture Indicator Pill */}
        {isTaskbarHidden && (
          <div
            style={{
              width: '46px',
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(255, 255, 255, 0.35)',
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.7)',
              transition: 'all var(--transition-instant)',
            }}
          />
        )}
      </div>

      {/* Desktop Taskbar (with auto-hide transform) */}
      <div
        onMouseEnter={() => setIsTaskbarHovered(true)}
        onMouseLeave={() => setIsTaskbarHovered(false)}
        onTouchStart={(e) => {
          if (touchHideTimerRef.current) {
            clearTimeout(touchHideTimerRef.current);
          }
          touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchMove={(e) => {
          if (touchStartPosRef.current) {
            const dy = e.touches[0].clientY - touchStartPosRef.current.y;
            if (dy > 18) {
              hideTaskbarOnTouch();
            }
          }
        }}
        onTouchEnd={() => {
          touchStartPosRef.current = null;
          if (touchHideTimerRef.current) {
            clearTimeout(touchHideTimerRef.current);
          }
          touchHideTimerRef.current = setTimeout(() => {
            setIsTaskbarTouchRevealed(false);
          }, 5000);
        }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9000,
          transform: isTaskbarHidden ? 'translateY(100%)' : 'translateY(0)',
          transition: 'transform var(--transition-smooth)',
        }}
      >
        <Taskbar
          pinnedApps={pinnedApps}
          windows={windows}
          isStartOpen={isStartOpen}
          isPointer={isPointer}
          onToggleStart={() => {
            setIsStartOpen((prev) => !prev);
            setIsQuickPanelOpen(false);
          }}
          onToggleQuickPanel={() => {
            setIsQuickPanelOpen((prev) => !prev);
            setIsStartOpen(false);
          }}
          onAppClick={(appId, title, iconName) => {
            hideTaskbarOnTouch();
            handleLaunchApp(appId, title, iconName);
          }}
          onWindowClick={(win) => {
            if (win.isFocused && win.mode !== 'minimized') {
              minimizeWindow(win.id);
            } else {
              focusWindow(win.id);
            }
          }}
          onShowDesktop={minimizeAll}
        />
      </div>
    </div>
  );
};

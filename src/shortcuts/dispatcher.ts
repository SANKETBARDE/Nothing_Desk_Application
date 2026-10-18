import { useEffect } from 'react';

export interface ShortcutHandlers {
  onToggleStart: () => void;
  onMinimizeAll: () => void;
  onCycleWindows: () => void;
  onCloseActiveWindow: () => void;
  onOpenSettings: () => void;
  onOpenFileAccess: () => void;
  onOpenHelp: () => void;
  onEscape: () => void;
}

/**
 * Universal keyboard shortcut listener matching Windows-inspired Nothing Desk mappings.
 * Automatically respects focused form inputs so text entry is never stolen.
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // Escape is always permitted to dismiss dialogs even while typing
      if (e.key === 'Escape') {
        handlers.onEscape();
        return;
      }

      // If user is actively typing in a field, don't steal standard keys (like Ctrl+A, Space, etc.)
      if (isTyping && !e.ctrlKey && !e.metaKey && !e.altKey) {
        return;
      }

      // Meta key alone (Windows key) or Ctrl + Space -> Start Menu
      if (e.key === 'Meta' || (e.ctrlKey && e.code === 'Space')) {
        e.preventDefault();
        handlers.onToggleStart();
        return;
      }

      // Meta + D -> Show Desktop / Minimize All
      if ((e.metaKey || (e.ctrlKey && e.altKey)) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        handlers.onMinimizeAll();
        return;
      }

      // Alt + Tab -> Cycle built-in windows
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        handlers.onCycleWindows();
        return;
      }

      // Alt + F4 or Ctrl + W -> Close active window
      if ((e.altKey && e.key === 'F4') || ((e.ctrlKey || e.metaKey) && (e.key === 'w' || e.key === 'W'))) {
        e.preventDefault();
        handlers.onCloseActiveWindow();
        return;
      }

      // Meta + I -> Settings
      if (e.metaKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        handlers.onOpenSettings();
        return;
      }

      // Meta + E -> File Access
      if (e.metaKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        handlers.onOpenFileAccess();
        return;
      }

      // F1 -> Help
      if (e.key === 'F1') {
        e.preventDefault();
        handlers.onOpenHelp();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers]);
}

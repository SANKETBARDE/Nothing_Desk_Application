import { migratePreferences } from './migrations';
import { DEFAULT_PREFERENCES } from './schema';
import type { DesktopPreferences, StoredWindowState } from './schema';

const PREFS_STORAGE_KEY = 'nothing_desk_preferences_v1';
const WINDOWS_STORAGE_KEY = 'nothing_desk_open_windows_v1';

/**
 * Persistence service handling atomic read/write to localStorage with corruption safeguards.
 */
export const StorageService = {
  loadPreferences(): DesktopPreferences {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      if (!raw) return { ...DEFAULT_PREFERENCES };
      const parsed = JSON.parse(raw);
      return migratePreferences(parsed);
    } catch (e) {
      console.warn('[NothingDesk Persistence] Failed to parse preferences from localStorage; resetting safely.', e);
      return { ...DEFAULT_PREFERENCES };
    }
  },

  savePreferences(prefs: DesktopPreferences): void {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.error('[NothingDesk Persistence] Unable to write preferences to storage:', e);
    }
  },

  loadStoredWindows(): StoredWindowState[] {
    try {
      const raw = localStorage.getItem(WINDOWS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((w) => w && typeof w.id === 'string' && typeof w.appId === 'string' && w.bounds);
    } catch (e) {
      console.warn('[NothingDesk Persistence] Corrupt window layout state detected; resetting windows.', e);
      return [];
    }
  },

  saveStoredWindows(windows: StoredWindowState[]): void {
    try {
      localStorage.setItem(WINDOWS_STORAGE_KEY, JSON.stringify(windows));
    } catch (e) {
      console.error('[NothingDesk Persistence] Unable to write window layouts to storage:', e);
    }
  },

  resetAll(): void {
    try {
      localStorage.removeItem(PREFS_STORAGE_KEY);
      localStorage.removeItem(WINDOWS_STORAGE_KEY);
    } catch (e) {
      console.error('[NothingDesk Persistence] Reset failed:', e);
    }
  },
};

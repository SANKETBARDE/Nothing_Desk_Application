import { CURRENT_SCHEMA_VERSION, DEFAULT_PREFERENCES } from './schema';
import type { DesktopPreferences } from './schema';

const VALID_BUILTIN_APPS = new Set(['phone', 'photos', 'files', 'browser', 'camera', 'messages', 'calculator', 'notes', 'settings']);
const NORMALIZE_MAP: Record<string, string> = {
  'com.google.android.dialer': 'phone',
  'com.android.phone': 'phone',
  'com.nothing.phone': 'phone',
  'com.google.android.apps.photos': 'photos',
  'com.nothing.gallery': 'photos',
  'org.chromium.chrome': 'browser',
  'com.android.chrome': 'browser',
  'chrome': 'browser',
  'tech.nothing.camera': 'camera',
  'com.android.camera': 'camera',
  'com.google.android.apps.messaging': 'messages',
  'com.android.calculator2': 'calculator',
  'com.android.documentsui': 'files',
  'com.android.settings': 'settings',
};

function sanitizeAppIds(ids: unknown, defaults: string[]): string[] {
  if (!Array.isArray(ids)) return [...defaults];
  const normalized = ids
    .filter((id): id is string => typeof id === 'string')
    .map((id) => NORMALIZE_MAP[id] || id)
    .filter((id) => VALID_BUILTIN_APPS.has(id));
  const deduped = Array.from(new Set(normalized));
  return deduped.length > 0 ? deduped : [...defaults];
}

/**
 * Validates and migrates stored preference objects from earlier schema versions or corrupt state.
 */
export function migratePreferences(raw: unknown): DesktopPreferences {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PREFERENCES };
  }

  const data = raw as Partial<DesktopPreferences>;
  const migrated: DesktopPreferences = {
    version: CURRENT_SCHEMA_VERSION,
    theme: data.theme === 'light' || data.theme === 'dark' ? data.theme : DEFAULT_PREFERENCES.theme,
    wallpaperId: typeof data.wallpaperId === 'string' ? data.wallpaperId : DEFAULT_PREFERENCES.wallpaperId,
    customWallpaperUrl: typeof data.customWallpaperUrl === 'string' ? data.customWallpaperUrl : undefined,
    iconScale: data.iconScale === 'small' || data.iconScale === 'medium' || data.iconScale === 'large' ? data.iconScale : DEFAULT_PREFERENCES.iconScale,
    showDesktopIcons: typeof data.showDesktopIcons === 'boolean' ? data.showDesktopIcons : DEFAULT_PREFERENCES.showDesktopIcons,
    autoHideTaskbar: typeof data.autoHideTaskbar === 'boolean' ? data.autoHideTaskbar : true,
    pinnedAppIds: sanitizeAppIds(data.pinnedAppIds, DEFAULT_PREFERENCES.pinnedAppIds),
    desktopShortcutIds: sanitizeAppIds(data.desktopShortcutIds, DEFAULT_PREFERENCES.desktopShortcutIds),
    recentAppHistory: Array.isArray(data.recentAppHistory) ? data.recentAppHistory.slice(0, 10).filter((id): id is string => typeof id === 'string') : [],
  };

  return migrated;
}

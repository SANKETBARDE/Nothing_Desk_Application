export interface StoredWindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StoredWindowState {
  id: string;
  appId: string;
  title: string;
  bounds: StoredWindowBounds;
  state: 'normal' | 'minimized' | 'maximized';
}

export type ThemeMode = 'dark' | 'light';
export type IconScale = 'small' | 'medium' | 'large';

export interface DesktopPreferences {
  version: number;
  theme: ThemeMode;
  wallpaperId: string;
  customWallpaperUrl?: string;
  iconScale: IconScale;
  showDesktopIcons: boolean;
  autoHideTaskbar?: boolean;
  pinnedAppIds: string[];
  desktopShortcutIds: string[];
  recentAppHistory: string[];
}

export const CURRENT_SCHEMA_VERSION = 1;

export const DEFAULT_PREFERENCES: DesktopPreferences = {
  version: CURRENT_SCHEMA_VERSION,
  theme: 'dark',
  wallpaperId: 'dot-matrix-black',
  iconScale: 'medium',
  showDesktopIcons: true,
  autoHideTaskbar: true,
  pinnedAppIds: ['phone', 'photos', 'files', 'browser', 'camera', 'messages', 'settings'],
  desktopShortcutIds: ['phone', 'photos', 'files', 'browser', 'camera', 'messages', 'calculator', 'notes', 'settings'],
  recentAppHistory: [],
};

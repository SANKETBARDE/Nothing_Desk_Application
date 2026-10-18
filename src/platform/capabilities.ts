/**
 * Core capability and result types for the Nothing Desk platform bridge.
 */

export interface DesktopCapabilities {
  canListLaunchableApps: boolean;
  canLaunchAndroidApps: boolean;
  hasExternalDisplay: boolean;
  supportsSeparateExternalDesktop: boolean;
  supportsSystemWindowing: boolean;
  hasHardwareKeyboard: boolean;
  hasPointerDevice: boolean;
  screenDensity: number;
  isTouchScreen: boolean;
}

export type NativeResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: string; message: string };

export interface InstalledApp {
  packageName: string;
  label: string;
  iconUrl?: string;
  isSystemApp: boolean;
  category?: 'built-in' | 'productivity' | 'tools' | 'media' | 'social' | 'utility';
}

export interface FileReference {
  name: string;
  uri: string;
  mimeType: string;
  size: number;
  lastModified: number;
  content?: string;
}

export interface DirectoryReference {
  name: string;
  uri: string;
  files: FileReference[];
}

export type OperatingMode =
  | 'PHONE_TOUCH'
  | 'PHONE_POINTER'
  | 'EXTERNAL_MIRROR'
  | 'EXTERNAL_DESKTOP'
  | 'DISPLAY_DISCONNECTED'
  | 'FEATURE_UNAVAILABLE';

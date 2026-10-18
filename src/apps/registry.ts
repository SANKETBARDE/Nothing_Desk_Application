import React from 'react';
import type { AppDefinition } from '../windowing/types';
import { SettingsApp } from './settings/SettingsApp';
import { HelpApp } from './help/HelpApp';
import { AboutApp } from './about/AboutApp';
import { FileAccessApp } from './file-access/FileAccessApp';
import { BrowserApp } from './browser/BrowserApp';
import { CameraApp } from './camera/CameraApp';
import { PhoneApp } from './phone/PhoneApp';
import { MessagesApp } from './messages/MessagesApp';
import { CalculatorApp } from './calculator/CalculatorApp';
import { NotesApp } from './notes/NotesApp';
import { PhotosApp } from './photos/PhotosApp';
import { AndroidAppWindow } from './android-app/AndroidAppWindow';
import type { DesktopPreferences } from '../persistence/schema';

export function getAppDefinitions(onPreferencesChange?: (prefs: DesktopPreferences) => void): Record<string, AppDefinition> {
  return {
    settings: {
      id: 'settings',
      title: 'Settings',
      iconName: 'Sliders',
      defaultWidth: 640,
      defaultHeight: 480,
      minWidth: 380,
      minHeight: 300,
      allowResize: true,
      allowMaximize: true,
      component: ({ windowId }) => React.createElement(SettingsApp, { windowId, onPreferencesChange }),
    },
    browser: {
      id: 'browser',
      title: 'Chrome Browser',
      iconName: 'Globe',
      defaultWidth: 780,
      defaultHeight: 520,
      minWidth: 420,
      minHeight: 320,
      allowResize: true,
      allowMaximize: true,
      component: ({ windowId }) => React.createElement(BrowserApp, { windowId }),
    },
    chrome: {
      id: 'chrome',
      title: 'Chrome Browser',
      iconName: 'Globe',
      defaultWidth: 780,
      defaultHeight: 520,
      minWidth: 420,
      minHeight: 320,
      allowResize: true,
      allowMaximize: true,
      component: ({ windowId }) => React.createElement(BrowserApp, { windowId }),
    },
    camera: {
      id: 'camera',
      title: 'Nothing Camera',
      iconName: 'Camera',
      defaultWidth: 640,
      defaultHeight: 480,
      minWidth: 360,
      minHeight: 320,
      allowResize: true,
      allowMaximize: true,
      component: ({ windowId }) => React.createElement(CameraApp, { windowId }),
    },
    phone: {
      id: 'phone',
      title: 'Phone',
      iconName: 'Phone',
      defaultWidth: 400,
      defaultHeight: 540,
      minWidth: 320,
      minHeight: 420,
      allowResize: true,
      allowMaximize: true,
      component: ({ windowId }) => React.createElement(PhoneApp, { windowId }),
    },
    messages: {
      id: 'messages',
      title: 'Messages',
      iconName: 'MessageSquare',
      defaultWidth: 640,
      defaultHeight: 480,
      minWidth: 400,
      minHeight: 320,
      allowResize: true,
      allowMaximize: true,
      component: ({ windowId }) => React.createElement(MessagesApp, { windowId }),
    },
    calculator: {
      id: 'calculator',
      title: 'Calculator',
      iconName: 'Calculator',
      defaultWidth: 340,
      defaultHeight: 480,
      minWidth: 260,
      minHeight: 340,
      allowResize: true,
      allowMaximize: true,
      component: ({ windowId }) => React.createElement(CalculatorApp, { windowId }),
    },
    notes: {
      id: 'notes',
      title: 'Notes',
      iconName: 'FileText',
      defaultWidth: 540,
      defaultHeight: 420,
      minWidth: 340,
      minHeight: 280,
      allowResize: true,
      allowMaximize: true,
      component: ({ windowId }) => React.createElement(NotesApp, { windowId }),
    },
    files: {
      id: 'files',
      title: 'File Manager',
      iconName: 'FolderOpen',
      defaultWidth: 680,
      defaultHeight: 480,
      minWidth: 400,
      minHeight: 300,
      allowResize: true,
      allowMaximize: true,
      component: ({ windowId }) => React.createElement(FileAccessApp, { windowId }),
    },
    photos: {
      id: 'photos',
      title: 'Photos',
      iconName: 'Image',
      defaultWidth: 720,
      defaultHeight: 500,
      minWidth: 400,
      minHeight: 320,
      allowResize: true,
      allowMaximize: true,
      component: ({ windowId }) => React.createElement(PhotosApp, { windowId }),
    },
    help: {
      id: 'help',
      title: 'Help & Shortcuts',
      iconName: 'Keyboard',
      defaultWidth: 600,
      defaultHeight: 480,
      minWidth: 380,
      minHeight: 280,
      allowResize: true,
      allowMaximize: true,
      component: ({ windowId }) => React.createElement(HelpApp, { windowId }),
    },
    about: {
      id: 'about',
      title: 'About Nothing Desk',
      iconName: 'Info',
      defaultWidth: 500,
      defaultHeight: 420,
      minWidth: 340,
      minHeight: 280,
      allowResize: true,
      allowMaximize: true,
      component: ({ windowId }) => React.createElement(AboutApp, { windowId }),
    },
  };
}

// Map Android package names or legacy IDs directly to our authentic built-in applications
const PACKAGE_TO_BUILTIN_MAP: Record<string, string> = {
  'com.google.android.dialer': 'phone',
  'com.android.phone': 'phone',
  'com.nothing.phone': 'phone',
  'com.google.android.apps.photos': 'photos',
  'com.nothing.gallery': 'photos',
  'com.android.gallery3d': 'photos',
  'org.chromium.chrome': 'browser',
  'com.android.chrome': 'browser',
  'chrome': 'browser',
  'tech.nothing.camera': 'camera',
  'com.android.camera': 'camera',
  'com.google.android.GoogleCamera': 'camera',
  'com.google.android.apps.messaging': 'messages',
  'com.android.mms': 'messages',
  'com.android.calculator2': 'calculator',
  'com.google.android.calculator': 'calculator',
  'com.android.documentsui': 'files',
  'com.google.android.apps.nbu.files': 'files',
  'com.android.settings': 'settings',
};

/**
 * Resolves an AppDefinition for either a built-in suite tool or an external Android package.
 * Guarantees every application opens inside a dedicated desktop window frame in Nothing Desk.
 */
export function resolveAppDefinition(
  appId: string,
  title?: string,
  packageName?: string,
  onPreferencesChange?: (prefs: DesktopPreferences) => void
): AppDefinition {
  const definitions = getAppDefinitions(onPreferencesChange);
  const normalizedId = PACKAGE_TO_BUILTIN_MAP[appId] || (packageName && PACKAGE_TO_BUILTIN_MAP[packageName]) || appId;
  if (definitions[normalizedId]) {
    return definitions[normalizedId];
  }

  // Fallback to dynamic Android App Freeform Window container
  return {
    id: appId,
    title: title || 'Android App',
    iconName: 'Smartphone',
    defaultWidth: 640,
    defaultHeight: 480,
    minWidth: 360,
    minHeight: 280,
    allowResize: true,
    allowMaximize: true,
    component: ({ windowId }) =>
      React.createElement(AndroidAppWindow, {
        windowId,
        packageName: packageName || appId,
        appName: title || 'Android App',
      }),
  };
}

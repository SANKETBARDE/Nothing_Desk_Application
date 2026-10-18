import type { ReactNode } from 'react';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type WindowMode = 'normal' | 'minimized' | 'maximized';

export interface WindowInstance {
  id: string;
  appId: string;
  title: string;
  iconName: string;
  packageName?: string;
  mode: WindowMode;
  bounds: WindowBounds;
  prevBounds: WindowBounds;
  zIndex: number;
  isFocused: boolean;
  minWidth: number;
  minHeight: number;
  allowResize?: boolean;
  allowMaximize?: boolean;
}

export interface AppDefinition {
  id: string;
  title: string;
  iconName: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  allowResize: boolean;
  allowMaximize: boolean;
  component: (props: { windowId: string }) => ReactNode;
}

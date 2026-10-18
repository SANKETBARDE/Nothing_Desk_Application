import React from 'react';
import * as Icons from 'lucide-react';
import type { WindowInstance } from '../../windowing/types';
import { SystemTray } from './SystemTray';

export interface PinnedApp {
  id: string;
  appId: string;
  title: string;
  iconName: string;
}

interface TaskbarProps {
  pinnedApps: PinnedApp[];
  windows: WindowInstance[];
  isStartOpen: boolean;
  isPointer: boolean;
  onToggleStart: () => void;
  onAppClick: (appId: string, title: string, iconName: string) => void;
  onWindowClick: (win: WindowInstance) => void;
  onShowDesktop: () => void;
  onToggleQuickPanel?: () => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  pinnedApps,
  windows,
  isStartOpen,
  isPointer,
  onToggleStart,
  onAppClick,
  onWindowClick,
  onShowDesktop,
  onToggleQuickPanel,
}) => {
  return (
    <nav
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--taskbar-height)',
        paddingBottom: 'var(--safe-bottom)',
        paddingLeft: 'var(--safe-left)',
        paddingRight: 'var(--safe-right)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 9000,
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)',
      }}
      role="navigation"
      aria-label="Desktop Taskbar"
    >
      {/* Left: Start Button + Pinned & Running Items */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          gap: '4px',
          paddingLeft: '8px',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
        }}
      >
        {/* Start Button */}
        <button
          type="button"
          onClick={onToggleStart}
          aria-label="Start Menu"
          aria-expanded={isStartOpen}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-sm)',
            background: isStartOpen ? 'var(--bg-surface-active)' : 'transparent',
            border: `1px solid ${isStartOpen ? 'var(--accent-red)' : 'transparent'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
          title="Start (Meta / Ctrl+Space)"
        >
          {/* Nothing OS Signature Glyph: Concentric Minimal Red Dot */}
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              border: '2px solid var(--text-pure-white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--accent-red)',
              }}
            />
          </div>
        </button>

        <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.08)', margin: '0 4px' }} />

        {/* Pinned & Running Apps */}
        {pinnedApps.map((app) => {
          const runningWindow = windows.find((w) => w.appId === app.appId);
          const isRunning = !!runningWindow;
          const isFocused = runningWindow?.isFocused && runningWindow?.mode !== 'minimized';

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const IconComponent = (Icons as any)[app.iconName] || Icons.AppWindow;

          return (
            <button
              key={app.id}
              type="button"
              onClick={() => {
                if (runningWindow) {
                  onWindowClick(runningWindow);
                } else {
                  onAppClick(app.appId, app.title, app.iconName);
                }
              }}
              style={{
                height: '40px',
                minWidth: '40px',
                padding: '0 10px',
                borderRadius: 'var(--radius-sm)',
                background: isFocused
                  ? 'var(--bg-surface-active)'
                  : isRunning
                  ? 'var(--bg-surface-hover)'
                  : 'transparent',
                border: `1px solid ${isFocused ? 'var(--glass-border-focus)' : 'transparent'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                position: 'relative',
              }}
              title={app.title}
              aria-label={app.title}
            >
              <IconComponent size={18} color={isFocused ? 'var(--accent-red)' : 'var(--text-primary)'} />

              {/* Running Status Pill / Indicator */}
              {isRunning && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: isFocused ? '14px' : '4px',
                    height: '3px',
                    borderRadius: 'var(--radius-full)',
                    background: isFocused ? 'var(--accent-red)' : 'var(--text-secondary)',
                    transition: 'width var(--transition-instant), background var(--transition-instant)',
                  }}
                />
              )}
            </button>
          );
        })}

        {/* Unpinned Running Windows (Samsung DeX Multi-Windowing) */}
        {windows
          .filter((win) => !pinnedApps.some((p) => p.appId === win.appId))
          .map((win) => {
            const isFocused = win.isFocused && win.mode !== 'minimized';
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const IconComponent = (Icons as any)[win.iconName] || Icons.AppWindow;

            return (
              <button
                key={win.id}
                type="button"
                onClick={() => onWindowClick(win)}
                style={{
                  height: '40px',
                  minWidth: '40px',
                  padding: '0 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: isFocused ? 'var(--bg-surface-active)' : 'var(--bg-surface-hover)',
                  border: `1px solid ${isFocused ? 'var(--glass-border-focus)' : 'rgba(255, 255, 255, 0.08)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  position: 'relative',
                }}
                title={win.title}
                aria-label={win.title}
              >
                <IconComponent size={18} color={isFocused ? 'var(--accent-red)' : 'var(--text-primary)'} />
                <span
                  style={{
                    fontSize: 11,
                    maxWidth: 90,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: isFocused ? '#fff' : '#aaa',
                  }}
                >
                  {win.title}
                </span>

                {/* Running Status Indicator */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: isFocused ? '14px' : '4px',
                    height: '3px',
                    borderRadius: 'var(--radius-full)',
                    background: isFocused ? 'var(--accent-red)' : 'var(--text-secondary)',
                    transition: 'width var(--transition-instant), background var(--transition-instant)',
                  }}
                />
              </button>
            );
          })}
      </div>

      {/* Right: System Tray & Show Desktop Peek Strip */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <SystemTray isPointer={isPointer} onClick={onToggleQuickPanel} />

        <button
          type="button"
          onClick={onShowDesktop}
          aria-label="Show Desktop (Meta+D)"
          title="Show Desktop (Meta+D)"
          style={{
            width: '12px',
            height: '100%',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'transparent',
            padding: 0,
            borderRadius: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        />
      </div>
    </nav>
  );
};

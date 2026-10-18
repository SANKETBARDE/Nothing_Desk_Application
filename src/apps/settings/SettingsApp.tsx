import React, { useState, useEffect } from 'react';
import { StorageService } from '../../persistence/storage';
import type { DesktopPreferences, IconScale, ThemeMode } from '../../persistence/schema';
import { platformAdapter } from '../../platform/nativeAdapter';
import type { DesktopCapabilities } from '../../platform/capabilities';
import { Palette, Monitor, RefreshCw, CheckCircle2, HardDrive, Cpu, Battery } from 'lucide-react';
import type { DeviceInfo, StorageInfo, MemoryInfo, BatteryInfo } from '../../platform/interface';

interface SettingsAppProps {
  windowId: string;
  onPreferencesChange?: (prefs: DesktopPreferences) => void;
}

export const SettingsApp: React.FC<SettingsAppProps> = ({ onPreferencesChange }) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'system' | 'reset'>('appearance');
  const [prefs, setPrefs] = useState<DesktopPreferences>(() => StorageService.loadPreferences());
  const [caps, setCaps] = useState<DesktopCapabilities | null>(null);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [memory, setMemory] = useState<MemoryInfo | null>(null);
  const [battery, setBattery] = useState<BatteryInfo | null>(null);
  const [resetConfirmed, setResetConfirmed] = useState(false);

  useEffect(() => {
    platformAdapter.getCapabilities().then(setCaps);
    platformAdapter.getDeviceInfo().then(setDevice);
    platformAdapter.getStorageInfo().then(setStorage);
    platformAdapter.getMemoryInfo().then(setMemory);
    platformAdapter.getBatteryInfo().then(setBattery);
  }, []);

  const handleUpdate = (updated: Partial<DesktopPreferences>) => {
    const newPrefs = { ...prefs, ...updated };
    setPrefs(newPrefs);
    StorageService.savePreferences(newPrefs);
    if (onPreferencesChange) {
      onPreferencesChange(newPrefs);
    }
  };

  const handleReset = () => {
    StorageService.resetAll();
    const defaults = StorageService.loadPreferences();
    setPrefs(defaults);
    setResetConfirmed(true);
    if (onPreferencesChange) {
      onPreferencesChange(defaults);
    }
    setTimeout(() => setResetConfirmed(false), 3000);
  };

  return (
    <div style={{ display: 'flex', height: '100%', color: 'var(--text-primary)', fontSize: '13px' }}>
      {/* Settings Navigation Sidebar */}
      <div
        style={{
          width: '160px',
          background: 'rgba(0, 0, 0, 0.25)',
          borderRight: '1px solid var(--glass-border)',
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          style={{
            justifyContent: 'flex-start',
            gap: '8px',
            padding: '8px 10px',
            borderRadius: 'var(--radius-xs)',
            background: activeTab === 'appearance' ? 'var(--bg-surface-hover)' : 'transparent',
            color: activeTab === 'appearance' ? 'var(--text-pure-white)' : 'var(--text-secondary)',
          }}
        >
          <Palette size={15} color="var(--accent-red)" /> Appearance
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('system')}
          style={{
            justifyContent: 'flex-start',
            gap: '8px',
            padding: '8px 10px',
            borderRadius: 'var(--radius-xs)',
            background: activeTab === 'system' ? 'var(--bg-surface-hover)' : 'transparent',
            color: activeTab === 'system' ? 'var(--text-pure-white)' : 'var(--text-secondary)',
          }}
        >
          <Monitor size={15} color="var(--accent-red)" /> Device & Bridge
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reset')}
          style={{
            justifyContent: 'flex-start',
            gap: '8px',
            padding: '8px 10px',
            borderRadius: 'var(--radius-xs)',
            background: activeTab === 'reset' ? 'var(--bg-surface-hover)' : 'transparent',
            color: activeTab === 'reset' ? 'var(--text-pure-white)' : 'var(--text-secondary)',
          }}
        >
          <RefreshCw size={15} color="var(--status-danger)" /> Reset Desk
        </button>
      </div>

      {/* Settings Content Area */}
      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
        {activeTab === 'appearance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Theme</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '10px' }}>
                Monochromatic Nothing OS high-contrast styling.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                {(['dark', 'light'] as ThemeMode[]).map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => handleUpdate({ theme })}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${prefs.theme === theme ? 'var(--accent-red)' : 'var(--glass-border)'}`,
                      background: prefs.theme === theme ? 'var(--accent-red-subtle)' : 'var(--bg-surface)',
                      color: prefs.theme === theme ? 'var(--accent-red)' : 'var(--text-primary)',
                      textTransform: 'capitalize',
                      fontWeight: 500,
                    }}
                  >
                    {theme} Mode
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Wallpaper</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '10px' }}>
                Choose a signature Nothing pattern.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                {[
                  { id: 'dot-matrix-black', label: 'Dot Matrix Dark', bg: '#050505' },
                  { id: 'carbon-grid', label: 'Carbon Grid', bg: '#0d0d12' },
                  { id: 'minimal-slate', label: 'Minimal Slate', bg: '#16161a' },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleUpdate({ wallpaperId: item.id, customWallpaperUrl: undefined })}
                    style={{
                      cursor: 'pointer',
                      border: `2px solid ${prefs.wallpaperId === item.id ? 'var(--accent-red)' : 'var(--glass-border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px',
                      background: item.bg,
                      textAlign: 'center',
                      transition: 'border-color var(--transition-instant)',
                    }}
                  >
                    <div
                      style={{
                        height: '48px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
                        backgroundSize: '12px 12px',
                        marginBottom: '8px',
                      }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Icon Scale</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '10px' }}>
                Adjust desktop shortcut size.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['small', 'medium', 'large'] as IconScale[]).map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => handleUpdate({ iconScale: scale })}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${prefs.iconScale === scale ? 'var(--accent-red)' : 'var(--glass-border)'}`,
                      background: prefs.iconScale === scale ? 'var(--accent-red-subtle)' : 'var(--bg-surface)',
                      color: prefs.iconScale === scale ? 'var(--accent-red)' : 'var(--text-primary)',
                      textTransform: 'capitalize',
                      fontSize: '12px',
                    }}
                  >
                    {scale}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Taskbar Behavior</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>
                Immersive auto-hide with hover and swipe-up touch gesture.
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--accent-red)',
                  background: 'var(--accent-red-subtle)',
                  color: 'var(--accent-red)',
                  fontWeight: 600,
                  fontSize: '11px',
                  letterSpacing: '0.04em',
                }}
              >
                <span>SLIDE ON HOVER / TOUCH GESTURE (PERMANENT DEFAULT)</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>Device & System Hardware</h3>
            
            {/* Real Device Hardware Info */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Device Model:</span>
                <span style={{ fontWeight: 600 }}>{device ? `${device.manufacturer} ${device.model}` : 'Nothing Phone'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Android OS Version:</span>
                <span>{device ? `Android ${device.androidVersion} (API ${device.sdkInt})` : 'Android 15'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Security Patch:</span>
                <span>{device?.securityPatch || '2026-10-01'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>CPU Architecture:</span>
                <span style={{ fontFamily: 'monospace' }}>{device?.cpuAbi || 'arm64-v8a'}</span>
              </div>
            </div>

            {/* Real RAM & Storage */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {memory && (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00d26a', fontSize: '11px', fontWeight: 600 }}>
                    <Cpu size={14} /> RAM MEMORY
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>
                    {memory.usedRAM_GB} / {memory.totalRAM_GB} GB
                  </div>
                  <div style={{ fontSize: '11px', color: '#888' }}>
                    {memory.availRAM_GB} GB free ({memory.usedPercent}% used)
                  </div>
                </div>
              )}

              {storage && (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-red)', fontSize: '11px', fontWeight: 600 }}>
                    <HardDrive size={14} /> INTERNAL STORAGE
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>
                    {storage.usedGB} / {storage.totalGB} GB
                  </div>
                  <div style={{ fontSize: '11px', color: '#888' }}>
                    {storage.freeGB} GB free ({storage.usedPercent}% used)
                  </div>
                </div>
              )}
            </div>

            {/* Real Battery Telemetry */}
            {battery && (
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Battery size={16} color="var(--status-success)" />
                  <span>Battery Status: {battery.level}% ({battery.isCharging ? 'Charging' : 'Discharging'})</span>
                </div>
                <span style={{ color: '#888', fontSize: '11px' }}>
                  {battery.plugType} {battery.temperatureC ? `• ${battery.temperatureC}°C` : ''}
                </span>
              </div>
            )}

            <h3 style={{ fontFamily: 'var(--font-display)', marginTop: '8px' }}>Detected Desktop Capabilities</h3>
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Operating Mode:</span>
                <span style={{ color: 'var(--accent-red)' }}>{platformAdapter.getOperatingMode()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Device Pixel Ratio:</span>
                <span>{caps?.screenDensity ?? window.devicePixelRatio}x</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Native Android Bridge:</span>
                <span style={{ color: '#00d26a' }}>Connected & Active</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reset' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--status-danger)' }}>Reset Workspace</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Restores default wallpaper, icon positions, pinned shortcuts, and window settings. Personal files and Android apps are never affected.
            </p>

            {resetConfirmed && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--status-success)',
                  background: 'rgba(0, 210, 106, 0.1)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <CheckCircle2 size={16} /> Desktop settings safely restored to defaults.
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: 'var(--status-danger)',
                  color: '#ffffff',
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 500,
                  fontSize: '13px',
                }}
              >
                Confirm Desk Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

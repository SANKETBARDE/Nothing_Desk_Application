import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, MousePointer, Touchpad, Battery, BatteryCharging } from 'lucide-react';
import { Clock } from './Clock';

interface SystemTrayProps {
  isPointer: boolean;
  onClick?: () => void;
}

export const SystemTray: React.FC<SystemTrayProps> = ({ isPointer, onClick }) => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Battery status API if permitted
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);

        battery.addEventListener('levelchange', () => setBatteryLevel(Math.round(battery.level * 100)));
        battery.addEventListener('chargingchange', () => setIsCharging(battery.charging));
      }).catch(() => {
        // Battery API blocked or unsupported
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      onClick={onClick}
      data-tray-trigger="true"
      aria-label="System Tray"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        height: '100%',
        padding: '0 8px',
        cursor: 'pointer',
        borderRadius: 'var(--radius-xs)',
        transition: 'background var(--transition-instant)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      role="button"
      title="Click to toggle Wi-Fi, Bluetooth & Quick Panel"
    >
      {/* Input Mode Indicator */}
      <div
        title={isPointer ? 'Hardware Pointer Active' : 'Touchscreen Mode'}
        style={{
          display: 'flex',
          alignItems: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        {isPointer ? <MousePointer size={14} /> : <Touchpad size={14} />}
      </div>

      {/* Network Indicator */}
      <div
        title={isOnline ? 'Network Connected' : 'Offline Mode'}
        style={{
          display: 'flex',
          alignItems: 'center',
          color: isOnline ? 'var(--text-secondary)' : 'var(--status-danger)',
        }}
      >
        {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
      </div>

      {/* Battery Indicator */}
      {batteryLevel !== null && (
        <div
          title={`Battery: ${batteryLevel}% ${isCharging ? '(Charging)' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
          }}
        >
          {isCharging ? <BatteryCharging size={14} color="var(--status-success)" /> : <Battery size={14} />}
          <span>{batteryLevel}%</span>
        </div>
      )}

      {/* Vertical separator */}
      <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.08)' }} />

      {/* Clock */}
      <Clock />
    </div>
  );
};

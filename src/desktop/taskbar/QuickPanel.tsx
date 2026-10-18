import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wifi,
  WifiOff,
  Bluetooth,
  Volume2,
  VolumeX,
  Sun,
  Flashlight,
  BellOff,
  RotateCw,
  Sliders,
  ChevronRight,
  ChevronDown,
  BatteryCharging,
  Battery,
  HardDrive,
  Cpu,
  Lock,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldAlert,
  MapPin,
} from 'lucide-react';
import { platformAdapter } from '../../platform/nativeAdapter';
import type {
  WifiStatus,
  WifiNetworkItem,
  BluetoothStatus,
  BluetoothDeviceInfo,
  BatteryInfo,
  StorageInfo,
  MemoryInfo,
  DeviceInfo,
  HardwarePermissionsStatus,
} from '../../platform/interface';

interface QuickPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const QuickPanel: React.FC<QuickPanelProps> = ({ isOpen, onClose, onOpenSettings }) => {
  const [wifi, setWifi] = useState<WifiStatus>({ isEnabled: true, ssid: 'Connected' });
  const [wifiNetworks, setWifiNetworks] = useState<WifiNetworkItem[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<'wifi' | 'bluetooth' | null>(null);
  const [isScanningWifi, setIsScanningWifi] = useState<boolean>(false);

  // In-shell Wi-Fi state
  const [selectedWifiSsid, setSelectedWifiSsid] = useState<string | null>(null);
  const [wifiPassword, setWifiPassword] = useState<string>('');
  const [showWifiPassword, setShowWifiPassword] = useState<boolean>(false);
  const [connectingWifiSsid, setConnectingWifiSsid] = useState<string | null>(null);
  const [wifiMessage, setWifiMessage] = useState<string | null>(null);

  const [bluetooth, setBluetooth] = useState<BluetoothStatus>({ isEnabled: true, bondedDevices: [] });

  // In-shell Bluetooth state
  const [connectingBtAddress, setConnectingBtAddress] = useState<string | null>(null);
  const [btMessage, setBtMessage] = useState<string | null>(null);

  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isDndOn, setIsDndOn] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(75);
  const [brightness, setBrightness] = useState<number>(85);

  const [battery, setBattery] = useState<BatteryInfo | null>(null);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [memory, setMemory] = useState<MemoryInfo | null>(null);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [permissions, setPermissions] = useState<HardwarePermissionsStatus | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  // Poll hardware status on open
  const loadHardwareStatus = useCallback(async () => {
    try {
      const wifiInfo = await platformAdapter.getWifiInfo();
      setWifi(wifiInfo);

      const btInfo = await platformAdapter.getBluetoothInfo();
      setBluetooth(btInfo);

      const batInfo = await platformAdapter.getBatteryInfo();
      setBattery(batInfo);

      const volInfo = await platformAdapter.getVolume();
      setVolume(volInfo.volume);

      const briInfo = await platformAdapter.getBrightness();
      setBrightness(briInfo.brightness);

      const stoInfo = await platformAdapter.getStorageInfo();
      setStorage(stoInfo);

      const memInfo = await platformAdapter.getMemoryInfo();
      setMemory(memInfo);

      const devInfo = await platformAdapter.getDeviceInfo();
      setDevice(devInfo);

      const perms = await platformAdapter.checkHardwarePermissions();
      setPermissions(perms);
    } catch {
      // Ignored
    }
  }, []);

  const handleRequestPermissions = async () => {
    await platformAdapter.requestHardwarePermissions();
    setTimeout(async () => {
      loadHardwareStatus();
      handleScanWifi();
    }, 1200);
  };

  const handleOpenAppSettings = async () => {
    await platformAdapter.openAppSettings();
  };

  const handleOpenWifiPanel = async () => {
    await platformAdapter.openWifiPanel();
    setTimeout(loadHardwareStatus, 1500);
  };

  const handleOpenBluetoothSettings = async () => {
    await platformAdapter.openBluetoothSettings();
    setTimeout(loadHardwareStatus, 1500);
  };

  const handleOpenLocationSettings = async () => {
    await platformAdapter.openLocationSettings();
    setTimeout(handleScanWifi, 2000);
  };

  useEffect(() => {
    if (isOpen) {
      loadHardwareStatus();
    } else {
      setActiveDropdown(null);
    }
  }, [isOpen, loadHardwareStatus]);

  // Scan real Wi-Fi networks in-shell
  const handleScanWifi = useCallback(async () => {
    setIsScanningWifi(true);
    try {
      const networks = await platformAdapter.getWifiScanResults();
      setWifiNetworks(networks);
    } catch {
      // Handled
    } finally {
      setIsScanningWifi(false);
    }
  }, []);

  // Click outside to dismiss
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('[data-tray-trigger="true"], [aria-label="System Tray"]')
      ) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('pointerdown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Volume Change Handler
  const handleVolumeChange = async (newVal: number) => {
    setVolume(newVal);
    await platformAdapter.setVolume(newVal);
  };

  // Brightness Change Handler
  const handleBrightnessChange = async (newVal: number) => {
    setBrightness(newVal);
    await platformAdapter.setBrightness(newVal);
  };

  // Flashlight Toggle
  const handleTorchToggle = async () => {
    const nextState = !isTorchOn;
    setIsTorchOn(nextState);
    await platformAdapter.toggleFlashlight(nextState);
  };

  // Mutually exclusive Wi-Fi & Bluetooth dropdown toggles
  const handleToggleWifiDropdown = () => {
    setActiveDropdown((prev) => {
      const next = prev === 'wifi' ? null : 'wifi';
      if (next === 'wifi' && wifiNetworks.length === 0) {
        handleScanWifi();
      }
      return next;
    });
  };

  const handleToggleBluetoothDropdown = () => {
    setActiveDropdown((prev) => (prev === 'bluetooth' ? null : 'bluetooth'));
  };

  // In-shell Wi-Fi power toggle
  const handleToggleWifiPower = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = !wifi.isEnabled;
    setWifi((prev) => ({ ...prev, isEnabled: next, ssid: next ? prev.ssid : undefined }));
    await platformAdapter.setWifiEnabled(next);
    if (next) {
      handleScanWifi();
    } else {
      setWifiNetworks([]);
      setSelectedWifiSsid(null);
    }
    setTimeout(loadHardwareStatus, 600);
  };

  // In-shell Wi-Fi connect
  const handleConnectWifi = async (ssid: string, password?: string) => {
    setConnectingWifiSsid(ssid);
    setWifiMessage(null);
    try {
      const res = await platformAdapter.connectWifi(ssid, password);
      if (!res.ok) {
        setWifiMessage(res.message || 'Connection failed');
      } else {
        setWifiMessage(`Connecting to ${ssid}...`);
        setSelectedWifiSsid(null);
        setWifiPassword('');
        setTimeout(() => {
          loadHardwareStatus();
          handleScanWifi();
          setWifiMessage(null);
        }, 1500);
      }
    } catch (e: unknown) {
      setWifiMessage((e as Error).message || 'Connection failed');
    } finally {
      setConnectingWifiSsid(null);
    }
  };

  // In-shell Wi-Fi disconnect
  const handleDisconnectWifi = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await platformAdapter.disconnectWifi();
      setWifi((prev) => ({ ...prev, ssid: undefined }));
      setTimeout(() => {
        loadHardwareStatus();
        handleScanWifi();
      }, 800);
    } catch {
      // Ignored
    }
  };

  // In-shell Bluetooth power toggle
  const handleToggleBluetoothPower = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = !bluetooth.isEnabled;
    setBluetooth((prev) => ({ ...prev, isEnabled: next }));
    await platformAdapter.setBluetoothEnabled(next);
    setTimeout(loadHardwareStatus, 800);
  };

  // In-shell Bluetooth connect / disconnect
  const handleToggleBtDevice = async (device: BluetoothDeviceInfo) => {
    setConnectingBtAddress(device.address);
    setBtMessage(null);
    try {
      if (device.isConnected) {
        await platformAdapter.disconnectBluetoothDevice(device.address);
      } else {
        await platformAdapter.connectBluetoothDevice(device.address);
      }
      setTimeout(() => {
        loadHardwareStatus();
      }, 1000);
    } catch (e: unknown) {
      setBtMessage((e as Error).message || 'Action failed');
    } finally {
      setConnectingBtAddress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="anim-slide-up"
      style={{
        position: 'absolute',
        bottom: 'calc(var(--taskbar-height) + var(--safe-bottom) + 8px)',
        right: 'calc(var(--safe-right) + 8px)',
        width: 'min(94vw, 380px)',
        maxHeight: 'calc(100vh - var(--taskbar-height) - 30px)',
        overflowY: 'auto',
        background: 'rgba(14, 14, 18, 0.92)',
        backdropFilter: 'blur(36px)',
        WebkitBackdropFilter: 'blur(36px)',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        zIndex: 9500,
        color: 'var(--text-primary)',
        userSelect: 'none',
      }}
      role="dialog"
      aria-label="Control Center"
    >
      {/* Device Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--glass-border)',
          paddingBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--accent-red)',
              boxShadow: '0 0 8px var(--accent-red)',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: 'var(--text-primary)',
            }}
          >
            {device ? `${device.manufacturer} ${device.model}`.toUpperCase() : 'NOTHING PHONE'}
          </span>
        </div>

        {battery && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
            }}
          >
            {battery.isCharging ? (
              <BatteryCharging size={13} color="var(--status-success)" />
            ) : (
              <Battery size={13} />
            )}
            <span>{battery.level}%</span>
            {battery.temperatureC ? (
              <span style={{ fontSize: '10px', color: '#666' }}>({battery.temperatureC}°C)</span>
            ) : null}
          </div>
        )}
      </div>

      {/* Permissions Status Banner (when hardware permissions are missing) */}
      {permissions && !permissions.allGranted && (
        <div
          className="anim-fade-in"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(215, 25, 33, 0.16)',
            border: '1px solid var(--accent-red)',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} color="var(--accent-red)" style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>
                Hardware Permissions Needed
              </span>
              <span style={{ fontSize: '10px', color: '#ccc' }}>
                Grant access for seamless Wi-Fi & Bluetooth control
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleRequestPermissions}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                background: 'var(--accent-red)',
                border: 'none',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Grant
            </button>
            <button
              type="button"
              onClick={handleOpenAppSettings}
              title="Open Android App Settings"
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              Settings
            </button>
          </div>
        </div>
      )}

      {/* Top 2 Primary Large Nothing Pill Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {/* Wi-Fi Pill Widget */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 'var(--radius-md)',
            background: wifi.isEnabled ? 'var(--accent-red-subtle)' : 'var(--bg-surface)',
            border: `1px solid ${wifi.isEnabled ? 'var(--accent-red)' : 'var(--glass-border)'}`,
            overflow: 'hidden',
          }}
        >
          <div
            onClick={handleToggleWifiDropdown}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              cursor: 'pointer',
            }}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleToggleWifiPower(e);
              }}
              title={wifi.isEnabled ? 'Click to turn off Wi-Fi' : 'Click to turn on Wi-Fi'}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: wifi.isEnabled ? 'var(--accent-red)' : 'var(--bg-surface-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
            >
              {wifi.isEnabled ? <Wifi size={16} /> : <WifiOff size={16} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
              <span style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {wifi.isEnabled ? 'Wi-Fi' : 'Wi-Fi Off'}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {wifi.isEnabled ? wifi.ssid || 'Connected' : 'Disconnected'}
              </span>
            </div>
            {activeDropdown === 'wifi' ? <ChevronDown size={14} color="#888" /> : <ChevronRight size={14} color="#888" />}
          </div>
        </div>

        {/* Bluetooth Pill Widget */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 'var(--radius-md)',
            background: bluetooth.isEnabled ? 'rgba(0, 191, 255, 0.12)' : 'var(--bg-surface)',
            border: `1px solid ${bluetooth.isEnabled ? 'var(--status-info)' : 'var(--glass-border)'}`,
            overflow: 'hidden',
          }}
        >
          <div
            onClick={handleToggleBluetoothDropdown}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              cursor: 'pointer',
            }}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleToggleBluetoothPower(e);
              }}
              title={bluetooth.isEnabled ? 'Click to turn off Bluetooth' : 'Click to turn on Bluetooth'}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: bluetooth.isEnabled ? 'var(--status-info)' : 'var(--bg-surface-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
            >
              <Bluetooth size={16} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
              <span style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Bluetooth
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {bluetooth.isEnabled
                  ? bluetooth.bondedDevices[0]?.name || 'Active'
                  : 'Off'}
              </span>
            </div>
            {activeDropdown === 'bluetooth' ? <ChevronDown size={14} color="#888" /> : <ChevronRight size={14} color="#888" />}
          </div>
        </div>
      </div>

      {/* Expandable In-Shell Wi-Fi Networks Drawer */}
      {activeDropdown === 'wifi' && (
        <div
          className="anim-fade-in"
          style={{
            background: 'rgba(0, 0, 0, 0.55)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Wi-Fi Drawer Header: Title + Power Switch + Scan */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-red)', letterSpacing: '0.05em' }}>
              WI-FI NETWORKS
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Settings Panel Button */}
              <button
                type="button"
                onClick={handleOpenWifiPanel}
                title="Open Android Wi-Fi / Internet Settings Panel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
              >
                <ExternalLink size={11} />
                <span>Panel</span>
              </button>

              {/* Scan Button */}
              {wifi.isEnabled && (
                <button
                  type="button"
                  onClick={handleScanWifi}
                  disabled={isScanningWifi}
                  title="Scan nearby networks"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '10px',
                    cursor: isScanningWifi ? 'default' : 'pointer',
                  }}
                >
                  <RotateCw size={11} className={isScanningWifi ? 'animate-spin' : ''} />
                  <span>{isScanningWifi ? 'Scanning...' : 'Scan'}</span>
                </button>
              )}

              {/* In-app Power Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleWifiPower}
                title={wifi.isEnabled ? 'Turn Wi-Fi Off' : 'Turn Wi-Fi On'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 9px',
                  borderRadius: '12px',
                  background: wifi.isEnabled ? 'var(--accent-red)' : 'rgba(255, 255, 255, 0.12)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: wifi.isEnabled ? '#fff' : '#666',
                  }}
                />
                <span>{wifi.isEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Wi-Fi Disabled State */}
          {!wifi.isEnabled ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 8px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '6px',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
              }}
            >
              <WifiOff size={22} color="#888" />
              <span style={{ fontSize: '12px', color: '#aaa' }}>Wi-Fi is currently turned off</span>
              <button
                type="button"
                onClick={handleToggleWifiPower}
                style={{
                  padding: '5px 14px',
                  borderRadius: '4px',
                  background: 'var(--accent-red)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Turn On Wi-Fi
              </button>
            </div>
          ) : (
            <>
              {/* Connected Network Pill */}
              {wifi.ssid && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(215, 25, 33, 0.15)',
                    border: '1px solid var(--accent-red)',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <Wifi size={14} color="var(--accent-red)" style={{ flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {wifi.ssid}
                      </span>
                      <span style={{ fontSize: '9px', color: '#00d26a', fontWeight: 600 }}>
                        Connected {wifi.frequencyMHz ? `(${wifi.frequencyMHz > 4000 ? '5 GHz' : '2.4 GHz'})` : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDisconnectWifi}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      fontSize: '10px',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              )}

              {/* Status Message */}
              {wifiMessage && (
                <div
                  style={{
                    fontSize: '10px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: 'rgba(215, 25, 33, 0.2)',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {wifiMessage}
                </div>
              )}

              {/* Available Networks List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#888', marginTop: '2px' }}>
                  AVAILABLE NETWORKS ({wifiNetworks.length})
                </span>

                {wifiNetworks.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '14px 8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#aaa' }}>
                      {isScanningWifi ? 'Scanning for nearby Wi-Fi networks...' : 'No Wi-Fi networks detected nearby.'}
                    </span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={handleScanWifi}
                        style={{
                          padding: '3px 9px',
                          borderRadius: '4px',
                          background: 'var(--accent-red)',
                          border: 'none',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Scan Again
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenWifiPanel}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#fff',
                          fontSize: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        <ExternalLink size={10} /> Wi-Fi Panel
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenLocationSettings}
                        title="Android requires Location services for Wi-Fi scanning"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#fff',
                          fontSize: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        <MapPin size={10} /> Location
                      </button>
                    </div>
                  </div>
                ) : (
                  wifiNetworks.map((net) => {
                    const isSecured = net.capabilities.includes('WPA') || net.capabilities.includes('WEP') || net.capabilities.includes('PSK');
                    const isExpanded = selectedWifiSsid === net.ssid;
                    const isConnecting = connectingWifiSsid === net.ssid;
                    const isCurrentSsid = wifi.ssid === net.ssid;

                    if (isCurrentSsid) return null; // Already shown in connected card

                    return (
                      <div
                        key={net.bssid || net.ssid}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: '6px',
                          background: isExpanded ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.03)',
                          border: isExpanded ? '1px solid var(--accent-red)' : '1px solid rgba(255, 255, 255, 0.06)',
                          overflow: 'hidden',
                          transition: 'border var(--transition-instant)',
                        }}
                      >
                        {/* Network Row */}
                        <div
                          onClick={() => {
                            if (isExpanded) {
                              setSelectedWifiSsid(null);
                            } else {
                              setSelectedWifiSsid(net.ssid);
                              setWifiPassword('');
                              setWifiMessage(null);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            <Wifi size={13} color="#aaa" />
                            <span style={{ fontWeight: 500, fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {net.ssid}
                            </span>
                            {isSecured && <Lock size={10} color="#777" />}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '9px', color: '#666' }}>
                              {net.frequency > 4000 ? '5 GHz' : '2.4 GHz'}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                padding: '2px 7px',
                                borderRadius: '3px',
                                background: isExpanded ? 'var(--accent-red)' : 'rgba(255, 255, 255, 0.08)',
                                color: '#fff',
                                fontWeight: 500,
                              }}
                            >
                              {isConnecting ? 'Connecting...' : isExpanded ? 'Close' : 'Connect'}
                            </span>
                          </div>
                        </div>

                        {/* Inline In-Shell Password / Connect Form */}
                        {isExpanded && (
                          <div
                            style={{
                              padding: '8px 10px 10px',
                              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              background: 'rgba(0, 0, 0, 0.2)',
                            }}
                          >
                            {isSecured ? (
                              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                                <input
                                  type={showWifiPassword ? 'text' : 'password'}
                                  placeholder="Enter Wi-Fi password"
                                  value={wifiPassword}
                                  onChange={(e) => setWifiPassword(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && wifiPassword) {
                                      handleConnectWifi(net.ssid, wifiPassword);
                                    }
                                  }}
                                  autoFocus
                                  style={{
                                    width: '100%',
                                    padding: '6px 30px 6px 8px',
                                    borderRadius: '4px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: '#fff',
                                    fontSize: '11px',
                                    fontFamily: showWifiPassword ? 'var(--font-mono)' : 'sans-serif',
                                    outline: 'none',
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowWifiPassword(!showWifiPassword)}
                                  style={{
                                    position: 'absolute',
                                    right: '6px',
                                    background: 'none',
                                    border: 'none',
                                    color: '#888',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    display: 'flex',
                                  }}
                                >
                                  {showWifiPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '10px', color: '#00d26a' }}>
                                Open network (no password required)
                              </span>
                            )}

                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedWifiSsid(null)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  border: 'none',
                                  color: '#aaa',
                                  fontSize: '10px',
                                  cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={isSecured && !wifiPassword}
                                onClick={() => handleConnectWifi(net.ssid, wifiPassword)}
                                style={{
                                  padding: '4px 12px',
                                  borderRadius: '4px',
                                  background: isSecured && !wifiPassword ? '#444' : 'var(--accent-red)',
                                  border: 'none',
                                  color: '#fff',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  cursor: isSecured && !wifiPassword ? 'not-allowed' : 'pointer',
                                }}
                              >
                                {isConnecting ? 'Connecting...' : 'Connect'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Expandable In-Shell Bluetooth Devices Drawer */}
      {activeDropdown === 'bluetooth' && (
        <div
          className="anim-fade-in"
          style={{
            background: 'rgba(0, 0, 0, 0.55)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--status-info)', letterSpacing: '0.05em' }}>
              BLUETOOTH DEVICES
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Settings Button */}
              <button
                type="button"
                onClick={handleOpenBluetoothSettings}
                title="Open Android Bluetooth Settings"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
              >
                <ExternalLink size={11} />
                <span>Settings</span>
              </button>

              {/* Sync Button */}
              {bluetooth.isEnabled && (
                <button
                  type="button"
                  onClick={loadHardwareStatus}
                  title="Refresh Bluetooth devices"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '10px',
                    cursor: 'pointer',
                  }}
                >
                  <RotateCw size={11} />
                  <span>Refresh</span>
                </button>
              )}

              {/* Power Switch */}
              <button
                type="button"
                onClick={handleToggleBluetoothPower}
                title={bluetooth.isEnabled ? 'Turn Bluetooth Off' : 'Turn Bluetooth On'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 9px',
                  borderRadius: '12px',
                  background: bluetooth.isEnabled ? 'var(--status-info)' : 'rgba(255, 255, 255, 0.12)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: bluetooth.isEnabled ? '#fff' : '#666',
                  }}
                />
                <span>{bluetooth.isEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Bluetooth Disabled State */}
          {!bluetooth.isEnabled ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 8px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '6px',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
              }}
            >
              <Bluetooth size={22} color="#888" />
              <span style={{ fontSize: '12px', color: '#aaa' }}>Bluetooth is currently turned off</span>
              <button
                type="button"
                onClick={handleToggleBluetoothPower}
                style={{
                  padding: '5px 14px',
                  borderRadius: '4px',
                  background: 'var(--status-info)',
                  border: 'none',
                  color: '#000',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Turn On Bluetooth
              </button>
            </div>
          ) : (
            <>
              {btMessage && (
                <div
                  style={{
                    fontSize: '10px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: 'rgba(0, 191, 255, 0.2)',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {btMessage}
                </div>
              )}

              {/* Devices List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '180px', overflowY: 'auto' }}>
                {bluetooth.bondedDevices.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '14px 8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#888' }}>No paired Bluetooth devices found</span>
                    <button
                      type="button"
                      onClick={handleOpenBluetoothSettings}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        background: 'var(--status-info)',
                        border: 'none',
                        color: '#000',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <ExternalLink size={11} /> Pair Device
                    </button>
                  </div>
                ) : (
                  bluetooth.bondedDevices.map((dev) => {
                    const isBusy = connectingBtAddress === dev.address;

                    return (
                      <div
                        key={dev.address}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: dev.isConnected ? 'rgba(0, 191, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                          border: `1px solid ${dev.isConnected ? 'var(--status-info)' : 'rgba(255, 255, 255, 0.06)'}`,
                          fontSize: '11px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <Bluetooth size={14} color={dev.isConnected ? 'var(--status-info)' : '#888'} style={{ flexShrink: 0 }} />
                          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {dev.name}
                            </span>
                            <span style={{ fontSize: '9px', color: dev.isConnected ? '#00d26a' : '#777' }}>
                              {dev.isConnected ? 'Connected' : 'Paired'} • {dev.address}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleBtDevice(dev)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: dev.isConnected ? 'rgba(215, 25, 33, 0.2)' : 'rgba(0, 191, 255, 0.15)',
                            border: `1px solid ${dev.isConnected ? 'var(--accent-red)' : 'var(--status-info)'}`,
                            color: dev.isConnected ? 'var(--accent-red)' : 'var(--status-info)',
                            fontSize: '10px',
                            fontWeight: 600,
                            cursor: isBusy ? 'wait' : 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          {isBusy ? '...' : dev.isConnected ? 'Disconnect' : 'Connect'}
                        </button>
                      </div>
                    );
                  })
                )}

                {/* Direct Pair in Settings Link Button */}
                {bluetooth.bondedDevices.length > 0 && (
                  <button
                    type="button"
                    onClick={handleOpenBluetoothSettings}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px dashed rgba(255, 255, 255, 0.15)',
                      color: 'var(--status-info)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginTop: '4px',
                    }}
                  >
                    <Bluetooth size={13} />
                    <span>Pair New Device in System Settings</span>
                    <ExternalLink size={12} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* 4 Circular Quick Toggles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {/* Flashlight / Torch */}
        <button
          type="button"
          onClick={handleTorchToggle}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 4px',
            borderRadius: 'var(--radius-sm)',
            background: isTorchOn ? 'rgba(255, 215, 0, 0.15)' : 'var(--bg-surface)',
            border: `1px solid ${isTorchOn ? '#ffd700' : 'var(--glass-border)'}`,
            cursor: 'pointer',
          }}
        >
          <Flashlight size={18} color={isTorchOn ? '#ffd700' : 'var(--text-primary)'} />
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Torch</span>
        </button>

        {/* DND Toggle */}
        <button
          type="button"
          onClick={() => setIsDndOn(!isDndOn)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 4px',
            borderRadius: 'var(--radius-sm)',
            background: isDndOn ? 'var(--accent-red-subtle)' : 'var(--bg-surface)',
            border: `1px solid ${isDndOn ? 'var(--accent-red)' : 'var(--glass-border)'}`,
            cursor: 'pointer',
          }}
        >
          <BellOff size={18} color={isDndOn ? 'var(--accent-red)' : 'var(--text-primary)'} />
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>DND</span>
        </button>

        {/* Refresh Hardware Telemetry */}
        <button
          type="button"
          onClick={loadHardwareStatus}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 4px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            cursor: 'pointer',
          }}
        >
          <RotateCw size={18} color="var(--text-primary)" />
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Sync</span>
        </button>

        {/* Desk Settings Shortcut */}
        <button
          type="button"
          onClick={() => {
            onOpenSettings();
            onClose();
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 4px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            cursor: 'pointer',
          }}
        >
          <Sliders size={18} color="var(--accent-red)" />
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Config</span>
        </button>
      </div>

      {/* Real Sliders Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Real Screen Brightness Slider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 12px',
          }}
        >
          <Sun size={16} color="var(--text-secondary)" />
          <input
            type="range"
            min="10"
            max="100"
            value={brightness}
            onChange={(e) => handleBrightnessChange(Number(e.target.value))}
            style={{
              flex: 1,
              accentColor: 'var(--accent-red)',
              cursor: 'pointer',
            }}
          />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', minWidth: '28px', textAlign: 'right' }}>
            {brightness}%
          </span>
        </div>

        {/* Real Audio Volume Slider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 12px',
          }}
        >
          {volume === 0 ? <VolumeX size={16} color="var(--status-danger)" /> : <Volume2 size={16} color="var(--text-secondary)" />}
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            style={{
              flex: 1,
              accentColor: 'var(--accent-red)',
              cursor: 'pointer',
            }}
          />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', minWidth: '28px', textAlign: 'right' }}>
            {volume}%
          </span>
        </div>
      </div>

      {/* Real Hardware Telemetry Summary Card */}
      {(storage || memory) && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '11px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#888' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>SYSTEM HARDWARE</span>
            <span>Android {device?.androidVersion || 'OS'}</span>
          </div>

          {memory && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#aaa' }}>
                <Cpu size={12} color="#00d26a" />
                <span>RAM Usage</span>
              </div>
              <span style={{ fontFamily: 'monospace' }}>
                {memory.usedRAM_GB} / {memory.totalRAM_GB} GB ({memory.usedPercent}%)
              </span>
            </div>
          )}

          {storage && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#aaa' }}>
                <HardDrive size={12} color="var(--accent-red)" />
                <span>Internal Storage</span>
              </div>
              <span style={{ fontFamily: 'monospace' }}>
                {typeof storage.usedGB === 'number' ? storage.usedGB.toFixed(1) : storage.usedGB} / {typeof storage.totalGB === 'number' ? storage.totalGB.toFixed(1) : storage.totalGB} GB ({Math.round(storage.usedPercent)}%)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer: Open Settings Desktop Window */}
      <button
        type="button"
        onClick={() => {
          onOpenSettings();
          onClose();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          width: '100%',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={14} color="var(--accent-red)" />
          <span>All Desk Preferences</span>
        </div>
        <ChevronRight size={14} />
      </button>
    </div>
  );
};

import type {
  DesktopCapabilities,
  DirectoryReference,
  FileReference,
  InstalledApp,
  NativeResult,
  OperatingMode,
} from './capabilities';
import type { IPlatformAdapter, WifiStatus, WifiNetworkItem, BluetoothStatus, DeviceContact, DeviceCallLogItem, HardwarePermissionsStatus } from './interface';

/**
 * Mock Platform Adapter providing realistic browser & offline development emulation.
 * Adheres strictly to the typed IPlatformAdapter contract.
 */
export class MockPlatformAdapter implements IPlatformAdapter {
  private listeners: Set<(capabilities: DesktopCapabilities) => void> = new Set();
  private mockWifi: WifiStatus = {
    isEnabled: true,
    ssid: 'NOTHING_WIFI_5G',
    signalStrength: 4,
  };
  private mockBluetooth: BluetoothStatus = {
    isEnabled: true,
    bondedDevices: [
      { name: 'Nothing Ear (a)', address: 'AA:BB:CC:DD:EE:01', isConnected: true },
      { name: 'Logitech MX Master 3S', address: 'AA:BB:CC:DD:EE:02', isConnected: true },
      { name: 'Keychron K3 Wireless', address: 'AA:BB:CC:DD:EE:03', isConnected: true },
    ],
  };
  private isTorchOn: boolean = false;

  private mockApps: InstalledApp[] = [
    { packageName: 'tech.nothing.camera', label: 'Nothing Camera', isSystemApp: true, category: 'media' },
    { packageName: 'tech.nothing.recorder', label: 'Sound Recorder', isSystemApp: true, category: 'tools' },
    { packageName: 'tech.nothing.weather', label: 'Nothing Weather', isSystemApp: true, category: 'utility' },
    { packageName: 'com.google.android.apps.messaging', label: 'Messages', isSystemApp: false, category: 'social' },
    { packageName: 'com.google.android.dialer', label: 'Phone', isSystemApp: true, category: 'utility' },
    { packageName: 'com.google.android.apps.photos', label: 'Google Photos', isSystemApp: false, category: 'media' },
    { packageName: 'org.chromium.chrome', label: 'Chrome Browser', isSystemApp: false, category: 'productivity' },
    { packageName: 'com.spotify.music', label: 'Spotify', isSystemApp: false, category: 'media' },
    { packageName: 'com.android.calculator2', label: 'Calculator', isSystemApp: true, category: 'tools' },
    { packageName: 'com.android.deskclock', label: 'Clock & Timer', isSystemApp: true, category: 'utility' },
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleEnvironmentChange);
      const finePointer = window.matchMedia('(pointer: fine)');
      finePointer.addEventListener('change', this.handleEnvironmentChange);
    }
  }

  private handleEnvironmentChange = () => {
    this.getCapabilities().then((caps) => {
      this.listeners.forEach((listener) => listener(caps));
    });
  };

  async getCapabilities(): Promise<DesktopCapabilities> {
    const isPointerFine = typeof window !== 'undefined' ? window.matchMedia('(pointer: fine)').matches : true;
    const isTouchScreen = typeof window !== 'undefined' ? 'ontouchstart' in window || navigator.maxTouchPoints > 0 : false;

    return {
      canListLaunchableApps: true,
      canLaunchAndroidApps: false, // Simulated in browser
      hasExternalDisplay: false,
      supportsSeparateExternalDesktop: false,
      supportsSystemWindowing: false,
      hasHardwareKeyboard: isPointerFine,
      hasPointerDevice: isPointerFine,
      screenDensity: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      isTouchScreen,
    };
  }

  getOperatingMode(): OperatingMode {
    if (typeof window === 'undefined') return 'PHONE_TOUCH';
    const isPointerFine = window.matchMedia('(pointer: fine)').matches;
    return isPointerFine ? 'PHONE_POINTER' : 'PHONE_TOUCH';
  }

  async getInstalledApps(): Promise<NativeResult<InstalledApp[]>> {
    return {
      ok: true,
      value: [...this.mockApps],
    };
  }

  async launchApp(
    packageName: string,
    _bounds?: { left?: number; top?: number; width?: number; height?: number }
  ): Promise<NativeResult<boolean>> {
    const app = this.mockApps.find((a) => a.packageName === packageName);
    if (!app) {
      return {
        ok: false,
        code: 'APP_NOT_FOUND',
        message: `Package "${packageName}" is not installed on this device.`,
      };
    }
    return {
      ok: true,
      value: true,
    };
  }

  async pickUserFile(options?: { mimeType?: string }): Promise<NativeResult<FileReference>> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      if (options?.mimeType) {
        input.accept = options.mimeType;
      }
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          resolve({
            ok: false,
            code: 'USER_CANCELLED',
            message: 'No file was selected.',
          });
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            ok: true,
            value: {
              name: file.name,
              uri: `file://${file.name}`,
              mimeType: file.type || 'application/octet-stream',
              size: file.size,
              lastModified: file.lastModified,
              content: typeof reader.result === 'string' ? reader.result : undefined,
            },
          });
        };
        reader.onerror = () => {
          resolve({
            ok: false,
            code: 'READ_ERROR',
            message: 'Failed to read selected file.',
          });
        };

        if (file.type.startsWith('text/') || file.type.includes('json') || file.type.includes('markdown')) {
          reader.readAsText(file);
        } else {
          reader.readAsDataURL(file);
        }
      };

      input.click();
    });
  }

  async pickUserDirectory(): Promise<NativeResult<DirectoryReference>> {
    return {
      ok: false,
      code: 'UNSUPPORTED_IN_BROWSER',
      message: 'Direct folder selection requires Android Storage Access Framework (SAF).',
    };
  }

  async requestLockScreen(): Promise<NativeResult<boolean>> {
    return {
      ok: false,
      code: 'LOCK_UNAVAILABLE',
      message: 'Secure lock is managed by Android OS device administrator.',
    };
  }

  onDisplayChange(callback: (capabilities: DesktopCapabilities) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  // System Hardware Controls (Simulated in browser, native on Android)
  async openWifiPanel(): Promise<NativeResult<boolean>> {
    this.mockWifi.isEnabled = !this.mockWifi.isEnabled;
    return { ok: true, value: true };
  }

  async openBluetoothSettings(): Promise<NativeResult<boolean>> {
    this.mockBluetooth.isEnabled = !this.mockBluetooth.isEnabled;
    return { ok: true, value: true };
  }

  async openVolumePanel(): Promise<NativeResult<boolean>> {
    return { ok: true, value: true };
  }

  async openDisplaySettings(): Promise<NativeResult<boolean>> {
    return { ok: true, value: true };
  }

  async openLocationSettings(): Promise<NativeResult<boolean>> {
    return { ok: true, value: true };
  }

  async openAppSettings(): Promise<NativeResult<boolean>> {
    return { ok: true, value: true };
  }

  async checkHardwarePermissions(): Promise<HardwarePermissionsStatus> {
    return {
      allGranted: true,
      location: true,
      bluetooth: true,
      camera: true,
      contacts: true,
      phone: true,
      storage: true,
    };
  }

  async requestHardwarePermissions(): Promise<NativeResult<boolean>> {
    return { ok: true, value: true };
  }

  async getWifiInfo(): Promise<WifiStatus> {
    return { ...this.mockWifi };
  }

  async getBluetoothInfo(): Promise<BluetoothStatus> {
    return { ...this.mockBluetooth };
  }

  async setWifiEnabled(enable: boolean): Promise<NativeResult<boolean>> {
    this.mockWifi.isEnabled = enable;
    if (!enable) {
      this.mockWifi.ssid = undefined;
    } else {
      this.mockWifi.ssid = 'NOTHING_WIFI_5G';
    }
    return { ok: true, value: enable };
  }

  async connectWifi(ssid: string, _password?: string): Promise<NativeResult<boolean>> {
    this.mockWifi.isEnabled = true;
    this.mockWifi.ssid = ssid;
    return { ok: true, value: true };
  }

  async disconnectWifi(): Promise<NativeResult<boolean>> {
    this.mockWifi.ssid = undefined;
    return { ok: true, value: true };
  }

  async setBluetoothEnabled(enable: boolean): Promise<NativeResult<boolean>> {
    this.mockBluetooth.isEnabled = enable;
    return { ok: true, value: enable };
  }

  async connectBluetoothDevice(address: string): Promise<NativeResult<boolean>> {
    this.mockBluetooth.bondedDevices = this.mockBluetooth.bondedDevices.map((d) =>
      d.address === address ? { ...d, isConnected: true } : d
    );
    return { ok: true, value: true };
  }

  async disconnectBluetoothDevice(address: string): Promise<NativeResult<boolean>> {
    this.mockBluetooth.bondedDevices = this.mockBluetooth.bondedDevices.map((d) =>
      d.address === address ? { ...d, isConnected: false } : d
    );
    return { ok: true, value: true };
  }

  async toggleFlashlight(enable: boolean): Promise<NativeResult<boolean>> {
    this.isTorchOn = enable;
    return { ok: true, value: this.isTorchOn };
  }

  async getBatteryInfo(): Promise<{ level: number; isCharging: boolean; plugType: string; temperatureC?: number; voltageMv?: number }> {
    return {
      level: 100,
      isCharging: true,
      plugType: 'AC Fast Charger',
      temperatureC: 28,
      voltageMv: 4200,
    };
  }

  async getStorageInfo(): Promise<{ totalGB: number; freeGB: number; usedGB: number; usedPercent: number }> {
    return {
      totalGB: 256.0,
      freeGB: 184.2,
      usedGB: 71.8,
      usedPercent: 28,
    };
  }

  async getMemoryInfo(): Promise<{ totalRAM_GB: number; availRAM_GB: number; usedRAM_GB: number; usedPercent: number; lowMemory?: boolean }> {
    return {
      totalRAM_GB: 12.0,
      availRAM_GB: 7.4,
      usedRAM_GB: 4.6,
      usedPercent: 38,
      lowMemory: false,
    };
  }

  async getDeviceInfo(): Promise<{ model: string; manufacturer: string; brand: string; device: string; androidVersion: string; sdkInt: number; securityPatch: string; cpuAbi: string; uptimeSeconds: number }> {
    return {
      model: 'Nothing Phone (2a) Plus',
      manufacturer: 'Nothing',
      brand: 'Nothing',
      device: 'PacmanPro',
      androidVersion: '15',
      sdkInt: 35,
      securityPatch: '2026-10-01',
      cpuAbi: 'arm64-v8a',
      uptimeSeconds: 72400,
    };
  }

  async getVolume(): Promise<{ volume: number }> {
    return { volume: 75 };
  }

  async setVolume(_volume: number): Promise<{ success: boolean }> {
    return { success: true };
  }

  async getBrightness(): Promise<{ brightness: number }> {
    return { brightness: 85 };
  }

  async setBrightness(_brightness: number): Promise<{ success: boolean }> {
    return { success: true };
  }

  async getWifiScanResults(): Promise<WifiNetworkItem[]> {
    return [
      { ssid: 'NOTHING_WIFI_5G', bssid: 'AA:BB:CC:DD:EE:01', level: 5, frequency: 5180, capabilities: '[WPA2-PSK-CCMP]' },
      { ssid: 'Nothing_Studio_Guest', bssid: 'AA:BB:CC:DD:EE:02', level: 4, frequency: 2437, capabilities: '[WPA2-PSK-CCMP]' },
      { ssid: 'DeskLab_HighSpeed', bssid: 'AA:BB:CC:DD:EE:03', level: 3, frequency: 5240, capabilities: '[WPA3-SAE-CCMP]' },
    ];
  }

  async listDirectory(path?: string): Promise<NativeResult<{ currentPath: string; parentPath: string | null; items: Array<{ name: string; path: string; isDirectory: boolean; size: number; lastModified: number; extension: string }> }>> {
    const cur = path || '/storage/emulated/0';
    return {
      ok: true,
      value: {
        currentPath: cur,
        parentPath: cur !== '/storage/emulated/0' ? '/storage/emulated/0' : null,
        items: [
          { name: 'Download', path: `${cur}/Download`, isDirectory: true, size: 0, lastModified: Date.now() - 3600000, extension: '' },
          { name: 'Documents', path: `${cur}/Documents`, isDirectory: true, size: 0, lastModified: Date.now() - 7200000, extension: '' },
          { name: 'DCIM', path: `${cur}/DCIM`, isDirectory: true, size: 0, lastModified: Date.now() - 86400000, extension: '' },
          { name: 'Pictures', path: `${cur}/Pictures`, isDirectory: true, size: 0, lastModified: Date.now() - 172800000, extension: '' },
          { name: 'Music', path: `${cur}/Music`, isDirectory: true, size: 0, lastModified: Date.now() - 259200000, extension: '' },
          { name: 'Notes.txt', path: `${cur}/Notes.txt`, isDirectory: false, size: 1024, lastModified: Date.now() - 1800000, extension: 'txt' },
          { name: 'NothingDesk_Config.json', path: `${cur}/NothingDesk_Config.json`, isDirectory: false, size: 2048, lastModified: Date.now() - 600000, extension: 'json' },
        ],
      },
    };
  }

  async readFileText(path: string): Promise<NativeResult<string>> {
    return {
      ok: true,
      value: `# Nothing Desk Document\nPath: ${path}\nCreated with Nothing Desk DeX Mode.\nDot-matrix aesthetics and multi-window productivity.`,
    };
  }

  async writeFileText(_path: string, _content: string): Promise<NativeResult<boolean>> {
    return { ok: true, value: true };
  }

  async createFolder(_parentPath: string, _folderName: string): Promise<NativeResult<boolean>> {
    return { ok: true, value: true };
  }

  async deleteItem(_path: string): Promise<NativeResult<boolean>> {
    return { ok: true, value: true };
  }

  async getDevicePhotos(_limit?: number, _offset?: number): Promise<NativeResult<Array<{ id: string; displayName: string; dateAdded: number; size: number; mimeType: string; uri: string; path?: string }>>> {
    return {
      ok: true,
      value: [
        { id: '1', displayName: 'IMG_20261017_001.jpg', dateAdded: Date.now() - 3600000, size: 4200000, mimeType: 'image/jpeg', uri: 'content://media/external/images/media/1', path: '/storage/emulated/0/DCIM/Camera/IMG_001.jpg' },
        { id: '2', displayName: 'IMG_20261017_002.jpg', dateAdded: Date.now() - 7200000, size: 3800000, mimeType: 'image/jpeg', uri: 'content://media/external/images/media/2', path: '/storage/emulated/0/DCIM/Camera/IMG_002.jpg' },
        { id: '3', displayName: 'Screenshot_20261017.png', dateAdded: Date.now() - 14400000, size: 1200000, mimeType: 'image/png', uri: 'content://media/external/images/media/3', path: '/storage/emulated/0/Pictures/Screenshots/Screenshot_001.png' },
      ],
    };
  }

  async getPhotoThumbnail(_id?: string, _path?: string, _targetSize?: number): Promise<NativeResult<string>> {
    return {
      ok: true,
      value: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%231a1a1a"/><text x="50%" y="50%" fill="%23d71921" font-family="monospace" font-size="14" text-anchor="middle" dy=".3em">NOTHING PHOTO</text></svg>',
    };
  }

  async getDeviceContacts(): Promise<NativeResult<DeviceContact[]>> {
    return {
      ok: true,
      value: [
        { id: 'c1', name: 'Carl Pei', number: '+44 7700 900077', label: 'Mobile' },
        { id: 'c2', name: 'Nothing Support', number: '+1 800 555 0199', label: 'Work' },
        { id: 'c3', name: 'Desk Dev Team', number: '+91 98765 43210', label: 'Work' },
        { id: 'c4', name: 'Akira Tanaka', number: '+81 90 1234 5678', label: 'Mobile' },
        { id: 'c5', name: 'Sarah Connor', number: '+1 555 2368', label: 'Home' },
      ],
    };
  }

  async getDeviceCallLog(): Promise<NativeResult<DeviceCallLogItem[]>> {
    const now = Date.now();
    return {
      ok: true,
      value: [
        { id: 'l1', name: 'Carl Pei', number: '+44 7700 900077', timestamp: now - 1800000, durationSeconds: 145, type: 'incoming' },
        { id: 'l2', name: 'Nothing Support', number: '+1 800 555 0199', timestamp: now - 7200000, durationSeconds: 320, type: 'outgoing' },
        { id: 'l3', name: 'Unknown Caller', number: '+1 888 234 5678', timestamp: now - 18000000, durationSeconds: 0, type: 'missed' },
        { id: 'l4', name: 'Desk Dev Team', number: '+91 98765 43210', timestamp: now - 86400000, durationSeconds: 512, type: 'incoming' },
        { id: 'l5', name: 'Spam Telemarketer', number: '+1 800 999 8888', timestamp: now - 95000000, durationSeconds: 0, type: 'rejected' },
      ],
    };
  }

  async makePhoneCall(number: string): Promise<NativeResult<boolean>> {
    console.log(`[MockAdapter] Dialing number: ${number}`);
    return { ok: true, value: true };
  }
}

export const mockPlatformAdapter = new MockPlatformAdapter();

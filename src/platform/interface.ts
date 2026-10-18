import type {
  DesktopCapabilities,
  DirectoryReference,
  FileReference,
  InstalledApp,
  NativeResult,
  OperatingMode,
} from './capabilities';

export interface WifiStatus {
  isEnabled: boolean;
  ssid?: string;
  signalStrength?: number;
  linkSpeedMbps?: number;
  frequencyMHz?: number;
}

export interface WifiNetworkItem {
  ssid: string;
  bssid: string;
  level: number;
  frequency: number;
  capabilities: string;
}

export interface BluetoothDeviceInfo {
  name: string;
  address: string;
  isConnected?: boolean;
}

export interface BluetoothStatus {
  isEnabled: boolean;
  bondedDevices: BluetoothDeviceInfo[];
}

export interface BatteryInfo {
  level: number;
  isCharging: boolean;
  plugType: string;
  temperatureC?: number;
  voltageMv?: number;
}

export interface StorageInfo {
  totalGB: number;
  freeGB: number;
  usedGB: number;
  usedPercent: number;
}

export interface MemoryInfo {
  totalRAM_GB: number;
  availRAM_GB: number;
  usedRAM_GB: number;
  usedPercent: number;
  lowMemory?: boolean;
}

export interface DeviceInfo {
  model: string;
  manufacturer: string;
  brand: string;
  device: string;
  androidVersion: string;
  sdkInt: number;
  securityPatch: string;
  cpuAbi: string;
  uptimeSeconds: number;
}

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  lastModified: number;
  extension: string;
}

export interface DirectoryListing {
  currentPath: string;
  parentPath: string | null;
  items: FileItem[];
}

export interface PhotoItem {
  id: string;
  displayName: string;
  dateAdded: number;
  size: number;
  mimeType: string;
  uri: string;
  path?: string;
  mediaType?: 'image' | 'video';
  duration?: number;
}

/**
 * Platform adapter contract isolating all native Android/Capacitor or browser operations.
 * UI components interact with Android hardware and settings through this interface.
 */
export interface IPlatformAdapter {
  /** Returns the detected device capabilities */
  getCapabilities(): Promise<DesktopCapabilities>;

  /** Query installed launchable applications */
  getInstalledApps(): Promise<NativeResult<InstalledApp[]>>;

  /** Request OS to launch an installed application by package name with optional freeform window bounds */
  launchApp(packageName: string, bounds?: { left?: number; top?: number; width?: number; height?: number }): Promise<NativeResult<boolean>>;

  /** Opens standard SAF file picker for a user-selected file */
  pickUserFile(options?: { mimeType?: string }): Promise<NativeResult<FileReference>>;

  /** Opens standard SAF folder picker for user-selected directory */
  pickUserDirectory(): Promise<NativeResult<DirectoryReference>>;

  /** Requests secure device lock via native OS capability */
  requestLockScreen(): Promise<NativeResult<boolean>>;

  /** Gets current operating display/input mode */
  getOperatingMode(): OperatingMode;

  /** Listen for display topology or hardware peripheral connection changes */
  onDisplayChange(callback: (capabilities: DesktopCapabilities) => void): () => void;

  /** Opens Android Settings Panel for Wi-Fi / Internet */
  openWifiPanel(): Promise<NativeResult<boolean>>;

  /** Opens Android Settings for Bluetooth */
  openBluetoothSettings(): Promise<NativeResult<boolean>>;

  /** Opens Android Volume & Sound Panel */
  openVolumePanel(): Promise<NativeResult<boolean>>;

  /** Opens Android Display Settings */
  openDisplaySettings(): Promise<NativeResult<boolean>>;

  /** Get live Wi-Fi connection info */
  getWifiInfo(): Promise<WifiStatus>;

  /** Scan for nearby real Wi-Fi networks */
  getWifiScanResults(): Promise<WifiNetworkItem[]>;

  /** Get live Bluetooth status and bonded devices */
  getBluetoothInfo(): Promise<BluetoothStatus>;

  /** Toggle Wi-Fi state */
  setWifiEnabled(enable: boolean): Promise<NativeResult<boolean>>;

  /** Connect to Wi-Fi network directly with optional password */
  connectWifi(ssid: string, password?: string): Promise<NativeResult<boolean>>;

  /** Disconnect current Wi-Fi network */
  disconnectWifi(): Promise<NativeResult<boolean>>;

  /** Toggle Bluetooth state */
  setBluetoothEnabled(enable: boolean): Promise<NativeResult<boolean>>;

  /** Connect to bonded Bluetooth device */
  connectBluetoothDevice(address: string): Promise<NativeResult<boolean>>;

  /** Disconnect from bonded Bluetooth device */
  disconnectBluetoothDevice(address: string): Promise<NativeResult<boolean>>;

  /** Toggle phone flashlight / torch */
  toggleFlashlight(enable: boolean): Promise<NativeResult<boolean>>;

  /** Real Battery telemetry */
  getBatteryInfo(): Promise<BatteryInfo>;

  /** Real Storage telemetry */
  getStorageInfo(): Promise<StorageInfo>;

  /** Real Memory / RAM telemetry */
  getMemoryInfo(): Promise<MemoryInfo>;

  /** Real Device model & OS details */
  getDeviceInfo(): Promise<DeviceInfo>;

  /** Real Audio Volume (0-100) */
  getVolume(): Promise<{ volume: number }>;

  /** Set Audio Volume (0-100) */
  setVolume(volume: number): Promise<{ success: boolean }>;

  /** Real Brightness (0-100) */
  getBrightness(): Promise<{ brightness: number }>;

  /** Set Screen Brightness (0-100) */
  setBrightness(brightness: number): Promise<{ success: boolean }>;

  /** Real File Manager: List files & folders on device storage */
  listDirectory(path?: string): Promise<NativeResult<DirectoryListing>>;

  /** Real File Manager: Read file text */
  readFileText(path: string): Promise<NativeResult<string>>;

  /** Real File Manager: Write file text */
  writeFileText(path: string, content: string): Promise<NativeResult<boolean>>;

  /** Real File Manager: Create folder */
  createFolder(parentPath: string, folderName: string): Promise<NativeResult<boolean>>;

  /** Real File Manager: Delete file or directory */
  deleteItem(path: string): Promise<NativeResult<boolean>>;

  /** Real Photos: Query device photo gallery */
  getDevicePhotos(limit?: number, offset?: number): Promise<NativeResult<PhotoItem[]>>;

  /** Real Photos: Load thumbnail base64 */
  getPhotoThumbnail(id?: string, path?: string, targetSize?: number): Promise<NativeResult<string>>;

  /** Phone: Query device contacts */
  getDeviceContacts(): Promise<NativeResult<DeviceContact[]>>;

  /** Phone: Query device call log */
  getDeviceCallLog(): Promise<NativeResult<DeviceCallLogItem[]>>;

  /** Phone: Make call directly via phone dialer */
  makePhoneCall(number: string): Promise<NativeResult<boolean>>;
}

export interface DeviceContact {
  id: string;
  name: string;
  number: string;
  label?: string;
  photoUri?: string;
}

export interface DeviceCallLogItem {
  id: string;
  number: string;
  name: string;
  timestamp: number;
  durationSeconds: number;
  type: 'incoming' | 'outgoing' | 'missed' | 'rejected';
}

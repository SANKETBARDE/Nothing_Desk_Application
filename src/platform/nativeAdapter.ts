import { Capacitor, registerPlugin } from '@capacitor/core';
import type {
  DesktopCapabilities,
  DirectoryReference,
  FileReference,
  InstalledApp,
  NativeResult,
  OperatingMode,
} from './capabilities';
import type {
  IPlatformAdapter,
  WifiStatus,
  WifiNetworkItem,
  BluetoothStatus,
  BatteryInfo,
  StorageInfo,
  MemoryInfo,
  DeviceInfo,
  DirectoryListing,
  PhotoItem,
  DeviceContact,
  DeviceCallLogItem,
  HardwarePermissionsStatus,
} from './interface';
import { MockPlatformAdapter } from './mockAdapter';

interface AppLauncherPluginNative {
  getInstalledApps(): Promise<{ apps: Array<{ packageName: string; label: string; isSystemApp: boolean }> }>;
  launchApp(options: {
    packageName: string;
    left?: number;
    top?: number;
    width?: number;
    height?: number;
  }): Promise<{ success: boolean }>;
}

interface StorageBridgePluginNative {
  pickFile(options?: { mimeType?: string }): Promise<FileReference>;
  listDirectory(options?: { path?: string }): Promise<DirectoryListing>;
  readFileText(options: { path: string }): Promise<{ path: string; content: string; size: number }>;
  writeFileText(options: { path: string; content: string }): Promise<{ success: boolean; path: string; size: number }>;
  createFolder(options: { parentPath: string; folderName: string }): Promise<{ success: boolean; path: string }>;
  deleteItem(options: { path: string }): Promise<{ success: boolean }>;
  getDevicePhotos(options?: { limit?: number; offset?: number }): Promise<{ photos: PhotoItem[] }>;
  getPhotoThumbnail(options: { id?: string; path?: string; targetSize?: number }): Promise<{ dataUrl: string }>;
}

interface DisplayDetectPluginNative {
  getDisplayInfo(): Promise<{ displayCount: number; hasExternalDisplay: boolean; supportsSeparateExternalDesktop: boolean }>;
  addListener(
    eventName: 'displayChanged',
    listenerFunc: (info: { displayCount: number; hasExternalDisplay: boolean; supportsSeparateExternalDesktop: boolean }) => void
  ): Promise<{ remove: () => Promise<void> }>;
}

interface SystemControlPluginNative {
  openWifiPanel(): Promise<{ success: boolean }>;
  openBluetoothSettings(): Promise<{ success: boolean }>;
  openVolumePanel(): Promise<{ success: boolean }>;
  openDisplaySettings(): Promise<{ success: boolean }>;
  openLocationSettings(): Promise<{ success: boolean }>;
  openAppSettings(): Promise<{ success: boolean }>;
  checkHardwarePermissions(): Promise<HardwarePermissionsStatus>;
  requestHardwarePermissions(): Promise<{ requested: boolean }>;
  getWifiInfo(): Promise<WifiStatus>;
  getWifiScanResults(): Promise<{ networks: WifiNetworkItem[]; locationRequired?: boolean }>;
  getBluetoothInfo(): Promise<BluetoothStatus>;
  toggleFlashlight(options: { enable: boolean }): Promise<{ success: boolean }>;
  getBatteryInfo(): Promise<BatteryInfo>;
  getStorageInfo(): Promise<StorageInfo>;
  getMemoryInfo(): Promise<MemoryInfo>;
  getDeviceInfo(): Promise<DeviceInfo>;
  getVolume(): Promise<{ volume: number }>;
  setVolume(options: { volume: number }): Promise<{ success: boolean }>;
  getBrightness(): Promise<{ brightness: number }>;
  setBrightness(options: { brightness: number }): Promise<{ success: boolean }>;
  getDeviceContacts(): Promise<{ contacts: DeviceContact[] }>;
  getDeviceCallLog(): Promise<{ calls: DeviceCallLogItem[] }>;
  makePhoneCall(options: { number: string }): Promise<{ success: boolean }>;
  setWifiEnabled(options: { enable: boolean }): Promise<{ success: boolean; isEnabled: boolean; openedPanel?: boolean }>;
  connectWifi(options: { ssid: string; password?: string }): Promise<{ success: boolean; ssid: string }>;
  disconnectWifi(): Promise<{ success: boolean }>;
  setBluetoothEnabled(options: { enable: boolean }): Promise<{ success: boolean; isEnabled: boolean }>;
  connectBluetoothDevice(options: { address: string }): Promise<{ success: boolean }>;
  disconnectBluetoothDevice(options: { address: string }): Promise<{ success: boolean }>;
}

const AppLauncher = registerPlugin<AppLauncherPluginNative>('AppLauncher');
const StorageBridge = registerPlugin<StorageBridgePluginNative>('StorageBridge');
const DisplayDetect = registerPlugin<DisplayDetectPluginNative>('DisplayDetect');
const SystemControl = registerPlugin<SystemControlPluginNative>('SystemControl');

export class NativePlatformAdapter implements IPlatformAdapter {
  private fallbackMock = new MockPlatformAdapter();
  private isNative = Capacitor.isNativePlatform();

  async getCapabilities(): Promise<DesktopCapabilities> {
    if (!this.isNative) {
      return this.fallbackMock.getCapabilities();
    }

    try {
      const displayInfo = await DisplayDetect.getDisplayInfo();
      const isPointerFine = typeof window !== 'undefined' ? window.matchMedia('(pointer: fine)').matches : false;
      const isTouch = typeof window !== 'undefined' ? 'ontouchstart' in window || navigator.maxTouchPoints > 0 : true;

      return {
        canListLaunchableApps: true,
        canLaunchAndroidApps: true,
        hasExternalDisplay: displayInfo.hasExternalDisplay,
        supportsSeparateExternalDesktop: displayInfo.supportsSeparateExternalDesktop,
        supportsSystemWindowing: false,
        hasHardwareKeyboard: isPointerFine,
        hasPointerDevice: isPointerFine,
        screenDensity: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
        isTouchScreen: isTouch,
      };
    } catch {
      return this.fallbackMock.getCapabilities();
    }
  }

  getOperatingMode(): OperatingMode {
    if (!this.isNative) {
      return this.fallbackMock.getOperatingMode();
    }
    const isPointerFine = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;
    return isPointerFine ? 'PHONE_POINTER' : 'PHONE_TOUCH';
  }

  async getInstalledApps(): Promise<NativeResult<InstalledApp[]>> {
    if (!this.isNative) {
      return this.fallbackMock.getInstalledApps();
    }

    try {
      const res = await AppLauncher.getInstalledApps();
      const mapped: InstalledApp[] = res.apps.map((a) => ({
        packageName: a.packageName,
        label: a.label,
        isSystemApp: a.isSystemApp,
      }));
      return { ok: true, value: mapped };
    } catch (e: unknown) {
      return {
        ok: false,
        code: 'LAUNCHER_QUERY_FAILED',
        message: (e as Error).message || 'Failed to query installed apps.',
      };
    }
  }

  async launchApp(
    packageName: string,
    bounds?: { left?: number; top?: number; width?: number; height?: number }
  ): Promise<NativeResult<boolean>> {
    if (!this.isNative) {
      return this.fallbackMock.launchApp(packageName, bounds);
    }

    try {
      const res = await AppLauncher.launchApp({
        packageName,
        left: bounds?.left,
        top: bounds?.top,
        width: bounds?.width,
        height: bounds?.height,
      });
      return { ok: true, value: res.success };
    } catch (e: unknown) {
      return {
        ok: false,
        code: 'APP_LAUNCH_FAILED',
        message: (e as Error).message || 'Failed to start activity.',
      };
    }
  }

  async pickUserFile(options?: { mimeType?: string }): Promise<NativeResult<FileReference>> {
    if (!this.isNative) {
      return this.fallbackMock.pickUserFile(options);
    }

    try {
      const file = await StorageBridge.pickFile({ mimeType: options?.mimeType || '*/*' });
      return { ok: true, value: file };
    } catch (e: unknown) {
      return {
        ok: false,
        code: 'USER_CANCELLED',
        message: (e as Error).message || 'User dismissed document picker.',
      };
    }
  }

  async pickUserDirectory(): Promise<NativeResult<DirectoryReference>> {
    return this.fallbackMock.pickUserDirectory();
  }

  async requestLockScreen(): Promise<NativeResult<boolean>> {
    return this.fallbackMock.requestLockScreen();
  }

  onDisplayChange(callback: (capabilities: DesktopCapabilities) => void): () => void {
    if (!this.isNative) {
      return this.fallbackMock.onDisplayChange(callback);
    }

    let removeHandle: (() => Promise<void>) | null = null;
    DisplayDetect.addListener('displayChanged', () => {
      this.getCapabilities().then(callback);
    }).then((h) => {
      removeHandle = h.remove;
    });

    return () => {
      if (removeHandle) removeHandle();
    };
  }

  async openWifiPanel(): Promise<NativeResult<boolean>> {
    if (!this.isNative) return this.fallbackMock.openWifiPanel();
    try {
      const res = await SystemControl.openWifiPanel();
      return { ok: true, value: res.success };
    } catch {
      return { ok: false, code: 'WIFI_PANEL_FAILED', message: 'Failed to open Wi-Fi panel' };
    }
  }

  async openBluetoothSettings(): Promise<NativeResult<boolean>> {
    if (!this.isNative) return this.fallbackMock.openBluetoothSettings();
    try {
      const res = await SystemControl.openBluetoothSettings();
      return { ok: true, value: res.success };
    } catch {
      return { ok: false, code: 'BT_SETTINGS_FAILED', message: 'Failed to open Bluetooth settings' };
    }
  }

  async openVolumePanel(): Promise<NativeResult<boolean>> {
    if (!this.isNative) return this.fallbackMock.openVolumePanel();
    try {
      const res = await SystemControl.openVolumePanel();
      return { ok: true, value: res.success };
    } catch {
      return { ok: false, code: 'VOLUME_PANEL_FAILED', message: 'Failed to open volume settings' };
    }
  }

  async openDisplaySettings(): Promise<NativeResult<boolean>> {
    if (!this.isNative) return this.fallbackMock.openDisplaySettings();
    try {
      const res = await SystemControl.openDisplaySettings();
      return { ok: true, value: res.success };
    } catch {
      return { ok: false, code: 'DISPLAY_SETTINGS_FAILED', message: 'Failed to open display settings' };
    }
  }

  async openLocationSettings(): Promise<NativeResult<boolean>> {
    if (!this.isNative) return this.fallbackMock.openLocationSettings();
    try {
      const res = await SystemControl.openLocationSettings();
      return { ok: true, value: res.success };
    } catch {
      return { ok: false, code: 'LOCATION_SETTINGS_FAILED', message: 'Failed to open location settings' };
    }
  }

  async openAppSettings(): Promise<NativeResult<boolean>> {
    if (!this.isNative) return this.fallbackMock.openAppSettings();
    try {
      const res = await SystemControl.openAppSettings();
      return { ok: true, value: res.success };
    } catch {
      return { ok: false, code: 'APP_SETTINGS_FAILED', message: 'Failed to open app settings' };
    }
  }

  async checkHardwarePermissions(): Promise<HardwarePermissionsStatus> {
    if (!this.isNative) return this.fallbackMock.checkHardwarePermissions();
    try {
      return await SystemControl.checkHardwarePermissions();
    } catch {
      return {
        allGranted: false,
        location: false,
        bluetooth: false,
        camera: false,
        contacts: false,
        phone: false,
        storage: false,
      };
    }
  }

  async requestHardwarePermissions(): Promise<NativeResult<boolean>> {
    if (!this.isNative) return this.fallbackMock.requestHardwarePermissions();
    try {
      const res = await SystemControl.requestHardwarePermissions();
      return { ok: true, value: res.requested };
    } catch (e: unknown) {
      return { ok: false, code: 'PERM_REQUEST_FAILED', message: (e as Error).message };
    }
  }

  async getWifiInfo(): Promise<WifiStatus> {
    if (!this.isNative) return this.fallbackMock.getWifiInfo();
    try {
      return await SystemControl.getWifiInfo();
    } catch {
      return { isEnabled: false };
    }
  }

  async getWifiScanResults(): Promise<WifiNetworkItem[]> {
    if (!this.isNative) return this.fallbackMock.getWifiScanResults();
    try {
      const res = await SystemControl.getWifiScanResults();
      return res.networks || [];
    } catch {
      return [];
    }
  }

  async getBluetoothInfo(): Promise<BluetoothStatus> {
    if (!this.isNative) return this.fallbackMock.getBluetoothInfo();
    try {
      return await SystemControl.getBluetoothInfo();
    } catch {
      return { isEnabled: false, bondedDevices: [] };
    }
  }

  async setWifiEnabled(enable: boolean): Promise<NativeResult<boolean>> {
    if (!this.isNative) return this.fallbackMock.setWifiEnabled(enable);
    try {
      const res = await SystemControl.setWifiEnabled({ enable });
      return { ok: true, value: res.success };
    } catch (e: unknown) {
      return { ok: false, code: 'WIFI_TOGGLE_FAILED', message: (e as Error).message };
    }
  }

  async connectWifi(ssid: string, password?: string): Promise<NativeResult<boolean>> {
    if (!this.isNative) return this.fallbackMock.connectWifi(ssid, password);
    try {
      const res = await SystemControl.connectWifi({ ssid, password });
      return { ok: true, value: res.success };
    } catch (e: unknown) {
      return { ok: false, code: 'WIFI_CONNECT_FAILED', message: (e as Error).message };
    }
  }

  async disconnectWifi(): Promise<NativeResult<boolean>> {
    if (!this.isNative) return this.fallbackMock.disconnectWifi();
    try {
      const res = await SystemControl.disconnectWifi();
      return { ok: true, value: res.success };
    } catch (e: unknown) {
      return { ok: false, code: 'WIFI_DISCONNECT_FAILED', message: (e as Error).message };
    }
  }

  async setBluetoothEnabled(enable: boolean): Promise<NativeResult<boolean>> {
    if (!this.isNative) return this.fallbackMock.setBluetoothEnabled(enable);
    try {
      const res = await SystemControl.setBluetoothEnabled({ enable });
      return { ok: true, value: res.success };
    } catch (e: unknown) {
      return { ok: false, code: 'BT_TOGGLE_FAILED', message: (e as Error).message };
    }
  }

  async connectBluetoothDevice(address: string): Promise<NativeResult<boolean>> {
    if (!this.isNative) return this.fallbackMock.connectBluetoothDevice(address);
    try {
      const res = await SystemControl.connectBluetoothDevice({ address });
      return { ok: true, value: res.success };
    } catch (e: unknown) {
      return { ok: false, code: 'BT_CONNECT_FAILED', message: (e as Error).message };
    }
  }

  async disconnectBluetoothDevice(address: string): Promise<NativeResult<boolean>> {
    if (!this.isNative) return this.fallbackMock.disconnectBluetoothDevice(address);
    try {
      const res = await SystemControl.disconnectBluetoothDevice({ address });
      return { ok: true, value: res.success };
    } catch (e: unknown) {
      return { ok: false, code: 'BT_DISCONNECT_FAILED', message: (e as Error).message };
    }
  }

  async toggleFlashlight(enable: boolean): Promise<NativeResult<boolean>> {
    if (!this.isNative) return this.fallbackMock.toggleFlashlight(enable);
    try {
      const res = await SystemControl.toggleFlashlight({ enable });
      return { ok: true, value: res.success };
    } catch (e: unknown) {
      return { ok: false, code: 'TORCH_FAILED', message: (e as Error).message };
    }
  }

  async getBatteryInfo(): Promise<BatteryInfo> {
    if (!this.isNative) return this.fallbackMock.getBatteryInfo();
    try {
      return await SystemControl.getBatteryInfo();
    } catch {
      return { level: 100, isCharging: false, plugType: 'Battery' };
    }
  }

  async getStorageInfo(): Promise<StorageInfo> {
    if (!this.isNative) return this.fallbackMock.getStorageInfo();
    try {
      return await SystemControl.getStorageInfo();
    } catch {
      return { totalGB: 128, freeGB: 64, usedGB: 64, usedPercent: 50 };
    }
  }

  async getMemoryInfo(): Promise<MemoryInfo> {
    if (!this.isNative) return this.fallbackMock.getMemoryInfo();
    try {
      return await SystemControl.getMemoryInfo();
    } catch {
      return { totalRAM_GB: 8, availRAM_GB: 4, usedRAM_GB: 4, usedPercent: 50 };
    }
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    if (!this.isNative) return this.fallbackMock.getDeviceInfo();
    try {
      return await SystemControl.getDeviceInfo();
    } catch {
      return {
        model: 'Nothing Phone',
        manufacturer: 'Nothing',
        brand: 'Nothing',
        device: 'Pacman',
        androidVersion: '15',
        sdkInt: 35,
        securityPatch: '2026',
        cpuAbi: 'arm64',
        uptimeSeconds: 3600,
      };
    }
  }

  async getVolume(): Promise<{ volume: number }> {
    if (!this.isNative) return this.fallbackMock.getVolume();
    try {
      return await SystemControl.getVolume();
    } catch {
      return { volume: 75 };
    }
  }

  async setVolume(volume: number): Promise<{ success: boolean }> {
    if (!this.isNative) return this.fallbackMock.setVolume(volume);
    try {
      return await SystemControl.setVolume({ volume });
    } catch {
      return { success: false };
    }
  }

  async getBrightness(): Promise<{ brightness: number }> {
    if (!this.isNative) return this.fallbackMock.getBrightness();
    try {
      return await SystemControl.getBrightness();
    } catch {
      return { brightness: 85 };
    }
  }

  async setBrightness(brightness: number): Promise<{ success: boolean }> {
    if (!this.isNative) return this.fallbackMock.setBrightness(brightness);
    try {
      return await SystemControl.setBrightness({ brightness });
    } catch {
      return { success: false };
    }
  }

  async listDirectory(path?: string): Promise<NativeResult<DirectoryListing>> {
    if (!this.isNative) return this.fallbackMock.listDirectory(path);
    try {
      const res = await StorageBridge.listDirectory({ path });
      return { ok: true, value: res };
    } catch (e: unknown) {
      return { ok: false, code: 'FS_LIST_FAILED', message: (e as Error).message };
    }
  }

  async readFileText(path: string): Promise<NativeResult<string>> {
    if (!this.isNative) return this.fallbackMock.readFileText(path);
    try {
      const res = await StorageBridge.readFileText({ path });
      return { ok: true, value: res.content };
    } catch (e: unknown) {
      return { ok: false, code: 'FS_READ_FAILED', message: (e as Error).message };
    }
  }

  async writeFileText(path: string, content: string): Promise<NativeResult<boolean>> {
    if (!this.isNative) return this.fallbackMock.writeFileText(path, content);
    try {
      const res = await StorageBridge.writeFileText({ path, content });
      return { ok: true, value: res.success };
    } catch (e: unknown) {
      return { ok: false, code: 'FS_WRITE_FAILED', message: (e as Error).message };
    }
  }

  async createFolder(parentPath: string, folderName: string): Promise<NativeResult<boolean>> {
    if (!this.isNative) return this.fallbackMock.createFolder(parentPath, folderName);
    try {
      const res = await StorageBridge.createFolder({ parentPath, folderName });
      return { ok: true, value: res.success };
    } catch (e: unknown) {
      return { ok: false, code: 'FS_CREATE_FAILED', message: (e as Error).message };
    }
  }

  async deleteItem(path: string): Promise<NativeResult<boolean>> {
    if (!this.isNative) return this.fallbackMock.deleteItem(path);
    try {
      const res = await StorageBridge.deleteItem({ path });
      return { ok: true, value: res.success };
    } catch (e: unknown) {
      return { ok: false, code: 'FS_DELETE_FAILED', message: (e as Error).message };
    }
  }

  async getDevicePhotos(limit?: number, offset?: number): Promise<NativeResult<PhotoItem[]>> {
    if (!this.isNative) return this.fallbackMock.getDevicePhotos(limit, offset);
    try {
      const res = await StorageBridge.getDevicePhotos({ limit, offset });
      return { ok: true, value: res.photos || [] };
    } catch (e: unknown) {
      return { ok: false, code: 'PHOTOS_QUERY_FAILED', message: (e as Error).message };
    }
  }

  async getPhotoThumbnail(id?: string, path?: string, targetSize?: number): Promise<NativeResult<string>> {
    if (!this.isNative) return this.fallbackMock.getPhotoThumbnail(id, path, targetSize);
    try {
      const res = await StorageBridge.getPhotoThumbnail({ id, path, targetSize });
      return { ok: true, value: res.dataUrl };
    } catch (e: unknown) {
      return { ok: false, code: 'THUMBNAIL_FAILED', message: (e as Error).message };
    }
  }

  async getDeviceContacts(): Promise<NativeResult<DeviceContact[]>> {
    if (!this.isNative) return this.fallbackMock.getDeviceContacts();
    try {
      const res = await SystemControl.getDeviceContacts();
      return { ok: true, value: res.contacts || [] };
    } catch (e: unknown) {
      return { ok: false, code: 'CONTACTS_FAILED', message: (e as Error).message };
    }
  }

  async getDeviceCallLog(): Promise<NativeResult<DeviceCallLogItem[]>> {
    if (!this.isNative) return this.fallbackMock.getDeviceCallLog();
    try {
      const res = await SystemControl.getDeviceCallLog();
      return { ok: true, value: res.calls || [] };
    } catch (e: unknown) {
      return { ok: false, code: 'CALL_LOG_FAILED', message: (e as Error).message };
    }
  }

  async makePhoneCall(number: string): Promise<NativeResult<boolean>> {
    if (!this.isNative) return this.fallbackMock.makePhoneCall(number);
    try {
      const res = await SystemControl.makePhoneCall({ number });
      return { ok: true, value: res.success };
    } catch (e: unknown) {
      return { ok: false, code: 'CALL_FAILED', message: (e as Error).message };
    }
  }
}

export const platformAdapter: IPlatformAdapter = new NativePlatformAdapter();

package tech.nothing.desk.plugins;

import android.app.Activity;
import android.app.ActivityManager;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.hardware.camera2.CameraManager;
import android.media.AudioManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.wifi.ScanResult;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Environment;
import android.os.StatFs;
import android.os.SystemClock;
import android.database.Cursor;
import android.net.Uri;
import android.provider.CallLog;
import android.provider.ContactsContract;
import android.provider.Settings;
import android.view.WindowManager;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiNetworkSuggestion;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@CapacitorPlugin(name = "SystemControl")
public class SystemControlPlugin extends Plugin {

    @PluginMethod
    public void getBatteryInfo(PluginCall call) {
        try {
            Context ctx = getContext();
            IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = ctx.registerReceiver(null, ifilter);

            int level = -1;
            int scale = -1;
            int status = -1;
            int chargePlug = -1;
            int temperature = 0;
            int voltage = 0;

            if (batteryStatus != null) {
                level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
                scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
                status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
                chargePlug = batteryStatus.getIntExtra(BatteryManager.EXTRA_PLUGGED, -1);
                temperature = batteryStatus.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0);
                voltage = batteryStatus.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 0);
            }

            int batteryPct = (level >= 0 && scale > 0) ? (int) ((level / (float) scale) * 100) : 100;
            boolean isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                                 status == BatteryManager.BATTERY_STATUS_FULL;

            String plugType = "Battery";
            if (chargePlug == BatteryManager.BATTERY_PLUGGED_AC) plugType = "AC Fast Charger";
            else if (chargePlug == BatteryManager.BATTERY_PLUGGED_USB) plugType = "USB Cable";
            else if (chargePlug == BatteryManager.BATTERY_PLUGGED_WIRELESS) plugType = "Wireless Dock";

            JSObject res = new JSObject();
            res.put("level", batteryPct);
            res.put("isCharging", isCharging);
            res.put("plugType", plugType);
            res.put("temperatureC", Math.round(temperature / 10.0));
            res.put("voltageMv", voltage);
            call.resolve(res);
        } catch (Exception e) {
            JSObject res = new JSObject();
            res.put("level", 100);
            res.put("isCharging", false);
            res.put("plugType", "Battery");
            call.resolve(res);
        }
    }

    @PluginMethod
    public void getStorageInfo(PluginCall call) {
        try {
            File path = Environment.getDataDirectory();
            StatFs stat = new StatFs(path.getPath());
            long blockSize = stat.getBlockSizeLong();
            long totalBlocks = stat.getBlockCountLong();
            long availableBlocks = stat.getAvailableBlocksLong();

            long totalBytes = totalBlocks * blockSize;
            long freeBytes = availableBlocks * blockSize;
            long usedBytes = totalBytes - freeBytes;

            double totalGB = Math.round((totalBytes / (1024.0 * 1024.0 * 1024.0)) * 10.0) / 10.0;
            double freeGB = Math.round((freeBytes / (1024.0 * 1024.0 * 1024.0)) * 10.0) / 10.0;
            double usedGB = Math.round((usedBytes / (1024.0 * 1024.0 * 1024.0)) * 10.0) / 10.0;
            int usedPercent = totalBytes > 0 ? (int) ((usedBytes * 100.0) / totalBytes) : 0;

            JSObject res = new JSObject();
            res.put("totalGB", totalGB);
            res.put("freeGB", freeGB);
            res.put("usedGB", usedGB);
            res.put("usedPercent", usedPercent);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to retrieve storage info: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getMemoryInfo(PluginCall call) {
        try {
            ActivityManager activityManager = (ActivityManager) getContext().getSystemService(Context.ACTIVITY_SERVICE);
            ActivityManager.MemoryInfo memoryInfo = new ActivityManager.MemoryInfo();
            if (activityManager != null) {
                activityManager.getMemoryInfo(memoryInfo);
            }

            long totalBytes = memoryInfo.totalMem;
            long availBytes = memoryInfo.availMem;
            long usedBytes = totalBytes - availBytes;

            double totalGB = Math.round((totalBytes / (1024.0 * 1024.0 * 1024.0)) * 10.0) / 10.0;
            double availGB = Math.round((availBytes / (1024.0 * 1024.0 * 1024.0)) * 10.0) / 10.0;
            double usedGB = Math.round((usedBytes / (1024.0 * 1024.0 * 1024.0)) * 10.0) / 10.0;
            int usedPercent = totalBytes > 0 ? (int) ((usedBytes * 100.0) / totalBytes) : 0;

            JSObject res = new JSObject();
            res.put("totalRAM_GB", totalGB);
            res.put("availRAM_GB", availGB);
            res.put("usedRAM_GB", usedGB);
            res.put("usedPercent", usedPercent);
            res.put("lowMemory", memoryInfo.lowMemory);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to retrieve memory info: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getDeviceInfo(PluginCall call) {
        try {
            JSObject res = new JSObject();
            res.put("model", Build.MODEL);
            res.put("manufacturer", Build.MANUFACTURER);
            res.put("brand", Build.BRAND);
            res.put("device", Build.DEVICE);
            res.put("androidVersion", Build.VERSION.RELEASE);
            res.put("sdkInt", Build.VERSION.SDK_INT);
            res.put("securityPatch", Build.VERSION.SECURITY_PATCH != null ? Build.VERSION.SECURITY_PATCH : "Recent");
            res.put("cpuAbi", Build.SUPPORTED_ABIS.length > 0 ? Build.SUPPORTED_ABIS[0] : "arm64-v8a");
            res.put("uptimeSeconds", SystemClock.elapsedRealtime() / 1000);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to retrieve device info: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getVolume(PluginCall call) {
        try {
            AudioManager am = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            int current = 0;
            int max = 15;
            if (am != null) {
                current = am.getStreamVolume(AudioManager.STREAM_MUSIC);
                max = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            }
            int percent = max > 0 ? (int) ((current * 100.0) / max) : 75;

            JSObject res = new JSObject();
            res.put("volume", percent);
            res.put("current", current);
            res.put("max", max);
            call.resolve(res);
        } catch (Exception e) {
            JSObject res = new JSObject();
            res.put("volume", 75);
            call.resolve(res);
        }
    }

    @PluginMethod
    public void setVolume(PluginCall call) {
        int percent = call.getInt("volume", 75);
        try {
            AudioManager am = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                int max = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
                int target = (int) Math.round((percent / 100.0) * max);
                am.setStreamVolume(AudioManager.STREAM_MUSIC, target, 0);
            }
            JSObject res = new JSObject();
            res.put("success", true);
            res.put("volume", percent);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to set volume: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getBrightness(PluginCall call) {
        try {
            Activity act = getActivity();
            float windowBrightness = (act != null) ? act.getWindow().getAttributes().screenBrightness : -1f;
            int percent;
            if (windowBrightness >= 0) {
                percent = Math.round(windowBrightness * 100);
            } else {
                int sysVal = Settings.System.getInt(getContext().getContentResolver(), Settings.System.SCREEN_BRIGHTNESS, 200);
                percent = Math.round((sysVal / 255f) * 100);
            }

            JSObject res = new JSObject();
            res.put("brightness", percent);
            call.resolve(res);
        } catch (Exception e) {
            JSObject res = new JSObject();
            res.put("brightness", 85);
            call.resolve(res);
        }
    }

    @PluginMethod
    public void setBrightness(PluginCall call) {
        final int percent = call.getInt("brightness", 85);
        final Activity act = getActivity();
        if (act != null) {
            act.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        WindowManager.LayoutParams lp = act.getWindow().getAttributes();
                        lp.screenBrightness = Math.max(0.05f, Math.min(1.0f, percent / 100.0f));
                        act.getWindow().setAttributes(lp);
                    } catch (Exception ignored) {
                    }
                }
            });
        }
        JSObject res = new JSObject();
        res.put("success", true);
        res.put("brightness", percent);
        call.resolve(res);
    }

    @PluginMethod
    public void openWifiPanel(PluginCall call) {
        try {
            Intent intent;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                intent = new Intent(Settings.Panel.ACTION_INTERNET_CONNECTIVITY);
            } else {
                intent = new Intent(Settings.ACTION_WIFI_SETTINGS);
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            Intent fallback = new Intent(Settings.ACTION_WIFI_SETTINGS);
            fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(fallback);
            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        }
    }

    @PluginMethod
    public void openBluetoothSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_BLUETOOTH_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to open Bluetooth settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openVolumePanel(PluginCall call) {
        try {
            Intent intent;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                intent = new Intent(Settings.Panel.ACTION_VOLUME);
            } else {
                intent = new Intent(Settings.ACTION_SOUND_SETTINGS);
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            Intent fallback = new Intent(Settings.ACTION_SOUND_SETTINGS);
            fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(fallback);
            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        }
    }

    @PluginMethod
    public void openDisplaySettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_DISPLAY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to open Display settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openLocationSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to open Location settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.fromParts("package", getContext().getPackageName(), null));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to open app settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void checkHardwarePermissions(PluginCall call) {
        Context ctx = getContext();
        boolean hasFineLoc = ctx.checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean hasCoarseLoc = ctx.checkSelfPermission(android.Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean hasLocation = hasFineLoc || hasCoarseLoc;

        boolean hasBt = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            hasBt = ctx.checkSelfPermission(android.Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
        }

        boolean hasCamera = ctx.checkSelfPermission(android.Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
        boolean hasContacts = ctx.checkSelfPermission(android.Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED;
        boolean hasPhone = ctx.checkSelfPermission(android.Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED;

        boolean hasStorage = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            hasStorage = ctx.checkSelfPermission(android.Manifest.permission.READ_MEDIA_IMAGES) == PackageManager.PERMISSION_GRANTED;
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            hasStorage = ctx.checkSelfPermission(android.Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
        }

        boolean allGranted = hasLocation && hasBt && hasCamera && hasContacts && hasPhone && hasStorage;

        JSObject res = new JSObject();
        res.put("allGranted", allGranted);
        res.put("location", hasLocation);
        res.put("bluetooth", hasBt);
        res.put("camera", hasCamera);
        res.put("contacts", hasContacts);
        res.put("phone", hasPhone);
        res.put("storage", hasStorage);
        call.resolve(res);
    }

    @PluginMethod
    public void requestHardwarePermissions(PluginCall call) {
        Activity act = getActivity();
        if (act != null) {
            act.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    tech.nothing.desk.MainActivity.requestAllPermissions(act);
                }
            });
        }
        JSObject res = new JSObject();
        res.put("requested", true);
        call.resolve(res);
    }

    @PluginMethod
    public void getWifiInfo(PluginCall call) {
        WifiManager wm = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        boolean isEnabled = wm != null && wm.isWifiEnabled();

        ConnectivityManager cm = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
        boolean isConnected = false;
        String resolvedSsid = null;
        int linkSpeed = 0;
        int frequency = 0;
        int signalLevel = 0;

        if (cm != null) {
            Network activeNet = cm.getActiveNetwork();
            if (activeNet != null) {
                NetworkCapabilities caps = cm.getNetworkCapabilities(activeNet);
                if (caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                    isConnected = true;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        try {
                            Object transportInfo = caps.getTransportInfo();
                            if (transportInfo instanceof WifiInfo) {
                                WifiInfo wi = (WifiInfo) transportInfo;
                                resolvedSsid = wi.getSSID();
                                linkSpeed = wi.getLinkSpeed();
                                frequency = wi.getFrequency();
                                signalLevel = WifiManager.calculateSignalLevel(wi.getRssi(), 5);
                            }
                        } catch (Exception ignored) {}
                    }
                }
            }
        }

        if (wm != null && (resolvedSsid == null || "<unknown ssid>".equals(resolvedSsid))) {
            try {
                WifiInfo connectionInfo = wm.getConnectionInfo();
                if (connectionInfo != null) {
                    if (connectionInfo.getNetworkId() != -1) {
                        isConnected = true;
                    }
                    if (resolvedSsid == null || "<unknown ssid>".equals(resolvedSsid)) {
                        resolvedSsid = connectionInfo.getSSID();
                    }
                    if (linkSpeed == 0) linkSpeed = connectionInfo.getLinkSpeed();
                    if (frequency == 0) frequency = connectionInfo.getFrequency();
                    if (signalLevel == 0) signalLevel = WifiManager.calculateSignalLevel(connectionInfo.getRssi(), 5);
                }
            } catch (Exception ignored) {}
        }

        String finalSsid = null;
        if (isConnected) {
            if (resolvedSsid != null) {
                resolvedSsid = resolvedSsid.replace("\"", "");
            }
            if (resolvedSsid == null || resolvedSsid.isEmpty() || "<unknown ssid>".equals(resolvedSsid) || "0x".equals(resolvedSsid)) {
                finalSsid = "Connected Wi-Fi";
            } else {
                finalSsid = resolvedSsid;
            }
        }

        JSObject res = new JSObject();
        res.put("isEnabled", isEnabled);
        res.put("isConnected", isConnected);
        res.put("ssid", finalSsid);
        res.put("linkSpeedMbps", linkSpeed);
        res.put("frequencyMHz", frequency);
        res.put("signalStrength", signalLevel);
        call.resolve(res);
    }

    @PluginMethod
    public void getWifiScanResults(PluginCall call) {
        try {
            WifiManager wm = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
            boolean isLocationEnabled = lm != null && (lm.isProviderEnabled(LocationManager.GPS_PROVIDER) || lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER));

            JSArray results = new JSArray();
            if (wm != null && wm.isWifiEnabled()) {
                try {
                    wm.startScan();
                } catch (Exception ignored) {}

                List<ScanResult> scanResults = null;
                try {
                    scanResults = wm.getScanResults();
                } catch (SecurityException ignored) {}

                if (scanResults != null) {
                    for (ScanResult sr : scanResults) {
                        if (sr.SSID == null || sr.SSID.isEmpty()) continue;
                        JSObject obj = new JSObject();
                        obj.put("ssid", sr.SSID);
                        obj.put("bssid", sr.BSSID);
                        obj.put("level", WifiManager.calculateSignalLevel(sr.level, 5));
                        obj.put("frequency", sr.frequency);
                        obj.put("capabilities", sr.capabilities);
                        results.put(obj);
                    }
                }
            }
            JSObject res = new JSObject();
            res.put("networks", results);
            res.put("locationRequired", !isLocationEnabled);
            call.resolve(res);
        } catch (Exception e) {
            JSObject res = new JSObject();
            res.put("networks", new JSArray());
            res.put("locationRequired", false);
            call.resolve(res);
        }
    }

    @PluginMethod
    public void setWifiEnabled(PluginCall call) {
        boolean enable = Boolean.TRUE.equals(call.getBoolean("enable", true));
        boolean toggledDirectly = false;
        try {
            WifiManager wm = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wm != null && Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                toggledDirectly = wm.setWifiEnabled(enable);
            }
        } catch (Exception ignored) {}

        boolean openedPanel = false;
        if (!toggledDirectly) {
            try {
                Intent panelIntent;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    panelIntent = new Intent(Settings.Panel.ACTION_INTERNET_CONNECTIVITY);
                } else {
                    panelIntent = new Intent(Settings.ACTION_WIFI_SETTINGS);
                }
                panelIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(panelIntent);
                openedPanel = true;
            } catch (Exception e) {
                try {
                    Intent fallback = new Intent(Settings.ACTION_WIFI_SETTINGS);
                    fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(fallback);
                    openedPanel = true;
                } catch (Exception ignored) {}
            }
        }

        JSObject res = new JSObject();
        res.put("success", toggledDirectly || openedPanel);
        res.put("isEnabled", enable);
        res.put("openedPanel", openedPanel);
        call.resolve(res);
    }

    @PluginMethod
    public void connectWifi(PluginCall call) {
        String ssid = call.getString("ssid");
        String password = call.getString("password");
        if (ssid == null || ssid.isEmpty()) {
            call.reject("SSID is required");
            return;
        }

        try {
            WifiManager wm = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wm != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    try {
                        WifiNetworkSuggestion.Builder builder = new WifiNetworkSuggestion.Builder()
                                .setSsid(ssid)
                                .setIsAppInteractionRequired(false);
                        if (password != null && !password.isEmpty()) {
                            builder.setWpa2Passphrase(password);
                        }
                        List<WifiNetworkSuggestion> list = new ArrayList<>();
                        list.add(builder.build());
                        wm.addNetworkSuggestions(list);
                    } catch (Exception ignored) {}
                }

                try {
                    WifiConfiguration conf = new WifiConfiguration();
                    conf.SSID = "\"" + ssid + "\"";
                    if (password != null && !password.isEmpty()) {
                        conf.preSharedKey = "\"" + password + "\"";
                    } else {
                        conf.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.NONE);
                    }
                    int netId = wm.addNetwork(conf);
                    if (netId != -1) {
                        wm.disconnect();
                        wm.enableNetwork(netId, true);
                        wm.reconnect();
                    }
                } catch (Exception ignored) {}
            }

            try {
                Intent panelIntent;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    panelIntent = new Intent(Settings.Panel.ACTION_INTERNET_CONNECTIVITY);
                } else {
                    panelIntent = new Intent(Settings.ACTION_WIFI_SETTINGS);
                }
                panelIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(panelIntent);
            } catch (Exception ignored) {}

            JSObject res = new JSObject();
            res.put("success", true);
            res.put("ssid", ssid);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to connect: " + e.getMessage());
        }
    }

    @PluginMethod
    public void disconnectWifi(PluginCall call) {
        try {
            WifiManager wm = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wm != null) {
                wm.disconnect();
            }
            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to disconnect: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getBluetoothInfo(PluginCall call) {
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        boolean isEnabled = adapter != null && adapter.isEnabled();
        JSArray devicesArray = new JSArray();

        if (adapter != null && isEnabled) {
            try {
                Set<BluetoothDevice> bonded = adapter.getBondedDevices();
                if (bonded != null) {
                    for (BluetoothDevice device : bonded) {
                        JSObject devObj = new JSObject();
                        String name = "Bluetooth Device";
                        try {
                            name = device.getName();
                            if (name == null || name.isEmpty()) {
                                name = device.getAddress();
                            }
                        } catch (SecurityException ignored) {}

                        devObj.put("name", name != null ? name : "Bluetooth Device");
                        devObj.put("address", device.getAddress());

                        boolean isConnected = false;
                        try {
                            Method isConnectedMethod = device.getClass().getMethod("isConnected");
                            isConnected = Boolean.TRUE.equals(isConnectedMethod.invoke(device));
                        } catch (Exception ignored) {}

                        devObj.put("isConnected", isConnected);
                        devicesArray.put(devObj);
                    }
                }
            } catch (SecurityException ignored) {}
        }

        JSObject res = new JSObject();
        res.put("isEnabled", isEnabled);
        res.put("bondedDevices", devicesArray);
        call.resolve(res);
    }

    @PluginMethod
    public void setBluetoothEnabled(PluginCall call) {
        boolean enable = Boolean.TRUE.equals(call.getBoolean("enable", true));
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null) {
            call.reject("Bluetooth is not supported on this device.");
            return;
        }

        boolean directSuccess = false;
        if (enable) {
            try {
                directSuccess = adapter.enable();
            } catch (Exception ignored) {}

            if (!directSuccess || !adapter.isEnabled()) {
                try {
                    Intent enableBtIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
                    enableBtIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(enableBtIntent);
                    directSuccess = true;
                } catch (Exception e) {
                    try {
                        Intent settingsIntent = new Intent(Settings.ACTION_BLUETOOTH_SETTINGS);
                        settingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        getContext().startActivity(settingsIntent);
                        directSuccess = true;
                    } catch (Exception ignored) {}
                }
            }
        } else {
            try {
                directSuccess = adapter.disable();
            } catch (Exception ignored) {}

            if (!directSuccess && adapter.isEnabled()) {
                try {
                    Intent settingsIntent = new Intent(Settings.ACTION_BLUETOOTH_SETTINGS);
                    settingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(settingsIntent);
                    directSuccess = true;
                } catch (Exception ignored) {}
            }
        }

        JSObject res = new JSObject();
        res.put("success", directSuccess);
        res.put("isEnabled", enable);
        call.resolve(res);
    }

    @PluginMethod
    public void connectBluetoothDevice(PluginCall call) {
        String address = call.getString("address");
        if (address == null || address.isEmpty()) {
            call.reject("Address required");
            return;
        }

        try {
            BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
            if (adapter != null) {
                BluetoothDevice device = adapter.getRemoteDevice(address);
                if (device != null) {
                    try {
                        Method connectMethod = device.getClass().getMethod("connect");
                        connectMethod.setAccessible(true);
                        connectMethod.invoke(device);
                    } catch (Exception e) {
                        try {
                            if (device.getBondState() != BluetoothDevice.BOND_BONDED) {
                                device.createBond();
                            }
                        } catch (Exception ignored) {}
                    }
                }
            }

            try {
                Intent settingsIntent = new Intent(Settings.ACTION_BLUETOOTH_SETTINGS);
                settingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(settingsIntent);
            } catch (Exception ignored) {}

            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to connect device: " + e.getMessage());
        }
    }

    @PluginMethod
    public void disconnectBluetoothDevice(PluginCall call) {
        String address = call.getString("address");
        if (address == null || address.isEmpty()) {
            call.reject("Address required");
            return;
        }

        try {
            BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
            if (adapter != null) {
                BluetoothDevice device = adapter.getRemoteDevice(address);
                if (device != null) {
                    try {
                        Method disconnectMethod = device.getClass().getMethod("disconnect");
                        disconnectMethod.setAccessible(true);
                        disconnectMethod.invoke(device);
                    } catch (Exception ignored) {}
                }
            }

            try {
                Intent settingsIntent = new Intent(Settings.ACTION_BLUETOOTH_SETTINGS);
                settingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(settingsIntent);
            } catch (Exception ignored) {}

            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to disconnect device: " + e.getMessage());
        }
    }

    @PluginMethod
    public void toggleFlashlight(PluginCall call) {
        boolean enable = Boolean.TRUE.equals(call.getBoolean("enable", false));
        CameraManager cameraManager = (CameraManager) getContext().getSystemService(Context.CAMERA_SERVICE);
        if (cameraManager == null) {
            call.reject("CameraManager not available");
            return;
        }

        try {
            String[] cameraIds = cameraManager.getCameraIdList();
            if (cameraIds.length > 0) {
                cameraManager.setTorchMode(cameraIds[0], enable);
                JSObject res = new JSObject();
                res.put("success", true);
                res.put("enabled", enable);
                call.resolve(res);
            } else {
                call.reject("No camera available for flashlight.");
            }
        } catch (Exception e) {
            call.reject("Flashlight toggle failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getDeviceContacts(PluginCall call) {
        JSArray contactsArray = new JSArray();
        try {
            Uri uri = ContactsContract.CommonDataKinds.Phone.CONTENT_URI;
            String[] projection = new String[]{
                ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                ContactsContract.CommonDataKinds.Phone.NUMBER,
                ContactsContract.CommonDataKinds.Phone.PHOTO_URI,
                ContactsContract.CommonDataKinds.Phone.TYPE
            };
            String sortOrder = ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC";

            try (Cursor cursor = getContext().getContentResolver().query(uri, projection, null, null, sortOrder)) {
                if (cursor != null) {
                    int idCol = cursor.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.CONTACT_ID);
                    int nameCol = cursor.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                    int numCol = cursor.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.NUMBER);
                    int photoCol = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.PHOTO_URI);
                    int typeCol = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.TYPE);

                    int count = 0;
                    while (cursor.moveToNext() && count < 300) {
                        String id = cursor.getString(idCol);
                        String name = cursor.getString(nameCol);
                        String number = cursor.getString(numCol);
                        String photo = photoCol != -1 ? cursor.getString(photoCol) : null;
                        int type = typeCol != -1 ? cursor.getInt(typeCol) : 1;

                        String label = "Mobile";
                        if (type == ContactsContract.CommonDataKinds.Phone.TYPE_HOME) label = "Home";
                        else if (type == ContactsContract.CommonDataKinds.Phone.TYPE_WORK) label = "Work";

                        JSObject contactObj = new JSObject();
                        contactObj.put("id", id + "_" + count);
                        contactObj.put("name", name != null ? name : number);
                        contactObj.put("number", number != null ? number : "");
                        contactObj.put("label", label);
                        if (photo != null) contactObj.put("photoUri", photo);

                        contactsArray.put(contactObj);
                        count++;
                    }
                }
            }
        } catch (Exception ignored) {
        }
        JSObject res = new JSObject();
        res.put("contacts", contactsArray);
        call.resolve(res);
    }

    @PluginMethod
    public void getDeviceCallLog(PluginCall call) {
        JSArray callsArray = new JSArray();
        try {
            Uri uri = CallLog.Calls.CONTENT_URI;
            String[] projection = new String[]{
                CallLog.Calls._ID,
                CallLog.Calls.NUMBER,
                CallLog.Calls.CACHED_NAME,
                CallLog.Calls.DATE,
                CallLog.Calls.DURATION,
                CallLog.Calls.TYPE
            };
            String sortOrder = CallLog.Calls.DATE + " DESC";

            try (Cursor cursor = getContext().getContentResolver().query(uri, projection, null, null, sortOrder)) {
                if (cursor != null) {
                    int idCol = cursor.getColumnIndexOrThrow(CallLog.Calls._ID);
                    int numCol = cursor.getColumnIndexOrThrow(CallLog.Calls.NUMBER);
                    int nameCol = cursor.getColumnIndex(CallLog.Calls.CACHED_NAME);
                    int dateCol = cursor.getColumnIndexOrThrow(CallLog.Calls.DATE);
                    int durCol = cursor.getColumnIndexOrThrow(CallLog.Calls.DURATION);
                    int typeCol = cursor.getColumnIndexOrThrow(CallLog.Calls.TYPE);

                    int count = 0;
                    while (cursor.moveToNext() && count < 100) {
                        long id = cursor.getLong(idCol);
                        String number = cursor.getString(numCol);
                        String cachedName = nameCol != -1 ? cursor.getString(nameCol) : null;
                        long date = cursor.getLong(dateCol);
                        long durationSec = cursor.getLong(durCol);
                        int rawType = cursor.getInt(typeCol);

                        String typeStr = "incoming";
                        if (rawType == CallLog.Calls.OUTGOING_TYPE) typeStr = "outgoing";
                        else if (rawType == CallLog.Calls.MISSED_TYPE) typeStr = "missed";
                        else if (rawType == CallLog.Calls.REJECTED_TYPE) typeStr = "rejected";

                        JSObject callObj = new JSObject();
                        callObj.put("id", String.valueOf(id));
                        callObj.put("number", number != null ? number : "Unknown");
                        callObj.put("name", (cachedName != null && !cachedName.isEmpty()) ? cachedName : (number != null ? number : "Unknown"));
                        callObj.put("timestamp", date);
                        callObj.put("durationSeconds", durationSec);
                        callObj.put("type", typeStr);

                        callsArray.put(callObj);
                        count++;
                    }
                }
            }
        } catch (Exception ignored) {
        }
        JSObject res = new JSObject();
        res.put("calls", callsArray);
        call.resolve(res);
    }

    @PluginMethod
    public void makePhoneCall(PluginCall call) {
        String num = call.getString("number");
        if (num == null || num.isEmpty()) {
            call.reject("Phone number is required");
            return;
        }

        try {
            Intent intent = new Intent(Intent.ACTION_CALL);
            intent.setData(Uri.parse("tel:" + Uri.encode(num)));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);

            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            // Fallback to ACTION_DIAL
            try {
                Intent dialIntent = new Intent(Intent.ACTION_DIAL);
                dialIntent.setData(Uri.parse("tel:" + Uri.encode(num)));
                dialIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(dialIntent);

                JSObject res = new JSObject();
                res.put("success", true);
                call.resolve(res);
            } catch (Exception ex) {
                call.reject("Failed to dial: " + ex.getMessage());
            }
        }
    }
}

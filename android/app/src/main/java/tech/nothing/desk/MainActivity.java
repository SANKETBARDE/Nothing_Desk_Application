package tech.nothing.desk;

import android.Manifest;
import android.content.pm.ActivityInfo;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;
import tech.nothing.desk.plugins.AppLauncherPlugin;
import tech.nothing.desk.plugins.StorageBridgePlugin;
import tech.nothing.desk.plugins.DisplayDetectPlugin;
import tech.nothing.desk.plugins.SystemControlPlugin;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Enforce full-screen sensor landscape orientation
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);

        registerPlugin(AppLauncherPlugin.class);
        registerPlugin(StorageBridgePlugin.class);
        registerPlugin(DisplayDetectPlugin.class);
        registerPlugin(SystemControlPlugin.class);
        super.onCreate(savedInstanceState);

        // Enable edge-to-edge layout with full cutout utilization
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }

        // Keep screen alive during desktop mode
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Hide system bars for complete immersive desktop experience
        enableStickyImmersiveMode();

        // Grant webview media and hardware permission requests in-shell
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.setWebChromeClient(new WebChromeClient() {
                    @Override
                    public void onPermissionRequest(final PermissionRequest request) {
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                request.grant(request.getResources());
                            }
                        });
                    }
                });
            }
        } catch (Exception ignored) {
        }

        // Request runtime permissions for direct hardware access
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            List<String> perms = new ArrayList<>();
            perms.add(Manifest.permission.CAMERA);
            perms.add(Manifest.permission.ACCESS_FINE_LOCATION);
            perms.add(Manifest.permission.ACCESS_COARSE_LOCATION);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                perms.add(Manifest.permission.READ_MEDIA_IMAGES);
                perms.add(Manifest.permission.READ_MEDIA_VIDEO);
                perms.add(Manifest.permission.READ_MEDIA_AUDIO);
            } else {
                perms.add(Manifest.permission.READ_EXTERNAL_STORAGE);
                perms.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                perms.add(Manifest.permission.BLUETOOTH_CONNECT);
                perms.add(Manifest.permission.BLUETOOTH_SCAN);
            }

            perms.add(Manifest.permission.READ_CONTACTS);
            perms.add(Manifest.permission.READ_CALL_LOG);
            perms.add(Manifest.permission.CALL_PHONE);

            requestPermissions(perms.toArray(new String[0]), 101);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        enableStickyImmersiveMode();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enableStickyImmersiveMode();
        }
    }

    private void enableStickyImmersiveMode() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (controller != null) {
            controller.hide(WindowInsetsCompat.Type.systemBars());
            controller.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            );
        }
    }
}

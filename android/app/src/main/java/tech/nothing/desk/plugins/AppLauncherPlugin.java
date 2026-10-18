package tech.nothing.desk.plugins;

import android.app.ActivityOptions;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Rect;
import android.os.Bundle;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.lang.reflect.Method;
import java.util.List;

@CapacitorPlugin(name = "AppLauncher")
public class AppLauncherPlugin extends Plugin {

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        Intent intent = new Intent(Intent.ACTION_MAIN, null);
        intent.addCategory(Intent.CATEGORY_LAUNCHER);

        List<ResolveInfo> resolveInfos = pm.queryIntentActivities(intent, 0);
        JSArray appsList = new JSArray();

        for (ResolveInfo resolveInfo : resolveInfos) {
            String packageName = resolveInfo.activityInfo.packageName;
            if ("tech.nothing.desk".equals(packageName)) continue;
            String label = resolveInfo.loadLabel(pm).toString();
            boolean isSystemApp = (resolveInfo.activityInfo.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0;

            JSObject appObj = new JSObject();
            appObj.put("packageName", packageName);
            appObj.put("label", label);
            appObj.put("isSystemApp", isSystemApp);
            appsList.put(appObj);
        }

        JSObject result = new JSObject();
        result.put("apps", appsList);
        call.resolve(result);
    }

    @PluginMethod
    public void launchApp(PluginCall call) {
        String packageName = call.getString("packageName");
        if (packageName == null || packageName.isEmpty()) {
            call.reject("Package name is required.");
            return;
        }

        PackageManager pm = getContext().getPackageManager();
        Intent launchIntent = pm.getLaunchIntentForPackage(packageName);

        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_MULTIPLE_TASK);

            Bundle optionsBundle = null;
            try {
                ActivityOptions options = ActivityOptions.makeBasic();

                int left = call.getInt("left", 200);
                int top = call.getInt("top", 100);
                int width = call.getInt("width", 1400);
                int height = call.getInt("height", 900);
                Rect bounds = new Rect(left, top, left + width, top + height);
                options.setLaunchBounds(bounds);

                // Set freeform windowing mode (WINDOWING_MODE_FREEFORM = 5)
                try {
                    Method setLaunchWindowingModeMethod = options.getClass().getMethod("setLaunchWindowingMode", int.class);
                    setLaunchWindowingModeMethod.invoke(options, 5);
                } catch (Exception ignored) {
                }

                optionsBundle = options.toBundle();
            } catch (Exception ignored) {
            }

            if (optionsBundle != null) {
                getContext().startActivity(launchIntent, optionsBundle);
            } else {
                getContext().startActivity(launchIntent);
            }

            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } else {
            call.reject("Application " + packageName + " cannot be launched.");
        }
    }
}

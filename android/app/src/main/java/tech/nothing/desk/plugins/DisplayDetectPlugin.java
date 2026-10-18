package tech.nothing.desk.plugins;

import android.content.Context;
import android.hardware.display.DisplayManager;
import android.view.Display;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DisplayDetect")
public class DisplayDetectPlugin extends Plugin {

    private DisplayManager displayManager;

    private final DisplayManager.DisplayListener displayListener = new DisplayManager.DisplayListener() {
        @Override
        public void onDisplayAdded(int displayId) {
            notifyDisplayState();
        }

        @Override
        public void onDisplayRemoved(int displayId) {
            notifyDisplayState();
        }

        @Override
        public void onDisplayChanged(int displayId) {
            notifyDisplayState();
        }
    };

    @Override
    public void load() {
        displayManager = (DisplayManager) getContext().getSystemService(Context.DISPLAY_SERVICE);
        if (displayManager != null) {
            displayManager.registerDisplayListener(displayListener, null);
        }
    }

    private void notifyDisplayState() {
        if (displayManager == null) return;
        Display[] displays = displayManager.getDisplays();
        boolean hasExternal = displays != null && displays.length > 1;

        JSObject data = new JSObject();
        data.put("displayCount", displays != null ? displays.length : 1);
        data.put("hasExternalDisplay", hasExternal);
        data.put("supportsSeparateExternalDesktop", hasExternal);
        notifyListeners("displayChanged", data);
    }

    @PluginMethod
    public void getDisplayInfo(PluginCall call) {
        DisplayManager dm = displayManager != null ? displayManager : (DisplayManager) getContext().getSystemService(Context.DISPLAY_SERVICE);
        Display[] displays = dm != null ? dm.getDisplays() : new Display[0];
        boolean hasExternal = displays.length > 1;

        JSObject result = new JSObject();
        result.put("displayCount", displays.length);
        result.put("hasExternalDisplay", hasExternal);
        result.put("supportsSeparateExternalDesktop", hasExternal);
        call.resolve(result);
    }

    @Override
    public void handleOnDestroy() {
        if (displayManager != null) {
            displayManager.unregisterDisplayListener(displayListener);
        }
        super.handleOnDestroy();
    }
}

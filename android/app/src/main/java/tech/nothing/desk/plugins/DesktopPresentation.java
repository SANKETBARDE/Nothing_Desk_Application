package tech.nothing.desk.plugins;

import android.app.Presentation;
import android.content.Context;
import android.os.Bundle;
import android.view.Display;
import android.webkit.WebSettings;
import android.webkit.WebView;

/**
 * Secondary Display Presentation surface for Nothing Desk.
 * Attaches directly to external monitors connected via USB-C DisplayPort Alternate Mode.
 */
public class DesktopPresentation extends Presentation {

    private final String secondaryDesktopUrl;
    private WebView secondaryWebView;

    public DesktopPresentation(Context outerContext, Display display, String secondaryDesktopUrl) {
        super(outerContext, display);
        this.secondaryDesktopUrl = secondaryDesktopUrl;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = new WebView(getContext());
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.loadUrl(secondaryDesktopUrl);

        secondaryWebView = webView;
        setContentView(webView);
    }

    @Override
    public void onDetachedFromWindow() {
        if (secondaryWebView != null) {
            secondaryWebView.destroy();
            secondaryWebView = null;
        }
        super.onDetachedFromWindow();
    }
}

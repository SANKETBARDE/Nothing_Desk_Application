import React, { useState } from 'react';
import { ExternalLink, Layers, Shield, Sparkles, RefreshCw, Smartphone } from 'lucide-react';
import { getPlatformAdapter } from '../../platform';

interface AndroidAppWindowProps {
  windowId: string;
  packageName?: string;
  appName?: string;
}

export const AndroidAppWindow: React.FC<AndroidAppWindowProps> = ({ packageName, appName = 'Android Application' }) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const [lastLaunched, setLastLaunched] = useState<string | null>(null);
  const platform = getPlatformAdapter();

  const handleLaunchFreeform = async () => {
    if (!packageName) return;
    setIsLaunching(true);
    try {
      await platform.launchApp(packageName, {
        left: 240,
        top: 120,
        width: 1300,
        height: 850,
      });
      setLastLaunched(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } finally {
      setTimeout(() => setIsLaunching(false), 500);
    }
  };

  // In-shell window management without forced mobile context-switch

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0d0d0d',
        color: '#fff',
        padding: 24,
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Accent Gradient */}
      <div
        style={{
          position: 'absolute',
          top: -80,
          right: -80,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(215, 25, 33, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header Info */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: '#161616',
              border: '1px solid #282828',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            <Smartphone size={26} color="var(--nothing-red)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '0.02em' }}>{appName}</h2>
              <span
                style={{
                  background: 'rgba(215, 25, 33, 0.15)',
                  color: 'var(--nothing-red)',
                  border: '1px solid rgba(215, 25, 33, 0.3)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                DeX Mode
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#666',
                fontFamily: 'var(--nothing-font-mono, monospace)',
                marginTop: 3,
              }}
            >
              {packageName || 'tech.nothing.app'}
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div
          style={{
            background: '#121212',
            border: '1px solid #202020',
            borderRadius: 10,
            padding: '16px',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Sparkles size={14} color="#00cc66" />
            <span style={{ fontSize: 12, fontWeight: 600 }}>Samsung DeX Style Freeform Window</span>
          </div>
          <p style={{ fontSize: 12, color: '#999', lineHeight: 1.5, margin: 0 }}>
            This application is running as a floating freeform window on your device screen. You can resize it, snap it side-by-side with other apps, or minimize it to the Nothing Desk taskbar.
          </p>
          {lastLaunched && (
            <div style={{ fontSize: 10, color: '#555', marginTop: 10, fontFamily: 'var(--nothing-font-mono, monospace)' }}>
              Last window sync: {lastLaunched}
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: '#141414', padding: 12, borderRadius: 8, border: '1px solid #1f1f1f' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Layers size={13} color="var(--nothing-red)" />
              <span style={{ fontSize: 11, fontWeight: 600 }}>Multi-Windowing</span>
            </div>
            <div style={{ fontSize: 11, color: '#777' }}>Independent window bounds & taskbar presence</div>
          </div>
          <div style={{ background: '#141414', padding: 12, borderRadius: 8, border: '1px solid #1f1f1f' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Shield size={13} color="#00cc66" />
              <span style={{ fontSize: 11, fontWeight: 600 }}>Native Sandbox</span>
            </div>
            <div style={{ fontSize: 11, color: '#777' }}>Direct hardware acceleration & GPU compositing</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button
          className="nothing-button"
          onClick={handleLaunchFreeform}
          disabled={isLaunching}
          style={{
            flex: 1,
            padding: '12px 18px',
            background: 'var(--nothing-red)',
            color: '#fff',
            borderColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontWeight: 600,
            fontSize: 13,
            borderRadius: 6,
          }}
        >
          {isLaunching ? <RefreshCw size={15} className="animate-spin" /> : <ExternalLink size={15} />}
          <span>{isLaunching ? 'Syncing...' : 'Bring Window to Front'}</span>
        </button>
      </div>
    </div>
  );
};

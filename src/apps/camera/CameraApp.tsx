import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  SwitchCamera,
  Grid,
  Timer as TimerIcon,
  Download,
  Trash2,
  X,
  ExternalLink,
  Image as ImageIcon,
  Check,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { getPlatformAdapter } from '../../platform';

interface CameraAppProps {
  windowId: string;
}

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
  resolution: string;
  facingMode: 'user' | 'environment';
}

const FILTER_PRESETS = [
  { id: 'normal', label: 'NATURAL', desc: 'True to life' },
  { id: 'mono', label: 'NOTHING MONO', desc: 'Signature high-contrast B&W' },
  { id: 'contrast', label: 'HIGH CONTRAST', desc: 'Punchy dynamic range' },
  { id: 'vibrant', label: 'VIBRANT', desc: 'Enhanced saturation' },
  { id: 'warm', label: 'WARM CINEMA', desc: 'Golden film tone' },
] as const;

type FilterMode = (typeof FILTER_PRESETS)[number]['id'];

// Realistic mechanical camera shutter sound using Web Audio API
function playShutterSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // 1. Initial click
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);

    // 2. Second curtain click
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(600, ctx.currentTime + 0.06);
    osc2.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.11);
    gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.11);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.06);
    osc2.stop(ctx.currentTime + 0.11);
  } catch {}
}

// Focus beep sound
function playFocusBeep() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch {}
}

export const CameraApp: React.FC<CameraAppProps> = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Camera stream state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isFlipping, setIsFlipping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Video resolution telemetry
  const [actualResolution, setActualResolution] = useState<{ width: number; height: number; fps: number }>({
    width: 0,
    height: 0,
    fps: 30,
  });

  // Settings & Controls
  const [filterMode, setFilterMode] = useState<FilterMode>('normal');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState<0 | 3 | 10>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFlashing, setIsFlashing] = useState(false);

  // Tap-to-focus reticle
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);

  // Countdown timer state
  const [countdown, setCountdown] = useState<number | null>(null);

  // Captures Gallery & Lightbox
  const [gallery, setGallery] = useState<CapturedPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<CapturedPhoto | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const platform = getPlatformAdapter();

  // Start / Switch camera stream
  const startCamera = useCallback(
    async (targetFacing: 'user' | 'environment') => {
      setIsFlipping(true);
      try {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        // Request maximum sensor resolution (up to 4K UHD)
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: targetFacing,
            width: { ideal: 3840, min: 1280 },
            height: { ideal: 2160, min: 720 },
            frameRate: { ideal: 60, min: 30 },
          },
          audio: false,
        };

        let newStream: MediaStream;
        try {
          newStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch {
          // Fallback to standard Full HD if high-res is rejected
          newStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: targetFacing, width: { ideal: 1920 }, height: { ideal: 1080 } },
            audio: false,
          });
        }

        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
        setFacingMode(targetFacing);
        setErrorMsg(null);
      } catch (e) {
        console.error('[CameraApp] Failed to start camera:', e);
        setErrorMsg('Camera access unavailable. Check permissions.');
      } finally {
        setTimeout(() => setIsFlipping(false), 250);
      }
    },
    [stream]
  );

  // Initial load
  useEffect(() => {
    startCamera('environment');
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Update actual stream resolution once video metadata is ready
  const handleVideoMetadata = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const track = stream?.getVideoTracks()[0];
    const settings = track?.getSettings();
    setActualResolution({
      width: v.videoWidth || settings?.width || 1920,
      height: v.videoHeight || settings?.height || 1080,
      fps: settings?.frameRate ? Math.round(settings.frameRate) : 60,
    });
  };

  // Toggle front/back camera
  const handleToggleFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextFacing);
  };

  // Tap-to-focus on viewfinder
  const handleViewfinderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If filter dropdown is open, clicking viewfinder closes it
    if (showFilterDropdown) {
      setShowFilterDropdown(false);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFocusPoint({ x, y });
    playFocusBeep();

    setTimeout(() => {
      setFocusPoint((curr) => (curr?.x === x && curr?.y === y ? null : curr));
    }, 2000);
  };

  // Shutter action (handles countdown if timer active)
  const triggerShutter = () => {
    if (countdown !== null) return;
    if (showFilterDropdown) setShowFilterDropdown(false);

    if (timerSeconds > 0) {
      let count = timerSeconds;
      setCountdown(count);
      const interval = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(interval);
          setCountdown(null);
          captureSnapshot();
        } else {
          setCountdown(count);
          playFocusBeep();
        }
      }, 1000);
    } else {
      captureSnapshot();
    }
  };

  // Capture high-resolution photo from video sensor
  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    setIsFlashing(true);
    playShutterSound();
    if (navigator.vibrate) navigator.vibrate(40);
    setTimeout(() => setIsFlashing(false), 140);

    const fullWidth = video.videoWidth || 1920;
    const fullHeight = video.videoHeight || 1080;

    canvas.width = fullWidth;
    canvas.height = fullHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply active filter
    if (filterMode === 'mono') {
      ctx.filter = 'grayscale(100%) contrast(135%) brightness(105%)';
    } else if (filterMode === 'contrast') {
      ctx.filter = 'contrast(150%) brightness(95%) saturate(120%)';
    } else if (filterMode === 'vibrant') {
      ctx.filter = 'saturate(165%) contrast(110%)';
    } else if (filterMode === 'warm') {
      ctx.filter = 'sepia(30%) contrast(115%) brightness(102%) saturate(125%)';
    } else {
      ctx.filter = 'none';
    }

    // Mirror horizontally if front-facing
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, fullWidth, fullHeight);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.96);
    const newPhoto: CapturedPhoto = {
      id: Date.now().toString(),
      dataUrl,
      timestamp: Date.now(),
      resolution: `${fullWidth} × ${fullHeight}`,
      facingMode,
    };

    setGallery((prev) => [newPhoto, ...prev]);
  };

  // Download captured photo
  const handleDownloadPhoto = (photo: CapturedPhoto) => {
    const a = document.createElement('a');
    a.href = photo.dataUrl;
    a.download = `NothingCam_${photo.timestamp}.jpg`;
    a.click();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  // Delete captured photo
  const handleDeletePhoto = (photoId: string) => {
    setGallery((prev) => prev.filter((p) => p.id !== photoId));
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(null);
    }
  };

  // Launch device's native Nothing camera app
  const openNativeCamera = async () => {
    await platform.launchApp('tech.nothing.camera');
  };

  // Filter CSS for live video feed
  const getFilterStyle = () => {
    if (filterMode === 'mono') return 'grayscale(100%) contrast(135%) brightness(105%)';
    if (filterMode === 'contrast') return 'contrast(150%) brightness(95%) saturate(120%)';
    if (filterMode === 'vibrant') return 'saturate(165%) contrast(110%)';
    if (filterMode === 'warm') return 'sepia(30%) contrast(115%) brightness(102%) saturate(125%)';
    return 'none';
  };

  const activeFilterInfo = FILTER_PRESETS.find((f) => f.id === filterMode);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#000000',
        color: '#ffffff',
        userSelect: 'none',
        overflow: 'hidden',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* 1. FULL-BLEED LIVE VIDEO ("video all over the app") */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onLoadedMetadata={handleVideoMetadata}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: getFilterStyle(),
          transform: `scale(${zoomLevel}) ${facingMode === 'user' ? 'scaleX(-1)' : ''}`,
          transition: isFlipping ? 'opacity 0.2s ease, transform 0.2s ease' : 'transform 0.15s ease',
          opacity: isFlipping ? 0.3 : 1,
        }}
      />

      {/* Hidden offscreen canvas for high-res photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* 2. VIEWFINDER TOUCH OVERLAY */}
      <div
        onClick={handleViewfinderClick}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          cursor: 'crosshair',
        }}
      >
        {/* Shutter White Flash Animation */}
        {isFlashing && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: '#ffffff',
              opacity: 0.95,
              pointerEvents: 'none',
              zIndex: 50,
            }}
          />
        )}

        {/* Rule-of-Thirds Grid Overlay */}
        {showGrid && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gridTemplateRows: '1fr 1fr 1fr',
              opacity: 0.22,
            }}
          >
            <div style={{ borderRight: '1px solid #fff', borderBottom: '1px solid #fff' }} />
            <div style={{ borderRight: '1px solid #fff', borderBottom: '1px solid #fff' }} />
            <div style={{ borderBottom: '1px solid #fff' }} />
            <div style={{ borderRight: '1px solid #fff', borderBottom: '1px solid #fff' }} />
            <div style={{ borderRight: '1px solid #fff', borderBottom: '1px solid #fff' }} />
            <div style={{ borderBottom: '1px solid #fff' }} />
            <div style={{ borderRight: '1px solid #fff' }} />
            <div style={{ borderRight: '1px solid #fff' }} />
            <div />
          </div>
        )}

        {/* Tap-To-Focus Reticle */}
        {focusPoint && (
          <div
            style={{
              position: 'absolute',
              left: focusPoint.x - 26,
              top: focusPoint.y - 26,
              width: 52,
              height: 52,
              border: '1.5px solid #ffcc00',
              borderRadius: 6,
              pointerEvents: 'none',
              animation: 'pulse 1s infinite',
              boxShadow: '0 0 12px rgba(255, 204, 0, 0.5)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 4,
                height: 4,
                background: '#ffcc00',
                borderRadius: '50%',
              }}
            />
          </div>
        )}

        {/* Timer Countdown Big Overlay */}
        {countdown !== null && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.45)',
              zIndex: 40,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                fontSize: 96,
                fontWeight: 700,
                fontFamily: 'monospace',
                color: '#fff',
                textShadow: '0 0 32px rgba(215, 25, 33, 0.9)',
                animation: 'pulse 1s infinite',
              }}
            >
              {countdown}
            </div>
          </div>
        )}

        {/* Error Fallback (if camera permission denied) */}
        {errorMsg && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.85)',
              padding: 24,
              textAlign: 'center',
              zIndex: 35,
            }}
          >
            <Camera size={44} color="#666" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 13, color: '#aaa', marginBottom: 16 }}>{errorMsg}</div>
            <button
              onClick={openNativeCamera}
              style={{
                background: '#d71921',
                border: 'none',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Open Full Nothing Camera
            </button>
          </div>
        )}
      </div>

      {/* 3. TOP FLOATING GLASS HEADER */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 12,
          right: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 12px',
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 10,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 30,
        }}
      >
        {/* Left: Branding & Resolution Telemetry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#d71921',
                animation: 'pulse 1.4s infinite',
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>
              NOTHING // CAM
            </span>
          </div>

          {actualResolution.width > 0 && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '2px 7px',
                borderRadius: 4,
                fontSize: 10,
                color: '#ccc',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span style={{ color: '#00d26a', fontWeight: 700 }}>
                {actualResolution.width >= 3840 ? '4K' : actualResolution.width >= 1920 ? 'FHD' : 'HD'}
              </span>
              <span>
                {actualResolution.width}×{actualResolution.height}
              </span>
              <span>•</span>
              <span>{actualResolution.fps} FPS</span>
            </div>
          )}
        </div>

        {/* Right: Grid, Timer & Native App Shortcut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid((p) => !p)}
            title="Toggle Rule-of-Thirds Grid"
            style={{
              background: showGrid ? 'rgba(215, 25, 33, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              border: '1px solid',
              borderColor: showGrid ? '#d71921' : 'rgba(255, 255, 255, 0.12)',
              color: showGrid ? '#ff4d4f' : '#aaa',
              padding: '4px 7px',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Grid size={13} />
          </button>

          {/* Timer Toggle */}
          <button
            onClick={() => {
              if (timerSeconds === 0) setTimerSeconds(3);
              else if (timerSeconds === 3) setTimerSeconds(10);
              else setTimerSeconds(0);
            }}
            title="Timer"
            style={{
              background: timerSeconds > 0 ? 'rgba(215, 25, 33, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              border: '1px solid',
              borderColor: timerSeconds > 0 ? '#d71921' : 'rgba(255, 255, 255, 0.12)',
              color: timerSeconds > 0 ? '#ff4d4f' : '#aaa',
              padding: '3px 8px',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            <TimerIcon size={12} />
            <span>{timerSeconds > 0 ? `${timerSeconds}s` : 'OFF'}</span>
          </button>

          {/* Native Nothing Camera */}
          <button
            onClick={openNativeCamera}
            title="Open Stock Nothing Camera"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#bbb',
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <ExternalLink size={11} color="#d71921" />
            <span>Native</span>
          </button>
        </div>
      </div>

      {/* 4. FLOATING ZOOM CONTROLS ("keep 1x and zoom") */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 24,
          padding: '3px 6px',
          display: 'flex',
          gap: 4,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          zIndex: 30,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
        }}
      >
        {[1, 1.5, 2, 3].map((z) => (
          <button
            key={z}
            onClick={() => setZoomLevel(z)}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: zoomLevel === z ? '#ffffff' : 'transparent',
              border: 'none',
              color: zoomLevel === z ? '#000000' : '#cccccc',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.1s ease',
            }}
          >
            {z}x
          </button>
        ))}
      </div>

      {/* 5. RIGHT CONTROLS STRIP ("capture button on right and above it a filter dropdown button") */}
      <div
        style={{
          position: 'absolute',
          right: 18,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          zIndex: 30,
        }}
      >
        {/* Filter Dropdown Button & Popover (Above Capture Button) */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowFilterDropdown((p) => !p)}
            title="Color & Style Filters"
            style={{
              background:
                filterMode !== 'normal'
                  ? 'linear-gradient(135deg, rgba(215, 25, 33, 0.4) 0%, rgba(215, 25, 33, 0.15) 100%)'
                  : 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: filterMode !== 'normal' ? '1.5px solid #d71921' : '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 20,
              padding: '6px 10px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.12s ease',
            }}
          >
            <Sparkles size={14} color={filterMode !== 'normal' ? '#ff4d4f' : '#fff'} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>
              {activeFilterInfo?.label || 'FILTER'}
            </span>
            <ChevronDown size={11} color="#aaa" />
          </button>

          {/* Filter Dropdown Popover Menu */}
          {showFilterDropdown && (
            <div
              style={{
                position: 'absolute',
                right: '105%',
                top: 0,
                marginRight: 10,
                width: 175,
                background: 'rgba(12, 12, 16, 0.96)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 12,
                padding: '6px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                zIndex: 60,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#666',
                  letterSpacing: '0.1em',
                  padding: '4px 8px',
                  fontFamily: 'monospace',
                }}
              >
                FILTER PRESETS
              </div>
              {FILTER_PRESETS.map((f) => {
                const isSelected = filterMode === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setFilterMode(f.id);
                      setShowFilterDropdown(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 8px',
                      borderRadius: 8,
                      background: isSelected ? 'rgba(215, 25, 33, 0.2)' : 'transparent',
                      border: isSelected ? '1px solid rgba(215, 25, 33, 0.4)' : '1px solid transparent',
                      color: isSelected ? '#ffffff' : '#cccccc',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.1s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>{f.label}</div>
                      <div style={{ fontSize: 9, color: '#777' }}>{f.desc}</div>
                    </div>
                    {isSelected && <Check size={13} color="#d71921" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Capture Shutter Button (Right Center) */}
        <button
          onClick={triggerShutter}
          disabled={countdown !== null}
          title="Take Photo"
          style={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            background: 'rgba(20, 20, 24, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '3px solid #ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.7)',
            transition: 'transform 0.08s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: '#d71921',
              boxShadow: '0 0 16px rgba(215, 25, 33, 0.6)',
            }}
          />
        </button>

        {/* Camera Shift Front / Back Button (Below Capture Button) */}
        <button
          onClick={handleToggleFacing}
          disabled={isFlipping}
          title={`Switch Camera (Currently ${facingMode === 'environment' ? 'Rear' : 'Front'})`}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
            transition: 'all 0.15s ease',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.background = 'rgba(215, 25, 33, 0.3)';
            e.currentTarget.style.transform = 'scale(0.92) rotate(180deg)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.65)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <SwitchCamera size={18} />
          <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.05em', marginTop: 1, color: '#aaa' }}>
            {facingMode === 'environment' ? 'REAR' : 'FRONT'}
          </span>
        </button>
      </div>

      {/* 6. BOTTOM-LEFT FLOATING GALLERY THUMBNAIL */}
      <div
        onClick={() => {
          if (gallery.length > 0) setSelectedPhoto(gallery[0]);
        }}
        style={{
          position: 'absolute',
          bottom: 18,
          left: 18,
          width: 46,
          height: 46,
          borderRadius: 8,
          border: '1.5px solid rgba(255, 255, 255, 0.25)',
          overflow: 'hidden',
          background: 'rgba(16, 16, 20, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: gallery.length > 0 ? 'pointer' : 'default',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
          zIndex: 30,
        }}
        title={gallery.length > 0 ? 'View captured photos' : 'No photos taken yet'}
      >
        {gallery.length > 0 ? (
          <>
            <img
              src={gallery[0].dataUrl}
              alt="Latest"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                background: '#d71921',
                color: '#fff',
                fontSize: 8,
                fontWeight: 700,
                borderRadius: 10,
                padding: '1px 4px',
              }}
            >
              {gallery.length}
            </div>
          </>
        ) : (
          <ImageIcon size={18} color="#777" />
        )}
      </div>

      {/* 7. FULL-SCREEN PHOTO VIEWER LIGHTBOX */}
      {selectedPhoto && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(20px)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Lightbox Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                {new Date(selectedPhoto.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
              <div style={{ fontSize: 10, color: '#888', fontFamily: 'monospace' }}>
                {selectedPhoto.resolution} •{' '}
                {selectedPhoto.facingMode === 'environment' ? 'Rear Camera' : 'Front Camera'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Download Photo */}
              <button
                onClick={() => handleDownloadPhoto(selectedPhoto)}
                title="Download Photo"
                style={{
                  background: downloadSuccess ? '#00d26a' : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                {downloadSuccess ? <Check size={13} /> : <Download size={13} />}
                <span>{downloadSuccess ? 'Saved' : 'Save'}</span>
              </button>

              {/* Delete Photo */}
              <button
                onClick={() => handleDeletePhoto(selectedPhoto.id)}
                title="Delete Photo"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#ff4d4f',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>

              {/* Close Lightbox */}
              <button
                onClick={() => setSelectedPhoto(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#fff',
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Lightbox Image Preview */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              overflow: 'hidden',
            }}
          >
            <img
              src={selectedPhoto.dataUrl}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: 8,
                boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
              }}
            />
          </div>

          {/* Filmstrip of all captured photos */}
          {gallery.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                padding: '10px 16px',
                overflowX: 'auto',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(0, 0, 0, 0.5)',
              }}
            >
              {gallery.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPhoto(p)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 6,
                    overflow: 'hidden',
                    border: selectedPhoto.id === p.id ? '2px solid #d71921' : '1px solid rgba(255,255,255,0.2)',
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                >
                  <img src={p.dataUrl} alt="Thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

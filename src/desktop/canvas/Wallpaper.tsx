import React from 'react';

interface WallpaperProps {
  wallpaperId: string;
  customUrl?: string;
}

export const Wallpaper: React.FC<WallpaperProps> = ({ wallpaperId, customUrl }) => {
  if (customUrl) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${customUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
    );
  }

  // Pure Nothing OS signature wallpapers
  let backgroundStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#050507',
    backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.08) 1.2px, transparent 1.2px)`,
    backgroundSize: '24px 24px',
    zIndex: 0,
    pointerEvents: 'none',
  };

  if (wallpaperId === 'carbon-grid') {
    backgroundStyle = {
      position: 'absolute',
      inset: 0,
      backgroundColor: '#0a0a0f',
      backgroundImage: `
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
      `,
      backgroundSize: '32px 32px',
      zIndex: 0,
      pointerEvents: 'none',
    };
  } else if (wallpaperId === 'minimal-slate') {
    backgroundStyle = {
      position: 'absolute',
      inset: 0,
      backgroundColor: '#121216',
      backgroundImage: `radial-gradient(ellipse at 50% 30%, rgba(215, 25, 33, 0.06), transparent 70%)`,
      zIndex: 0,
      pointerEvents: 'none',
    };
  }

  return (
    <div style={backgroundStyle}>
      {/* Subtle bottom vignette to emphasize taskbar */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.6) 100%)',
        }}
      />
    </div>
  );
};

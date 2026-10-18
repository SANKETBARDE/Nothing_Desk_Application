import React from 'react';
import type { WindowBounds } from '../types';

interface SnapPreviewProps {
  bounds: WindowBounds | null;
}

export const SnapPreview: React.FC<SnapPreviewProps> = ({ bounds }) => {
  if (!bounds) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: `${bounds.y}px`,
        left: `${bounds.x}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
        background: 'rgba(215, 25, 33, 0.12)',
        border: '2px dashed var(--accent-red)',
        borderRadius: 'var(--radius-md)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 8900,
        pointerEvents: 'none',
        transition: 'all 120ms cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 0 24px rgba(215, 25, 33, 0.25)',
      }}
      aria-hidden="true"
    />
  );
};

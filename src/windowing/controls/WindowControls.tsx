import React from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import type { WindowMode } from '../types';

interface WindowControlsProps {
  mode: WindowMode;
  allowMaximize?: boolean;
  onMinimize: () => void;
  onMaximizeToggle: () => void;
  onClose: () => void;
}

export const WindowControls: React.FC<WindowControlsProps> = ({
  mode,
  allowMaximize = true,
  onMinimize,
  onMaximizeToggle,
  onClose,
}) => {
  return (
    <div className="window-controls" role="group" aria-label="Window Controls">
      <button
        type="button"
        className="window-control-btn"
        onClick={(e) => {
          e.stopPropagation();
          onMinimize();
        }}
        aria-label="Minimize Window"
        title="Minimize"
      >
        <Minus size={14} />
      </button>

      {allowMaximize && (
        <button
          type="button"
          className="window-control-btn"
          onClick={(e) => {
            e.stopPropagation();
            onMaximizeToggle();
          }}
          aria-label={mode === 'maximized' ? 'Restore Window' : 'Maximize Window'}
          title={mode === 'maximized' ? 'Restore' : 'Maximize'}
        >
          {mode === 'maximized' ? <Copy size={12} /> : <Square size={12} />}
        </button>
      )}

      <button
        type="button"
        className="window-control-btn close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close Window"
        title="Close (Alt+F4)"
      >
        <X size={14} />
      </button>
    </div>
  );
};

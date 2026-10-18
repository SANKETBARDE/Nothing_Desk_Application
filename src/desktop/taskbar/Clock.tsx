import React, { useState, useEffect } from 'react';

export const Clock: React.FC = () => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const dateStr = time.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 8px',
        cursor: 'default',
        lineHeight: 1.15,
      }}
      title={time.toLocaleString()}
    >
      <div
        style={{
          fontFamily: 'var(--font-dot)',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-pure-white)',
          letterSpacing: '0.8px',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
        }}
      >
        <span>{hours}</span>
        <span style={{ color: 'var(--accent-red)', animation: 'dotPulse 1s infinite' }}>:</span>
        <span>{minutes}</span>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--text-muted)',
          letterSpacing: '0.2px',
        }}
      >
        {dateStr}
      </div>
    </div>
  );
};

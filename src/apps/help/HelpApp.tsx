import React, { useState } from 'react';
import { Search, Bluetooth } from 'lucide-react';

interface ShortcutEntry {
  keys: string[];
  action: string;
  category: 'System' | 'Window Management' | 'Navigation' | 'Editing';
  notes?: string;
}

const SHORTCUTS: ShortcutEntry[] = [
  { keys: ['Meta / Win'], action: 'Open / Close Start Menu', category: 'System', notes: 'Reserved on some devices; use Ctrl+Space' },
  { keys: ['Ctrl', 'Space'], action: 'Open Start & Focus Search', category: 'System', notes: 'Universal fallback' },
  { keys: ['Meta', 'D'], action: 'Minimize all / Show Desktop', category: 'System', notes: 'Toggles between minimized & restored' },
  { keys: ['Alt', 'Tab'], action: 'Cycle Built-in Windows', category: 'Window Management', notes: 'Cycles top focused window' },
  { keys: ['Alt', 'F4'], action: 'Close Focused Window', category: 'Window Management' },
  { keys: ['Ctrl', 'W'], action: 'Close Active Window', category: 'Window Management' },
  { keys: ['Ctrl', 'Shift', 'Esc'], action: 'Open Task Panel', category: 'Window Management' },
  { keys: ['Meta', 'I'], action: 'Open Nothing Desk Settings', category: 'System' },
  { keys: ['Meta', 'E'], action: 'Open File Access App', category: 'System' },
  { keys: ['Esc'], action: 'Close Menu, Dialog or Cancel Drag', category: 'Navigation' },
  { keys: ['Enter', 'Space'], action: 'Activate Selected Item', category: 'Navigation' },
  { keys: ['Tab', 'Shift+Tab'], action: 'Move Focus Forward / Back', category: 'Navigation' },
  { keys: ['Arrow Keys'], action: 'Navigate Menus & Icon Grid', category: 'Navigation' },
  { keys: ['Shift', 'F10'], action: 'Open Context Menu (Right-Click)', category: 'Navigation' },
];

export const HelpApp: React.FC<{ windowId: string }> = () => {
  const [filter, setFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredShortcuts = SHORTCUTS.filter((s) => {
    const matchesQuery =
      s.action.toLowerCase().includes(filter.toLowerCase()) ||
      s.keys.join(' ').toLowerCase().includes(filter.toLowerCase()) ||
      (s.notes && s.notes.toLowerCase().includes(filter.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: 'var(--text-primary)', fontSize: '13px' }}>
      {/* Search Header */}
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(0, 0, 0, 0.25)',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: 1,
            minWidth: '200px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Search size={14} color="var(--text-secondary)" style={{ position: 'absolute', left: '10px' }} />
          <input
            type="text"
            placeholder="Search shortcuts or guides..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 30px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-primary)',
              fontSize: '12px',
              outline: 'none',
            }}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['All', 'System', 'Window Management', 'Navigation'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '11px',
                background: selectedCategory === cat ? 'var(--accent-red-subtle)' : 'var(--bg-surface)',
                border: `1px solid ${selectedCategory === cat ? 'var(--accent-red)' : 'var(--glass-border)'}`,
                color: selectedCategory === cat ? 'var(--accent-red)' : 'var(--text-secondary)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Shortcuts List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredShortcuts.map((s, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-xs)',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontWeight: 500 }}>{s.action}</span>
              {s.notes && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.notes}</span>}
            </div>

            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              {s.keys.map((k, kIdx) => (
                <kbd
                  key={kIdx}
                  style={{
                    padding: '3px 8px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--glass-border-focus)',
                    borderRadius: 'var(--radius-xs)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--text-primary)',
                    boxShadow: '0 2px 0 rgba(0,0,0,0.4)',
                  }}
                >
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        ))}

        {/* Hardware Tips Card */}
        <div
          style={{
            marginTop: '16px',
            padding: '14px 16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-red)' }}>
            <Bluetooth size={16} />
            <span style={{ fontWeight: 600, fontFamily: 'var(--font-display)' }}>Peripheral Connectivity</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.5 }}>
            Bluetooth mice and keyboards pair directly in standard Android Bluetooth Settings. Nothing Desk immediately detects mouse hover, right-clicks, and keyboard shortcuts without requiring any special companion drivers.
          </p>
        </div>
      </div>
    </div>
  );
};

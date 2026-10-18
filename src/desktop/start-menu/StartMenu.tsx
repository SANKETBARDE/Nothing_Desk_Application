import React, { useState, useEffect, useRef } from 'react';
import { Search, Star, Sliders } from 'lucide-react';
import * as Icons from 'lucide-react';

export interface StartMenuItem {
  id: string;
  title: string;
  iconName: string;
  category: 'built-in';
  packageName?: string;
  isImportant?: boolean;
}

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchApp: (appId: string, title: string, iconName: string, packageName?: string) => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ isOpen, onClose, onLaunchApp }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('[aria-label="Start Menu"]')
      ) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('pointerdown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Curated list of genuine, authentic desktop applications (no fake or duplicate entries)
  const importantItems: StartMenuItem[] = [
    { id: 'phone', title: 'Phone', iconName: 'Phone', category: 'built-in', isImportant: true },
    { id: 'photos', title: 'Photos', iconName: 'Image', category: 'built-in', isImportant: true },
    { id: 'files', title: 'Files', iconName: 'FolderOpen', category: 'built-in', isImportant: true },
    { id: 'browser', title: 'Chrome', iconName: 'Globe', category: 'built-in', isImportant: true },
    { id: 'camera', title: 'Camera', iconName: 'Camera', category: 'built-in', isImportant: true },
    { id: 'messages', title: 'Messages', iconName: 'MessageSquare', category: 'built-in', isImportant: true },
    { id: 'calculator', title: 'Calculator', iconName: 'Calculator', category: 'built-in', isImportant: true },
    { id: 'notes', title: 'Notes', iconName: 'FileText', category: 'built-in', isImportant: true },
    { id: 'settings', title: 'Settings', iconName: 'Sliders', category: 'built-in', isImportant: true },
  ];

  const filteredItems = importantItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Keyboard navigation within Start Menu
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        onLaunchApp(selected.id, selected.title, selected.iconName);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="anim-slide-up"
      style={{
        position: 'absolute',
        bottom: 'calc(var(--taskbar-height) + var(--safe-bottom) + 8px)',
        left: 'calc(var(--safe-left) + 8px)',
        width: 'min(94vw, 460px)',
        height: 'min(82vh, 560px)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid var(--glass-border-focus)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--glass-shadow)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9500,
        overflow: 'hidden',
      }}
      role="dialog"
      aria-label="Start Menu"
    >
      {/* Search Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <Search size={16} color="var(--accent-red)" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search applications & tools..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-primary)',
            fontSize: '14px',
            outline: 'none',
          }}
        />
      </div>

      {/* Main Content Area: Scrollable Application Grids */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {searchQuery ? (
          /* Search Results Grid */
          <div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.5px',
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>SEARCH RESULTS</span>
              <span>{filteredItems.length} MATCHES</span>
            </div>

            {filteredItems.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))',
                  gap: '10px',
                }}
              >
                {filteredItems.map((item, idx) => renderGridCard(item, idx === selectedIndex))}
              </div>
            ) : (
              <div
                style={{
                  padding: '36px 12px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                }}
              >
                No applications matching &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        ) : (
          /* Default View: Clean Grid of Genuine Applications */
          <div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.6px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Star size={12} color="var(--accent-red)" />
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>APPLICATIONS</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>NOTHING DESK</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))',
                gap: '12px',
              }}
            >
              {importantItems.map((item) => renderGridCard(item, false, true))}
            </div>
          </div>
        )}
      </div>

      {/* Start Menu Footer */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--glass-border)',
          background: 'rgba(0, 0, 0, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--accent-red)',
            }}
          />
          <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
            NOTHING DESK
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            onLaunchApp('settings', 'Settings', 'Sliders');
            onClose();
          }}
          style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-xs)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--glass-border)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Sliders size={12} color="var(--accent-red)" /> Preferences
        </button>
      </div>
    </div>
  );

  /**
   * Renders an individual application card within the grid.
   */
  function renderGridCard(item: StartMenuItem, isSelected: boolean, isFeatured: boolean = false) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (Icons as any)[item.iconName] || Icons.AppWindow;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onLaunchApp(item.id, item.title, item.iconName, item.packageName);
          onClose();
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 4px',
          borderRadius: 'var(--radius-sm)',
          background: isSelected
            ? 'var(--bg-surface-active)'
            : isFeatured
            ? 'rgba(255, 255, 255, 0.04)'
            : 'var(--bg-surface)',
          border: `1px solid ${
            isSelected
              ? 'var(--accent-red)'
              : isFeatured
              ? 'rgba(215, 25, 33, 0.25)'
              : 'var(--glass-border)'
          }`,
          cursor: 'pointer',
          outline: 'none',
          position: 'relative',
          transition: 'transform var(--transition-instant), background var(--transition-instant), border-color var(--transition-instant)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isSelected
            ? 'var(--bg-surface-active)'
            : isFeatured
            ? 'rgba(255, 255, 255, 0.04)'
            : 'var(--bg-surface)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        title={item.title}
      >
        {/* Important Dot Indicator */}
        {isFeatured && (
          <div
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: 'var(--accent-red)',
            }}
          />
        )}

        {/* Icon Capsule */}
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '6px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
          }}
        >
          <IconComponent size={20} color={isFeatured ? 'var(--accent-red)' : 'var(--text-primary)'} />
        </div>

        {/* App Title Label */}
        <span
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--text-primary)',
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: '72px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.title}
        </span>
      </button>
    );
  }
};

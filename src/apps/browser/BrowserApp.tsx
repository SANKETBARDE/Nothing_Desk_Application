import React, { useState } from 'react';
import { Globe, ArrowLeft, ArrowRight, RotateCw, ExternalLink, ShieldCheck, Bookmark } from 'lucide-react';
import { getPlatformAdapter } from '../../platform';

interface BrowserAppProps {
  windowId: string;
}

const DEFAULT_BOOKMARKS = [
  { name: 'Nothing Tech', url: 'https://nothing.tech' },
  { name: 'Wikipedia', url: 'https://en.m.wikipedia.org' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com' },
  { name: 'OpenStreetMap', url: 'https://www.openstreetmap.org' },
];

export const BrowserApp: React.FC<BrowserAppProps> = () => {
  const [url, setUrl] = useState('https://nothing.tech');
  const [currentUrl, setCurrentUrl] = useState('https://nothing.tech');
  const [isLoading, setIsLoading] = useState(false);
  const platform = getPlatformAdapter();

  const handleNavigate = (targetUrl: string) => {
    let finalUrl = targetUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = 'https://' + finalUrl;
      } else {
        finalUrl = `https://duckduckgo.com/?q=${encodeURIComponent(finalUrl)}`;
      }
    }
    setUrl(finalUrl);
    setCurrentUrl(finalUrl);
    setIsLoading(true);
  };

  const handleLaunchExternal = async () => {
    await platform.launchApp('org.chromium.chrome');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a', color: '#fff' }}>
      {/* Browser Navigation Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          background: 'rgba(20, 20, 20, 0.95)',
          borderBottom: '1px solid #222',
        }}
      >
        <button
          className="nothing-button"
          onClick={() => handleNavigate(currentUrl)}
          style={{ padding: '6px 8px', borderRadius: 4 }}
          title="Back"
        >
          <ArrowLeft size={14} />
        </button>
        <button
          className="nothing-button"
          onClick={() => handleNavigate(currentUrl)}
          style={{ padding: '6px 8px', borderRadius: 4 }}
          title="Forward"
        >
          <ArrowRight size={14} />
        </button>
        <button
          className="nothing-button"
          onClick={() => {
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 600);
          }}
          style={{ padding: '6px 8px', borderRadius: 4 }}
          title="Reload"
        >
          <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>

        {/* Address Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleNavigate(url);
          }}
          style={{ flex: 1, display: 'flex', alignItems: 'center' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              background: '#141414',
              border: '1px solid #2a2a2a',
              borderRadius: 20,
              padding: '4px 12px',
              gap: 8,
            }}
          >
            <ShieldCheck size={13} color="#00ff66" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Search or enter web address..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: 12,
                outline: 'none',
                fontFamily: 'var(--nothing-font-mono, monospace)',
              }}
            />
          </div>
        </form>

        <button
          className="nothing-button"
          onClick={handleLaunchExternal}
          style={{
            padding: '6px 10px',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
          }}
          title="Open in Native Chrome"
        >
          <ExternalLink size={13} color="var(--nothing-red)" />
          <span>Chrome</span>
        </button>
      </div>

      {/* Bookmarks Bar */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '4px 12px',
          background: '#0d0d0d',
          borderBottom: '1px solid #1a1a1a',
          fontSize: 11,
          alignItems: 'center',
        }}
      >
        <Bookmark size={11} color="var(--nothing-red)" />
        {DEFAULT_BOOKMARKS.map((bm) => (
          <button
            key={bm.name}
            onClick={() => handleNavigate(bm.url)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 11,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.background = '#1a1a1a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#888';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {bm.name}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <iframe
          src={currentUrl}
          title="Desktop Browser"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: '#fff',
          }}
          onLoad={() => setIsLoading(false)}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />

        {/* Security fallback banner for sites with X-Frame-Options */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            background: 'rgba(15, 15, 15, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #222',
            padding: '6px 12px',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            color: '#aaa',
            pointerEvents: 'auto',
          }}
        >
          <Globe size={12} color="var(--nothing-red)" />
          <span>If page is restricted by site headers:</span>
          <button
            onClick={handleLaunchExternal}
            style={{
              background: 'var(--nothing-red)',
              color: '#fff',
              border: 'none',
              padding: '2px 8px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            Launch in Chrome
          </button>
        </div>
      </div>
    </div>
  );
};

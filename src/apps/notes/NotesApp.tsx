import React, { useState, useEffect } from 'react';
import { FileText, Copy, Trash2, Check } from 'lucide-react';

interface NotesAppProps {
  windowId: string;
}

const STORAGE_KEY = 'nothing_desk_notes_draft';

export const NotesApp: React.FC<NotesAppProps> = () => {
  const [content, setContent] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || 'NOTHING DESK — SCRATCHPAD\n\n- PC mode multi-windowing active\n- Connected to Nothing Phone\n- Freeform apps supported';
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, content);
  }, [content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a', color: '#fff' }}>
      {/* Top Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 14px',
          background: '#111',
          borderBottom: '1px solid #222',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={14} color="var(--nothing-red)" />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>NOTHING NOTES</span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="nothing-button"
            onClick={handleCopy}
            style={{ padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
            title="Copy Text"
          >
            {copied ? <Check size={12} color="#00ff66" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            className="nothing-button"
            onClick={() => setContent('')}
            style={{ padding: '4px 8px', fontSize: 11 }}
            title="Clear"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Text Area */}
      <div style={{ flex: 1, padding: 16 }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your notes..."
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
            border: 'none',
            color: '#eee',
            fontSize: 13,
            lineHeight: 1.6,
            fontFamily: 'var(--nothing-font-mono, monospace)',
            resize: 'none',
            outline: 'none',
          }}
        />
      </div>

      {/* Bottom Status Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '6px 14px',
          background: '#0d0d0d',
          borderTop: '1px solid #1a1a1a',
          fontSize: 10,
          color: '#666',
          fontFamily: 'var(--nothing-font-mono, monospace)',
        }}
      >
        <span>STATUS: SAVED</span>
        <span>{wordCount} WORDS • {charCount} CHARS</span>
      </div>
    </div>
  );
};

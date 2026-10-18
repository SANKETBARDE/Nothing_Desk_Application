import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Delete,
  Users,
  Clock,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Search,
  RefreshCw,
  Copy,
  Check,
  Minimize2,
  Maximize2,
  Hash,
} from 'lucide-react';
import { platformAdapter } from '../../platform/nativeAdapter';
import type { DeviceContact, DeviceCallLogItem } from '../../platform/interface';

interface PhoneAppProps {
  windowId?: string;
}

const DIAL_KEYS = [
  { num: '1', sub: 'VOICEMAIL' },
  { num: '2', sub: 'ABC' },
  { num: '3', sub: 'DEF' },
  { num: '4', sub: 'GHI' },
  { num: '5', sub: 'JKL' },
  { num: '6', sub: 'MNO' },
  { num: '7', sub: 'PQRS' },
  { num: '8', sub: 'TUV' },
  { num: '9', sub: 'WXYZ' },
  { num: '*', sub: 'P' },
  { num: '0', sub: '+' },
  { num: '#', sub: 'W' },
];

const T9_MAP: Record<string, string[]> = {
  '2': ['a', 'b', 'c'],
  '3': ['d', 'e', 'f'],
  '4': ['g', 'h', 'i'],
  '5': ['j', 'k', 'l'],
  '6': ['m', 'n', 'o'],
  '7': ['p', 'q', 'r', 's'],
  '8': ['t', 'u', 'v'],
  '9': ['w', 'x', 'y', 'z'],
  '0': ['+'],
};

// Format timestamp to readable phone dialer date
function formatCallTime(timestamp: number): string {
  if (!timestamp) return 'Unknown';
  const now = new Date();
  const date = new Date(timestamp);
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (diffHours < 24 && now.getDate() === date.getDate()) {
    return `Today, ${timeStr}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.getDate() === date.getDate() && yesterday.getMonth() === date.getMonth()) {
    return `Yesterday, ${timeStr}`;
  }
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
}

// Format call duration in seconds to "Xm Ys"
function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (mins < 60) return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

// Extract contact initials
function getInitials(name: string): string {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const PhoneApp: React.FC<PhoneAppProps> = () => {
  const [activeTab, setActiveTab] = useState<'dialer' | 'recents' | 'contacts'>('dialer');
  const [sidebarTab, setSidebarTab] = useState<'recents' | 'contacts'>('recents');
  const [number, setNumber] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live device data
  const [contacts, setContacts] = useState<DeviceContact[]>([]);
  const [callLogs, setCallLogs] = useState<DeviceCallLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [recentsFilter, setRecentsFilter] = useState<'all' | 'missed' | 'incoming' | 'outgoing'>('all');
  const [recentsSearch, setRecentsSearch] = useState('');
  const [contactsSearch, setContactsSearch] = useState('');

  // Active call state
  const [activeCall, setActiveCall] = useState<{
    number: string;
    name: string;
    duration: number;
    isMuted: boolean;
    isSpeaker: boolean;
    isMinimized: boolean;
    showDtmf: boolean;
  } | null>(null);

  // Container sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 400, height: 540 });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerDimensions({
          width: Math.round(entry.contentRect.width),
          height: Math.round(entry.contentRect.height),
        });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const isWide = containerDimensions.width >= 640;

  // Load real contacts and real call log from Android device
  const loadDeviceTelephony = async () => {
    setIsRefreshing(true);
    try {
      const [contactsRes, callsRes] = await Promise.all([
        platformAdapter.getDeviceContacts(),
        platformAdapter.getDeviceCallLog(),
      ]);

      if (contactsRes.ok && contactsRes.value) {
        setContacts(contactsRes.value);
      }
      if (callsRes.ok && callsRes.value) {
        setCallLogs(callsRes.value);
      }
    } catch (e) {
      console.error('[PhoneApp] Failed to load telephony data:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDeviceTelephony();
  }, []);

  // Call timer effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (activeCall) {
      timer = setInterval(() => {
        setActiveCall((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeCall !== null]);

  // Handle dial input
  const handleDial = (char: string) => {
    if (number.length < 24) {
      setNumber((prev) => prev + char);
    }
  };

  const handleDelete = () => {
    setNumber((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setNumber('');
  };

  // Keyboard navigation for dialer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isWide && activeTab !== 'dialer') return;
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key >= '0' && e.key <= '9') {
        handleDial(e.key);
      } else if (e.key === '*' || e.key === '#' || e.key === '+') {
        handleDial(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter' && number.trim()) {
        handleStartCall();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, number, isWide]);

  // Initiate call
  const handleStartCall = async (targetNum?: string, targetName?: string) => {
    const numToCall = (targetNum || number).trim();
    if (!numToCall) return;

    // Find contact name if not provided
    const match = contacts.find((c) => c.number.replace(/\D/g, '') === numToCall.replace(/\D/g, ''));
    const displayName = targetName || (match ? match.name : numToCall);

    // Call native Android phone dialer
    await platformAdapter.makePhoneCall(numToCall);

    // Launch in-shell active call view
    setActiveCall({
      number: numToCall,
      name: displayName,
      duration: 0,
      isMuted: false,
      isSpeaker: false,
      isMinimized: false,
      showDtmf: false,
    });
  };

  const handleEndCall = () => {
    if (activeCall) {
      // Add local entry to recent calls immediately
      const newEntry: DeviceCallLogItem = {
        id: Date.now().toString(),
        number: activeCall.number,
        name: activeCall.name,
        timestamp: Date.now(),
        durationSeconds: activeCall.duration,
        type: 'outgoing',
      };
      setCallLogs((prev) => [newEntry, ...prev]);
    }
    setActiveCall(null);
  };

  // Copy number to clipboard
  const handleCopyNumber = (num: string, id: string) => {
    navigator.clipboard?.writeText(num);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // T9 contact matching for active dialer
  const t9Matches = useMemo(() => {
    if (!number || number.length < 1) return [];
    const cleanNum = number.replace(/\D/g, '');
    const cleanInput = number.toLowerCase();

    return contacts
      .filter((c) => {
        // Direct number match
        const cNum = c.number.replace(/\D/g, '');
        if (cNum.includes(cleanNum)) return true;

        // T9 letters match on contact name
        const nameLower = c.name.toLowerCase();
        if (cleanNum.length > 0) {
          const pattern = cleanNum
            .split('')
            .map((d) => (T9_MAP[d] ? `[${T9_MAP[d].join('')}]` : d))
            .join('');
          try {
            if (new RegExp(pattern, 'i').test(nameLower)) return true;
          } catch {}
        }
        return nameLower.includes(cleanInput);
      })
      .slice(0, 8);
  }, [number, contacts]);

  // Exact matching contact for currently typed number
  const exactContactMatch = useMemo(() => {
    if (!number) return null;
    const clean = number.replace(/\D/g, '');
    return contacts.find((c) => c.number.replace(/\D/g, '') === clean);
  }, [number, contacts]);

  // Filtered recent calls
  const filteredRecents = useMemo(() => {
    return callLogs.filter((item) => {
      if (recentsFilter === 'missed' && item.type !== 'missed') return false;
      if (recentsFilter === 'incoming' && item.type !== 'incoming') return false;
      if (recentsFilter === 'outgoing' && item.type !== 'outgoing') return false;

      if (recentsSearch.trim()) {
        const query = recentsSearch.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesNum = item.number.includes(query);
        return matchesName || matchesNum;
      }
      return true;
    });
  }, [callLogs, recentsFilter, recentsSearch]);

  // Missed call count
  const missedCount = useMemo(() => {
    return callLogs.filter((c) => c.type === 'missed').length;
  }, [callLogs]);

  // Filtered & grouped contacts
  const filteredContacts = useMemo(() => {
    const q = contactsSearch.toLowerCase().trim();
    const list = contacts.filter((c) => {
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.number.includes(q);
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts, contactsSearch]);

  // RENDER: Active In-Call View
  const renderActiveCallScreen = () => {
    if (!activeCall) return null;
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(180deg, #14141d 0%, #09090c 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 20px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header with Minimize button */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setActiveCall((prev) => (prev ? { ...prev, isMinimized: true } : null))}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: 6,
              color: '#aaa',
              padding: '5px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <Minimize2 size={13} />
            <span>Minimize</span>
          </button>
        </div>

        {/* Pulse Avatar & Contact Name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(215, 25, 33, 0.35) 0%, rgba(215, 25, 33, 0.05) 70%)',
              border: '2px solid #d71921',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 28px rgba(215, 25, 33, 0.4)',
              fontSize: 28,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            {getInitials(activeCall.name)}
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{activeCall.name}</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 3, fontFamily: 'monospace' }}>
              {activeCall.number}
            </div>
            <div style={{ fontSize: 16, fontFamily: 'monospace', color: '#00d26a', marginTop: 8, fontWeight: 600 }}>
              {Math.floor(activeCall.duration / 60)}:{(activeCall.duration % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* DTMF Pad during call (if toggled) */}
        {activeCall.showDtmf && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 6,
              width: 200,
              background: 'rgba(0, 0, 0, 0.5)',
              padding: 10,
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
              <button
                key={k}
                onClick={() => handleDial(k)}
                style={{
                  height: 34,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {k}
              </button>
            ))}
          </div>
        )}

        {/* Call Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
          <div style={{ display: 'flex', gap: 18 }}>
            {/* Mute */}
            <button
              onClick={() => setActiveCall((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null))}
              title={activeCall.isMuted ? 'Unmute' : 'Mute'}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: activeCall.isMuted ? '#d71921' : 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              {activeCall.isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* Speaker */}
            <button
              onClick={() => setActiveCall((prev) => (prev ? { ...prev, isSpeaker: !prev.isSpeaker } : null))}
              title={activeCall.isSpeaker ? 'Speaker Off' : 'Speaker On'}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: activeCall.isSpeaker ? '#00d26a' : 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              {activeCall.isSpeaker ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>

            {/* DTMF Keypad */}
            <button
              onClick={() => setActiveCall((prev) => (prev ? { ...prev, showDtmf: !prev.showDtmf } : null))}
              title="Toggle Keypad"
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: activeCall.showDtmf ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Hash size={20} />
            </button>
          </div>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: '#d71921',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 18px rgba(215, 25, 33, 0.5)',
              transition: 'transform 0.1s ease',
            }}
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    );
  };

  // RENDER: Dialer Pad Content (usable in both Compact and Wide mode)
  const renderDialerContent = (wideMode: boolean) => (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: wideMode ? '16px 24px' : '8px 16px',
        width: '100%',
        maxWidth: wideMode ? 360 : 340,
        margin: '0 auto',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* T9 Horizontal Match Chips Strip */}
      {t9Matches.length > 0 && (
        <div
          style={{
            width: '100%',
            overflowX: 'auto',
            display: 'flex',
            gap: 6,
            padding: '2px 0 6px 0',
            scrollbarWidth: 'none',
            flexShrink: 0,
          }}
        >
          {t9Matches.map((match) => (
            <div
              key={match.id}
              onClick={() => {
                setNumber(match.number);
                handleStartCall(match.number, match.name);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 20,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(215, 25, 33, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'rgba(215, 25, 33, 0.3)',
                  color: '#ff4d4f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                {getInitials(match.name)}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{match.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Number Display & Backspace */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '4px 0',
          minHeight: 44,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: number.length > 12 ? 18 : 24,
            fontWeight: 600,
            letterSpacing: '0.06em',
            fontFamily: 'monospace',
            color: '#fff',
            textAlign: 'center',
            lineHeight: '28px',
            wordBreak: 'break-all',
          }}
        >
          {number || (
            <span style={{ color: '#555', fontSize: 16, letterSpacing: '0.02em', fontWeight: 400 }}>
              Dial a number
            </span>
          )}
        </div>

        {exactContactMatch && (
          <div style={{ fontSize: 11, color: '#00d26a', fontWeight: 600, marginTop: 1 }}>
            {exactContactMatch.name}
          </div>
        )}

        {number.length > 0 && (
          <button
            onClick={handleDelete}
            onDoubleClick={handleClear}
            title="Backspace (Double tap to clear)"
            style={{
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Delete size={18} />
          </button>
        )}
      </div>

      {/* 12-Key Pad Grid with responsive cell heights */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(4, 1fr)',
          gap: wideMode ? 10 : 'clamp(4px, 1.2vh, 8px)',
          width: '100%',
          flex: 1,
          maxHeight: wideMode ? 280 : undefined,
          minHeight: 0,
        }}
      >
        {DIAL_KEYS.map((k) => (
          <button
            key={k.num}
            onClick={() => handleDial(k.num)}
            style={{
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.08s ease',
              height: '100%',
              minHeight: 0,
              padding: 0,
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.background = 'rgba(215, 25, 33, 0.25)';
              e.currentTarget.style.borderColor = '#d71921';
              e.currentTarget.style.transform = 'scale(0.96)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 600, lineHeight: '20px' }}>{k.num}</span>
            {k.sub && (
              <span
                style={{
                  fontSize: 8,
                  color: '#666',
                  letterSpacing: '0.1em',
                  marginTop: 1,
                  fontWeight: 600,
                }}
              >
                {k.sub}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Call Button Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: wideMode ? 14 : 'clamp(6px, 1.5vh, 12px)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => handleStartCall()}
          disabled={!number.trim()}
          title="Call"
          style={{
            width: wideMode ? 54 : 'clamp(44px, 7vh, 50px)',
            height: wideMode ? 54 : 'clamp(44px, 7vh, 50px)',
            borderRadius: '50%',
            background: number.trim() ? '#d71921' : 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            color: '#fff',
            cursor: number.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: number.trim() ? '0 4px 16px rgba(215, 25, 33, 0.45)' : 'none',
            transition: 'all 0.12s ease',
            opacity: number.trim() ? 1 : 0.4,
          }}
        >
          <PhoneCall size={20} />
        </button>
      </div>
    </div>
  );

  // RENDER: Recents Call Log Content
  const renderRecentsContent = () => (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 12px',
        overflow: 'hidden',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Search & Filter Header */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <div
          style={{
            flex: 1,
            minWidth: 160,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#141418',
            borderRadius: 6,
            padding: '5px 10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Search size={13} color="#666" />
          <input
            type="text"
            value={recentsSearch}
            onChange={(e) => setRecentsSearch(e.target.value)}
            placeholder="Search recents..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 11,
              outline: 'none',
            }}
          />
          {recentsSearch && (
            <button
              onClick={() => setRecentsSearch('')}
              style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 1 }}
            >
              <Delete size={13} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'missed', 'incoming', 'outgoing'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setRecentsFilter(filter)}
              style={{
                padding: '3px 8px',
                borderRadius: 5,
                border: '1px solid',
                borderColor: recentsFilter === filter ? '#d71921' : 'rgba(255, 255, 255, 0.08)',
                background: recentsFilter === filter ? 'rgba(215, 25, 33, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: recentsFilter === filter ? '#fff' : '#888',
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Call Log Scrollable List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          paddingRight: 2,
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 160,
              color: '#888',
              fontSize: 12,
            }}
          >
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
            <span>Loading call log...</span>
          </div>
        ) : filteredRecents.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: '#666',
              padding: '40px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Clock size={32} style={{ opacity: 0.3 }} />
            <div style={{ fontSize: 13, fontWeight: 500 }}>No call history</div>
          </div>
        ) : (
          filteredRecents.map((call) => {
            const isMissed = call.type === 'missed';
            const isRejected = call.type === 'rejected';
            const isIncoming = call.type === 'incoming';
            const isOutgoing = call.type === 'outgoing';

            return (
              <div
                key={call.id}
                onClick={() => {
                  setNumber(call.number);
                  if (!isWide) {
                    setActiveTab('dialer');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  transition: 'background 0.1s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
              >
                {/* Left: Avatar + Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: isMissed || isRejected ? 'rgba(215, 25, 33, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                      color: isMissed || isRejected ? '#d71921' : '#fff',
                      border: isMissed ? '1px solid #d71921' : '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(call.name)}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: isMissed ? '#ff4d4f' : '#fff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {call.name}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        marginTop: 1,
                        fontSize: 10,
                        color: '#888',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {isMissed && <PhoneMissed size={11} color="#d71921" />}
                      {isIncoming && <PhoneIncoming size={11} color="#00d26a" />}
                      {isOutgoing && <PhoneOutgoing size={11} color="#888" />}
                      {isRejected && <PhoneOff size={11} color="#d71921" />}

                      <span style={{ fontFamily: 'monospace' }}>{call.number}</span>
                      <span>•</span>
                      <span>{formatCallTime(call.timestamp)}</span>
                      {call.durationSeconds > 0 && (
                        <>
                          <span>•</span>
                          <span>{formatDuration(call.durationSeconds)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Call & Copy */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 6 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyNumber(call.number, call.id);
                    }}
                    title="Copy number"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: copiedId === call.id ? '#00d26a' : '#888',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedId === call.id ? <Check size={12} /> : <Copy size={12} />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartCall(call.number, call.name);
                    }}
                    title="Call back"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'rgba(0, 210, 106, 0.15)',
                      border: '1px solid #00d26a',
                      color: '#00d26a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Phone size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // RENDER: Contacts List Content
  const renderContactsContent = () => (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 12px',
        overflow: 'hidden',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Search Header */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#141418',
            borderRadius: 6,
            padding: '5px 10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Search size={13} color="#666" />
          <input
            type="text"
            value={contactsSearch}
            onChange={(e) => setContactsSearch(e.target.value)}
            placeholder="Search contacts..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 11,
              outline: 'none',
            }}
          />
          {contactsSearch && (
            <button
              onClick={() => setContactsSearch('')}
              style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 1 }}
            >
              <Delete size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Contacts Scrollable List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          paddingRight: 2,
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 160,
              color: '#888',
              fontSize: 12,
            }}
          >
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
            <span>Loading contacts...</span>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: '#666',
              padding: '40px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Users size={32} style={{ opacity: 0.3 }} />
            <div style={{ fontSize: 13, fontWeight: 500 }}>No contacts found</div>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => {
                setNumber(contact.number);
                if (!isWide) {
                  setActiveTab('dialer');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
            >
              {/* Left: Avatar + Details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(215, 25, 33, 0.15) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {getInitials(contact.name)}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {contact.name}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      marginTop: 1,
                      fontSize: 10,
                      color: '#888',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <span style={{ fontFamily: 'monospace' }}>{contact.number}</span>
                    {contact.label && (
                      <span
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          padding: '1px 4px',
                          borderRadius: 3,
                          fontSize: 9,
                        }}
                      >
                        {contact.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Quick Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 6 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyNumber(contact.number, contact.id);
                  }}
                  title="Copy number"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: copiedId === contact.id ? '#00d26a' : '#888',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {copiedId === contact.id ? <Check size={12} /> : <Copy size={12} />}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartCall(contact.number, contact.name);
                  }}
                  title={`Call ${contact.name}`}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: 'rgba(0, 210, 106, 0.15)',
                    border: '1px solid #00d26a',
                    color: '#00d26a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Phone size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: '#09090b',
        color: '#f4f4f5',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        userSelect: 'none',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Minimized Active Call Banner (if minimized in either mode) */}
      {activeCall && activeCall.isMinimized && (
        <div
          style={{
            background: 'linear-gradient(90deg, #d71921 0%, #a31219 100%)',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 10px rgba(215, 25, 33, 0.4)',
            zIndex: 100,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#fff',
                animation: 'pulse 1.2s infinite',
              }}
            />
            <span style={{ fontWeight: 600, fontSize: 12 }}>{activeCall.name}</span>
            <span style={{ fontSize: 11, fontFamily: 'monospace', opacity: 0.9 }}>
              {Math.floor(activeCall.duration / 60)}:{(activeCall.duration % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => setActiveCall((prev) => (prev ? { ...prev, isMinimized: false } : null))}
              style={{
                padding: '3px 8px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: 4,
                color: '#fff',
                fontSize: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Maximize2 size={11} />
              <span>Expand</span>
            </button>
            <button
              onClick={handleEndCall}
              style={{
                padding: '3px 10px',
                background: '#000',
                border: 'none',
                borderRadius: 4,
                color: '#ff4d4f',
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <PhoneOff size={11} />
              <span>End</span>
            </button>
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          height: 40,
          background: 'rgba(15, 15, 18, 0.98)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0,
        }}
      >
        {isWide ? (
          /* Wide Desktop Mode Header: Title on Left, Sync on Right */
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#d71921',
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#fff',
                }}
              >
                NOTHING PHONE CONSOLE
              </span>
            </div>

            <button
              onClick={loadDeviceTelephony}
              title="Sync Contacts & Calls"
              disabled={isRefreshing}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 5,
                color: '#aaa',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
              }}
            >
              <RefreshCw size={12} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
              <span>Sync</span>
            </button>
          </>
        ) : (
          /* Compact Mode Header: 3 Tabs (DIALER, RECENTS, CONTACTS) */
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: '100%' }}>
              <button
                onClick={() => setActiveTab('dialer')}
                style={{
                  height: '100%',
                  padding: '0 10px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'dialer' ? '2px solid #d71921' : '2px solid transparent',
                  color: activeTab === 'dialer' ? '#fff' : '#888',
                  fontSize: 11,
                  fontWeight: activeTab === 'dialer' ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Phone size={12} color={activeTab === 'dialer' ? '#d71921' : '#888'} />
                <span>DIALER</span>
              </button>

              <button
                onClick={() => setActiveTab('recents')}
                style={{
                  height: '100%',
                  padding: '0 10px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'recents' ? '2px solid #d71921' : '2px solid transparent',
                  color: activeTab === 'recents' ? '#fff' : '#888',
                  fontSize: 11,
                  fontWeight: activeTab === 'recents' ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Clock size={12} color={activeTab === 'recents' ? '#d71921' : '#888'} />
                <span>RECENTS</span>
                {missedCount > 0 && (
                  <span
                    style={{
                      background: '#d71921',
                      color: '#fff',
                      borderRadius: 8,
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '1px 5px',
                      lineHeight: '11px',
                    }}
                  >
                    {missedCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('contacts')}
                style={{
                  height: '100%',
                  padding: '0 10px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'contacts' ? '2px solid #d71921' : '2px solid transparent',
                  color: activeTab === 'contacts' ? '#fff' : '#888',
                  fontSize: 11,
                  fontWeight: activeTab === 'contacts' ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Users size={12} color={activeTab === 'contacts' ? '#d71921' : '#888'} />
                <span>CONTACTS</span>
              </button>
            </div>

            <button
              onClick={loadDeviceTelephony}
              title="Sync Phone"
              disabled={isRefreshing}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <RefreshCw size={13} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </>
        )}
      </div>

      {/* BODY CONTENT */}
      {isWide ? (
        /* WIDE / MAXIMIZED DUAL-PANE VIEW */
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Pane: Contacts / Recents Sidebar */}
          <div
            style={{
              width: 320,
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              background: '#0d0d11',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            {/* Sidebar Tab Selector */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <button
                onClick={() => setSidebarTab('recents')}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: sidebarTab === 'recents' ? '2px solid #d71921' : '2px solid transparent',
                  color: sidebarTab === 'recents' ? '#fff' : '#777',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Clock size={12} />
                <span>RECENTS</span>
                {missedCount > 0 && (
                  <span
                    style={{
                      background: '#d71921',
                      color: '#fff',
                      borderRadius: 8,
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '1px 5px',
                    }}
                  >
                    {missedCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setSidebarTab('contacts')}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: sidebarTab === 'contacts' ? '2px solid #d71921' : '2px solid transparent',
                  color: sidebarTab === 'contacts' ? '#fff' : '#777',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Users size={12} />
                <span>CONTACTS ({contacts.length})</span>
              </button>
            </div>

            {/* Sidebar list content */}
            {sidebarTab === 'recents' ? renderRecentsContent() : renderContactsContent()}
          </div>

          {/* Right Pane: Dialer & Active Call View */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: '#09090b',
              height: '100%',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {activeCall && !activeCall.isMinimized ? (
              renderActiveCallScreen()
            ) : (
              renderDialerContent(true)
            )}
          </div>
        </div>
      ) : (
        /* COMPACT / MINIMIZED SINGLE-PANE VIEW */
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
          {activeCall && !activeCall.isMinimized ? (
            <div style={{ position: 'absolute', inset: 0, zIndex: 90 }}>
              {renderActiveCallScreen()}
            </div>
          ) : activeTab === 'dialer' ? (
            renderDialerContent(false)
          ) : activeTab === 'recents' ? (
            renderRecentsContent()
          ) : (
            renderContactsContent()
          )}
        </div>
      )}
    </div>
  );
};

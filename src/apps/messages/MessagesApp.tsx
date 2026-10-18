import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, MessageSquare, ExternalLink, Trash2, Smartphone } from 'lucide-react';

interface MessagesAppProps {
  windowId: string;
}

interface Message {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  name: string;
  number: string;
  avatar: string;
  lastMessage: string;
  time: string;
  messages: Message[];
}

const MESSAGES_KEY = 'nothing_desk_messages_v2';

export const MessagesApp: React.FC<MessagesAppProps> = () => {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const raw = localStorage.getItem(MESSAGES_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      {
        id: '1',
        name: 'Nothing Desk Assistant',
        number: '+1000',
        avatar: 'N',
        lastMessage: 'Welcome to your Nothing Desk desktop messaging center!',
        time: 'Just now',
        messages: [
          {
            id: 'm1',
            sender: 'them',
            text: 'Welcome to Nothing Desk on your Nothing Phone! You can manage files, contacts, notes, and messages in full-screen desktop mode.',
            time: 'Just now',
          },
        ],
      },
    ];
  });

  const [selectedId, setSelectedId] = useState<string>('1');
  const [inputText, setInputText] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatNumber, setNewChatNumber] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, selectedId]);

  const activeConv = conversations.find((c) => c.id === selectedId) || conversations[0];

  const handleSend = () => {
    if (!inputText.trim() || !activeConv) return;
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'me',
      text: inputText.trim(),
      time: timeStr,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? {
              ...c,
              lastMessage: newMsg.text,
              time: timeStr,
              messages: [...c.messages, newMsg],
            }
          : c
      )
    );
    setInputText('');
  };

  const handleSendNativeSMS = () => {
    if (!activeConv) return;
    try {
      const bodyParam = encodeURIComponent(inputText || activeConv.lastMessage || '');
      window.open(`sms:${encodeURIComponent(activeConv.number)}?body=${bodyParam}`, '_self');
    } catch {}
  };

  const handleWhatsAppChat = () => {
    if (!activeConv) return;
    const cleanNum = activeConv.number.replace(/\D/g, '');
    if (cleanNum) {
      window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(inputText)}`, '_blank');
    }
  };

  const handleCreateChat = () => {
    if (!newChatName.trim()) return;
    const newConv: Conversation = {
      id: Date.now().toString(),
      name: newChatName.trim(),
      number: newChatNumber.trim() || 'Mobile',
      avatar: newChatName.trim()[0].toUpperCase(),
      lastMessage: 'Conversation created',
      time: 'Just now',
      messages: [],
    };
    setConversations([newConv, ...conversations]);
    setSelectedId(newConv.id);
    setNewChatName('');
    setNewChatNumber('');
    setShowNewChatModal(false);
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = conversations.filter((c) => c.id !== id);
    setConversations(filtered);
    if (selectedId === id && filtered.length > 0) {
      setSelectedId(filtered[0].id);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', background: '#0a0a0c', color: '#fff', fontSize: 13, userSelect: 'none' }}>
      {/* Left Conversations Sidebar */}
      <div
        style={{
          width: 220,
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 15, 18, 0.95)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
            <MessageSquare size={14} color="#d71921" />
            <span>MESSAGES</span>
          </div>
          <button
            onClick={() => setShowNewChatModal(true)}
            style={{
              padding: '4px 8px',
              background: '#d71921',
              borderRadius: 4,
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Plus size={12} />
            <span>New</span>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {conversations.map((c) => {
            const isSelected = c.id === activeConv?.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  background: isSelected ? 'rgba(215, 25, 33, 0.15)' : 'transparent',
                  borderLeft: `3px solid ${isSelected ? '#d71921' : 'transparent'}`,
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isSelected ? '#d71921' : 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  {c.avatar}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.name}
                    </span>
                    <span style={{ fontSize: 10, color: '#666' }}>{c.time}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                    {c.lastMessage}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(c.id, e)}
                  style={{ padding: 4, color: '#555', cursor: 'pointer', opacity: isSelected ? 1 : 0 }}
                  title="Delete chat"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Chat Panel */}
      {activeConv ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 16px',
              background: 'rgba(18, 18, 22, 0.95)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{activeConv.name}</div>
              <div style={{ fontSize: 10, color: '#888' }}>{activeConv.number}</div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSendNativeSMS}
                title="Send as real SMS via device"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 4,
                  fontSize: 11,
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                <Smartphone size={12} color="#00d26a" />
                <span>Device SMS</span>
              </button>

              <button
                onClick={handleWhatsAppChat}
                title="Open WhatsApp chat"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  background: 'rgba(0, 210, 106, 0.15)',
                  border: '1px solid #00d26a',
                  borderRadius: 4,
                  fontSize: 11,
                  color: '#00d26a',
                  cursor: 'pointer',
                }}
              >
                <ExternalLink size={12} />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeConv.messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#666', marginTop: 40 }}>
                No messages yet. Send a message below.
              </div>
            ) : (
              activeConv.messages.map((m) => {
                const isMe = m.sender === 'me';
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      padding: '8px 12px',
                      borderRadius: 12,
                      background: isMe ? '#d71921' : 'rgba(255, 255, 255, 0.06)',
                      border: `1px solid ${isMe ? '#d71921' : 'rgba(255, 255, 255, 0.08)'}`,
                      color: '#fff',
                    }}
                  >
                    <div style={{ fontSize: 13, lineHeight: 1.4 }}>{m.text}</div>
                    <div
                      style={{
                        fontSize: 9,
                        color: isMe ? 'rgba(255,255,255,0.7)' : '#666',
                        textAlign: 'right',
                        marginTop: 4,
                        fontFamily: 'monospace',
                      }}
                    >
                      {m.time}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(15, 15, 18, 0.95)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: 8,
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              style={{
                flex: 1,
                background: '#15151b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                padding: '8px 12px',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              style={{
                padding: '8px 16px',
                background: inputText.trim() ? '#d71921' : 'rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                color: '#fff',
                cursor: inputText.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 600,
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
          Select or create a conversation
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 300,
              background: '#16161c',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>New Conversation</div>
            <input
              type="text"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              placeholder="Recipient Name"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#0a0a0c',
                border: '1px solid #333',
                borderRadius: 6,
                color: '#fff',
                marginBottom: 8,
                outline: 'none',
              }}
            />
            <input
              type="tel"
              value={newChatNumber}
              onChange={(e) => setNewChatNumber(e.target.value)}
              placeholder="Phone Number (e.g. +91 9876543210)"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#0a0a0c',
                border: '1px solid #333',
                borderRadius: 6,
                color: '#fff',
                marginBottom: 14,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowNewChatModal(false)} style={{ padding: '6px 12px', color: '#aaa', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleCreateChat}
                style={{
                  padding: '6px 14px',
                  background: '#d71921',
                  color: '#fff',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

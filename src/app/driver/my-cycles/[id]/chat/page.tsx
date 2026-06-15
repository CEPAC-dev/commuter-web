'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getTripMessages, sendMessage, type ChatMessage } from '@/lib/api/chat';

function formatTime(raw: string) {
  const d = new Date(raw);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function DriverChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('trip_chat');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tripId = Number(id);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await getTripMessages(tripId);
      const sorted = (res.data ?? []).sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setMessages(sorted);
      setError(null);
    } catch {
      setError(t('load_error'));
    } finally {
      setLoading(false);
    }
  }, [tripId, t]);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  async function handleSend() {
    const msg = text.trim();
    if (!msg || sending) return;
    setSending(true);
    try {
      await sendMessage(tripId, msg);
      setText('');
      await fetchMessages();
    } catch {
      // ignore send error silently
    } finally {
      setSending(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <span style={{
          width: 32, height: 32,
          border: '3px solid #E2E8F0',
          borderTopColor: '#00C2A8',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            width: 36, height: 36,
            borderRadius: '50%',
            background: '#F1F5F9',
            border: 'none',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#5A6A7A',
            fontSize: 16,
          }}
        >
          ←
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: '#E0FAF6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#00C2A8', flexShrink: 0,
          }}>
            <MessageIcon />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0B1E3D' }}>{t('chat_with_passenger')}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#9AA0A6' }}>Trip #{tripId}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background: '#F8F9FA',
        }}
      >
        {error && (
          <p style={{ textAlign: 'center', color: '#E74C3C', fontSize: 13 }}>{error}</p>
        )}
        {messages.length === 0 && !error && (
          <div style={{ textAlign: 'center', margin: 'auto', color: '#9AA0A6' }}>
            <p style={{ fontSize: 40, margin: '0 0 8px' }}>💬</p>
            <p style={{ fontSize: 14 }}>{t('no_messages')}</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isSelf = msg.is_mine;
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const prevIsSelf = prevMsg?.is_mine;
          const showSenderName = !isSelf && msg.sender?.name && (idx === 0 || prevIsSelf || prevMsg?.sender_id !== msg.sender_id);
          const spacing = prevMsg && prevIsSelf !== isSelf ? '16px' : '8px';
          return (
            <div key={msg.id} style={{ marginBottom: spacing }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isSelf ? 'flex-end' : 'flex-start',
                }}
              >
                {showSenderName && (
                  <span style={{ fontSize: 11, color: '#9AA0A6', marginBottom: 6, paddingInlineStart: 4, fontWeight: 600 }}>
                    {msg.sender.name}
                  </span>
                )}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 6,
                    flexDirection: isSelf ? 'row-reverse' : 'row',
                    maxWidth: '100%',
                  }}
                >
                  <div style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    borderRadius: isSelf ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                    background: isSelf
                      ? 'linear-gradient(135deg, #00C2A8 0%, #00A896 100%)'
                      : '#fff',
                    color: isSelf ? '#fff' : '#0B1E3D',
                    fontSize: 14,
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                    boxShadow: isSelf ? 'none' : '0 1px 3px rgba(11,30,61,0.12)',
                  }}>
                    {msg.message}
                  </div>
                  <span style={{ fontSize: 11, color: '#9AA0A6', whiteSpace: 'nowrap', paddingBottom: 2, opacity: 0.7 }}>
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px 20px',
        borderTop: '1px solid #E2E8F0',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-end',
        flexShrink: 0,
        background: '#fff',
      }}>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={t('type_message')}
          style={{
            flex: 1,
            padding: '11px 16px',
            borderRadius: 28,
            border: '1.5px solid #E2E8F0',
            fontSize: 14,
            outline: 'none',
            fontFamily: 'inherit',
            background: '#F8F9FA',
            color: '#0B1E3D',
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{
            width: 44, height: 44,
            borderRadius: '50%',
            background: text.trim() && !sending
              ? 'linear-gradient(135deg, #00C2A8 0%, #00A896 100%)'
              : '#E2E8F0',
            border: 'none',
            cursor: text.trim() && !sending ? 'pointer' : 'default',
            color: text.trim() && !sending ? '#fff' : '#9AA0A6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          {sending ? (
            <span style={{
              width: 18, height: 18,
              border: '2px solid rgba(255,255,255,0.4)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.6s linear infinite',
            }} />
          ) : (
            <SendIcon />
          )}
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getTripMessages, sendMessage, type ChatMessage } from '@/lib/api/chat';

function formatTime(raw: string) {
  return new Date(raw).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ArrowLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function ChatFillIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
    </svg>
  );
}

export default function DriverChatPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const t       = useTranslations('trip_chat');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text,     setText]     = useState('');
  const [sending,  setSending]  = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const tripId    = Number(id);

  const fetchMessages = useCallback(async () => {
    try {
      const res    = await getTripMessages(tripId);
      const sorted = (res.data ?? []).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
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
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 150); }, []);

  async function handleSend() {
    const msg = text.trim();
    if (!msg || sending) return;
    setSending(true);
    try {
      await sendMessage(tripId, msg);
      setText('');
      await fetchMessages();
    } catch { /* silent */ } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .chat-msg { animation: fadeUp 0.18s ease; }
        .chat-input:focus { border-color: #00C2A8 !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(0,194,168,0.12) !important; }
        .send-btn:not(:disabled):hover { transform: scale(1.07); }
        .send-btn { transition: transform 0.15s, background 0.2s, box-shadow 0.2s; }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#EDEEF0', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* ── Fixed header ── */}
        <div style={{
          background: '#fff',
          borderBottom: '1px solid #E8ECF0',
          display: 'flex', alignItems: 'center',
          padding: '0 16px', height: 66, gap: 12,
          flexShrink: 0,
          boxShadow: '0 1px 8px rgba(11,30,61,0.07)',
          zIndex: 10,
        }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: '#F1F5F9', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#5A6A7A', flexShrink: 0,
            }}
          >
            <ArrowLeft />
          </button>

          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #00C2A8, #00A896)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,194,168,0.3)',
          }}>
            <ChatFillIcon />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0B1E3D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t('chat_with_passenger')}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9AA0A6' }}>
              {t('trip_ref')} #{tripId}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 0 2px rgba(34,197,94,0.25)', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }}>Live</span>
          </div>
        </div>

        {/* ── Scrollable messages ── */}
        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 8px', display: 'flex', flexDirection: 'column' }}
        >
          {loading && (
            <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 32, height: 32, border: '3px solid #E2E8F0', borderTopColor: '#00C2A8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <span style={{ fontSize: 13, color: '#9AA0A6' }}>Loading…</span>
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', margin: 'auto', color: '#E74C3C', fontSize: 14, background: '#FFEBEE', padding: '14px 20px', borderRadius: 12, border: '1px solid #FFCDD2' }}>
              {error}
            </div>
          )}

          {!loading && !error && messages.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#9AA0A6' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#E0FAF6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 30 }}>💬</div>
              <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#0B1E3D' }}>{t('no_messages')}</p>
              <p style={{ margin: 0, fontSize: 13 }}>Start the conversation below!</p>
            </div>
          )}

          {!loading && messages.map((msg, idx) => {
            const isSelf   = msg.is_mine;
            const prev     = idx > 0 ? messages[idx - 1] : null;
            const prevSelf = prev?.is_mine;
            const showName = !isSelf && msg.sender?.name && (idx === 0 || prevSelf || prev?.sender_id !== msg.sender_id);
            const gap = prev && prevSelf !== isSelf ? 18 : 6;
            return (
              <div key={msg.id} className="chat-msg" style={{ marginBottom: gap, display: 'flex', flexDirection: 'column', alignItems: isSelf ? 'flex-end' : 'flex-start' }}>
                {showName && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#5A6A7A', marginBottom: 5, paddingInlineStart: 12 }}>
                    {msg.sender.name}
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: isSelf ? 'row-reverse' : 'row', maxWidth: '82%' }}>
                  <div style={{
                    padding: '10px 16px',
                    borderRadius: isSelf ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                    background: isSelf ? 'linear-gradient(135deg, #00C2A8 0%, #00A896 100%)' : '#fff',
                    color: isSelf ? '#fff' : '#0B1E3D',
                    fontSize: 14, lineHeight: 1.55, wordBreak: 'break-word',
                    boxShadow: isSelf ? '0 2px 12px rgba(0,194,168,0.22)' : '0 1px 4px rgba(11,30,61,0.10)',
                  }}>
                    {msg.message}
                  </div>
                  <span style={{ fontSize: 11, color: '#B0B8C1', whiteSpace: 'nowrap', paddingBottom: 2, flexShrink: 0 }}>
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
          <div style={{ height: 4 }} />
        </div>

        {/* ── Fixed input bar ── */}
        <div style={{
          background: '#fff',
          borderTop: '1px solid #E8ECF0',
          display: 'flex', alignItems: 'center',
          padding: '0 16px', height: 72, gap: 10,
          flexShrink: 0,
          boxShadow: '0 -1px 10px rgba(11,30,61,0.06)',
        }}>
          <input
            ref={inputRef}
            className="chat-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder={t('type_message')}
            style={{
              flex: 1, padding: '12px 18px', borderRadius: 30,
              border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none',
              fontFamily: 'inherit', background: '#F4F6F8', color: '#0B1E3D',
              transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
            }}
          />
          <button
            type="button"
            className="send-btn"
            onClick={handleSend}
            disabled={!text.trim() || sending}
            style={{
              width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
              background: text.trim() && !sending ? 'linear-gradient(135deg, #00C2A8 0%, #00A896 100%)' : '#E8ECF0',
              border: 'none',
              cursor: text.trim() && !sending ? 'pointer' : 'default',
              color: text.trim() && !sending ? '#fff' : '#9AA0A6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: text.trim() && !sending ? '0 2px 10px rgba(0,194,168,0.35)' : 'none',
            }}
          >
            {sending ? (
              <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
            ) : <SendIcon />}
          </button>
        </div>

      </div>
    </>
  );
}

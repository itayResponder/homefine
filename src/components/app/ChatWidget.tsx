import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { useChat } from '../../hooks/useChat';
import { useI18n } from '../../i18n/context';
import styles from './ChatWidget.module.css';

interface Props {
  householdId: string;
}

export function ChatWidget({ householdId }: Props) {
  const { t } = useI18n();
  const isRtl = t.dir === 'rtl';

  const { messages, streaming, error, send, clear } = useChat({ householdId });
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSend = useCallback(() => {
    if (!input.trim() || streaming) return;
    send(input);
    setInput('');
  }, [input, streaming, send]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <>
      <button
        className={styles.fab}
        onClick={() => setOpen((v) => !v)}
        aria-label="AI Chat"
        title="AI Chat"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.4 7.2H22l-6.2 4.5 2.4 7.3L12 17l-6.2 4L8.2 13.7 2 9.2h7.6z" />
          </svg>
        )}
      </button>

      {open && (
        <div className={`${styles.panel} ${isRtl ? styles.panelRtl : ''}`} dir={t.dir}>
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <span className={styles.aiDot} />
              HomeFine AI
            </div>
            <div className={styles.headerActions}>
              {messages.length > 0 && (
                <button
                  className={styles.clearBtn}
                  onClick={clear}
                  title="Clear chat"
                  aria-label="Clear chat"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              )}
              <button
                className={styles.closeBtn}
                onClick={() => setOpen(false)}
                aria-label="Close chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.errorBanner} role="alert">
              {error}
            </div>
          )}

          <div className={styles.messages}>
            {messages.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>✨</div>
                <p>שאל אותי כל שאלה על המשק הבית שלך</p>
              </div>
            )}

            {messages.map((msg, index) => {
              const isLast = index === messages.length - 1;
              const isStreamingMsg = isLast && msg.role === 'assistant' && streaming;

              return (
                <div
                  key={msg.id}
                  className={`${styles.bubble} ${
                    msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant
                  }`}
                >
                  <div className={styles.bubbleContent}>
                    {msg.content || (isStreamingMsg ? '' : '…')}
                    {isStreamingMsg && (
                      <span className={styles.cursor} aria-hidden="true">|</span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className={styles.footer}>
            <textarea
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="הקלד הודעה..."
              rows={1}
              disabled={streaming}
              aria-label="Chat input"
            />
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={!input.trim() || streaming}
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

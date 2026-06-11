# Chat Feature — Implementation Plan
> Generated for Claude Code execution.  
> **Rule: Create new files only. Do NOT modify any existing file.**

---

## Files to Create

| # | Path | Type |
|---|------|------|
| 1 | `src/services/api.ts` | Service layer — backend communication |
| 2 | `src/hooks/useChat.ts` | React hook — chat state management |
| 3 | `src/components/app/ChatWidget.tsx` | UI component — floating chat panel |
| 4 | `src/components/app/ChatWidget.module.css` | CSS Modules — widget styles |

## .env Addition (append one line, do not remove existing)

```
VITE_API_URL=https://homefine-backend.onrender.com
```

---

## Architecture Notes

- `src/services/api.ts` is the **only** file that knows about `VITE_API_URL` or fetch/SSE.
- `src/hooks/useChat.ts` imports from `src/services/api.ts` — never calls fetch directly.
- `src/components/app/ChatWidget.tsx` imports only from `useChat.ts` — no service layer access.
- CSS uses `var(--clr-dark)` and `var(--clr-purple)` defined in `src/index.css`, plus `var(--ac)` / `var(--acl)` from the app's theme system.
- CSS Modules pattern (`.module.css`) follows the existing convention (see `SettingsView.module.css`).
- Firebase `auth` object is imported from `src/firebase/config.ts` (already exports `auth`).

---

## SSE Protocol (Backend Contract)

Backend endpoint: `POST /api/chat/stream`

**Request:**
```json
{
  "messages": [{ "role": "user" | "assistant", "content": "string" }],
  "householdId": "string",
  "lang": "he" | "en"
}
```
Headers:
```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Response stream (each line):**
```
data: {"type":"text","content":"chunk of text..."}
data: {"type":"text","content":"more text..."}
data: {"type":"done"}
```

**On error:**
```
data: {"type":"error","message":"error description"}
data: {"type":"done"}
```

---

## File 1 — `src/services/api.ts`

```typescript
// src/services/api.ts
import { auth } from '../firebase/config';

const BASE_URL = import.meta.env.VITE_API_URL as string;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatStreamEvent {
  type: 'text' | 'done' | 'error';
  content?: string;
  message?: string;
}

/**
 * Opens a streaming POST to /api/chat/stream.
 * Returns a ReadableStream<ChatStreamEvent> that the caller consumes.
 * Rejects if the Firebase token cannot be obtained or the HTTP request fails (non-2xx).
 */
export async function chatStream(
  messages: ChatMessage[],
  householdId: string,
  lang: 'he' | 'en',
): Promise<ReadableStream<ChatStreamEvent>> {
  // 1. Get a fresh Firebase ID token
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated');
  }
  const idToken = await currentUser.getIdToken();

  // 2. POST request
  const response = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ messages, householdId, lang }),
  });

  if (!response.ok) {
    throw new Error(`Backend error: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  // 3. Transform the raw byte stream → parsed ChatStreamEvent stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  return new ReadableStream<ChatStreamEvent>({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last (possibly incomplete) line in the buffer
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const raw = trimmed.slice(5).trim();
          if (!raw) continue;

          try {
            const event = JSON.parse(raw) as ChatStreamEvent;
            controller.enqueue(event);

            if (event.type === 'done') {
              controller.close();
              return;
            }
          } catch {
            // Malformed JSON line — skip silently
          }
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}
```

---

## File 2 — `src/hooks/useChat.ts`

```typescript
// src/hooks/useChat.ts
import { useState, useCallback, useRef } from 'react';
import { chatStream, type ChatMessage } from '../services/api';
import { useI18n } from '../i18n/context';

export interface ChatEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UseChatOptions {
  householdId: string;
}

interface UseChatReturn {
  messages: ChatEntry[];
  streaming: boolean;
  error: string | null;
  send: (text: string) => void;
  clear: () => void;
}

export function useChat({ householdId }: UseChatOptions): UseChatReturn {
  const { lang } = useI18n();
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the active stream so we can cancel on clear()
  const streamRef = useRef<ReadableStream | null>(null);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;

      setError(null);

      // Build the user message
      const userEntry: ChatEntry = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
      };

      // Add placeholder for the assistant reply
      const assistantId = `assistant-${Date.now() + 1}`;
      const assistantPlaceholder: ChatEntry = {
        id: assistantId,
        role: 'assistant',
        content: '',
      };

      setMessages((prev) => [...prev, userEntry, assistantPlaceholder]);
      setStreaming(true);

      // Build the history array for the API (role/content only, no ids)
      // Use functional updater to capture the latest state
      const history: ChatMessage[] = [
        ...messages.map(({ role, content }) => ({ role, content })),
        { role: 'user' as const, content: text.trim() },
      ];

      try {
        const stream = await chatStream(history, householdId, lang);
        streamRef.current = stream;
        const reader = stream.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          if (value.type === 'text' && value.content) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + value.content! }
                  : m,
              ),
            );
          }

          if (value.type === 'error') {
            setError(value.message ?? 'Unknown error');
            break;
          }

          if (value.type === 'done') {
            break;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Connection error';
        setError(msg);
        // Remove the empty assistant placeholder on hard failure
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setStreaming(false);
        streamRef.current = null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [householdId, lang, streaming, messages],
  );

  const clear = useCallback(() => {
    streamRef.current?.cancel?.();
    streamRef.current = null;
    setMessages([]);
    setError(null);
    setStreaming(false);
  }, []);

  return { messages, streaming, error, send, clear };
}
```

---

## File 3 — `src/components/app/ChatWidget.tsx`

```tsx
// src/components/app/ChatWidget.tsx
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

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // Focus input when panel opens
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
      {/* Floating toggle button */}
      <button
        className={styles.fab}
        onClick={() => setOpen((v) => !v)}
        aria-label="AI Chat"
        title="AI Chat"
      >
        {open ? (
          // X icon
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          // Sparkle / AI icon
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.4 7.2H22l-6.2 4.5 2.4 7.3L12 17l-6.2 4L8.2 13.7 2 9.2h7.6z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className={`${styles.panel} ${isRtl ? styles.panelRtl : ''}`} dir={t.dir}>
          {/* Header */}
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

          {/* Error banner */}
          {error && (
            <div className={styles.errorBanner} role="alert">
              {error}
            </div>
          )}

          {/* Messages */}
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

          {/* Input footer */}
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
```

---

## File 4 — `src/components/app/ChatWidget.module.css`

```css
/* src/components/app/ChatWidget.module.css */

/* ── FAB (Floating Action Button) ───────────────────────── */
.fab {
  position: fixed;
  bottom: 24px;
  inset-inline-end: 24px;
  z-index: 900;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: var(--clr-dark);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(26, 26, 46, 0.35);
  transition: transform 0.15s ease, background 0.15s ease;
}

.fab:hover {
  transform: scale(1.08);
  background: var(--clr-purple);
}

/* ── Panel ───────────────────────────────────────────────── */
.panel {
  position: fixed;
  bottom: 88px;
  inset-inline-end: 24px;
  z-index: 899;
  width: 360px;
  max-height: 520px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 8px 40px rgba(26, 26, 46, 0.18), 0 2px 8px rgba(26, 26, 46, 0.08);
  overflow: hidden;
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Header ──────────────────────────────────────────────── */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--clr-dark);
  color: #fff;
  flex-shrink: 0;
}

.headerTitle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.aiDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--clr-purple);
  box-shadow: 0 0 0 3px rgba(148, 144, 204, 0.35);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.headerActions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.clearBtn,
.closeBtn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background 0.15s;
}

.clearBtn:hover,
.closeBtn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

/* ── Error Banner ────────────────────────────────────────── */
.errorBanner {
  background: #FFF1F2;
  color: #E11D48;
  font-size: 12px;
  padding: 8px 14px;
  flex-shrink: 0;
  border-bottom: 1px solid #FECDD3;
}

/* ── Messages ────────────────────────────────────────────── */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scroll-behavior: smooth;
}

.messages::-webkit-scrollbar {
  width: 4px;
}

.messages::-webkit-scrollbar-thumb {
  background: #E2E8F0;
  border-radius: 4px;
}

/* ── Empty State ─────────────────────────────────────────── */
.emptyState {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #94A3B8;
  padding: 24px;
  gap: 8px;
}

.emptyIcon {
  font-size: 32px;
  line-height: 1;
}

.emptyState p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}

/* ── Bubbles ─────────────────────────────────────────────── */
.bubble {
  display: flex;
  max-width: 82%;
}

.bubbleUser {
  align-self: flex-end;
}

.bubbleAssistant {
  align-self: flex-start;
}

.bubbleContent {
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.bubbleUser .bubbleContent {
  background: var(--clr-dark);
  color: #fff;
  border-end-inline-end-radius: 4px;
}

.bubbleAssistant .bubbleContent {
  background: #F1F5F9;
  color: #1E293B;
  border-end-inline-start-radius: 4px;
}

/* ── Streaming cursor ────────────────────────────────────── */
.cursor {
  display: inline-block;
  margin-inline-start: 2px;
  color: var(--clr-purple);
  animation: blink 0.9s step-end infinite;
  font-weight: 300;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ── Footer / Input ──────────────────────────────────────── */
.footer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid #F1F5F9;
  flex-shrink: 0;
  background: #fff;
}

.input {
  flex: 1;
  resize: none;
  border: 1.5px solid #E2E8F0;
  border-radius: 12px;
  padding: 9px 12px;
  font-size: 13px;
  font-family: inherit;
  line-height: 1.45;
  color: var(--clr-dark);
  background: #F8FAFC;
  transition: border-color 0.15s;
  max-height: 120px;
  overflow-y: auto;
}

.input:focus {
  outline: none;
  border-color: var(--clr-purple);
  background: #fff;
}

.input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input::placeholder {
  color: #CBD5E1;
}

.sendBtn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: var(--clr-dark);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, transform 0.1s;
}

.sendBtn:hover:not(:disabled) {
  background: var(--clr-purple);
}

.sendBtn:active:not(:disabled) {
  transform: scale(0.93);
}

.sendBtn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ── Mobile responsive ───────────────────────────────────── */
@media (max-width: 480px) {
  .panel {
    inset-inline-end: 12px;
    inset-inline-start: 12px;
    width: auto;
    bottom: 80px;
  }

  .fab {
    bottom: 16px;
    inset-inline-end: 16px;
  }
}
```

---

## Integration Instructions for Claude Code

After creating all 4 files and appending `.env`:

### How to use `ChatWidget` in the app

`ChatWidget` is a self-contained floating widget. Add it **once** to the top-level app shell where `householdId` is available.

**Example — inside `src/App.tsx` or the household layout component:**

```tsx
import { ChatWidget } from './components/app/ChatWidget';

// Inside the JSX where householdId is available:
<ChatWidget householdId={householdId} />
```

The widget renders a fixed FAB button and manages its own open/close state.  
No prop drilling, no context changes, no existing file modifications required.

---

## Checklist for Claude Code

- [ ] `src/services/api.ts` — created
- [ ] `src/hooks/useChat.ts` — created  
- [ ] `src/components/app/ChatWidget.tsx` — created
- [ ] `src/components/app/ChatWidget.module.css` — created
- [ ] `.env` — `VITE_API_URL=https://homefine-backend.onrender.com` appended (existing lines untouched)
- [ ] No existing file was modified

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

  const streamRef = useRef<ReadableStream | null>(null);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;

      setError(null);

      const userEntry: ChatEntry = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
      };

      const assistantId = `assistant-${Date.now() + 1}`;
      const assistantPlaceholder: ChatEntry = {
        id: assistantId,
        role: 'assistant',
        content: '',
      };

      setMessages((prev) => [...prev, userEntry, assistantPlaceholder]);
      setStreaming(true);

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

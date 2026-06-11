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

export async function chatStream(
  messages: ChatMessage[],
  householdId: string,
  lang: 'he' | 'en',
): Promise<ReadableStream<ChatStreamEvent>> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated');
  }
  const idToken = await currentUser.getIdToken();

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

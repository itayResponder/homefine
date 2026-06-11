---
name: project-chat-widget
description: AI chat widget — architecture, files, backend contract, integration point
metadata:
  type: project
---

Floating AI chat widget backed by a streaming backend. Self-contained — no prop drilling, no context changes needed.

**Why:** Adds an AI assistant to the household app that can answer questions about finances/tasks using the backend at `https://homefine-backend.onrender.com`.

**How to apply:** When touching chat, streaming, or the AI assistant — refer to these files and the SSE contract below.

## Files

| File | Role |
|------|------|
| `src/services/api.ts` | Only file that knows `VITE_API_URL`. Firebase token + fetch + SSE → `ReadableStream<ChatStreamEvent>` |
| `src/hooks/useChat.ts` | State: messages, streaming, error. Calls `chatStream`, appends tokens to assistant bubble |
| `src/components/app/ChatWidget.tsx` | Self-contained floating UI. Uses `useChat` + `useI18n`. RTL-aware via `t.dir` |
| `src/components/app/ChatWidget.module.css` | CSS Modules. Uses `var(--clr-dark)` / `var(--clr-purple)`. Mobile responsive |

## Backend Contract

`POST /api/chat/stream`

Request:
```json
{ "messages": [{ "role": "user"|"assistant", "content": "string" }], "householdId": "string", "lang": "he"|"en" }
```
Headers: `Authorization: Bearer <firebase-id-token>`, `Content-Type: application/json`

Response stream (SSE lines):
```
data: {"type":"text","content":"chunk..."}
data: {"type":"done"}
data: {"type":"error","message":"..."}
```

## Integration

Add once where `householdId` is available:
```tsx
import { ChatWidget } from './components/app/ChatWidget';
<ChatWidget householdId={householdId} />
```

Widget manages its own open/close state. Currently **not yet mounted** in any layout — next step is to add it to `HouseholdLayout.tsx`.

## .env
`VITE_API_URL=https://homefine-backend.onrender.com`

# AI Chat Assistant

A full-stack AI chat application built with Next.js 14, featuring streaming LLM responses, real-time WebSocket cross-tab sync, contextual memory summarization, and voice I/O.

Built by **Muhammad Anees** for Internee.pk.

---

## Tech Stack

| Layer         | Technology                                     |
|---------------|------------------------------------------------|
| Framework     | Next.js 14 (App Router, React Server Components) |
| Language      | TypeScript                                     |
| Styling       | Tailwind CSS (glassmorphism dark theme)        |
| Auth          | Clerk (middleware + client-side)               |
| Database      | MongoDB + Mongoose                             |
| LLM           | Groq (llama-3.1-8b-instant, streaming)         |
| Real-time     | Socket.io (custom Next.js server)              |
| Voice Input   | Web Speech API (primary) / OpenAI Whisper (fallback) |
| Voice Output  | Web Speech Synthesis API                       |
| State         | Zustand + React hooks                          |

## Features

- **Streaming responses** — tokens arrive in real-time via ReadableStream, rendered progressively with a blinking cursor.
- **Authentication** — Clerk-powered sign-in/sign-up with protected routes and middleware.
- **Real-time sync** — Socket.io broadcasts new messages and typing indicators across open tabs/devices.
- **Contextual memory** — conversations exceeding 20 messages are automatically summarized; the summary is prepended to the LLM context to preserve early details without unbounded token growth.
- **Voice input** — microphone button uses the browser's SpeechRecognition API; falls back to MediaRecorder + OpenAI Whisper when unavailable.
- **Voice output** — each assistant message has a "Read aloud" button using SpeechSynthesis; optional auto-read toggle persisted in localStorage.
- **Rate-limit handling** — 429 errors from the LLM API display a friendly retry-after message with a Retry button.
- **Prompt suggestions** — empty-state grid with clickable example prompts that instantly create a conversation and send the message.
- **Dark glassmorphism UI** — frosted-glass panels, cyan/purple accents, smooth animations, custom scrollbars.

## Architecture Overview

The app uses a **custom Next.js server** (`server.ts`) that runs both the Next.js request handler and Socket.io on the same HTTP server. This is necessary because Vercel's serverless functions do not support persistent WebSocket connections; for production on Vercel, Socket.io must be hosted separately (e.g., Railway, Render, or a small Node.js instance).

The chat API route (`/api/chat`) uses the **App Router's Node.js runtime** to:
1. Save the user message to MongoDB
2. Fetch conversation history (last 10 raw messages + optional `contextSummary`)
3. Stream tokens from Groq via `ReadableStream`
4. Save the assistant response and fire a non-blocking summarization check

**Client-side streaming** is handled by `useChat` hook: it issues a `fetch` with `AbortController`, reads the response body chunk by chunk via `ReadableStream.getReader()`, and updates a Zustand-like React state. Optimistic updates insert both messages immediately so the UI feels instant.

**WebSocket events** (`message:new`, `typing:start/end`) are emitted by the API route after database writes, using a globally shared Socket.io instance. The client joins a `conversation:{id}` room on mount and leaves on unmount.

## Setup

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- Groq API key ([groq.com](https://groq.com))

### Environment Variables

Create `.env.local`:

```env
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
MONGODB_URI=mongodb://localhost:27017/chatbot
GROQ_API_KEY=

# Optional — for Whisper voice transcription fallback
OPENAI_API_KEY=
```

### Install & Run

```bash
npm install
npm run dev    # starts custom server (Next.js + Socket.io) on :3000
```

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          — streaming LLM endpoint
│   │   ├── transcribe/route.ts    — Whisper transcription proxy
│   │   ├── conversations/route.ts — CRUD for conversations
│   │   └── messages/route.ts      — message history
│   ├── (chat)/                    — chat UI route group
│   ├── (auth)/                    — sign-in/sign-up layout
│   ├── layout.tsx                 — root layout (Clerk, fonts, SEO)
│   ├── error.tsx                  — global error boundary
│   └── not-found.tsx              — 404 page
├── components/
│   ├── ChatMessage.tsx            — message bubble with voice output
│   ├── ChatInput.tsx              — textarea + mic + send/stop
│   ├── Sidebar.tsx                — conversation list + memory indicator
│   ├── PromptSuggestions.tsx      — empty-state prompt grid
│   ├── SkeletonLoader.tsx         — Suspense fallback
│   └── PermissionModal.tsx        — mic permission denied modal
├── hooks/
│   ├── useChat.ts                 — core state, streaming, socket
│   └── useVoiceInput.ts           — SpeechRecognition / Whisper
├── lib/
│   ├── db/                        — MongoDB helpers
│   ├── memory/summarize.ts        — context summarization
│   ├── voice/whisper.ts           — Whisper API client
│   ├── socket-server.ts           — global Socket.io instance
│   ├── socket-client.ts           — client-side socket singleton
│   └── errors.ts                  — custom error classes
├── models/
│   ├── Conversation.ts            — Mongoose schema + contextSummary
│   └── Message.ts                 — message schema
└── server.ts                      — custom Next.js + Socket.io server
```

## Deployment

See [`deploy-checklist.md`](./deploy-checklist.md) for Vercel deployment instructions and known limitations.

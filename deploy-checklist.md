# Deploy Checklist — Vercel

Use this checklist to deploy the AI Chat Assistant to Vercel.

---

## 1. Environment Variables

Set these in **Vercel Dashboard → Project Settings → Environment Variables**:

| Variable | Required | Notes |
|---|---|---|
| `CLERK_SECRET_KEY` | Yes | From Clerk dashboard |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | From Clerk dashboard |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `GROQ_API_KEY` | Yes | From Groq dashboard |
| `OPENAI_API_KEY` | No | Only needed if using Whisper voice fallback |

## 2. MongoDB Atlas — IP Whitelist

If using MongoDB Atlas:

1. Go to **Network Access** in Atlas.
2. Add `0.0.0.0/0` (allow all) **or** Vercel's published IP ranges:
   - Vercel does not publish static IPs for Serverless+Edge functions.
   - The safest option is `0.0.0.0/0` with TLS enabled (Atlas enforces TLS by default).

## 3. Build Settings

Vercel auto-detects Next.js. Defaults should work:

- **Framework preset:** Next.js
- **Build command:** `npm run build`
- **Output directory:** `.next`
- **Node version:** 18.x or 20.x

## 4. Socket.io — Known Limitation

**Vercel's serverless/edge functions do not support persistent WebSocket connections.** The app includes a custom `server.ts` that runs both Next.js and Socket.io on the same HTTP server — this works on traditional Node.js hosts but **not on Vercel's serverless platform**.

### Options for Socket.io in production:

1. **Recommended: Separate WebSocket host** — Deploy the Socket.io server on a platform that supports persistent connections:
   - [Railway](https://railway.app) — easy, Node.js-friendly.
   - [Render](https://render.com) — Web Service (not Static).
   - A small VPS (DigitalOcean, Linode).

   The socket server code in `server.ts` can be extracted and run standalone. The Next.js app (deployed on Vercel) would then connect to the remote Socket.io URL via `NEXT_PUBLIC_SOCKET_URL`.

2. **Disable real-time features** — The chat works without Socket.io: messages sync via the existing fetch-streaming path, and cross-tab sync simply won't be available. Set the client to skip socket connection when the `NEXT_PUBLIC_SOCKET_URL` env var is absent.

### Current behavior without a Socket.io server:

- The app runs normally on Vercel.
- `getIO()` returns `undefined`, so `io.to(room).emit(...)` calls are safely skipped.
- Streaming, chat, auth, and voice I/O all work.
- Cross-tab message sync and typing indicators are unavailable.

## 5. Deployment Steps

```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Create Vercel project
#    - Import the GitHub repo
#    - Add env vars from step 1
#    - Deploy

# 3. (Optional) Deploy Socket.io server
#    - Copy server.ts and lib/socket-server.ts to a separate repo
#    - Deploy on Railway/Render
#    - Set NEXT_PUBLIC_SOCKET_URL in Vercel
```

## 6. Post-Deploy Verification

- [ ] Sign-up / Sign-in flow works
- [ ] New chat creates a conversation
- [ ] Messages stream in real-time
- [ ] Voice input (SpeechRecognition) works in supported browsers
- [ ] Rate limit messages display correctly
- [ ] Error page shows glass-themed boundary
- [ ] 404 page renders styled content
- [ ] Loading skeletons appear during navigation
- [ ] SEO meta tags are rendered (inspect `<head>`)

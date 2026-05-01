# Dogfood checklist — Camille v0

Use this before calling the app “ready for daily learning.” Last aligned with **Implementation plan v1.3**.

## Environment (once per machine)

- [ ] `cp .env.example .env` and fill **`DATABASE_URL`**, **`BETTER_AUTH_SECRET`**, **`BETTER_AUTH_URL`**.
- [ ] Set **`GOOGLE_GENAI_API_KEY`** (or `GEMINI_API_KEY`).
- [ ] Optional voice duplex: **`GEMINI_LIVE_RESPONSE_MODALITIES=TEXT,AUDIO`** (speakers on; see `docs/adr/002-browser-audio-live.md`).
- [ ] For session audio without AWS: **`AUDIO_STORAGE_BACKEND=local`** (and ensure `.data/session-audio/` is writable).
- [ ] Optional: `RESEND_API_KEY` for magic links; otherwise confirm password sign-up works.

## Database

- [ ] `npm install` then **`npx prisma migrate dev`** (or `npm run db:push` for a throwaway DB).

## Happy path (10–15 min)

1. [ ] Open `/sign-up`, create account (or sign in).
2. [ ] Complete **onboarding** → land on **`/dashboard`**.
3. [ ] Open **`/settings`**, change CEFR or voice, **Save**, reload page and confirm values stick.
4. [ ] From dashboard, **Start a session** → mic check → **Start call**.
5. [ ] Wait for **Connected**; send a short French line via **Message** or speak (with **`GEMINI_LIVE_RESPONSE_MODALITIES`** including **AUDIO**) → expect assistant reply in captions and **both** learner + Camille lines on the transcript after end.
6. [ ] **End call** → **complete** page → **transcript** shows turns.
7. [ ] **`/history`** lists the session; open **diagnostic** if `audioS3Key` exists (local mode usually does after finalize).
8. [ ] **`/progress`** shows non-zero week minutes after at least one ended session.

## Known limitations (expected for v0)

- Default Live modality is **TEXT** unless you set `GEMINI_LIVE_RESPONSE_MODALITIES` — see `docs/adr/002-browser-audio-live.md`.
- Diagnostic **scores** are placeholders until M3-T05–T09 (Azure + Gemini Flash).
- Help chips in live UI are **toasts / stubs** until M4-T08.

## If something fails

- **503 on token** — missing or invalid Gemini API key.
- **404 on live** — session not `IN_PROGRESS` (start a new session from dashboard).
- **No `audioS3Key`** after end — check server logs for `finalizePracticeSessionAudio`; confirm local dir or S3 credentials.

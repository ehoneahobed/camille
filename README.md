# Camille — Immersive French learning

Next.js 16 app (see `docs/PRD.md` and `docs/IMPLEMENTATION_PLAN.md`).

## Quick start

1. **Environment**

   ```bash
   cp .env.example .env
   ```

   Set `DATABASE_URL`, `BETTER_AUTH_SECRET` (≥32 random bytes), and `BETTER_AUTH_URL` (e.g. `http://localhost:3000`). For magic links in dev, add `RESEND_API_KEY` or rely on console logging when it is unset.

   For **Gemini Live**, set `GOOGLE_GENAI_API_KEY` (or `GEMINI_API_KEY`). For **session audio**, either:
   - **`AUDIO_STORAGE_BACKEND=local`** (recommended for dev): chunks are `PUT` to the Next server and stored under `LOCAL_AUDIO_DIR` (default `.data/session-audio/`; gitignored). No AWS credentials required. `PracticeSession.audioS3Key` will look like `local:dev/sessions/…/audio.webm`.
   - **`AUDIO_STORAGE_BACKEND=s3`** (default / production): set `AWS_S3_BUCKET`, `AWS_REGION`, and credentials the SDK can use. Add a bucket CORS rule allowing browser `PUT` from your app origin (see `docs/adr/003-audio-concat-s3.md`). `S3_KEY_PREFIX` (`dev/` or `prod/`) is used for object keys and matches the local folder layout when testing both modes.

2. **Database**

   Option A — Docker:

   ```bash
   docker compose up -d
   # DATABASE_URL=postgresql://camille:camille@localhost:5432/camille
   ```

   Option B — [Neon](https://neon.tech) or any Postgres host.

3. **Migrate & run**

   ```bash
   npm install
   npx prisma migrate dev --name init
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) — sign up, complete onboarding, open the dashboard.

## Scripts

| Command           | Description                |
| ----------------- | -------------------------- |
| `npm run dev`     | Next.js dev (Turbopack)    |
| `npm run build`   | `prisma generate` + build  |
| `npm run lint`    | ESLint                     |
| `npm run db:push` | Push schema (dev shortcut) |

## Repo layout

- `app/` — Next.js App Router (marketing, auth, authenticated shell).
- `lib/` — Auth, DB, mail helpers.
- `prisma/` — Schema and migrations.
- `prototype/` — Original static HTML/React prototype.
- `docs/` — PRD and implementation plan.

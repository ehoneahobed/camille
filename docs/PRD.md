# Product Requirements Document (PRD)

## Camille — Immersive French Learning Companion


| Field            | Value                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------- |
| **Version**      | 2.1                                                                                     |
| **Status**       | **Ready for implementation** — scope locked unless explicitly re-baselined              |
| **Owner**        | Obed                                                                                    |
| **Last updated** | April 28, 2026                                                                          |
| **Supersedes**   | PRD v1.0; unifies v0.1 “French Immersion Companion” technical PRD with prototype vision |


**Mandated stack:** Next.js 16 (App Router), PostgreSQL (e.g. Neon), Prisma ORM, Better Auth (email + password **and** magic link), Resend (transactional email), Vercel (deployment baseline)

**How to read requirement IDs:** `A-*` auth, `S-*` scenarios, `C-*` conversation, `AU-*` audio, `T-*` transcript, `D-*` diagnostic, `P-*` progress/history, `G-*` settings, `M-*` marketing.

---

## 1. Purpose and authority

### 1.1 Role of this document

Single source of truth for **what** we build, **why**, and **acceptance-level** behaviour. Implementation details (exact JSON schemas, prompt text, rate-limit numbers) live in code + ADRs + technical specs, but must **not contradict** this PRD.

- Scope changes **update this file first**, then code.  
- Anything in **§14.1 (deferred)** or **§14.2 (non-goals)** is **out of scope for v1.0** unless the team re-baselines with a version bump and changelog note.

### 1.2 Lineage

1. **In-repo prototype** (`index.html`, `src/*`): UX, scenarios, diagnostics layout, progress, settings, marketing.
2. **v0.1 technical PRD** (Apr 27, 2026): Gemini Live token pattern, S3 + MediaRecorder, Azure + Gemini diagnostics, risks.

**Conflict rule:** Camille **bilingual / multi-user / credentials + magic link** vision wins over v0.1’s single-user or French-only-only stance. v0.1 remains the **default engineering pattern** for realtime audio, storage, and diagnostics until a spike documents a change in an ADR.

### 1.3 Assumptions (v1.0)

- **Web first:** desktop-class browsers (Chrome, Safari, Firefox, Edge — exact minimum versions set in eng docs after MediaRecorder spike).  
- **App shell language:** English for navigation and settings.  
- **Learning language:** French; English allowed **inside** the learning interaction as a bridge per §5.

---

## 2. Problem statement

### 2.1 Market gap

Many French products optimise for retention metrics and shallow gamification rather than **spoken fluency**. Typical gaps:

- Recognition over production (MCQ, matching) vs forced **spoken** output.  
- Weak or absent **speaking feedback**, or feedback that never teaches correction.  
- English-heavy UI trains **think-in-English-then-translate**.  
- Over-scripted dialogues vs **messy realtime** interaction.  
- Poor **adaptation** for adults who tolerate discomfort to progress faster.

### 2.2 Camille’s response

**Voice-first** practice with a **French-default** tutor, **English on demand** for meaning and phrasing, **repeat-to-continue** back into French, **level-aware** difficulty, and **optional** post-session **diagnostics** (pronunciation, grammar, vocabulary) grounded in **real audio + transcript**—without blocking session end or daily flow.

---

## 3. Target users and positioning


| Dimension | v0.1 (historical)           | **v1.0 (authoritative)**                                                                         |
| --------- | --------------------------- | ------------------------------------------------------------------------------------------------ |
| Tenancy   | Single user, allowlist      | **Multi-user**; optional env **invite list** for private beta only                               |
| Auth      | Magic only                  | **Better Auth:** magic link **+** email/password; **Resend** for magic links and reminder emails |
| Pedagogy  | French-only post-onboarding | **French-first + English bridge** + production back in French                                    |


**Personas:** motivated adults from false beginner (≈A2) through advanced (C1), 20–60+ minutes per session several times per week, care about **speaking**, want low-shame correction.

---

## 4. North star and metrics

### 4.1 North star

**Minutes of French produced per week** — time spent **actively producing French aloud** in sessions. If a **text fallback** ships, define whether typed French counts toward the same metric and instrument consistently.

**Decision test:** *Does this increase honest weekly minutes of French production without destroying trust or flow?*

### 4.2 Secondary metrics


| Metric                             | Purpose                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| **Voluntary diagnostic rate**      | % of ended sessions where user runs diagnostic — perceived value of feedback |
| **Activation**                     | % of signups completing first session ≥10 minutes within 7 days              |
| **Repeat-to-continue**             | Sessions with ≥1 completed bridge→French cycle (log **skips** separately)    |
| **Business** (when billing exists) | Trial→paid, churn, ARPU                                                      |


---

## 5. Product principles


| #   | Principle                          | Expectation                                                                                            |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| P1  | **Output before input**            | Substantial French **speech** each session; session end state includes production, not only listening  |
| P2  | **French default; English bridge** | Tutor leads in French; English for help/explanation when needed; then **repeat-to-continue** in French |
| P3  | **Real interaction over drills**   | Scenarios set **register**, not linear scripts; freestyle unbounded within safety                      |
| P4  | **Feedback not the chore**         | Diagnostics **after** session, **on demand**, never block “End session”                                |
| P5  | **SRS is plumbing**                | No mandatory flashcard mode in v1; revisit in **§14.1**                                                |
| P6  | **Authentic tone in static copy**  | Prompts and examples use natural French registers where curated                                        |


---

## 6. User journeys

### 6.1 Acquisition → first session

1. Landing → trial / sign in.
2. Sign up or sign in: **password** and/or **magic link**.
3. Onboarding: starting difficulty (CEFR-oriented), voice/persona, daily target, transcript retention, timezone.
4. Scenario pick → pre-session (mic permission, level meter, device label) → **Begin**.

### 6.2 During session (voice-first)

1. `getUserMedia` once; stream feeds **realtime client** + **MediaRecorder** (§7.4).
2. `POST /api/realtime/token` (authenticated); server returns **ephemeral** credentials bound to user + session.
3. Browser connects **directly** to **Gemini Live** (or successor documented in ADR).
4. Tutor **French-first**; **barge-in** when provider supports it.
5. Help: “What did she say?”, “How do I say…?”, “Slow down”, “Repeat” — structured intents (tech spec).
6. **Gloss:** Off / Hover / Always on AI French lines.
7. **Pause** / **End** → flush uploads, persist turns, set session `ENDED`, finalise `audioS3Key` when concat done.

### 6.3 After session

1. Session complete: duration, turns, scenario.
2. User may **Run diagnostic** (async), **View transcript**, or start again.
3. Diagnostic runs **server-side**; user may close the tab — job must complete idempotently (**§7.6 D-6**).
4. Results feed history, home “loose end”, progress charts when implemented.

---

## 7. Feature specification

### 7.1 Authentication


| ID  | Requirement                                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------- |
| A-1 | **Better Auth** with **httpOnly session cookies**; no hand-rolled JWT session unless required by a specific Better Auth mode |
| A-2 | **Magic link** via **Resend** — expiry, single-use, resend cooldown                                                          |
| A-3 | **Email + password** on same account model where product allows                                                              |
| A-4 | Optional `**ALLOWED_EMAILS`** (or similar) for **private beta** — not production’s primary access control                    |
| A-5 | Sign out; **account deletion** + data export hooks for GDPR                                                                  |


**Implementation note:** Prefer **Better Auth’s Prisma adapter / schema** for `User`, `Session`, `Account`, etc., and attach `UserSettings` via `userId` FK — avoid maintaining a duplicate parallel user table.

### 7.2 Scenarios and library


| ID  | Requirement                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------- |
| S-1 | Seed eight scenarios + metadata (FR/EN title, description, CEFR band, tags) aligned with prototype `data.jsx` |
| S-2 | Prompt templates + metadata **in repo** for v1 (no CMS unless added later)                                    |
| S-3 | Library filters: Any, A2, B1, B2, C1 (match if scenario band overlaps filter)                                 |
| S-4 | Starting a session creates `Session` with `scenarioId`, `IN_PROGRESS`                                         |


### 7.3 Live conversation


| ID  | Requirement                                            | Default implementation                                                                                                                                                             |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-1 | Low-latency speech in/out; **barge-in** when available | **Gemini Live** via **Google GenAI TypeScript SDK**; **browser-direct**; server **only mints ephemeral tokens**                                                                    |
| C-2 | French-first + English bridge + repeat-to-continue     | Versioned system + scenario prompts in repo                                                                                                                                        |
| C-3 | Level adaptation                                       | `UserSettings.startingCefr` + rolling estimate from diagnostics when data exists                                                                                                   |
| C-4 | In-session controls                                    | Map to provider + client UX (slow, repeat, replay line)                                                                                                                            |
| C-5 | Captions / gloss                                       | Client renders from stream / turn API                                                                                                                                              |
| C-6 | Avatar                                                 | RPM + visemes **or** static/portrait fallback                                                                                                                                      |
| C-7 | Session length                                         | **Product:** no mandatory 20-minute cap. **Engineering:** `MAX_SESSION_MINUTES` per env + plan; soft in-session warning optional; hard cap only for provider/cost abuse prevention |


**ADR:** Pin exact **Live model ID** at build time; refresh when Google deprecates or improves a SKU.

### 7.4 Audio capture and storage


| ID   | Requirement                                                                                                                                                                                                                             |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AU-1 | One **MediaStream** → realtime SDK **and** parallel `**MediaRecorder`** — spike browser matrix early (**§13**)                                                                                                                          |
| AU-2 | Chunks (e.g. WebM/Opus ~5s) → `**POST /api/audio/presign`** then `**PUT`** to **S3** (presigned)                                                                                                                                        |
| AU-3 | **Concatenate** (or normalise) to single object **at session end** or **on first diagnostic**, whichever first — **document chosen pipeline** in runbook                                                                                |
| AU-4 | **Retention:** default **audio 30 days** (adjust in privacy policy); **transcripts** follow `UserSettings.transcriptRetention` — if off, delete per policy (e.g. after diagnostic completes + grace period); legal review before launch |


### 7.5 Transcript persistence


| ID  | Requirement                                                                                                                                                                |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-1 | `Turn`: `sessionId`, `**index`** (0-based ordered), `role`, `text`, optional `lang`, optional `kind` (`normal`                                                             |
| T-2 | Populate from **provider transcription events** where available; server normalisation allowed                                                                              |
| T-3 | Persist via authenticated API (`PATCH` batch turns or `POST` turn) — **at minimum** flush on pause/end and every N seconds configurable (tech spec picks N for durability) |


### 7.6 Post-session diagnostic


| ID  | Requirement                                                                                                  | Implementation                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| D-1 | User triggers **Diagnose** on ended session                                                                  | Upsert `Diagnostic` with `QUEUED` → worker picks up                                                                           |
| D-2 | **Pronunciation**                                                                                            | **Azure Speech Pronunciation Assessment** (REST), `fr-FR`; week-1 quality spike before UI lock-in                             |
| D-3 | **Grammar** (+ structured vocab hints)                                                                       | **Gemini 2.5 Flash** (or current JSON-capable successor), **versioned JSON schema** in repo                                   |
| D-4 | **Vocabulary** comfortable vs stumbled                                                                       | Same or second LLM pass over transcript (+ timing if available)                                                               |
| D-5 | **Job runner**                                                                                               | Postgres row + **Vercel Cron** and/or **Inngest / Trigger.dev** if serverless timeout insufficient — **record choice in ADR** |
| D-6 | **Idempotency:** re-run or double-click must not corrupt data; terminal states `DONE`                        | `FAILED` with `error` message                                                                                                 |
| D-7 | UI: tabs Pronunciation / Grammar / Vocabulary + annotated transcript; **no editing** diagnostic output in v1 |                                                                                                                               |


**Lifecycle:** `Session` may exist without `Diagnostic` row until first trigger **or** create `Diagnostic` with `NOT_RUN` on session end — **pick one pattern** in schema migration and stick to it (UI treats missing row as “not run” if applicable).

### 7.7 History, home, progress


| ID  | Requirement                                                                                                                 |
| --- | --------------------------------------------------------------------------------------------------------------------------- |
| P-1 | **History:** chronological list; filters All / Analysed / Not analysed                                                      |
| P-2 | **Session detail:** full transcript; waveform when audio exists; run/open diagnostic                                        |
| P-3 | **Home:** CTA to continue; recent sessions; **“loose end”** from last diagnostic when available                             |
| P-4 | **Progress:** streak, weekly minutes vs target, heat grid, estimated level, diagnostic score trend — per prototype fidelity |


### 7.8 Settings, marketing, billing


| ID  | Requirement                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------- |
| G-1 | Voice/persona, starting CEFR, daily target minutes, email reminder toggle, transcript retention, timezone                       |
| G-2 | **No mobile push** in v1 unless explicitly re-scoped; **email** reminder only                                                   |
| G-3 | Export all transcripts (Markdown first; PDF later if scheduled)                                                                 |
| G-4 | Landing: hero, hand-off, how it works, method, pricing, **Privacy**, **Terms**, **Contact** (working URLs before public launch) |
| G-5 | Billing (e.g. Stripe) when monetisation milestone is active                                                                     |


### 7.9 Permissions and compliance (v1.0)

- **Microphone:** request only when user starts pre-session or session; explain why in UI.  
- **Camera:** optional for future; v1 may show **placeholder** tile (prototype).  
- **Subprocessors** disclosed in privacy policy: Google (Gemini), Microsoft (Azure Speech), AWS (S3), Vercel, Resend, Neon (or chosen DB host).  
- **Age:** default **16+** or **18+** — **confirm in open questions** before marketing copy is final.

---

## 8. v1.0 release scope (must ship)

Minimum shippable **Camille v1.0** for paid or public early access:


| Area       | Must ship                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| Auth       | Better Auth: magic + password; Resend; sign out; delete account path documented                               |
| Session    | Gemini Live loop from browser after server-minted token; end session; persist `Session` + `Turn`s             |
| Audio      | S3 chunked upload + final key for diagnostic input                                                            |
| Transcript | Durable turns for ended sessions; session detail view                                                         |
| Diagnostic | On-demand pipeline Azure + Gemini JSON; results UI (three tabs); history badge                                |
| Scenarios  | Full seeded library + filters                                                                                 |
| Shell      | Home, history, scenario flow, pre-session, live session UI (gloss modes), session end, settings (core fields) |
| Legal      | Privacy + Terms published                                                                                     |


**Should (v1.0 if time permits):** progress charts, streak heat, export, RPM polish, email reminder job.  
**Could:** PDF export, billing.  
**Won’t (v1.0):** §14.1 items.

---

## 9. Tech stack


| Layer               | Choice                                      | Rationale                                  |
| ------------------- | ------------------------------------------- | ------------------------------------------ |
| App                 | **Next.js 16** App Router                   | Full-stack TS, one deployable              |
| Auth                | **Better Auth** + **Resend**                | Credentials + magic link                   |
| DB                  | **PostgreSQL** (e.g. **Neon**)              | Serverless-friendly                        |
| ORM                 | **Prisma**                                  | Migrations, types                          |
| Realtime            | **Gemini Live** (Google GenAI SDK)          | Browser-direct audio; token mint on server |
| Pronunciation       | **Azure Speech** Pronunciation Assessment   | Phoneme-level, REST                        |
| Grammar / structure | **Gemini 2.5 Flash** (API)                  | JSON extraction                            |
| Objects             | **AWS S3** + presigned URLs                 | Chunked browser upload                     |
| Jobs                | **Vercel Cron** ± **Inngest / Trigger.dev** | Long-running diagnostic                    |
| Hosting             | **Vercel**                                  | Native Next.js                             |


---

## 10. Architecture

### 10.1 HTTP / API contract (indicative — names may vary in code)


| Method  | Path                         | Purpose                                          |
| ------- | ---------------------------- | ------------------------------------------------ |
| `POST`  | `/api/realtime/token`        | Mint ephemeral Live token for `sessionId` (auth) |
| `POST`  | `/api/audio/presign`         | Issue presigned PUT URL for chunk key            |
| `POST`  | `/api/sessions`              | Create session (scenario, start)                 |
| `PATCH` | `/api/sessions/:id`          | Update status, endedAt, audioS3Key, metadata     |
| `POST`  | `/api/sessions/:id/turns`    | Append turn(s) batch                             |
| `POST`  | `/api/sessions/:id/diagnose` | Enqueue diagnostic                               |
| `GET`   | `/api/sessions/:id`          | Session + turns + diagnostic summary for UI      |


**Realtime:** WebSocket / SDK session is **browser ↔ Google**, not through Next.js.

### 10.2 Text diagram

```
Browser
  ├── POST /api/realtime/token     →  mint ephemeral token (auth)
  ├── Live SDK / WS                →  Gemini Live (browser-direct audio)
  ├── POST /api/audio/presign + PUT → S3 chunks
  ├── /api/sessions*               →  Prisma → Postgres
  └── POST …/diagnose              →  queue → Azure + Gemini → Diagnostic
```

**Fallback:** If ephemeral tokens are unstable, **proxied WS** on small always-on host (Railway/Fly) — spike early (**§13**).

### 10.3 Provider interfaces (thin)

One implementation per interface for v1.


| Interface                          | Path (conceptual)                | Responsibility                                                          |
| ---------------------------------- | -------------------------------- | ----------------------------------------------------------------------- |
| `ConversationProvider`             | `lib/providers/conversation.ts`  | `mintToken`, `getSystemPrompt(scenarioId, ctx)`, `parseTranscriptEvent` |
| `GeminiLiveProvider`               | implements above                 | Default realtime                                                        |
| `PronunciationProvider`            | `lib/providers/pronunciation.ts` | `assess(audio, referenceText, locale)`                                  |
| `AzureSpeechPronunciationProvider` | implements above                 | Default pronunciation                                                   |


Grammar: `lib/diagnostics/grammar.ts` (single Gemini caller, versioned JSON schema).

### 10.4 Route groups

- `(marketing)` — landing, legal.  
- `(app)` — authenticated app shell, nav, all learner surfaces.  
- `app/api/`* — token, audio, sessions, diagnose.

---

## 11. Data model (Prisma sketch)

Use **Better Auth** tables for identity; extend with `UserSettings`. Below shows **domain** tables only — merge with generated Better Auth schema in one Prisma file.

```prisma
model UserSettings {
  id                   String   @id @default(cuid())
  userId               String   @unique
  voiceId              String
  startingCefr         String
  dailyTargetMinutes   Int      @default(30)
  remindersEnabled     Boolean  @default(false)
  transcriptRetention Boolean @default(true)
  timezone             String?
  // relation to User per Better Auth user id
}

model Session {
  id         String        @id @default(cuid())
  userId     String
  scenarioId String
  startedAt  DateTime      @default(now())
  endedAt    DateTime?
  audioS3Key String?
  status     SessionStatus @default(IN_PROGRESS)
  turns      Turn[]
  diagnostic Diagnostic?
}

model Turn {
  id         String   @id @default(cuid())
  sessionId  String
  index      Int
  role       Role
  text       String
  lang       String?
  kind       String?
  occurredAt DateTime
  session    Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@unique([sessionId, index])
}

model Diagnostic {
  id                       String           @id @default(cuid())
  sessionId                String           @unique
  status                   DiagnosticStatus @default(NOT_RUN)
  pronunciationScoresJson Json?
  grammarFeedbackJson      Json?
  vocabularyJson           Json?
  aggregateScore           Int?
  runAt                    DateTime?
  error                    String?
  session                  Session          @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}

enum Role {
  USER
  ASSISTANT
}

enum SessionStatus {
  IN_PROGRESS
  ENDED
}

enum DiagnosticStatus {
  NOT_RUN
  QUEUED
  RUNNING
  DONE
  FAILED
}
```

**Relations:** `Session.userId` must reference the Better Auth **user** primary key in the merged schema (add `User` relation when composing Prisma with the Better Auth adapter).

**Indexes:** `(userId, endedAt DESC)` on `Session` for history lists.

---

## 12. Non-functional requirements


| Area              | Requirement                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Security**      | HTTPS only; secure cookies; S3 least privilege; rate-limit token mint and presign; no sensitive logs                      |
| **Privacy**       | GDPR-ready export/delete; retention table in privacy policy; subprocessors listed (**§7.9**)                              |
| **Performance**   | Time-to-first-audio target set in eng NFR after spike; diagnostic P95 **< 90s** for typical 30–45 min session once stable |
| **Reliability**   | WS drop: persist partial state; user can reconnect or start new session without orphaning billing-critical data           |
| **Cost**          | Log session minutes + job runtime; billing alarms                                                                         |
| **A11y**          | Keyboard nav for shell; focus visible; captions; reduced-motion option                                                    |
| **Observability** | Structured logs + error tracking (e.g. Sentry) + product analytics                                                        |


**Minimum analytics events:** `signup_completed`, `session_started`, `token_minted`, `session_ended`, `turn_batch_written`, `audio_chunk_uploaded`, `diagnostic_queued`, `diagnostic_completed`, `diagnostic_failed`, `help_button_used` (per button type).

---

## 13. Risks and mitigations


| Risk                             | L   | I   | Mitigation                                      |
| -------------------------------- | --- | --- | ----------------------------------------------- |
| Ephemeral / Live API instability | M   | H   | Early spike; ADR for proxy fallback             |
| Model language drift             | M   | M   | Prompt regression suite per scenario            |
| MediaStream fork brittle         | M   | M   | Day-2 spike; document supported browsers        |
| Cost spike / abuse               | L–M | M   | Caps, rate limits, alarms                       |
| Azure French quality             | M   | M   | Week-1 pronunciation spike                      |
| Serverless diagnostic timeout    | M   | L   | Job queue + worker; never unbounded inline HTTP |


---

## 14. Scope boundaries

### 14.1 Deferred (v1.5+)

Implicit SRS in prompts; daily writing + feedback; curated authentic library; shadowing mode; second realtime provider (e.g. OpenAI); vision input; multilingual app shell; social features; dedicated exam prep mode.

### 14.2 Non-goals (v1.0)

Human tutoring marketplace; offline-first realtime; “guaranteed exam pass” marketing.

---

## 15. Milestones and acceptance


| Milestone | Delivers                                                         | **Done when**                                      |
| --------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| **M0**    | Next app, Prisma + Better Auth + Resend, landing + auth screens  | User can sign up/in and hit protected route        |
| **M1**    | Token endpoint + Gemini Live spike + one scenario + turn write   | ≥1 min stable duplex audio; turns appear in DB     |
| **M2**    | S3 pipeline + concat + full scenario library + pre-session UI    | Ended session has `audioS3Key` and full turn log   |
| **M3**    | Diagnostic job + Azure + Gemini + results UI + history           | Real session diagnosed end-to-end in staging       |
| **M4**    | Home/progress/settings/gloss/avatar/export/billing as per **§8** | v1.0 checklist in **§8** satisfied for launch tier |


---

## 16. Success criteria

### 16.1 Product

North star trending up for active users; diagnostic opt-in proves value; activation metric meets target set at launch.

### 16.2 Early-access hardening

1. Production on Vercel + domain.
2. **14 consecutive days** daily dogfood by owner/pilot without P0 incidents.
3. Diagnostic on **real** audio+transcript, not fixtures.
4. Monthly infra + API cost **≤ agreed cap** (re-baseline from legacy $50 single-user figure).

---

## 17. Open questions (resolve before or shortly after launch)

1. Six-month personal success definition (conversation length, media, exam mock).
2. Diagnostic UI copy: **English vs French** for explanations.
3. Soft nudge when under daily minutes — tone and channel (email only?).
4. Web-only v1 vs wrapper roadmap.
5. **COPPA / schools** vs default 16+ or 18+.
6. Magic-first vs password-first UX.
7. Repeat-to-continue: max retries, skip policy, **typed French** as accessibility parity.
8. Pricing and trial claims vs Stripe products.
9. Exact Live model version + deprecation process.
10. Whether `Diagnostic` row is created at session end (`NOT_RUN`) or only on first diagnose (affects queries).

---

## 18. Definitions


| Term                   | Definition                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **Output**             | French **spoken** by learner (typed only if product counts it toward north star)         |
| **Session**            | One conversation from Begin to End; bounded by `MAX_SESSION_MINUTES` / product rules     |
| **Turn**               | Ordered segment of one speaker within a session                                          |
| **Diagnostic**         | Optional async analysis of session **audio + transcript**                                |
| **Scenario**           | Register/vocabulary frame, not a fixed script (except freestyle is unbounded)            |
| **Repeat-to-continue** | After English bridge, learner produces acceptable French before advancing (skips logged) |
| **Gloss**              | English rendering / hint for a French line in captions                                   |
| **Barge-in**           | User can interrupt AI speech; AI stops or yields per provider semantics                  |


---

## 19. Traceability


| Source             | Maps to                                       |
| ------------------ | --------------------------------------------- |
| Prototype `src/`*  | §6–7 UX, §7.7–7.8, §8                         |
| v0.1 technical PRD | §7.3–7.4, §9–11, §13, §18 definitions pattern |
| PRD v2.0           | §3–5 multi-user + bilingual thesis            |


---

*End of PRD v2.1 — ready for implementation*
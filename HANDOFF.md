# FLX Workspace — Engineering Handoff

A handoff for the developer taking over to polish and extend the app.
**Everything is in the Git repository** — clone it and you have the full source.

---

## 1. What this is

A multi-tenant **Creative Operations System (CreativeOS)** for the FLX agency and its
clients. Agency uploads content → client reviews/approves → admin publishes to social
platforms. Arabic-first (RTL) with a live AR/EN toggle.

**Stack:** Next.js 14 (App Router, JavaScript) · Prisma · PostgreSQL (prod) / SQLite
(local) · JWT auth (`jose`, httpOnly cookie) · bcrypt · Nodemailer · deployed on Render.

**Live:** https://flx-workspace.onrender.com

---

## 2. Run it locally

```bash
npm install
# Local option A — SQLite (fastest): set DATABASE_URL="file:./dev.db" in .env and
#   change prisma/schema.prisma datasource provider to "sqlite", then:
npm run setup        # db push + seed demo data
npm run dev          # http://localhost:3000

# Local option B — point at a Postgres (matches prod): set DATABASE_URL to a Postgres
#   URL, keep provider "postgresql", then: npx prisma db push && npm run seed && npm run dev
```

> The committed `prisma/schema.prisma` uses **postgresql** (required by Render). For local
> SQLite you flip the provider; just don't commit that flip.

### Logins
`flx / khalaf123$` (owner admin) · `admin / admin123` · `sara / 123456` (account mgr) ·
`lina / 123456`, `sami / 123456`, `yafa / yafa123` (clients). **Change these before real use.**

---

## 3. Environment variables (`.env`, never commit)

| Var | Required | Purpose |
|-----|----------|---------|
| `DATABASE_URL` | ✅ | Postgres connection string (prod) / `file:./dev.db` (local SQLite) |
| `SESSION_SECRET` | ✅ | 30+ random chars — signs the session JWT |
| `APP_URL` | recommended | Public URL, used in email links + OAuth redirect URIs |
| `SMTP_HOST/PORT/USER/PASS`, `MAIL_FROM` | optional | Real email (else a test inbox is used) |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | optional | WhatsApp notifications |
| **Publishing engine** | | |
| `PUBLISHING_ENC_KEY` | for publishing | 32-byte key (hex or base64) to encrypt OAuth tokens at rest |
| `FACEBOOK_APP_ID/SECRET` | per platform | Facebook + Instagram |
| `LINKEDIN_CLIENT_ID/SECRET` | per platform | LinkedIn |
| `TIKTOK_CLIENT_KEY/SECRET` | per platform | TikTok |
| `GOOGLE_CLIENT_ID/SECRET` | per platform | YouTube |
| `X_CLIENT_ID/SECRET` | per platform | X (Twitter) |
| `PUBLISHING_CRON_SECRET` | optional | Lets a cron POST `/api/publishing/process` to run scheduled jobs |

Exact env var names per platform are also documented in `lib/publishing/platforms.js`.

---

## 4. Project map

```
app/
  (app)/                     authenticated area (shares AppShell layout)
    page.jsx                 client home — "this week's posts" board
    calendar/                content calendar (month + agenda)
    campaigns/[id]/          campaigns + detail
    brand/                   Brand Hub (editable identity)
    archive/                 searchable archive
    posts/[id]/              content review (comments, approve/revise, publish, edit)
    settings/                profile, password, language/theme, notifications
    subscribers/[id]/        ADMIN: clients list + per-client workspace
    publishing/              ADMIN: Publishing Center (the publishing engine UI)
    connected-accounts/      ADMIN: connect social accounts (OAuth)
    scheduled/ , published/  ADMIN: timelines grouped by day
  api/                       route handlers (REST). api/publishing/* = the engine
  globals.css, pages.css     all styling + the mobile @media layer
components/                  client components (board, dialogs, bars, editors)
lib/
  auth.js access.js permissions.js   auth, multi-tenant isolation, role matrix
  db.js ui.js image.js notify/        prisma client, display helpers, uploads, notifications
  publishing/                THE SOCIAL PUBLISHING ENGINE (see §6)
prisma/
  schema.prisma              source of truth (postgresql)
  schema.prod.prisma         legacy mirror — keep models in sync if you touch it
  seed.js , ensure-admin.js  demo seed + idempotent owner-admin on every deploy
middleware.js                route protection (redirects unauthenticated to /login)
```

### Conventions worth knowing
- **Roles & access:** `lib/permissions.js` (role matrix) + `lib/access.js` (a client is
  hard-pinned to their own client; agency can switch). Enforce access in **every** query
  and route — see existing handlers for the pattern (`canAccessClient`, `canManageClients`).
- **i18n:** elements carry `data-ar="…"` and English as the inner text; `components/I18nClient.jsx`
  swaps them live. Add both when you add UI text.
- **Uploads** are stored as **downscaled data-URLs in Postgres** (`lib/image.js`) because
  Render's filesystem is ephemeral. For heavy media (video) move to S3/Cloudflare and store
  a URL instead — this is the biggest "make it professional" win.
- **Deploys:** Render runs `npm run vercel-build` (generate → `db push` → seed-if-empty →
  ensure-admin → `next build`). Pushing to `main` then redeploying applies schema changes.

---

## 5. What's fully working today
Auth + isolation · client home with approve/request-revision · content review + comments ·
add/edit/delete material (video/image/design/copy) · calendar (real nav + schedule) ·
Brand Hub (editable, logo upload) · settings (profile/avatar/password) · subscribers admin
(create/delete client, full control) · scheduled/published timelines · notifications
(email + WhatsApp scaffold) · full mobile layout · the Publishing Center (§6).

---

## 6. The Social Publishing Engine (`lib/publishing/`)  ← main place to finish

A **real** architecture (no fake posting). Flow: approved material → Publishing Center →
pick platforms → publish now / schedule → a **PublishingJob** runs through the pipeline.

- `platforms.js` — registry of the 6 platforms with their **official** OAuth + publishing
  endpoints, scopes, env var names, and docs links.
- `crypto.js` — AES-256-GCM encryption for OAuth tokens (needs `PUBLISHING_ENC_KEY`).
- `publishers.js` — one publisher per platform calling the **official API**. Facebook,
  Instagram, LinkedIn and X have the real request implemented; **TikTok and YouTube, plus
  media hosting and multi-step uploads, are marked `TODO(engineer)`** and currently fail
  loudly instead of pretending to succeed.
- `service.js` — `createJobsForPost`, `processJob` (status machine + logs), `processDueJobs`
  (the queue runner).
- Data: `SocialAccount`, `PublishingJob` (statuses: pending/publishing/published/failed/retry),
  `PublishingLog` in `schema.prisma`.
- API under `app/api/publishing/`: `oauth/[platform]/start` + `callback`, `accounts`,
  `jobs` (+`[id]` retry), `process` (queue runner — wire a 1-min cron to it for scheduled jobs).

**To make publishing go live:** register a developer app per platform, set the env
credentials + `PUBLISHING_ENC_KEY`, finish each `TODO(engineer)` (token-identity fetch in
the OAuth callback, media hosting, TikTok/YouTube upload flows), and add a cron hitting
`/api/publishing/process`. Search the codebase for `TODO(engineer)` to find every spot.

---

## 7. Good "make it more professional" targets
- Move media uploads to object storage (S3/Cloudflare R2) + a CDN; keep only URLs in the DB.
- Finish the publishing integrations (§6) and add per-platform preview/validation.
- Add automated tests (Playwright e2e for the review/publish flows) and CI.
- Observability: structured logs + error tracking (Sentry).
- Rate-limit auth + publishing endpoints; add token refresh for expiring OAuth tokens.
- Accessibility pass + design polish on the AR/EN typography.

---

## 8. Quick answers
- **Is the GitHub repo enough?** Yes — it contains the entire app including the publishing
  engine. The only things *not* in it (by design) are `.env` secrets, `node_modules`
  (run `npm install`), the local `dev.db`, and two large demo videos. Hand over the repo
  link + the `.env` values separately (securely).

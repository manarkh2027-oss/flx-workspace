# FLX Workspace

A real full-stack Creative Operations System (CreativeOS) for FLX Creative Production.
Built with **Next.js (App Router) · Prisma · SQLite · JWT auth**. Arabic-first with a
live AR/EN toggle.

## Run it locally

```bash
cd flx-app
npm install        # installs dependencies (also generates the Prisma client)
npm run setup      # creates the SQLite database and seeds demo data
npm run dev        # starts the app at http://localhost:3000
```

Open http://localhost:3000 — you'll be redirected to the login page.

### Demo logins
| Role        | Username | Password   |
|-------------|----------|------------|
| Client      | `lina`   | `123456`   |
| Super admin | `admin`  | `admin123` |

## What's real (persists to the database)
- **Authentication** — passwords hashed with bcrypt, session in a signed httpOnly JWT cookie, route protection via middleware.
- **Home — this week's posts** — loaded live from the database for the signed-in client.
- **Content review** — open any post, add comments, and **Approve / Request revision**. All of it saves and the status updates everywhere.
- **Campaigns** — listed from the database with approval progress.
- **Language** — full AR/EN toggle with RTL, remembered per browser.

## Coming next
Calendar, Archive, Brand Hub and the Notification centre have polished designs ready
(in `../FLX-Workspace/`) and currently show a placeholder in the app — wiring them to
live data is the next step. Dark mode and WhatsApp notifications are also planned.

## Moving to production
The database is SQLite for zero-setup local use. To go to Postgres, change the
`datasource` provider in `prisma/schema.prisma` to `postgresql`, set `DATABASE_URL`,
and run `npx prisma db push`. Storage (S3) and managed video (Mux/Cloudflare Stream)
slot in at the content-version layer.

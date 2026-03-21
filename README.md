# Hayling Bike Night

Monorepo for the **Hayling Bike Night** site: **Next.js** (public site + owner moderation + APIs) and **Strapi v4** (content & permissions). Database is **PostgreSQL** (Docker locally, **Supabase** recommended in production).

## UX choices (riders & photographers)

- **Gallery**: filter by **meet date**, then search **subject keywords** (plate fragment, bike colour, kit). This is the practical way to help people find shots of *themselves* without facial recognition.
- **Photographer content**: each photo can be an **external thumbnail** with **source** and **purchase** URLs so visitors **leave your site** to buy prints — you stay clear of payment/commerce liability.
- **Owner console** (`/owner/moderation`): large **Approve / Reject** controls for pending community uploads (tablet-friendly).

## Repo layout

| Path | Purpose |
|------|---------|
| `apps/web` | Next.js 15 App Router, Tailwind, NextAuth |
| `apps/cms` | Strapi v4 |
| `packages/ui` | Reserved shared UI (optional) |

## Prerequisites

- **Node.js 20** (see `.nvmrc`). Strapi 4.25 officially supports up to **Node 20** (use nvm/fnm). Avoid developing Strapi on **Node 22+**.
- **Docker** (optional) for local Postgres.

### Install troubleshooting

- **One React version**: this monorepo uses npm `overrides` so `next`, `next-auth`, and `web` share **react@18.3.1**. If `npm ls react` shows both 18 and 19 under `apps/web`, delete `apps/web/node_modules` and run `npm install` again from the **repo root**.
- **sharp / libvips** (Next image optimisation): if `npm install` fails compiling `sharp`, use Node 20 LTS and retry, or see [Sharp install](https://sharp.pixelplumbing.com/install).

## Local development

### 1. Postgres

```bash
docker compose up -d
```

### 2. Strapi

```bash
cp apps/cms/.env.example apps/cms/.env
# Set APP_KEYS to four comma-separated random strings, e.g.:
# node -e "console.log(Array.from({length:4},()=>require('crypto').randomBytes(16).toString('base64')).join(','))"
# Fill ADMIN_JWT_SECRET, API_TOKEN_SALT, TRANSFER_TOKEN_SALT, JWT_SECRET with random values.
cd apps/cms && npm install && npm run develop
```

Open `http://localhost:1337/admin`, create the admin user, then:

**Settings → Users & Permissions → Roles → Public** — enable at minimum:

- `Event`: `find`, `findOne`
- `News-post`: `find`, `findOne`
- `Petition`: `find`, `findOne`
- `Photographer`: `find`, `findOne`
- `Photo`: **leave disabled** if the frontend uses `STRAPI_API_TOKEN` for all reads (recommended). If you enable `Photo` `find`, anyone can call the Strapi API directly.

**Settings → API Tokens** — create a **Full access** token (simplest), or a **custom** token that can at least:

- **Official album**: `create`, `find`, `update` (pro weekly submissions + moderation)
- **Gallery entry**: `find` (link new albums to the current week)
- **Photo**: `create`, `find`, `update` (community uploads + moderation)
- **Petition** / **Petition signature**: as needed for petitions

Put it in `apps/web/.env.local` (or `apps/web/.env`) as `STRAPI_API_TOKEN`.

If album submissions “succeed” on the site but never appear in Strapi, the token almost certainly lacks **Official album → create** — check `apps/web/.local-run/submission-queue/` for JSON files that include `strapiStatus` / `strapiBody`.

Bootstrap on first start seeds **Thursday Bike Night events** (Apr–Sep, current year) and a **sample petition**.

### 3. Web

```bash
cp apps/web/.env.example apps/web/.env.local
# Set STRAPI_URL, STRAPI_API_TOKEN, AUTH_SECRET, OAuth keys, OWNER_EMAILS
cd apps/web && npm install && npm run dev
```

Open `http://localhost:3000`.

- **Dev login**: with no Google/Facebook keys, use **Dev login** on `/auth/signin` (development only).
- **Owner console**: add your email to `OWNER_EMAILS` (comma-separated).

## Environment variables

See `apps/web/.env.example` and `apps/cms/.env.example`.

| Variable | App | Notes |
|----------|-----|--------|
| `DATABASE_URL` | CMS | Use Supabase Postgres in production |
| `STRAPI_URL` | Web | Public CMS URL |
| `STRAPI_API_TOKEN` | Web | **Server only** — never expose to the browser |
| `AUTH_SECRET` | Web | Required for NextAuth |
| `AUTH_*` OAuth | Web | Google / Facebook app keys |
| `FACEBOOK_PAGE_ID` | Web | Numeric Facebook page id for feed source |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Web | Server-only Graph API page token for post/media feed |
| `OWNER_EMAILS` | Web | Who can access `/owner/moderation` |

## APIs

- **iCal**: `GET /api/calendar.ics`
- **JSON events**: `GET /api/events?upcoming=1`

## Deployment sketch

1. Create **Supabase** project → copy **Postgres** connection string → `DATABASE_URL` on Strapi host (use **pooler** if you see connection limit errors).
2. Run **Strapi** on Render, Fly.io, Railway, or a small VPS (`npm run build && npm run start` in `apps/cms`).
3. Deploy **Next.js** to **Vercel**; set env vars; point `STRAPI_URL` at the public Strapi URL.
4. Use **Byet / cPanel** only for **DNS**, **email**, or **redirects** — not for running Node.

## cPanel / Byet hosting

Shared **cPanel** hosting is **not** suitable for Strapi or this Next.js app. Keep cheap hosting for the domain; run the app on Vercel + a Node host + Supabase.

## Scripts (root)

```bash
npm install          # all workspaces (if `sharp` fails to compile locally, use Node 20 or `npm install --ignore-scripts` then fix sharp per Sharp docs)
npm run build:web
npm run lint
npm run test
```

### One-command local startup

```bash
/Users/ati/hayling-bike-night/scripts/start-local.sh
```

This starts:
- Docker Postgres
- Strapi (`apps/cms`) on `http://localhost:1337/admin`
- Next.js (`apps/web`) on `http://localhost:3000`

To stop:

```bash
/Users/ati/hayling-bike-night/scripts/stop-local.sh
```

### Push this repo to GitHub (checkpoint)

If `git remote -v` is empty, create an empty repository on GitHub, then:

```bash
git remote add origin git@github.com:<YOUR_USER_OR_ORG>/hayling-bike-night.git
# or: git remote add origin https://github.com/<YOUR_USER_OR_ORG>/hayling-bike-night.git

git push -u origin master
# If your GitHub default branch is main: git push -u origin master:main

git push origin checkpoint-2026-03-20   # optional: push the annotated checkpoint tag
```

If `git push` prints `RPC failed; HTTP 400` or `send-pack: unexpected disconnect`, GitHub usually rejected the upload: check the token has push rights (**classic PAT**: `repo` scope; **fine-grained PAT**: **Contents: Read and write** on this repository). Also try without an HTTP proxy/VPN, or switch the remote to SSH (`git@github.com:attilahajdu/hayling-bike-night.git`) if `ssh -T git@github.com` works.

## Owner guide (non-technical)

See [docs/OWNER_GUIDE.md](docs/OWNER_GUIDE.md) for moderation and tagging.

## Content: external photographer thumbnails

In Strapi **Photo**:

- Set **Is external** / **Thumbnail URL** / **Source page URL** / **Purchase URL** (optional).
- Link **Photographer** and **Event** where possible.

Purchases always happen on the **photographer’s site**; you only surface discovery.

## Licence

Private / project-specific — adjust as needed.

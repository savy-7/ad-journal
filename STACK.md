# AD Journal — Tech Stack & Architecture Reference

**Paste this whole file into every new Claude session (Opus, Fable, or Sonnet) working on this project**, before asking it to build anything. It keeps every session — and every model — building against the same decisions instead of drifting to whatever it half-remembers from training data.

## What this project is

A private, date-based shared diary for two people, Amatulla and Divy. Each date is one "page," split into two columns — one per person — with a highlight, a little thing loved, something that made them smile, a mood slider, an "on my mind" note, and a photo. Plus a calendar view and a "random memory" feature. Full spec lives in the original project brief; this file only covers the technical stack.

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | One repo for UI + light server logic (Server Components/Actions) — no separate backend service |
| Language | TypeScript | |
| Styling | Tailwind CSS v4 | Config lives in CSS via `@theme`, **not** `tailwind.config.js` — that file doesn't exist in v4 |
| Animation | Motion (formerly Framer Motion) | Import from `motion/react`, **not** `framer-motion` — same library, new name |
| UI primitives | shadcn/ui | CLI copies component source into the repo; used for the mood slider, calendar grid, dialogs |
| Backend | Supabase (Postgres + Auth + Storage) | One project, one SDK |
| Supabase/Next.js glue | `@supabase/ssr` | **Never** `@supabase/auth-helpers-nextjs` — that package is deprecated |
| Runtime | Node.js 24 (Active LTS) | Node 22 also works, less headroom |
| Deploy | Vercel (Hobby/free) | Connected to GitHub, auto-deploy on push |
| Package manager | npm | |

## Verified dependency versions

Tested together in a clean install with zero conflicts and a successful production build:

```json
{
  "dependencies": {
    "@supabase/ssr": "^0.12.4",
    "@supabase/supabase-js": "^2.112.3",
    "motion": "^13.1.0",
    "next": "16.3.1",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.3.1",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

## Design palette

Warm cream / beige background, soft lavender + muted green accents, subtle pastels. Mature and elegant — no hearts, no childish romance styling, no overly pink design.

## Decisions & gotchas — read before building

- **Auth:** two seeded Supabase accounts (Amatulla, Divy), not a shared passcode. Row Level Security enforces "each person can only write their own entries" at the database level.
- **Never use `getSession()` for authorization checks.** It reads the cookie without verifying it against the auth server. Use `getClaims()` or `getUser()` instead for anything that gates access.
- **Env vars:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (current naming — older tutorials say "anon key," same thing).
- **Supabase free tier:** 500MB database, 50K monthly active users, 5GB egress, up to 2 projects. Free projects auto-pause after 7 days with zero activity — a one-click resume from the dashboard fixes it, not a bug.
- **Vercel free tier:** 100GB bandwidth, 1M function calls/month, personal/non-commercial use only — fine for this app.
- **Compress photos client-side before upload** (resize to ~1600px on the long edge, convert to WebP) to keep comfortably inside free-tier storage for years of daily use.
- **`@supabase/ssr` is still pre-1.0** — expect minor API refinements over time. It's still the correct package to use.

## Build roadmap

1. ~~Toolchain & architecture~~ — done (this doc)
2. Supabase backend setup — tables, storage bucket, seeded auth accounts, RLS policies
3. Repo scaffold & theme — Next.js init, Tailwind v4 theme, base layout
4. Calendar view — month grid, date navigation, completion indicators
5. Daily entry page — the two-column form, mood slider, photo upload
6. Random memory feature — "on this day" query + reveal
7. Animation & polish pass — page turns, save feedback, typing feel
8. Auth gate & deploy — wire Supabase Auth, connect Vercel, go live

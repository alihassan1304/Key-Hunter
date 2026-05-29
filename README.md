# Key Hunter

Key Hunter is a browser-based anime-inspired typing shooter built with vanilla JavaScript, HTML Canvas, CSS, and Supabase.

## Run

```bash
npm run dev
```

Open:

```txt
http://localhost:4173
```

## Environment

Create `.env` in the project root:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_publishable_or_anon_key
```

Only public browser keys belong in `.env` for this app.

## Current V2 Core

- Animated splash, username-first onboarding, guest/login/signup, element selection, RPG hub, battle, results, inventory, shop, settings, leaderboard
- Story, Endless, Ranked, and Training Zone mode cards
- Wind, Ice, Fire, and Lightning elements
- Rank-evolving arenas from E to S
- Level 1-100 progression with XP scaling
- Words currency
- Keyboard skins, key press sound packs, pets, typing impacts, enemy drops, daily check-in, and mission reward hooks
- Animated original enemies that move forward with bob/wind-up motion instead of static image-only movement
- Supabase auth, profiles, leaderboard scores, inventory, progress, settings, daily check-ins, and mission progress

## Supabase Tables

The live project has these public tables with row-level security enabled:

- `profiles`
- `leaderboard_scores`
- `inventory`
- `progress`
- `settings`
- `daily_checkins`
- `mission_progress`

The auth trigger creates a starter profile, inventory, progress, settings, and daily check-in row whenever a new account is created.

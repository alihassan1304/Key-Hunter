# Key Hunter RPG V2 Implementation Plan

## Project Vision

Key Hunter RPG V2 is an anime-inspired RPG typing shooter built with Vanilla JavaScript, HTML5 Canvas, CSS, and Supabase. The goal is to turn the current prototype into a polished cyber-anime typing RPG with strong progression, responsive combat feedback, animated enemies, elemental typing powers, collectible keyboards, pets, sound packs, rewards, and cloud-backed player progress.

## Current Project State

The project is already a playable single-page browser game.

Current files and responsibilities:

- `index.html`: App shell, canvas, UI overlay, environment script, main module.
- `styles.css`: Full-screen UI styling for splash/onboarding, hub, inventory, shop, settings, leaderboard, results, HUD, and responsive layout.
- `src/main.js`: Main game state, UI rendering, onboarding flow, local/cloud state loading, battle loop, input handling, enemy spawning, drops, progression rewards, shop, inventory, settings, leaderboard, and Canvas drawing.
- `src/config.js`: Game content and tuning: ranks, arena themes, elements, keyboard skins, sound packs, pets, level rewards, missions, modes, drops, word pools, XP/rank helpers.
- `src/supabaseClient.js`: Supabase REST/auth wrapper for signup, login, profile, inventory, daily check-in, mission progress, settings, and leaderboard scores.
- `scripts/serve.mjs`: Lightweight local server with `.env` injection through `/env.js`.
- `README.md`: Current run instructions, feature summary, and Supabase table list.
- `supabase-schema-notes.md`: Applied migration/security notes.
- `assets/`: Runtime game assets including splash, arena, enemy images, and logo assets.
- `Reference images/`: Visual references for splash, hub, buttons, rank card/emblem, attacks, pets, anime character inspiration, keyboard/logo/currency ideas.

Already implemented:

- Splash screen and username-first onboarding.
- Guest mode, login, and signup flow.
- Element selection for Wind, Ice, Fire, and Lightning.
- RPG hub with profile, level XP, rank, Words, modes, quick actions, daily check-in, and current loadout.
- Battle mode with keyboard-only typing combat.
- Enemy types: normal, fast, tank, splitter, fake, boss.
- Animated procedural enemies with bob, sway, wind-up, labels, HP bars, particles, and elemental attacks.
- Rank-based arena themes from E to S.
- Level 1-100 XP scaling and milestone reward hooks.
- Words currency.
- Keyboard skins, pets, sound packs, typing effects, drops, and shop/inventory flows.
- Settings for sound volume, visual intensity, and reduced camera shake.
- Leaderboard save/read hooks for ranked mode.
- Supabase hooks for profiles, inventory, settings, daily check-ins, mission progress, and leaderboard scores.
- LocalStorage fallback for guest progress.

Important current gaps:

- Missions are currently a simple reward button, not real tracked objectives.
- Achievements button exists but has no screen/system yet.
- Story mode is a mode card only; no chapters, dialogue, stage map, or boss progression.
- Keyboard evolution paths are defined in data but not implemented in UI or mechanics.
- Shards and special drops are collected during battle but not persisted as usable currencies/materials.
- Pet effects exist, but pets do not have leveling, shards, rarity progression, or detailed combat UI.
- Sound packs use generated oscillator tones, not authored audio assets.
- Enemy image assets exist but Canvas currently draws procedural enemies instead of using the PNG enemy art.
- `visual_intensity` is saved but not deeply applied to effects.
- There is no dedicated Profile screen despite the reference asset set including profile UI.
- There is no guild, friends/mail, live events, rare endgame element, or expanded story system yet.
- The app is still one large `main.js`; growth will become harder without splitting modules.

## Implementation Strategy

Build V2 in layers. First stabilize the current playable loop, then deepen progression and persistence, then polish visuals/audio, then add larger RPG systems. Each phase should remain playable at the end.

## Phase 1: Stabilize The Core Prototype

Goal: Make the existing V2 core reliable, readable, and ready for more systems.

Tasks:

- Fix text encoding issues in UI copy, especially the current loadout separator showing as `â€¢`.
- Load saved local settings during boot, not only save them.
- Add visible sign-out control for authenticated users, since the handler exists but no button is rendered.
- Add error handling around cloud profile/inventory/settings updates so the game does not break when Supabase is unavailable.
- Prevent duplicate purchases of already-owned shop items or show owned/equipped state in the shop.
- Make quit results clearer: no rewards if quitting, but show reason.
- Apply `visual_intensity` to particles, shake, impact opacity, and domain overlays.
- Keep local and cloud inventory schemas aligned.
- Add a small debug-safe fallback if `crypto.randomUUID()` is unavailable.
- Add basic browser smoke testing checklist: splash, onboarding, element select, hub, battle, results, shop, inventory, settings, leaderboard.

Acceptance criteria:

- A new guest can complete onboarding, choose an element, play a battle, earn Words/XP, buy/equip an item, and see that progress persist after refresh.
- An authenticated player can do the same with Supabase configured.
- The UI has no broken encoded characters.
- Shop/inventory state cannot accidentally double-charge or duplicate items.

## Phase 2: Refactor Into Maintainable Modules

Goal: Keep Vanilla JavaScript while reducing the size and risk of `main.js`.

Proposed structure:

- `src/state.js`: State defaults, local profile/inventory, localStorage persistence.
- `src/ui.js`: Screen templates and UI binding helpers.
- `src/battle.js`: Battle state, enemy spawning, typing logic, rewards, mode rules.
- `src/rendering.js`: Canvas drawing: splash, hub backdrop, arena, enemies, effects, keyboard, pets.
- `src/audio.js`: Sound synthesis/audio playback.
- `src/progression.js`: XP, rank, rewards, missions, achievements, drops, unlocks.
- `src/economy.js`: Purchases, currencies, shards, item ownership/equipment.
- `src/assets.js`: Image/audio asset loading and manifest.
- `src/config.js`: Keep content/tuning data here.
- `src/supabaseClient.js`: Keep backend client here.

Tasks:

- Move code in small slices without changing behavior.
- Keep public function boundaries simple: `startGame`, `updateGame`, `handleTyping`, `renderUI`, `persistProgress`, `rewardPlayer`.
- Add comments only for non-obvious systems like enemy targeting, domain activation, drop handling, and cloud/local persistence.
- Keep the project dependency-free unless a feature truly requires a package.

Acceptance criteria:

- Behavior matches the current game after refactor.
- Each major system can be edited without scrolling through one giant file.
- No new build step is required.

## Phase 3: Real Missions And Achievements

Goal: Turn daily missions and achievements from hooks into real RPG goals.

Mission system:

- Track mission progress from battle stats:
  - keys typed
  - correct hits
  - max combo
  - enemies defeated
  - bosses defeated
  - Words collected
  - drops collected
  - mode played
  - element used
- Store progress locally for guests and in `mission_progress` for signed-in players.
- Add daily reset behavior based on date.
- Add mission states: active, claimable, claimed.
- Show missions in a dedicated screen/panel instead of instant reward.
- Include daily, weekly, and one-time beginner missions.

Achievement system:

- Add achievements config with id, name, description, target, reward, hidden flag.
- Track lifetime achievements locally/cloud.
- Add an Achievements screen from the hub button.
- Reward titles, Words, skins, effects, and profile badges.

Acceptance criteria:

- Mission progress updates from actual battle performance.
- Rewards can be claimed once.
- Daily missions reset cleanly.
- Achievements unlock automatically and persist.

## Phase 4: Progression And Economy Depth

Goal: Make the RPG loop feel valuable beyond score.

Tasks:

- Formalize player currencies/materials:
  - Words
  - XP shards
  - keyboard fragments
  - pet shards
  - sound shards
  - effect cores
  - optional premium-like cosmetic currency later, if desired
- Persist all collected non-Words drops.
- Add inventory fields for materials and unlocked cosmetics.
- Add a post-battle rewards breakdown:
  - base score reward
  - enemy drops
  - boss bonus
  - mission rewards
  - level-up rewards
  - rank change
- Implement level milestone rewards every 10 levels.
- Add titles and battlefield themes as usable inventory categories.
- Add balancing pass for XP curve, Words income, shop costs, and drop rates.

Acceptance criteria:

- Every drop type has a use.
- Level rewards unlock visibly and persist.
- Results screen clearly explains what the player earned and why.

## Phase 5: Keyboard Skin System V2

Goal: Make keyboards one of the main collectible systems.

Tasks:

- Add dedicated Keyboard screen/tab with:
  - rarity filters
  - owned/locked states
  - equipped state
  - bonus details
  - evolution path preview
  - required fragments/materials
- Implement keyboard evolution using existing `evolvesTo` data.
- Add keyboard bonuses into battle:
  - speed bonus
  - combo duration
  - damage scaling
  - critical hit chance
  - slow-motion meter rate
  - double input hit chance
  - Words bonus
- Add unique Canvas keyboard visuals for each rarity/theme.
- Add typing effect preview in inventory/shop.

Acceptance criteria:

- A player can unlock, equip, and evolve keyboard skins.
- Equipped keyboard changes both visuals and battle behavior.
- Bonuses are small enough to feel good without breaking typing skill balance.

## Phase 6: Pet Support System V2

Goal: Turn pets into collectible companions with visible support roles.

Tasks:

- Add dedicated Pets screen/tab.
- Add pet levels, shards, rarity, cooldown, active effect, passive effect.
- Persist pet shards and pet XP/levels.
- Expand existing effects:
  - Shield support: blocks escaped enemy damage.
  - Combo protection: saves combo once per cooldown.
  - Enemy slow: targets most dangerous enemy.
  - Bonus Words: increases Words drops.
  - Minor damage: attacks nearest/highest threat enemy.
- Add pet animation variants or use reference pet assets where appropriate.
- Add pet cooldown/status in battle HUD.

Acceptance criteria:

- Pets have visible identity, progression, and useful but balanced combat value.
- Pet state persists across guest/cloud saves.

## Phase 7: Battle System Polish

Goal: Make typing combat feel fast, fair, and satisfying.

Tasks:

- Improve targeting feedback so the player can tell which enemy will receive the next typed character.
- Add word highlight previews and current target lock-on.
- Add WPM, accuracy, and domain meter to HUD.
- Add mode-specific rules:
  - Story: fixed waves and chapter boss.
  - Endless: infinite scaling and boss every minute.
  - Ranked: fixed rules, no guest leaderboard upload, anti-cheese constraints.
  - Training Zone: no death, practice-focused stats.
- Improve enemy attack cycles:
  - wind-up warning
  - impact effects on escape/attack
  - boss phase changes
  - splitter spawn animation
  - fake enemy reveal animation
- Use existing enemy PNG assets or blend them with procedural Canvas enemies.
- Add authored arena hazards or wave modifiers per rank.
- Add pause overlay with resume, restart, quit.

Acceptance criteria:

- The player always understands what happened after a correct key, wrong key, enemy kill, enemy escape, pet trigger, and domain activation.
- All four modes feel meaningfully different.
- Battle is playable with keyboard only.

## Phase 8: Element System V2

Goal: Make Wind, Ice, Fire, and Lightning feel mechanically and visually distinct.

Wind:

- Push enemies backward.
- Wide ring shockwaves.
- Bonus against fast/fake enemies.
- Domain: Storm Gate pushes all enemies back and increases target clarity.

Ice:

- Slow and freeze enemies.
- Frost shards and crack effects.
- Bonus against tanks/bosses through freeze stacks.
- Domain: Frozen Moon slows all enemies and adds freeze burst on kills.

Fire:

- Burn damage and small area explosions.
- Ember trails on correct typing.
- Bonus against clustered waves.
- Domain: Ash Crown causes repeated burn pulses.

Lightning:

- Chain hits to nearby enemies.
- Sharp bolt visuals and sound.
- Bonus for high combos.
- Domain: Thunder Circuit chains stronger as combo rises.

Tasks:

- Add element-specific status fields to enemies.
- Add effect-specific particle systems.
- Add element mastery progression.
- Add optional rare/endgame elements later after the four base elements are complete.

Acceptance criteria:

- The same battle feels different depending on element choice.
- Element mechanics are shown in UI and explained by effects, not only text.

## Phase 9: RPG Hub And Screen Completion

Goal: Make the hub feel like the true command center.

Screens to complete:

- Splash Screen: final logo/loading presentation using `assets/splash-loading.jpeg` and logo assets.
- Username/Auth Flow: polished guest/login/signup, sign-out, cloud sync status.
- Element Selection: animated element cards and element identity.
- RPG Hub: profile, XP, rank, resources, mode selection, loadout, missions, daily rewards, achievements, events placeholder.
- Battle Mode: full HUD and pause/results handoff.
- Inventory: tabs for keyboards, pets, sounds, effects, titles, themes, materials.
- Shop: category filters, owned state, preview, affordability, purchase confirmation for expensive items.
- Settings: audio, visuals, reduced shake, account, reset guest save, controls.
- Leaderboard: ranked scores, filters, player row, empty/error/loading states.
- Profile: stats, titles, badges, favorite element, lifetime progress.

Acceptance criteria:

- Every hub button opens a meaningful screen or clearly marked future placeholder.
- Screens are responsive on desktop and mobile.
- No screen depends on marketing-style explanations; it should feel like a usable game UI.

## Phase 10: Supabase Backend Completion

Goal: Make cloud saves reliable and secure.

Current known tables:

- `profiles`
- `leaderboard_scores`
- `inventory`
- `progress`
- `settings`
- `daily_checkins`
- `mission_progress`

Recommended additions or extensions:

- Add/confirm `achievements` or `achievement_progress`.
- Add material storage to `inventory` or a dedicated `materials` JSON column.
- Add pet/keyboard levels and evolution state.
- Add profile statistics:
  - lifetime keys typed
  - lifetime correct keys
  - lifetime enemies defeated
  - lifetime bosses defeated
  - best combo
  - best WPM
  - favorite element
  - total playtime
- Add leaderboard filters by mode/season if live events are added.
- Add seasons/events tables later:
  - `events`
  - `event_progress`
  - `guilds`
  - `guild_members`
  - `friends`
  - `mail`

Security requirements:

- Keep Row Level Security enabled.
- Player-owned data must only be readable/writable by the owner.
- Public leaderboard reads are okay.
- Ranked score inserts must require authenticated `user_id`.
- Never expose service-role keys in `.env` for the browser app.

Acceptance criteria:

- Guest mode works without Supabase.
- Authenticated mode syncs progress without overwriting newer local/cloud data unexpectedly.
- Supabase failures show friendly notices and do not destroy local progress.

## Phase 11: Visual And Audio Asset Integration

Goal: Move from procedural placeholders toward a polished cyber-anime aesthetic.

Runtime assets to integrate:

- `assets/key-hunter-logo-dark.png`: splash/auth/hub branding.
- `assets/arena.png`: stronger arena background use with rank tinting.
- `assets/enemy-fast.png`, `enemy-tank.png`, `enemy-fake.png`, `enemy-boss.png`: enemy art integration.
- `assets/main-screen-reference.jpeg`: hub reference.
- `Reference images/final main screen.png`, `mainscreen back ground.png`, rank/button/profile/shop/mode references: UI composition guidance.
- Attack references for Wind, Fire, Lightning, and general attack styling.
- Pet references for future pet visual identity.

Tasks:

- Create an asset manifest in `src/assets.js`.
- Use safe generated/original assets for production runtime; keep inspiration/reference files separate.
- Optimize large PNGs where needed.
- Add authored UI icon/button treatment where helpful.
- Add audio files later if desired, but keep oscillator fallback.

Acceptance criteria:

- Main screens match the intended cyber-anime RPG direction.
- Assets load gracefully.
- Performance remains smooth on typical browsers.

## Phase 12: Story Mode

Goal: Add the first real RPG campaign layer.

Tasks:

- Add chapter config:
  - chapter id/name
  - arena rank/theme
  - wave list
  - boss
  - unlock requirements
  - rewards
  - dialogue snippets
- Add story map/chapter select screen.
- Add scripted wave mode separate from endless spawning.
- Add boss-specific mechanics and phrases.
- Save chapter completion and star ratings.

Acceptance criteria:

- Story Mode has at least 3 playable chapters.
- Each chapter has a clear beginning, boss encounter, result, and reward.

## Phase 13: Ranked, Seasons, And Live Events

Goal: Make competitive play and recurring content meaningful.

Ranked tasks:

- Fixed run duration or standardized death/end conditions.
- No pay-to-win bonuses in ranked, or normalize bonuses.
- Auth required for leaderboard upload.
- Store accuracy, WPM, combo, boss kills, survival, element, skin, pet.
- Add season id to leaderboard scores.

Live event tasks:

- Add event definitions and time windows.
- Add event missions and event shop.
- Add limited cosmetics, titles, or battlefield themes.

Acceptance criteria:

- Ranked feels fair and repeatable.
- Leaderboard rows are comparable.
- Events can be added mostly through config.

## Phase 14: Future Social Systems

Goal: Add optional long-term RPG/community features after the core game is strong.

Guild System:

- Guild creation/joining.
- Guild XP and weekly missions.
- Guild leaderboard.
- Shared cosmetic banners.

Friends And Mail:

- Friend requests.
- Friend list.
- System mail for event rewards and announcements.
- Optional gift messages or daily friend energy.

Endgame Elements:

- Rare unlockable elements after story/rank milestones.
- Require strong base-element balance first.

Acceptance criteria:

- Social systems do not block solo play.
- All social writes are secured with Supabase RLS.

## Suggested Build Order

1. Stabilize current app and fix obvious bugs.
2. Split `main.js` into modules.
3. Implement real missions and achievements.
4. Persist all drop/material rewards.
5. Complete keyboard evolution and bonuses.
6. Complete pet progression and battle UI.
7. Polish battle feedback and mode rules.
8. Deepen elemental mechanics.
9. Complete all hub screens and profile/settings flows.
10. Extend Supabase schema for achievements, materials, stats, and item progression.
11. Integrate visual/audio assets and optimize.
12. Add Story Mode chapters.
13. Add ranked seasons/live events.
14. Add guilds, friends/mail, and rare endgame elements.

## Short-Term Sprint Plan

Sprint 1: Cleanup and reliability

- Fix encoding issue.
- Load saved settings on boot.
- Add sign-out UI.
- Add owned-state shop buttons.
- Add purchase duplicate protection.
- Improve Supabase error handling.
- Add smoke test checklist to README.

Sprint 2: Mission screen

- Add real mission progress tracking.
- Add missions screen.
- Store claim state locally/cloud.
- Replace instant mission reward button.

Sprint 3: Inventory/economy expansion

- Persist materials from drops.
- Add material display.
- Add level reward modal/notice.
- Add title/theme inventory categories.

Sprint 4: Keyboard evolution

- Add evolution UI.
- Add evolution material costs.
- Apply keyboard bonuses in battle.
- Add keyboard preview visuals.

Sprint 5: Combat polish

- Add WPM/accuracy/domain HUD.
- Add target lock-on feedback.
- Add mode-specific rules.
- Integrate enemy art.

## Testing Checklist

Manual tests:

- Fresh guest onboarding.
- Returning guest progress.
- Signup/login with Supabase configured.
- Cloud save load after refresh.
- Element selection and persistence.
- Start all four modes.
- Correct typing, wrong typing, fake enemy penalty, tank HP, splitter behavior, boss spawn.
- Pet damage, slow, shield, combo protection, Words bonus.
- Drops collected and rewards applied.
- Level up and milestone unlock.
- Shop purchase and equip.
- Inventory equip for skin/pet/sound.
- Settings save and effect in battle.
- Daily check-in claim once per day.
- Mission progress and one-time claim.
- Ranked score save and leaderboard refresh.
- Mobile layout for hub, element select, inventory, shop, and battle HUD.

Technical checks:

- No console errors during normal play.
- No broken asset paths.
- Supabase missing config still allows guest play.
- LocalStorage data migration/fallback handles missing fields.
- RLS policies prevent cross-user writes.
- Large images are optimized enough for smooth loading.

## Definition Of Done For V2

Key Hunter RPG V2 is complete when:

- The player can onboard, choose an element, play, progress, collect rewards, upgrade/equip cosmetics, and return later with progress intact.
- Battle is responsive, readable, and visually satisfying.
- Each element has distinct mechanics and effects.
- The hub has complete screens for profile, modes, missions, achievements, inventory, shop, settings, and leaderboard.
- Keyboard skins, pets, sound packs, titles, themes, and materials are all real systems, not placeholders.
- Supabase sync works securely for authenticated users while guest mode remains fully playable.
- The visual direction matches the cyber-anime RPG target.
- The codebase is modular enough to support future story, events, guilds, friends/mail, and endgame elements.

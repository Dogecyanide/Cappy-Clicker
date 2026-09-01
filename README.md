# Cappy Clicker

Cappy Clicker is a colorful, globe-trotting incremental browser game inspired by Mario's many adventures. Toss Cappy for Kingdom Coins, build a 40-stop Grand Tour that deliberately mixes destinations from different Mario series from the beginning, collect finite Power Moons and rare Shines, distil the whole trip into Odyssey Fuel, fill a 700-stamp passport, and decide whether King Boo's definitely-legitimate casino is worth the risk.

This is a personal, non-commercial fan project. It is not affiliated with or endorsed by Nintendo.

## Play locally

Install a current Node.js LTS release, then run:

```text
npm install
npm run dev
```

Vite prints the local address to open. On Windows, `PLAY_DEV.bat` changes to the project directory first, installs missing dependencies, and starts the same development server.

Production commands:

```text
npm run test
npm run validate
npm run simulate
npm run build
npm run preview
npm run test:e2e
```

`dist/` is a complete static game with no required backend, database, API key, or runtime asset hotlinks. The optional Open League panel remains offline unless a separate leaderboard service is deployed and its URL is supplied when the front end is built.

## Game systems

- 40 progressively discovered producer destinations with Buy 1/10/25/100/Max controls. Each card builds a miniature district from that destination's real local artwork and divides huge ownership totals into exact labelled groups. The route interleaves *Odyssey*, *Super Mario 64*, *Sunshine*, *3D World*, *Galaxy*, *Mario Kart*, *Paper Mario*, *Yoshi's Island*, *Mario & Luigi*, and *Luigi's Mansion* instead of completing one game at a time.
- 460 permanent upgrades: eleven varied milestones for every destination at 5, 15, 25, 50, 100, 150, 200, 350, 500, 750, and 1,000 owned, plus twenty Cappy techniques. Every producer milestone has its own authored name and flavour text. Effects include production boosts, discounts, neighbouring-route fusions, series bonuses, click improvements, and Shine modifiers.
- 700 authored achievements across ten categories. Each badge adds +0.02% additive production, reaching the +14% cap only when the passport is complete.
- Odyssey Fuel, a permanent achievement-style tank blended from badges, Moons, Multi Moons, discovered routes, upgrades, and caught Shines. Fuel is never spent; ten coin-bought engine modules make its fill scale production, prices, clicking, offline time, fusions, and Shine payouts.
- 50 finite, one-time Power Moons bought with current coins. Moons 10, 20, 30, 40, and 50 are Multi Moons with a much steeper price step and a much larger permanent reward; Moons never reset progress.
- Rare clickable Shines appear during active play with six beneficial outcomes. Seven percent are cracked purple Gloom Shines with three risky outcomes instead.
- 21 permanent cosmetics across Cappy styles, voyage backdrops, and synthesized sound packs.
- 18 optional King Boo outcomes with three genuinely cycling reel strips that stop on a committed-before-animation result, plus reload-safe effects, receipts, and a 0.5% triple-Boo catastrophe.
- A 190-headline ambient news pool, varied reactive headlines, unseen-first selection, and recent-item suppression make the ticker substantially less repetitive.
- Versioned local saving with validated CAPPY2 text and file export/import, clipboard support, confirmed local-save deletion, piecewise offline production, and Moon-expanded offline caps.
- Readable short-scale names extend through centillion, with scientific notation used beyond the named range.
- An optional, self-reported Open League for lifetime coins and CPS. The game works without it; a genuinely shared board requires deploying and configuring the included backend.
- Responsive travel-brochure presentation, kingdom backdrops, a journey strip, capped canvas particles, reduced-motion and performance modes, synthesized WebAudio, and image fallbacks.
- Hidden collection panels and the Developer Lab load only when opened, destination rendering is cached, and local art decodes asynchronously for a faster first usable frame.
- A Developer Lab for exact economy, collection, producer, save, King Boo, normal Shine, Gloom Shine, and deterministic Shine-outcome testing. Open it from the footer or press Shift+D.

## Architecture

The game is vanilla JavaScript and ES modules built with Vite.

```text
src/core/       canonical numbers, economy, state, save, store, loop, audio, leaderboard client
src/data/       producers, upgrades, achievements, Moons, Boo/Shine outcomes, cosmetics, news
src/systems/    purchases, clicking, achievements, events, offline, King Boo, Shines, cosmetics
src/ui/         game shell and focused UI components
src/visuals/    background journey and pooled canvas particles
src/styles/     layout, components, and animation rules
scripts/        content validation, asset tooling, and economy simulation
tests/          Vitest logic coverage and Playwright browser journeys
public/assets/  optimized local runtime art
worker/leaderboard/  optional Cloudflare Worker, D1 migration, validation, and tests
```

`getEconomySnapshot()` is the single production pipeline. The game loop, click value, offline earnings, producer cards, stats, Developer Lab, Power Moon tests, Odyssey Fuel, King Boo and Shine payouts, and Open League score payloads all consume that same snapshot. It reports base and effective per-unit rates, ownership, local upgrades, additive globals, Moon and Fuel modifiers, temporary multipliers, disabled state, effective totals, and CPS contribution.

Big-number arithmetic uses the bundled `break_infinity.js` dependency behind `src/core/numbers.js`; no CDN is used. The word formatter constructs short-scale names through centillion and falls back to scientific notation for still-larger values.

## Saving and offline progress

The save key is `cappy-clicker-v2`. v1 imports are intentionally rejected. The Save Desk can show or copy export text, download a dated `.cappy2.txt` file, import pasted text or a file, and permanently delete the local voyage after confirmation. Imports whitelist content and timed-effect types, rebuild trusted King Boo display data from canonical content, and sanitize nested settings and statistics before replacing the current voyage.

Offline earnings begin after 30 seconds, use the current 8–24 hour cap, and integrate production across timed-effect expiry boundaries. King Boo and rare Shines do not generate encounters while the game is closed; their active-play spawn delays resume after reload. Imported or Developer Lab voyages may view Open League but cannot submit scores.

## Balance simulation

`npm run simulate` runs deterministic cheapest-producer, fastest-ROI, upgrade-first, balanced-with-Moons, and idle-after-first-Frog strategies. It uses the canonical economy, expected 5% critical tosses, no King Boo randomness, and a 30-day horizon. The current pacing checkpoints cover the first 20 of the 40 destinations; the remaining stops are still included in content validation and tests. The idle run is seeded with exactly the first Frog because a truly zero-click fresh save correctly never starts.

The tuned balanced baseline currently reaches:

| Milestone | Simulated time | Rough target |
|---|---:|---:|
| First upgrade | 2.7 minutes | 2–5 minutes |
| First 5 destinations | 31.8 minutes | 25–60 minutes |
| Destination 10 | 9.8 hours | 6–18 hours |
| Destination 15 | 5.8 days | 3–8 days |
| Destination 20 | 14.1 days | 10–21 days |

All current balanced-strategy pacing checks pass. Different player priorities, active click rates, voluntary King Boo spins, rare Shine results, and offline habits will change real play time.

## Optional Open League backend

The Open League interface ships in the static game, but the shared scores do not. With no endpoint configured, the panel clearly reports `OFFLINE` and every other game system remains available. A shared online board requires you to deploy and configure the backend; uploading only `dist/` or enabling GitHub Pages is not enough.

The supported backend is the Cloudflare Worker and D1 package in [`worker/leaderboard/`](worker/leaderboard/). It stores one best score per browser token and metric, keeps a submission audit trail, applies rate limits and basic plausibility checks, and deliberately labels the results as self-reported rather than cheat-proof.

One-time deployment:

1. Enter `worker/leaderboard/`, run `npm install`, authenticate with `npx wrangler login`, and create the D1 database with `npx wrangler d1 create cappy-clicker-leaderboard`.
2. Replace the placeholder `database_id` in `worker/leaderboard/wrangler.jsonc` with the returned ID. Review `ALLOWED_ORIGINS`; each entry is only a scheme and host, never a GitHub Pages repository path.
3. Store a private random hashing secret of at least 32 characters with `npx wrangler secret put TOKEN_PEPPER`.
4. Run `npm run db:migrate:remote` and then `npm run deploy` from `worker/leaderboard/`.
5. Set `VITE_LEADERBOARD_API_URL` to the deployed Worker URL, without a trailing slash, in the environment that runs the front-end `npm run build`. Vite embeds this value at build time, so changing it requires a new front-end build.

For GitHub Pages, create a repository Actions variable named `VITE_LEADERBOARD_API_URL` containing that Worker URL. The checked-in Pages workflow already passes the variable to Vite's build step. For a local build, set the same environment variable before `npm run dev` or `npm run build`; [`.env.example`](.env.example) shows the expected form.

Until both the Worker/D1 deployment and that front-end build configuration are complete, each browser only sees the offline Open League state. Local Worker setup, migrations, API routes, and operational limits are documented in [`worker/leaderboard/README.md`](worker/leaderboard/README.md).

## GitHub Pages

The Vite base is relative, so the same build works locally and at the repository project path. The Pages workflow deploys `dist/` on pushes to `main` or manual dispatch. It deploys the complete game even without Open League; shared rankings additionally require the backend and build-time variable described above.

Repository owners need to select **Settings → Pages → Source → GitHub Actions** once. The intended address is:

```text
https://Dogecyanide.github.io/Cappy-Clicker/
```

## Artwork

Runtime images are local optimized copies. Provenance, proxy/fallback notes, and rights cautions are recorded in [SOURCES.md](SOURCES.md). The game remains playable if an image fails to load.

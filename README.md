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
- 480 permanent upgrades: eleven varied milestones for every destination at 5, 15, 25, 50, 100, 150, 200, 350, 500, 750, and 1,000 owned, plus forty Cappy/Fuel techniques. Every producer milestone has its own authored name and flavour text. Effects include production boosts, discounts, neighbouring-route fusions, series bonuses, click improvements, offline systems, event protection, and Shine modifiers.
- 700 authored achievements across ten categories. Each badge adds +0.02% additive production, reaching the +14% cap only when the passport is complete.
- Odyssey Fuel, a permanent achievement-style tank blended from badges, Moons, Multi Moons, discovered routes, upgrades, and caught Shines. Fuel is never spent; eighteen coin-bought engine modules make its fill scale production, prices, clicking, offline time, event luck, Gloom protection, fusions, and Shine payouts. A compact dipstick remains beneath Cappy.
- 50 finite, one-time Power Moons bought with current coins. Moons 10, 20, 30, 40, and 50 are Multi Moons with a much steeper price step and a much larger permanent reward; Moons never reset progress.
- Producer prices retain the familiar 15% curve through the first 50 of a destination, then bulk-logistics bands progressively soften the curve through 1,000 owned. Growth returns to 15% beyond 1,000 so endless ownership remains bounded instead of eclipsing the destination ladder.
- Rare clickable Shines appear during active play with six beneficial outcomes. Seven percent are cracked purple Gloom Shines with three risky outcomes instead; the latest exact payout, penalty, protection, or timed effect stays in a receipt beneath Cappy. The Developer Lab can force every result.
- 21 permanent cosmetics across Cappy styles, six distinct local-image voyage backdrops, and sound packs.
- 18 optional King Boo outcomes with three genuinely cycling reel strips that stop on a committed-before-animation result, plus reload-safe effects, receipts, and a 0.5% triple-Boo catastrophe.
- A 190-headline ambient news pool, varied reactive headlines, unseen-first selection, and recent-item suppression make the ticker substantially less repetitive.
- Versioned local saving with validated CAPPY2 text and file export/import, clipboard support, confirmed local-save deletion, piecewise offline production, and Moon-expanded offline caps.
- Readable short-scale names extend through centillion, with scientific notation used beyond the named range.
- An optional, self-reported Open League for lifetime coins and CPS. The game works without it; a genuinely shared board requires deploying and configuring the included backend.
- Responsive travel-brochure presentation, eight journey backdrops, a journey strip, capped canvas particles, reduced-motion and performance modes, synthesized effects, supplied Moon/Multi Moon fanfares, and image fallbacks.
- On desktop, Cappy, destinations, and the collection rail scroll independently; stacked phone layouts return to normal document flow. Collection panels are paged and rendered on demand, the Developer Lab loads only when opened, audio samples load only when played, destination rendering is cached, and local art decodes asynchronously.
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

`npm run simulate` runs active, balanced, and idle Grand Tour strategies across a ten-year horizon. It uses the canonical changing critical stats, continuous automatic production, limited daily active-click windows, and no speculative Shine or King Boo income. The idle run is seeded with exactly the first Frog because a truly zero-click fresh save correctly never starts.

The tuned active baseline currently reaches:

| Milestone | Simulated time | Rough target |
|---|---:|---:|
| First upgrade | 1.7 minutes | 1–3 minutes |
| First 5 destinations | 24.5 minutes | 20–60 minutes |
| Destination 10 | 3.9 hours | 3–12 hours |
| Destination 15 | 2.9 days | 2–8 days |
| Destination 20 | 8.5 days | 7–21 days |
| All 40 destinations | 26.4 days | Long-form tour |
| First destination at 1,000 owned | 17.3 days | Late ownership ladder |

The complete passport is deliberately much longer: the deterministic run reaches all routes at 100 owned in about 167 days and saves the final Moons, Fuel hardware, and techniques for multi-year play. Four manual throws per second stay below 5% of full-catalogue output, so clicking helps without becoming the dominant strategy. Different priorities, Shine results, King Boo spins, and check-in habits will change real play time.

## Optional Open League backend

The Open League interface ships in the static game, but the shared scores do not. With no endpoint configured, the panel clearly reports `OFFLINE` and every other game system remains available. A shared online board requires you to deploy and configure the backend; uploading only `dist/` or enabling GitHub Pages is not enough.

The supported backend is the Cloudflare Worker and D1 package in [`worker/leaderboard/`](worker/leaderboard/). It stores one best score per browser token and metric, keeps a submission audit trail, applies rate limits and basic plausibility checks, and deliberately labels the results as self-reported rather than cheat-proof.

One-time deployment:

1. Enter `worker/leaderboard/`, run `npm install`, and authenticate in the browser with `npx wrangler login`.
2. Run `npm run cloud:create`; Wrangler creates D1 and writes its ID into `wrangler.jsonc` automatically.
3. Run `npm run db:migrate:remote`, `npm run deploy`, and `npm run secret:generate`, in that order.
4. Confirm the printed Worker URL plus `/health` reports `submissionsReady: true`.
5. In GitHub's repository **Actions variables**, set `VITE_LEADERBOARD_API_URL` to that Worker URL without a trailing slash, then manually run the Pages workflow once.

The Pages workflow checks the configured Worker's `/health` route before embedding it. If the variable is absent it emits a clear warning and safely builds the game with Open League offline; if a configured Worker is broken or incomplete it stops instead of publishing a misleading `ONLINE` panel. For a local build, set the same environment variable before `npm run dev` or `npm run build`; [`.env.example`](.env.example) shows the expected form.

Until both the Worker/D1 deployment and that front-end build configuration are complete, each browser only sees the offline Open League state. Local Worker setup, migrations, API routes, and operational limits are documented in [`worker/leaderboard/README.md`](worker/leaderboard/README.md).

## GitHub Pages

The Vite base is relative, so the same build works locally and at the repository project path. The Pages workflow deploys `dist/` on pushes to `main` or manual dispatch. It deploys the complete game even without Open League; shared rankings additionally require the backend and build-time variable described above.

Repository owners need to select **Settings → Pages → Source → GitHub Actions** once. The intended address is:

```text
https://Dogecyanide.github.io/Cappy-Clicker/
```

## Artwork

Runtime images are local optimized copies. Provenance, proxy/fallback notes, and rights cautions are recorded in [SOURCES.md](SOURCES.md). The game remains playable if an image fails to load.

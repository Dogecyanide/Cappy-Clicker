# Cappy Clicker

Cappy Clicker is a colorful, globe-trotting incremental browser game inspired by *Super Mario Odyssey*. Toss Cappy for Kingdom Coins, build a twenty-stop producer economy, collect finite Power Moons, fill a 250-stamp passport, and decide whether King Boo's definitely-legitimate casino is worth the risk.

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

`dist/` is a complete static build with no backend, database, API key, or runtime asset hotlinks.

## Game systems

- 20 progressively discovered Kingdom producers with Buy 1/10/25/100/Max controls.
- 140 authored milestone upgrades: seven local doublers per producer at 5, 15, 25, 50, 100, 150, and 200 owned.
- 250 authored achievements across eight categories. Each badge adds +0.04% additive production, capped at +10% total.
- 16 finite, one-time Power Moons bought with current coins. Moons never reset progress.
- 18 optional King Boo outcomes with a committed-before-animation slot result, reload-safe effects, receipts, and a 0.5% triple-Boo catastrophe.
- Versioned local saving, validated import/export, piecewise offline production, and Moon-expanded offline caps.
- Responsive travel-brochure presentation, kingdom backdrops, a journey strip, capped canvas particles, reduced-motion and performance modes, synthesized WebAudio, and image fallbacks.
- A Developer Lab for exact economy, collection, producer, save, and King Boo testing. Open it from the footer or press Shift+D.

## Architecture

The game is vanilla JavaScript and ES modules built with Vite.

```text
src/core/       canonical numbers, economy, state, save, store, loop, audio
src/data/       producers, upgrades, achievements, Moons, Boo outcomes, news
src/systems/    purchases, clicking, achievements, events, offline, King Boo
src/ui/         game shell and focused UI components
src/visuals/    background journey and pooled canvas particles
src/styles/     layout, components, and animation rules
scripts/        content validation, asset tooling, and economy simulation
tests/          Vitest logic coverage and Playwright browser journeys
public/assets/  optimized local runtime art
```

`getEconomySnapshot()` is the single production pipeline. The game loop, click value, offline earnings, producer cards, stats, Developer Lab, Power Moon tests, and King Boo payouts all consume that same snapshot. It reports base and effective per-unit rates, ownership, local upgrades, additive globals, Moon modifiers, temporary multipliers, disabled state, effective totals, and CPS contribution.

Big-number arithmetic uses the bundled `break_infinity.js` dependency behind `src/core/numbers.js`; no CDN is used.

## Saving and offline progress

The save key is `cappy-clicker-v2`. v1 imports are intentionally rejected. Imports whitelist content and timed-effect types, rebuild trusted King Boo display data from canonical content, and sanitize nested settings and statistics before replacing the current voyage.

Offline earnings begin after 30 seconds, use the current 8–24 hour cap, and integrate production across timed-effect expiry boundaries. King Boo does not generate encounters while the game is closed, and his active-play spawn delay is paused across reloads.

## Balance simulation

`npm run simulate` runs deterministic cheapest-producer, fastest-ROI, upgrade-first, balanced-with-Moons, and idle-after-first-Frog strategies. It uses the canonical economy, expected 5% critical tosses, no King Boo randomness, and a 30-day horizon. The idle run is seeded with exactly the first Frog because a truly zero-click fresh save correctly never starts.

The tuned balanced baseline currently reaches:

| Milestone | Simulated time | Rough target |
|---|---:|---:|
| First upgrade | 2.6 minutes | 2–5 minutes |
| First 5 producers | 20.1 minutes | 15–30 minutes |
| Tier 10 | 3.2 hours | about 1–3 hours |
| Tier 15 | 1.5 days | 1–2 days |
| Tier 20 | 15.4 days | multiple days |

Tier 10 remains slightly slower than the initial rough target in this particular balanced bot. The simulator reports it as a warning rather than treating pacing as a brittle test failure. Different player priorities, active click rates, voluntary King Boo spins, and offline habits will change real play time.

## GitHub Pages

The Vite base is relative, so the same build works locally and at the repository project path. The Pages workflow deploys `dist/` on pushes to `main` or manual dispatch.

Repository owners need to select **Settings → Pages → Source → GitHub Actions** once. The intended address is:

```text
https://Dogecyanide.github.io/Cappy-Clicker/
```

## Artwork

Runtime images are local optimized copies. Provenance, proxy/fallback notes, and rights cautions are recorded in [SOURCES.md](SOURCES.md). The game remains playable if an image fails to load.

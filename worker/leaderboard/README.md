# Cappy Clicker Open League worker

This package is the optional online backend for the game's friendly, self-reported leaderboard. It stores one best score per player and metric in Cloudflare D1, keeps an audit trail of submissions, rate-limits writes, and holds obviously implausible submissions out of public ranks.

## One-time Cloudflare setup

GitHub Pages hosts only the game files. It cannot store a shared score table, so a successful Pages deployment does **not** turn Open League on. The Worker and its D1 database must belong to the site owner's Cloudflare account.

1. Open a terminal in this directory and run:

   ```text
   npm install
   npx wrangler login
   ```

   `wrangler login` opens Cloudflare in the owner's normal browser. No Cloudflare password belongs in this repository or in the game.

2. Create and connect the database. The setup helper reuses a same-named D1 database if it already exists, so it is safe to retry, and writes its ID into `wrangler.jsonc` automatically:

   ```text
   npm run cloud:create
   ```

3. Create the tables and deploy the Worker:

   ```text
   npm run db:migrate:remote
   npm run deploy
   ```

4. Give the deployed Worker a private, cryptographically random hashing secret:

   ```text
   npm run secret:generate
   ```

   The generator pipes the value straight to Cloudflare. It does not save the secret in a file or expose it to browser players.

5. Open the Worker URL printed by `npm run deploy` and add `/health`. Continue only when it returns `{"ok":true,...,"submissionsReady":true}`.

6. In GitHub, open **Settings → Secrets and variables → Actions → Variables**, create a repository variable named exactly `VITE_LEADERBOARD_API_URL`, and paste the Worker URL without `/health` and without a trailing `/`. This URL is public configuration, so use a **Variable**, not a Secret.

7. Open GitHub's **Actions** tab, choose **Deploy Cappy Clicker to Pages**, select **Run workflow**, and wait for the green check. The workflow checks `/health` before it embeds the URL, so an incomplete Worker setup cannot masquerade as an online board.

`ALLOWED_ORIGINS` already permits `https://dogecyanide.github.io` and the usual local Vite addresses. An origin contains only the scheme and host; the `/Cappy-Clicker/` repository path must not be added.

## Local development

Copy `.dev.vars.example` to `.dev.vars`, replace the sample pepper, then run:

```text
npm run db:migrate:local
npm run dev
```

Point the game at the local Worker with `VITE_LEADERBOARD_API_URL=http://127.0.0.1:8787`.

## API

- `GET /health` checks the D1 tables and the private submission secret.
- `GET /leaderboard?metric=lifetime` returns the top lifetime-coin scores.
- `GET /leaderboard?metric=cps` returns the top CPS scores.
- `GET /leaderboard?metric=all` returns both boards in one response.
- `POST /leaderboard` accepts the payload already emitted by `src/core/leaderboard.js`.

An optional `playerToken` query parameter or `X-Player-Token` request header makes a single-board GET include `ownRank`. Tokens are salted and SHA-256 hashed before storage. Network addresses are hashed the same way and used only for throttling and basic abuse detection.

The board is deliberately labeled self-reported. Validation catches malformed or internally inconsistent values, but a browser game cannot make client-provided scores cryptographically trustworthy. Held submissions remain in `submissions` for manual inspection and do not update `scores`.

## Operational notes

- Public GET responses are briefly cacheable; POST and health responses are not.
- Defaults allow one submission per player per minute, 50 per player per day, and 12 per network per ten minutes. All can be changed in `wrangler.jsonc`.
- Content-count ceilings match the Grand Tour build: 40 producers, 480 upgrades, 700 achievements, and 50 Moons. Raise the corresponding variables when future releases add content.
- Apply every new migration before deploying code that depends on it.

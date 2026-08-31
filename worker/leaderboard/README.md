# Cappy Clicker Open League worker

This package is the optional online backend for the game's friendly, self-reported leaderboard. It stores one best score per player and metric in Cloudflare D1, keeps an audit trail of submissions, rate-limits writes, and holds obviously implausible submissions out of public ranks.

## One-time Cloudflare setup

1. From this directory, install dependencies with `npm install` and authenticate with `npx wrangler login`.
2. Create the database:

   ```text
   npx wrangler d1 create cappy-clicker-leaderboard
   ```

3. Copy the returned database ID into `wrangler.jsonc`, replacing the all-zero placeholder.
4. Set a private hashing secret. Use a random value of at least 32 characters and never put it in `wrangler.jsonc`:

   ```text
   npx wrangler secret put TOKEN_PEPPER
   ```

5. Check `ALLOWED_ORIGINS` in `wrangler.jsonc`. Origins contain only scheme and host—no GitHub Pages repository path. The supplied values permit the project owner's GitHub Pages origin and the two usual local Vite origins.
6. Create the remote tables and deploy:

   ```text
   npm run db:migrate:remote
   npm run deploy
   ```

7. In the GitHub repository, open **Settings → Secrets and variables → Actions → Variables**, create a repository variable named exactly `VITE_LEADERBOARD_API_URL`, and set it to the deployed Worker URL without a trailing `/`. The Pages workflow passes that variable into the Vite build automatically. The URL is public configuration, so it should be a repository variable rather than a secret.

## Local development

Copy `.dev.vars.example` to `.dev.vars`, replace the sample pepper, then run:

```text
npm run db:migrate:local
npm run dev
```

Point the game at the local Worker with `VITE_LEADERBOARD_API_URL=http://127.0.0.1:8787`.

## API

- `GET /health` checks the D1 binding.
- `GET /leaderboard?metric=lifetime` returns the top lifetime-coin scores.
- `GET /leaderboard?metric=cps` returns the top CPS scores.
- `GET /leaderboard?metric=all` returns both boards in one response.
- `POST /leaderboard` accepts the payload already emitted by `src/core/leaderboard.js`.

An optional `playerToken` query parameter or `X-Player-Token` request header makes a single-board GET include `ownRank`. Tokens are salted and SHA-256 hashed before storage. Network addresses are hashed the same way and used only for throttling and basic abuse detection.

The board is deliberately labeled self-reported. Validation catches malformed or internally inconsistent values, but a browser game cannot make client-provided scores cryptographically trustworthy. Held submissions remain in `submissions` for manual inspection and do not update `scores`.

## Operational notes

- Public GET responses are briefly cacheable; POST and health responses are not.
- Defaults allow one submission per player per minute, 50 per player per day, and 12 per network per ten minutes. All can be changed in `wrangler.jsonc`.
- Content-count ceilings match the Grand Tour build: 40 producers, 460 upgrades, 700 achievements, and 50 Moons. Raise the corresponding variables when future releases add content.
- Apply every new migration before deploying code that depends on it.

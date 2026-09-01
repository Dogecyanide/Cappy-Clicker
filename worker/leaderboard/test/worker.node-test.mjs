import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/index.js';

const allowedOrigin = 'https://dogecyanide.github.io';

function env(overrides = {}) {
  return {
    ALLOWED_ORIGINS: allowedOrigin,
    TOKEN_PEPPER: 'a-private-test-pepper-that-is-long-enough',
    DB: {
      prepare(sql) {
        assert.match(sql, /sqlite_master/);
        return { first: async (column) => column === 'count' ? 3 : { count: 3 } };
      },
    },
    ...overrides,
  };
}

test('health confirms both the database and score submissions are ready', async () => {
  const response = await worker.fetch(new Request('https://league.test/health', {
    headers: { origin: allowedOrigin },
  }), env());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), allowedOrigin);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), {
    ok: true,
    service: 'cappy-clicker-open-league',
    submissionsReady: true,
  });
});

test('health fails closed when the private submission secret is missing', async () => {
  const originalError = console.error;
  console.error = () => {};
  let response;
  try {
    response = await worker.fetch(new Request('https://league.test/health'), env({ TOKEN_PEPPER: '' }));
  } finally {
    console.error = originalError;
  }
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'TOKEN_PEPPER is not configured.' });
});

test('health fails closed before the D1 migration creates every table', async () => {
  const originalError = console.error;
  console.error = () => {};
  let response;
  try {
    response = await worker.fetch(new Request('https://league.test/health'), env({
      DB: { prepare: () => ({ first: async () => 2 }) },
    }));
  } finally {
    console.error = originalError;
  }
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'The leaderboard database migration is not applied.' });
});

test('CORS rejects unknown sites but permits the configured Pages preflight', async () => {
  const rejected = await worker.fetch(new Request('https://league.test/leaderboard', {
    method: 'OPTIONS',
    headers: { origin: 'https://example.com' },
  }), env());
  assert.equal(rejected.status, 403);

  const allowed = await worker.fetch(new Request('https://league.test/leaderboard', {
    method: 'OPTIONS',
    headers: { origin: allowedOrigin },
  }), env());
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get('access-control-allow-origin'), allowedOrigin);
});

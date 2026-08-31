import {
  METRICS,
  ValidationError,
  boundedInteger,
  buildAbuseFlags,
  parseRuntimeLimits,
  shouldHoldForReview,
  validateSubmissionPayload,
} from './validation.js';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
};

class ApiError extends Error {
  constructor(status, message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.field = options.field ?? '';
    this.retryAfter = options.retryAfter ?? 0;
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin');
    const cors = corsHeaders(origin, env.ALLOWED_ORIGINS);
    const requestId = request.headers.get('cf-ray') ?? crypto.randomUUID();

    try {
      if (origin && !cors.allowed) throw new ApiError(403, 'This origin is not allowed.');
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors.headers });
      if (!env.DB) throw new ApiError(503, 'The leaderboard database is not configured.');

      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, '') || '/';
      let response;

      if (request.method === 'GET' && path === '/health') {
        response = await health(env);
      } else if (request.method === 'GET' && path === '/leaderboard') {
        response = await getLeaderboard(request, env, url);
      } else if (request.method === 'POST' && path === '/leaderboard') {
        response = await postLeaderboard(request, env);
      } else {
        throw new ApiError(404, 'Route not found.');
      }

      return withHeaders(response, cors.headers, { 'x-request-id': requestId });
    } catch (error) {
      const normalized = normalizeError(error);
      if (normalized.status >= 500) console.error('leaderboard_request_failed', { requestId, error });
      const headers = { ...cors.headers, 'x-request-id': requestId };
      if (normalized.retryAfter) headers['retry-after'] = String(normalized.retryAfter);
      return json({ error: normalized.message, ...(normalized.field ? { field: normalized.field } : {}) }, normalized.status, headers);
    }
  },
};

async function health(env) {
  await env.DB.prepare('SELECT 1 AS ok').first();
  return json({ ok: true, service: 'cappy-clicker-open-league' }, 200, {
    'cache-control': 'no-store',
  });
}

async function getLeaderboard(request, env, url) {
  const metric = url.searchParams.get('metric') ?? 'lifetime';
  const playerToken = url.searchParams.get('playerToken') ?? request.headers.get('x-player-token');
  const cacheHeaders = playerToken ? { 'cache-control': 'private, no-store' } : publicCacheHeaders();
  if (metric === 'all') {
    const [lifetime, cps] = await Promise.all([
      listMetric(env, 'lifetime'),
      listMetric(env, 'cps'),
    ]);
    return json({ boards: { lifetime, cps } }, 200, cacheHeaders);
  }
  if (!METRICS.has(metric)) throw new ApiError(400, 'Metric must be lifetime, cps, or all.');

  const entries = await listMetric(env, metric);
  const ownRank = playerToken ? await findOwnRank(env, metric, playerToken) : null;
  return json({ metric, entries, ownRank }, 200, cacheHeaders);
}

async function listMetric(env, metric) {
  const limit = boundedInteger(env.LEADERBOARD_LIMIT, 100, 1, 100);
  const result = await env.DB.prepare(`
    SELECT p.display_name AS name, s.score_log10, s.display_value, s.metadata_json, s.submitted_at
    FROM scores s
    INNER JOIN players p ON p.id = s.player_id
    WHERE s.metric = ?1 AND s.is_flagged = 0
    ORDER BY s.score_log10 DESC, s.submitted_at ASC
    LIMIT ?2
  `).bind(metric, limit).all();

  return (result.results ?? []).map((row, index) => ({
    rank: index + 1,
    name: row.name,
    displayValue: row.display_value,
    scoreLog10: row.score_log10,
    metadata: safeJsonObject(row.metadata_json),
    submittedAt: row.submitted_at,
  }));
}

async function findOwnRank(env, metric, playerToken) {
  if (!/^[A-Za-z0-9-]{16,80}$/.test(playerToken) || !env.TOKEN_PEPPER) return null;
  const tokenHash = await hashIdentity('player', playerToken, env.TOKEN_PEPPER);
  const own = await env.DB.prepare(`
    SELECT s.score_log10, s.submitted_at
    FROM scores s INNER JOIN players p ON p.id = s.player_id
    WHERE p.token_hash = ?1 AND s.metric = ?2 AND s.is_flagged = 0
  `).bind(tokenHash, metric).first();
  if (!own) return null;
  const rank = await env.DB.prepare(`
    SELECT COUNT(*) + 1 AS rank
    FROM scores
    WHERE metric = ?1 AND is_flagged = 0
      AND (score_log10 > ?2 OR (score_log10 = ?2 AND submitted_at < ?3))
  `).bind(metric, own.score_log10, own.submitted_at).first('rank');
  return Number(rank) || null;
}

async function postLeaderboard(request, env) {
  if (!env.TOKEN_PEPPER || String(env.TOKEN_PEPPER).length < 24) {
    throw new ApiError(503, 'TOKEN_PEPPER is not configured.');
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > 16_384) throw new ApiError(413, 'Submission body is too large.');
  const source = await request.text();
  if (new TextEncoder().encode(source).byteLength > 16_384) throw new ApiError(413, 'Submission body is too large.');

  let raw;
  try { raw = JSON.parse(source); } catch { throw new ApiError(400, 'Submission body is not valid JSON.'); }

  const limits = parseRuntimeLimits(env);
  let submission;
  try { submission = validateSubmissionPayload(raw, limits); } catch (error) {
    if (error instanceof ValidationError) throw new ApiError(422, error.message, { field: error.field });
    throw error;
  }

  const now = Date.now();
  const tokenHash = await hashIdentity('player', submission.playerToken, env.TOKEN_PEPPER);
  const clientAddress = request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'local-development';
  const ipHash = await hashIdentity('network', clientAddress, env.TOKEN_PEPPER);

  let player = await env.DB.prepare(`
    SELECT id, display_name, submissions_count, abuse_count
    FROM players WHERE token_hash = ?1
  `).bind(tokenHash).first();

  await enforceRateLimits(env, player?.id ?? null, ipHash, now);

  if (player) {
    await env.DB.prepare(`
      UPDATE players SET display_name = ?1, updated_at = ?2, last_ip_hash = ?3 WHERE id = ?4
    `).bind(submission.name, now, ipHash, player.id).run();
  } else {
    try {
      const inserted = await env.DB.prepare(`
        INSERT INTO players (token_hash, display_name, created_at, updated_at, last_ip_hash)
        VALUES (?1, ?2, ?3, ?3, ?4)
      `).bind(tokenHash, submission.name, now, ipHash).run();
      player = { id: inserted.meta.last_row_id, submissions_count: 0, abuse_count: 0 };
    } catch (error) {
      player = await env.DB.prepare(`
        SELECT id, display_name, submissions_count, abuse_count FROM players WHERE token_hash = ?1
      `).bind(tokenHash).first();
      if (!player) throw error;
    }
  }

  const [previousScore, identitySummary] = await Promise.all([
    env.DB.prepare(`
      SELECT score_log10, submitted_at FROM scores WHERE player_id = ?1 AND metric = ?2
    `).bind(player.id, submission.metric).first(),
    env.DB.prepare(`
      SELECT COUNT(DISTINCT player_id) AS identities
      FROM submissions WHERE ip_hash = ?1 AND submitted_at >= ?2
    `).bind(ipHash, now - 24 * 60 * 60 * 1_000).first(),
  ]);

  const flags = buildAbuseFlags(submission, {
    previousScore,
    ipIdentityCount: Number(identitySummary?.identities ?? 0),
    now,
  });
  const held = shouldHoldForReview(flags);
  const metadataJson = JSON.stringify(submission.metadata);

  await env.DB.prepare(`
    INSERT INTO submissions (
      player_id, metric, score_log10, display_value, metadata_json,
      abuse_flags, ip_hash, submitted_at, accepted
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
  `).bind(
    player.id,
    submission.metric,
    submission.scoreLog10,
    submission.displayValue,
    metadataJson,
    JSON.stringify(flags),
    ipHash,
    now,
    held ? 0 : 1,
  ).run();

  const bestUpdated = !held && (!previousScore || submission.scoreLog10 > Number(previousScore.score_log10));
  if (!held) {
    await env.DB.prepare(`
      INSERT INTO scores (
        player_id, metric, score_log10, display_value, metadata_json,
        submitted_at, is_flagged, abuse_flags
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, ?7)
      ON CONFLICT(player_id, metric) DO UPDATE SET
        score_log10 = excluded.score_log10,
        display_value = excluded.display_value,
        metadata_json = excluded.metadata_json,
        submitted_at = excluded.submitted_at,
        is_flagged = 0,
        abuse_flags = excluded.abuse_flags
      WHERE excluded.score_log10 > scores.score_log10
    `).bind(
      player.id,
      submission.metric,
      submission.scoreLog10,
      submission.displayValue,
      metadataJson,
      now,
      JSON.stringify(flags),
    ).run();
  }

  await env.DB.prepare(`
    UPDATE players
    SET submissions_count = submissions_count + 1,
        abuse_count = abuse_count + ?1,
        updated_at = ?2
    WHERE id = ?3
  `).bind(held ? 1 : 0, now, player.id).run();

  return json({
    accepted: !held,
    held,
    bestUpdated,
    metric: submission.metric,
    message: held
      ? 'Score received but held out of public ranks by an automatic abuse check.'
      : bestUpdated ? 'New personal best posted.' : 'Score received; your existing best remains higher.',
  }, held ? 202 : 201, { 'cache-control': 'no-store' });
}

async function enforceRateLimits(env, playerId, ipHash, now) {
  const cooldownSeconds = boundedInteger(env.SUBMISSION_COOLDOWN_SECONDS, 60, 10, 3_600);
  const playerDailyLimit = boundedInteger(env.PLAYER_SUBMISSIONS_PER_DAY, 50, 1, 1_000);
  const networkTenMinuteLimit = boundedInteger(env.NETWORK_SUBMISSIONS_PER_10_MINUTES, 12, 1, 1_000);

  const statements = [
    env.DB.prepare(`
      SELECT COUNT(*) AS count FROM submissions WHERE ip_hash = ?1 AND submitted_at >= ?2
    `).bind(ipHash, now - 10 * 60 * 1_000),
  ];
  if (playerId) {
    statements.push(
      env.DB.prepare(`SELECT MAX(submitted_at) AS latest FROM submissions WHERE player_id = ?1`).bind(playerId),
      env.DB.prepare(`
        SELECT COUNT(*) AS count FROM submissions WHERE player_id = ?1 AND submitted_at >= ?2
      `).bind(playerId, now - 24 * 60 * 60 * 1_000),
    );
  }
  const rows = await env.DB.batch(statements);
  const networkCount = Number(rows[0]?.results?.[0]?.count ?? 0);
  if (networkCount >= networkTenMinuteLimit) {
    throw new ApiError(429, 'Too many submissions from this network. Try again later.', { retryAfter: 600 });
  }
  if (!playerId) return;

  const latest = Number(rows[1]?.results?.[0]?.latest ?? 0);
  const remaining = cooldownSeconds - Math.floor((now - latest) / 1_000);
  if (latest && remaining > 0) {
    throw new ApiError(429, 'Please wait before submitting again.', { retryAfter: remaining });
  }
  const dailyCount = Number(rows[2]?.results?.[0]?.count ?? 0);
  if (dailyCount >= playerDailyLimit) {
    throw new ApiError(429, 'This player has reached today’s submission limit.', { retryAfter: 3_600 });
  }
}

async function hashIdentity(namespace, value, pepper) {
  const bytes = new TextEncoder().encode(`${namespace}\u0000${pepper}\u0000${value}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function corsHeaders(origin, configuredOrigins = '') {
  const allowedOrigins = String(configuredOrigins)
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  const normalizedOrigin = String(origin ?? '').replace(/\/+$/, '');
  const wildcard = allowedOrigins.includes('*');
  const allowed = !origin || wildcard || allowedOrigins.includes(normalizedOrigin);
  const headers = {
    vary: 'Origin',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type, Accept, X-Player-Token',
    'access-control-max-age': '86400',
  };
  if (origin && allowed) headers['access-control-allow-origin'] = wildcard ? '*' : normalizedOrigin;
  return { allowed, headers };
}

function publicCacheHeaders() {
  return {
    'cache-control': 'public, max-age=20, s-maxage=45, stale-while-revalidate=120',
  };
}

function safeJsonObject(value) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeError(error) {
  if (error instanceof ApiError) return error;
  if (error instanceof ValidationError) return new ApiError(422, error.message, { field: error.field });
  return new ApiError(500, 'The leaderboard service hit an unexpected error.');
}

function json(value, status = 200, headers = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

function withHeaders(response, ...headerSets) {
  const headers = new Headers(response.headers);
  for (const set of headerSets) for (const [key, value] of Object.entries(set)) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export const METRICS = new Set(['lifetime', 'cps']);

const PLAYER_TOKEN_PATTERN = /^[A-Za-z0-9-]{16,80}$/;
const GAME_DECIMAL_PATTERN = /^(\d{1,80})(?:\.(\d{1,80}))?(?:e([+-]?\d{1,8}))?$/i;
const BUILD_PATTERN = /^[A-Za-z0-9._-]{1,40}$/;

export class ValidationError extends Error {
  constructor(message, field = '') {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export function validateSubmissionPayload(value, limits = {}) {
  if (!isPlainObject(value)) throw new ValidationError('The submission must be a JSON object.');

  const playerToken = String(value.playerToken ?? '').trim();
  if (!PLAYER_TOKEN_PATTERN.test(playerToken)) {
    throw new ValidationError('The player token is missing or malformed.', 'playerToken');
  }

  const name = sanitizePlayerName(value.name);
  const metric = String(value.metric ?? '');
  if (!METRICS.has(metric)) throw new ValidationError('Metric must be lifetime or cps.', 'metric');

  const display = parseGameDecimal(value.displayValue, 'displayValue');
  const scoreLog10 = finiteNumber(value.scoreLog10, 'scoreLog10');
  const maxScoreLog10 = boundedInteger(limits.maxScoreLog10, 1_000_000, 100, 10_000_000);
  if (scoreLog10 < -maxScoreLog10 || scoreLog10 > maxScoreLog10) {
    throw new ValidationError('The score is outside the supported range.', 'scoreLog10');
  }
  if (!logsMatch(scoreLog10, display.log10)) {
    throw new ValidationError('scoreLog10 does not match displayValue.', 'scoreLog10');
  }

  const metadata = validateMetadata(value.metadata, limits);
  const metricDecimal = metric === 'cps' ? metadata.cpsDecimal : metadata.lifetimeDecimal;
  if (display.zero !== metricDecimal.zero || !logsMatch(display.log10, metricDecimal.log10)) {
    throw new ValidationError(`displayValue does not match metadata.${metric}.`, 'displayValue');
  }

  return {
    playerToken,
    name,
    metric,
    scoreLog10,
    displayValue: display.source,
    metadata: {
      cps: metadata.cpsDecimal.source,
      lifetime: metadata.lifetimeDecimal.source,
      producers: metadata.producers,
      upgrades: metadata.upgrades,
      achievements: metadata.achievements,
      moons: metadata.moons,
      playSeconds: metadata.playSeconds,
      build: metadata.build,
    },
    derived: {
      cpsLog10: metadata.cpsDecimal.log10,
      lifetimeLog10: metadata.lifetimeDecimal.log10,
    },
  };
}

export function sanitizePlayerName(value) {
  const name = String(value ?? '').normalize('NFKC').replace(/\s+/gu, ' ').trim();
  const length = [...name].length;
  if (length < 2 || length > 24) throw new ValidationError('Name must contain 2 to 24 characters.', 'name');
  if (/[\u0000-\u001f\u007f<>{}\\]/u.test(name)) {
    throw new ValidationError('Name contains unsupported characters.', 'name');
  }
  if (!/[\p{L}\p{N}]/u.test(name)) throw new ValidationError('Name must contain a letter or number.', 'name');
  if (/(?:https?:\/\/|www\.|\b(?:com|net|org|gg)\/)/iu.test(name)) {
    throw new ValidationError('Links are not allowed in player names.', 'name');
  }
  return name;
}

export function parseGameDecimal(value, field = 'value') {
  const source = String(value ?? '').trim();
  if (!source || source.length > 180) throw new ValidationError(`${field} is not a supported number.`, field);
  const match = GAME_DECIMAL_PATTERN.exec(source);
  if (!match) throw new ValidationError(`${field} is not a supported number.`, field);

  const integer = match[1];
  const fraction = match[2] ?? '';
  const exponent = Number(match[3] ?? 0);
  if (!Number.isSafeInteger(exponent)) throw new ValidationError(`${field} has an invalid exponent.`, field);

  const digits = `${integer}${fraction}`;
  const firstNonZero = digits.search(/[1-9]/);
  if (firstNonZero === -1) return { source: '0', log10: 0, zero: true };

  const decimalPower = integer.length - firstNonZero - 1 + exponent;
  const significant = digits.slice(firstNonZero, firstNonZero + 16);
  const leading = Number(`${significant[0]}.${significant.slice(1) || '0'}`);
  const log10 = decimalPower + Math.log10(leading);
  if (!Number.isFinite(log10)) throw new ValidationError(`${field} is outside the supported range.`, field);
  return { source, log10, zero: false };
}

export function buildAbuseFlags(submission, context = {}) {
  const flags = [];
  const { scoreLog10, metric, metadata, derived } = submission;
  const previous = context.previousScore;
  const now = Number(context.now ?? Date.now());

  if (metadata.playSeconds < 300 && scoreLog10 > 12) flags.push('very_fast_growth');
  if (metadata.playSeconds < 3_600 && scoreLog10 > 80) flags.push('extreme_first_hour');
  if (metadata.upgrades > 0 && metadata.producers === 0) flags.push('upgrades_without_producers');
  if (metadata.moons > 0 && derived.lifetimeLog10 < 4) flags.push('moons_without_lifetime_coins');
  if (derived.cpsLog10 > derived.lifetimeLog10 + 12) flags.push('cps_far_above_lifetime');
  if (Number(context.ipIdentityCount ?? 0) >= 8) flags.push('many_tokens_from_network');

  if (previous && Number.isFinite(Number(previous.score_log10))) {
    const elapsed = Math.max(0, now - Number(previous.submitted_at ?? 0));
    const jump = scoreLog10 - Number(previous.score_log10);
    if (elapsed < 60 * 60 * 1_000 && jump > 25) flags.push('rapid_score_jump');
    if (metric === 'lifetime' && jump < -6) flags.push('large_lifetime_regression');
  }

  return [...new Set(flags)];
}

export function shouldHoldForReview(flags) {
  const holdFlags = new Set([
    'very_fast_growth',
    'extreme_first_hour',
    'upgrades_without_producers',
    'moons_without_lifetime_coins',
    'cps_far_above_lifetime',
    'many_tokens_from_network',
    'rapid_score_jump',
  ]);
  return flags.some((flag) => holdFlags.has(flag));
}

export function parseRuntimeLimits(env = {}) {
  return {
    maxScoreLog10: boundedInteger(env.MAX_SCORE_LOG10, 1_000_000, 100, 10_000_000),
    maxProducers: boundedInteger(env.MAX_PRODUCERS, 40_000_000_000, 40, 40_000_000_000),
    maxUpgrades: boundedInteger(env.MAX_UPGRADES, 480, 1, 100_000),
    maxAchievements: boundedInteger(env.MAX_ACHIEVEMENTS, 700, 1, 100_000),
    maxMoons: boundedInteger(env.MAX_MOONS, 50, 1, 10_000),
    maxPlaySeconds: boundedInteger(env.MAX_PLAY_SECONDS, 3_155_760_000, 86_400, 31_557_600_000),
  };
}

export function boundedInteger(value, fallback, minimum, maximum) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(minimum, Math.min(maximum, Math.floor(number)));
}

function validateMetadata(value, limits) {
  if (!isPlainObject(value)) throw new ValidationError('metadata must be an object.', 'metadata');
  const runtime = parseRuntimeLimits(limits);
  const build = String(value.build ?? '').trim();
  if (!BUILD_PATTERN.test(build)) throw new ValidationError('metadata.build is malformed.', 'metadata.build');

  return {
    cpsDecimal: parseGameDecimal(value.cps, 'metadata.cps'),
    lifetimeDecimal: parseGameDecimal(value.lifetime, 'metadata.lifetime'),
    producers: count(value.producers, 'metadata.producers', runtime.maxProducers),
    upgrades: count(value.upgrades, 'metadata.upgrades', runtime.maxUpgrades),
    achievements: count(value.achievements, 'metadata.achievements', runtime.maxAchievements),
    moons: count(value.moons, 'metadata.moons', runtime.maxMoons),
    playSeconds: count(value.playSeconds, 'metadata.playSeconds', runtime.maxPlaySeconds),
    build,
  };
}

function count(value, field, maximum) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0 || number > maximum) {
    throw new ValidationError(`${field} is outside the supported range.`, field);
  }
  return number;
}

function finiteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new ValidationError(`${field} must be finite.`, field);
  return number;
}

function logsMatch(left, right) {
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= Math.max(1e-6, scale * 1e-10);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

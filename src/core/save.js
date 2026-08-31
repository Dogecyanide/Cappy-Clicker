import { D, Decimal, isFiniteDecimal } from './numbers.js';
import { createInitialState, randomBooDelay, SAVE_VERSION } from './state.js';
import { PRODUCERS } from '../data/buildings.js';
import { BUILDING_UPGRADE_BY_ID } from '../data/building-upgrades.js';
import { ACHIEVEMENT_BY_ID } from '../data/achievements.js';
import { POWER_MOON_BY_ID } from '../data/power-moons.js';
import { BOO_OUTCOME_BY_ID } from '../data/boo-outcomes.js';

export const SAVE_KEY = 'cappy-clicker-v2';

const DECIMAL_STAT_KEYS = ['coinsFromClicks', 'coinsFromProduction', 'offlineEarned', 'booCoinsLost'];
const STRING_ARRAY_STAT_KEYS = ['booDistinct', 'uniqueNewsSeen', 'backdropsSeen', 'playDays', 'performanceModesUsed'];
const EFFECT_TYPES = new Set([
  'global-additive', 'production-multiplier', 'click-multiplier', 'price-multiplier',
  'producer-multiplier', 'producer-disabled', 'purple-curse', 'cosmetic-banana',
]);
const PRODUCER_IDS = new Set(PRODUCERS.map(({ id }) => id));

export function serializeState(state) {
  return JSON.stringify(state, (_key, value) => value instanceof Decimal ? value.toString() : value);
}

export function deserializeState(serialized, now = Date.now()) {
  let raw;
  try {
    raw = typeof serialized === 'string' ? JSON.parse(serialized) : structuredClone(serialized);
  } catch {
    throw new Error('That save is not valid JSON.');
  }
  if (!raw || typeof raw !== 'object' || raw.version !== SAVE_VERSION) throw new Error('That is not a Cappy Clicker v2 save.');

  const state = createInitialState(now);
  state.coins = parseDecimal(raw.coins, 'coins');
  state.lifetimeCoins = parseDecimal(raw.lifetimeCoins, 'lifetime coins');
  if (state.coins.lt(0) || state.lifetimeCoins.lt(0)) throw new Error('Coin totals cannot be negative.');

  for (const producer of PRODUCERS) {
    const amount = Number(raw.producers?.[producer.id] ?? 0);
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > 1_000_000_000) throw new Error(`Invalid amount for ${producer.name}.`);
    state.producers[producer.id] = amount;
  }

  state.upgrades = uniqueArray(raw.upgrades).filter((id) => BUILDING_UPGRADE_BY_ID[id]);
  state.moons = uniqueArray(raw.moons).filter((id) => POWER_MOON_BY_ID[id]);
  state.discoveredProducers = uniqueArray(raw.discoveredProducers).filter((id) => state.producers[id] !== undefined);
  if (!state.discoveredProducers.length) state.discoveredProducers = PRODUCERS.slice(0, 2).map(({ id }) => id);

  state.achievements = {};
  for (const [id, record] of Object.entries(raw.achievements ?? {})) {
    if (ACHIEVEMENT_BY_ID[id]) state.achievements[id] = { unlockedAt: Number(record?.unlockedAt ?? now) || now };
  }

  state.stats = sanitizeStats(state.stats, raw.stats);
  state.activeEffects = Array.isArray(raw.activeEffects)
    ? raw.activeEffects.filter(validEffect).map(sanitizeEffect)
    : [];
  state.settings = sanitizeSettings(state.settings, raw.settings);
  state.combo = sanitizeCombo(state.combo, raw.combo);
  state.lastSaveAt = finiteNumber(raw.lastSaveAt, now);
  state.boo = sanitizeBoo(state.boo, raw.boo, state.lastSaveAt, now);
  state.news = Array.isArray(raw.news)
    ? raw.news.filter((item) => item && typeof item.text === 'string').slice(0, 30).map((item) => ({ text: item.text.slice(0, 500), at: finiteNumber(item.at, now) }))
    : [];
  state.lastTickAt = now;
  return state;
}

function parseDecimal(value, label) {
  let number;
  try { number = new Decimal(value); } catch { throw new Error(`Invalid ${label}.`); }
  if (!isFiniteDecimal(number)) throw new Error(`Invalid ${label}.`);
  return number;
}

function uniqueArray(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item) => typeof item === 'string'))];
}

function validEffect(effect) {
  return effect && typeof effect === 'object' && EFFECT_TYPES.has(effect.type)
    && Number.isFinite(Number(effect.expiresAt)) && Number(effect.expiresAt) > 0;
}

function sanitizeEffect(effect) {
  const sanitized = {
    type: effect.type,
    expiresAt: Number(effect.expiresAt),
    source: typeof effect.source === 'string' ? effect.source.slice(0, 100) : 'save',
  };
  if (effect.producerId && PRODUCER_IDS.has(effect.producerId)) sanitized.producerId = effect.producerId;
  if ('multiplier' in effect) sanitized.multiplier = boundedNumber(effect.multiplier, 1, 0, 100);
  if ('amount' in effect) sanitized.amount = boundedNumber(effect.amount, 0, -1, 100);
  return sanitized;
}

function sanitizeStats(defaults, value) {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const stats = { ...defaults };
  for (const [key, fallback] of Object.entries(defaults)) {
    if (DECIMAL_STAT_KEYS.includes(key)) {
      stats[key] = D(raw[key] ?? fallback).max(0);
    } else if (typeof fallback === 'number') {
      stats[key] = Math.max(0, finiteNumber(raw[key], fallback));
    }
  }
  for (const key of STRING_ARRAY_STAT_KEYS) {
    const allowed = key === 'performanceModesUsed' ? new Set(['full', 'reduced', 'potato']) : null;
    const items = Array.isArray(raw[key]) ? raw[key] : defaults[key];
    stats[key] = [...new Set(items.filter((item) => typeof item === 'string' && (!allowed || allowed.has(item))).map((item) => item.slice(0, 500)))].slice(0, 500);
  }
  stats.booOutcomeCounts = sanitizeCountMap(raw.booOutcomeCounts, new Set(Object.keys(BOO_OUTCOME_BY_ID)));
  stats.booTierCounts = sanitizeCountMap(raw.booTierCounts, new Set(['positive', 'neutral', 'mild-negative', 'severe-negative', 'catastrophic']));
  const streak = raw.booStreak && typeof raw.booStreak === 'object' ? raw.booStreak : defaults.booStreak;
  stats.booStreak = {
    tier: ['positive', 'neutral', 'negative'].includes(streak.tier) ? streak.tier : '',
    count: Math.max(0, Math.floor(finiteNumber(streak.count, 0))),
  };
  return stats;
}

function sanitizeCountMap(value, allowedKeys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => allowedKeys.has(key))
    .map(([key, count]) => [key, Math.max(0, Math.floor(finiteNumber(count, 0)))]));
}

function sanitizeSettings(defaults, value) {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    ...defaults,
    performance: ['full', 'reduced', 'potato'].includes(raw.performance) ? raw.performance : defaults.performance,
    sound: typeof raw.sound === 'boolean' ? raw.sound : defaults.sound,
    reducedMotion: typeof raw.reducedMotion === 'boolean' ? raw.reducedMotion : defaults.reducedMotion,
    numberFormat: ['words', 'scientific'].includes(raw.numberFormat) ? raw.numberFormat : defaults.numberFormat,
  };
}

function sanitizeCombo(defaults, value) {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    count: Math.max(0, Math.floor(finiteNumber(raw.count, defaults.count))),
    lastClickAt: Math.max(0, finiteNumber(raw.lastClickAt, defaults.lastClickAt)),
  };
}

function sanitizeBoo(defaults, value, savedAt, now) {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const boo = {
    ...defaults,
    visibleUntil: Math.max(0, finiteNumber(raw.visibleUntil, 0)),
    committedSpin: sanitizeCommittedSpin(raw.committedSpin, now),
    history: sanitizeBooHistory(raw.history, now),
  };
  if (boo.committedSpin) {
    boo.nextSpawnAt = Math.max(now, finiteNumber(raw.nextSpawnAt, now));
  } else if (boo.visibleUntil > now) {
    boo.nextSpawnAt = Math.max(now, finiteNumber(raw.nextSpawnAt, now));
  } else {
    boo.visibleUntil = 0;
    const rawNextSpawn = Number(raw.nextSpawnAt);
    const remainingActiveDelay = Number.isFinite(rawNextSpawn)
      ? Math.max(1_000, Math.min(8 * 60 * 1000, rawNextSpawn - savedAt))
      : randomBooDelay();
    boo.nextSpawnAt = now + remainingActiveDelay;
  }
  return boo;
}

function sanitizeCommittedSpin(value, now) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const outcome = BOO_OUTCOME_BY_ID[value.outcomeId];
  if (!outcome) return null;
  const committedAt = Math.max(0, finiteNumber(value.committedAt, now));
  const revealAt = Math.max(committedAt, finiteNumber(value.revealAt, committedAt));
  return {
    outcomeId: outcome.id,
    symbols: [...outcome.symbols],
    producerId: PRODUCER_IDS.has(value.producerId) ? value.producerId : PRODUCERS[0].id,
    committedAt,
    revealAt,
    applied: Boolean(value.applied),
    lossApplied: Boolean(value.lossApplied),
    payout: D(value.payout).max(0).toString(),
    loss: D(value.loss).max(0).toString(),
    ...(value.applied ? { appliedAt: Math.max(revealAt, finiteNumber(value.appliedAt, revealAt)) } : {}),
  };
}

function sanitizeBooHistory(value, now) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((record) => {
    const outcome = record && typeof record === 'object' ? BOO_OUTCOME_BY_ID[record.outcomeId] : null;
    if (!outcome) return [];
    const at = Math.max(0, finiteNumber(record.at, now));
    return [{
      id: `${at}-${outcome.id}`,
      outcomeId: outcome.id,
      title: outcome.title,
      tier: outcome.tier,
      at,
      payout: D(record.payout).max(0).toString(),
      loss: D(record.loss).max(0).toString(),
      producerId: PRODUCER_IDS.has(record.producerId) ? record.producerId : PRODUCERS[0].id,
    }];
  }).slice(0, 100);
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function boundedNumber(value, fallback, min, max) {
  return Math.max(min, Math.min(max, finiteNumber(value, fallback)));
}

export function saveToStorage(state, storage = localStorage, now = Date.now()) {
  state.lastSaveAt = now;
  storage.setItem(SAVE_KEY, serializeState(state));
  return now;
}

export function loadFromStorage(storage = localStorage, now = Date.now()) {
  const serialized = storage.getItem(SAVE_KEY);
  return serialized ? deserializeState(serialized, now) : createInitialState(now);
}

export function exportSave(state) {
  const bytes = new TextEncoder().encode(serializeState(state));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `CAPPY2:${btoa(binary)}`;
}

export function importSave(value, now = Date.now()) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed.startsWith('CAPPY2:')) throw new Error('The save must begin with CAPPY2:.');
  try {
    const binary = atob(trimmed.slice(7));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return deserializeState(new TextDecoder().decode(bytes), now);
  } catch (error) {
    if (error.message?.startsWith('That') || error.message?.startsWith('Coin') || error.message?.startsWith('Invalid')) throw error;
    throw new Error('The save text is malformed.');
  }
}

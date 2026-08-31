import { D } from '../core/numbers.js';
import { getEconomySnapshot, getMoonBonuses, strongestProducerId } from '../core/economy.js';
import { randomBooDelay } from '../core/state.js';
import { BOO_OUTCOMES, BOO_OUTCOME_BY_ID } from '../data/boo-outcomes.js';

export function spawnBoo(state, now = Date.now()) {
  if (state.boo.visibleUntil > now || state.boo.committedSpin) return false;
  state.boo.visibleUntil = now + 10_000;
  state.stats.booEncounters += 1;
  return true;
}

export function chooseBooOutcome(state, random = Math.random) {
  const luck = Math.max(0, Math.min(0.2, getMoonBonuses(state).eventLuck));
  const weighted = BOO_OUTCOMES.map((outcome) => {
    const positive = outcome.tier === 'positive';
    const negative = outcome.tier.includes('negative') || outcome.tier === 'catastrophic';
    const weight = outcome.probability * (positive ? 1 + luck : negative ? 1 - luck : 1);
    return { outcome, weight };
  });
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let cursor = random() * total;
  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) return item.outcome;
  }
  return weighted.at(-1).outcome;
}

export function commitBooSpin(state, options = {}) {
  const now = options.now ?? Date.now();
  if (state.boo.committedSpin) return state.boo.committedSpin;
  if (!options.force && state.boo.visibleUntil <= now) return null;
  const outcome = options.outcomeId ? BOO_OUTCOME_BY_ID[options.outcomeId] : chooseBooOutcome(state, options.random);
  if (!outcome) return null;
  const producerId = strongestProducerId(state, { now });
  const totalCps = getEconomySnapshot(state, { now }).totalCps;
  const committed = {
    outcomeId: outcome.id,
    symbols: [...outcome.symbols],
    producerId,
    committedAt: now,
    revealAt: now + (options.instant ? 0 : 3_200),
    applied: false,
    payout: '0',
    loss: '0',
  };
  if (outcome.effect.type === 'cps-payout') {
    committed.payout = totalCps.mul(outcome.effect.seconds).add(outcome.effect.flat ?? 0).toString();
  }
  if (outcome.effect.type === 'cps-loss') {
    committed.loss = DecimalMin(totalCps.mul(outcome.effect.seconds), D(state.coins).mul(outcome.effect.bankCap ?? 1)).toString();
  }
  if (outcome.effect.type === 'bank-percent-loss') committed.loss = D(state.coins).mul(outcome.effect.amount).toString();
  if (outcome.effect.type === 'catastrophe') committed.loss = D(state.coins).mul(outcome.effect.bankLoss).toString();
  if (D(committed.loss).gt(0)) {
    const reservedLoss = DecimalMin(D(state.coins), D(committed.loss));
    state.coins = D(state.coins).sub(reservedLoss).max(0);
    state.stats.booCoinsLost = D(state.stats.booCoinsLost).add(reservedLoss);
    committed.loss = reservedLoss.toString();
    committed.lossApplied = true;
  }
  state.boo.committedSpin = committed;
  state.boo.visibleUntil = committed.revealAt + 8_000;
  state.stats.booSpins += 1;
  return committed;
}

export function applyCommittedBooSpin(state, now = Date.now()) {
  const spin = state.boo.committedSpin;
  if (!spin || spin.applied || now < spin.revealAt) return null;
  const outcome = BOO_OUTCOME_BY_ID[spin.outcomeId];
  if (!outcome) {
    state.boo.committedSpin = null;
    return null;
  }
  const effect = outcome.effect;
  if (D(spin.payout).gt(0)) {
    state.coins = D(state.coins).add(spin.payout);
    state.lifetimeCoins = D(state.lifetimeCoins).add(spin.payout);
  }
  if (D(spin.loss).gt(0) && !spin.lossApplied) {
    const actualLoss = DecimalMin(D(state.coins), D(spin.loss));
    state.coins = D(state.coins).sub(actualLoss).max(0);
    state.stats.booCoinsLost = D(state.stats.booCoinsLost).add(actualLoss);
    spin.loss = actualLoss.toString();
    spin.lossApplied = true;
  }

  switch (effect.type) {
    case 'production-multiplier': addTimedEffect(state, { type: effect.type, multiplier: effect.multiplier, expiresAt: spin.revealAt + effect.duration * 1000, source: outcome.id }); break;
    case 'click-multiplier': addTimedEffect(state, { type: effect.type, multiplier: effect.multiplier, expiresAt: spin.revealAt + effect.duration * 1000, source: outcome.id }); break;
    case 'price-multiplier': addTimedEffect(state, { type: effect.type, multiplier: effect.multiplier, expiresAt: spin.revealAt + effect.duration * 1000, source: outcome.id }); break;
    case 'strongest-producer-multiplier': addTimedEffect(state, { type: 'producer-multiplier', producerId: spin.producerId, multiplier: effect.multiplier, expiresAt: spin.revealAt + effect.duration * 1000, source: outcome.id }); break;
    case 'strongest-producer-disabled': addTimedEffect(state, { type: 'producer-disabled', producerId: spin.producerId, expiresAt: spin.revealAt + effect.duration * 1000, source: outcome.id }); break;
    case 'cosmetic': addTimedEffect(state, { type: 'cosmetic-banana', expiresAt: spin.revealAt + effect.duration * 1000, source: outcome.id }); break;
    case 'catastrophe':
      addTimedEffect(state, { type: 'producer-disabled', producerId: spin.producerId, expiresAt: spin.revealAt + effect.duration * 1000, source: outcome.id });
      addTimedEffect(state, { type: 'purple-curse', expiresAt: spin.revealAt + effect.duration * 1000, source: outcome.id });
      break;
    default: break;
  }

  recordOutcomeStats(state, outcome);
  const record = {
    id: `${spin.committedAt}-${outcome.id}`,
    outcomeId: outcome.id,
    title: outcome.title,
    tier: outcome.tier,
    at: now,
    payout: spin.payout,
    loss: spin.loss,
    producerId: spin.producerId,
  };
  state.boo.history.unshift(record);
  state.boo.history = state.boo.history.slice(0, 100);
  spin.applied = true;
  spin.appliedAt = now;
  return { outcome, record };
}

function recordOutcomeStats(state, outcome) {
  if (outcome.tier === 'positive') state.stats.booPositive += 1;
  else if (outcome.tier === 'neutral') state.stats.booNeutral += 1;
  else state.stats.booNegative += 1;
  if (outcome.tier === 'severe-negative') state.stats.booSevere = (state.stats.booSevere ?? 0) + 1;
  if (outcome.tier === 'catastrophic') state.stats.booCatastrophes += 1;
  state.stats.booOutcomeCounts[outcome.id] = (state.stats.booOutcomeCounts[outcome.id] ?? 0) + 1;
  state.stats.booTierCounts[outcome.tier] = (state.stats.booTierCounts[outcome.tier] ?? 0) + 1;
  if (!state.stats.booDistinct.includes(outcome.id)) state.stats.booDistinct.push(outcome.id);
  const streakTier = outcome.tier === 'positive' ? 'positive' : outcome.tier === 'neutral' ? 'neutral' : 'negative';
  if (state.stats.booStreak.tier === streakTier) state.stats.booStreak.count += 1;
  else state.stats.booStreak = { tier: streakTier, count: 1 };
}

export function addTimedEffect(state, effect) {
  const key = effectKey(effect);
  const existing = state.activeEffects.find((item) => effectKey(item) === key);
  if (!existing) {
    state.activeEffects.push(effect);
    return effect;
  }
  existing.expiresAt = Math.max(existing.expiresAt, effect.expiresAt);
  existing.source = effect.source;
  if ('multiplier' in effect) {
    const current = Number(existing.multiplier ?? 1);
    const incoming = Number(effect.multiplier ?? 1);
    existing.multiplier = current < 1 || incoming < 1 ? Math.min(current, incoming) : Math.max(current, incoming);
  }
  return existing;
}

function effectKey(effect) {
  if (effect.type === 'producer-disabled') return 'producer-disabled:*';
  const band = 'multiplier' in effect ? (Number(effect.multiplier) < 1 ? 'below-one' : 'above-one') : 'plain';
  return `${effect.type}:${effect.producerId ?? '*'}:${band}`;
}

export function updateBoo(state, options = {}) {
  const now = options.now ?? Date.now();
  const result = { spawned: false, ignored: false, resolved: null };
  if (state.boo.committedSpin) {
    result.resolved = applyCommittedBooSpin(state, now);
    if (state.boo.committedSpin?.applied && now > state.boo.visibleUntil) {
      state.boo.committedSpin = null;
      state.boo.visibleUntil = 0;
      state.boo.nextSpawnAt = now + randomBooDelay(options.random);
    }
    return result;
  }
  if (state.boo.visibleUntil && now > state.boo.visibleUntil) {
    state.boo.visibleUntil = 0;
    state.stats.booIgnored += 1;
    state.boo.nextSpawnAt = now + randomBooDelay(options.random);
    result.ignored = true;
  }
  if (options.active !== false && !state.boo.visibleUntil && now >= state.boo.nextSpawnAt) result.spawned = spawnBoo(state, now);
  return result;
}

export function forceBooOutcome(state, outcomeId, now = Date.now()) {
  spawnBoo(state, now);
  return commitBooSpin(state, { outcomeId, now, force: true });
}

export function clearTemporaryEffects(state) {
  const count = state.activeEffects.length;
  state.activeEffects = [];
  return count;
}

function DecimalMin(a, b) {
  return D(a).lte(b) ? D(a) : D(b);
}

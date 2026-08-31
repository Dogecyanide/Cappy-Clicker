import { D } from '../core/numbers.js';
import { getClickProfile, getEconomySnapshot, strongestProducerId } from '../core/economy.js';
import { randomShineDelay } from '../core/state.js';
import { SHINE_OUTCOMES } from '../data/shine-outcomes.js';
import { addTimedEffect } from './king-boo.js';

export function spawnShine(state, options = {}) {
  const now = options.now ?? Date.now();
  const random = options.random ?? Math.random;
  if (state.shine.visibleUntil > now) return false;
  const snapshot = getEconomySnapshot(state, { now });
  const profile = getClickProfile(state, { now, snapshot });
  state.shine.kind = random() < 0.07 ? 'corrupted' : 'normal';
  state.shine.spawnedAt = now;
  state.shine.visibleUntil = now + (18 + profile.shineDuration) * 1000;
  state.stats.shinesSeen += 1;
  return true;
}

export function updateShine(state, options = {}) {
  const now = options.now ?? Date.now();
  const active = options.active ?? true;
  const random = options.random ?? Math.random;
  if (state.shine.visibleUntil > 0 && state.shine.visibleUntil <= now) {
    state.shine.visibleUntil = 0;
    state.shine.spawnedAt = 0;
    state.shine.nextSpawnAt = now + randomShineDelay(random);
    state.stats.shinesMissed += 1;
    state.stats.shineStreak = 0;
    return { missed: true, spawned: false };
  }
  if (active && state.shine.visibleUntil <= 0 && now >= state.shine.nextSpawnAt) {
    return { missed: false, spawned: spawnShine(state, { now, random }) };
  }
  return { missed: false, spawned: false };
}

export function claimShine(state, options = {}) {
  const now = options.now ?? Date.now();
  const random = options.random ?? Math.random;
  if (state.shine.visibleUntil <= now) return { ok: false, reason: 'That Shine already slipped away.' };
  const kind = state.shine.kind;
  const choices = SHINE_OUTCOMES.filter((outcome) => outcome.kind === kind);
  let roll = random() * choices.reduce((total, outcome) => total + outcome.probability, 0);
  let outcome = choices[choices.length - 1];
  for (const candidate of choices) {
    roll -= candidate.probability;
    if (roll <= 0) { outcome = candidate; break; }
  }
  const snapshot = getEconomySnapshot(state, { now });
  const profile = getClickProfile(state, { now, snapshot });
  const result = applyShineEffect(state, outcome, { now, snapshot, payoutMultiplier: profile.shinePayout });
  state.stats.shinesClaimed += 1;
  state.stats.shineStreak += 1;
  if (kind === 'corrupted') state.stats.corruptedShines += 1;
  state.stats.shineOutcomeCounts[outcome.id] = (state.stats.shineOutcomeCounts[outcome.id] ?? 0) + 1;
  state.shine.visibleUntil = 0;
  state.shine.spawnedAt = 0;
  state.shine.nextSpawnAt = now + randomShineDelay(random);
  return { ok: true, kind, outcome, ...result };
}

function applyShineEffect(state, outcome, context) {
  const effect = outcome.effect;
  const expiresAt = context.now + Number(effect.duration ?? 0) * 1000;
  if (effect.type === 'coins-cps' || effect.type === 'grand-coins') {
    let amount = context.snapshot.totalCps.mul(effect.seconds);
    if (effect.currentFraction) amount = amount.add(D(state.coins).mul(effect.currentFraction));
    amount = DecimalMax(amount, 100).mul(context.payoutMultiplier).ceil();
    state.coins = D(state.coins).add(amount);
    state.lifetimeCoins = D(state.lifetimeCoins).add(amount);
    state.stats.shineCoins = D(state.stats.shineCoins).add(amount);
    return { amount: amount.toString(), loss: '0' };
  }
  if (effect.type === 'coin-loss') {
    const loss = D(state.coins).mul(effect.fraction).floor();
    state.coins = D(state.coins).sub(loss).max(0);
    return { amount: '0', loss: loss.toString() };
  }
  if (effect.type === 'strongest-producer-disabled') {
    addTimedEffect(state, { type: 'producer-disabled', producerId: strongestProducerId(state, { now: context.now }), expiresAt, source: outcome.id });
  } else {
    const timedEffect = { type: effect.type, expiresAt, source: outcome.id };
    if (effect.multiplier !== undefined) timedEffect.multiplier = effect.multiplier;
    if (effect.amount !== undefined) timedEffect.amount = effect.amount;
    addTimedEffect(state, timedEffect);
  }
  state.stats.shineEffects += 1;
  return { amount: '0', loss: '0' };
}

function DecimalMax(value, minimum) {
  return D(value).gte(minimum) ? D(value) : D(minimum);
}

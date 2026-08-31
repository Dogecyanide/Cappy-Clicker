import { D } from '../core/numbers.js';
import { getClickValue } from '../core/economy.js';

export function performCappyClick(state, context = {}) {
  const now = context.now ?? Date.now();
  const random = context.random ?? Math.random;
  const base = getClickValue(state, { now });
  const criticalChance = 0.05;
  const critical = random() < criticalChance;
  const amount = critical ? base.mul(5) : base;

  if (now - (state.combo.lastClickAt ?? 0) <= 700) state.combo.count += 1;
  else state.combo.count = 1;
  state.combo.lastClickAt = now;
  state.stats.longestCombo = Math.max(state.stats.longestCombo, state.combo.count);
  state.stats.totalClicks += 1;
  if (critical) state.stats.criticalClicks += 1;
  state.stats.coinsFromClicks = D(state.stats.coinsFromClicks).add(amount);
  state.coins = D(state.coins).add(amount);
  state.lifetimeCoins = D(state.lifetimeCoins).add(amount);
  return { amount, critical, combo: state.combo.count };
}


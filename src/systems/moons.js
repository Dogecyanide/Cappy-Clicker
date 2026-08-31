import { D } from '../core/numbers.js';
import { POWER_MOONS, POWER_MOON_BY_ID } from '../data/power-moons.js';

export function getVisibleMoons(state) {
  const unowned = POWER_MOONS.filter(({ id }) => !state.moons.includes(id));
  if (!unowned.length) return [];
  const visible = [unowned[0]];
  const next = unowned[1];
  if (next && D(state.lifetimeCoins).gte(D(next.cost).mul(0.03))) visible.push(next);
  return visible;
}

export function purchaseMoon(state, moonId) {
  const moon = POWER_MOON_BY_ID[moonId];
  if (!moon) return { ok: false, reason: 'Unknown Power Moon.' };
  if (state.moons.includes(moonId)) return { ok: false, reason: 'Already collected.' };
  if (!getVisibleMoons(state).some(({ id }) => id === moonId)) return { ok: false, reason: 'This Moon is not available yet.' };
  const cost = D(moon.cost);
  if (D(state.coins).lt(cost)) return { ok: false, reason: 'Not enough current coins.' };
  state.coins = D(state.coins).sub(cost);
  state.moons.push(moonId);
  state.stats.moonsPurchased += 1;
  return { ok: true, moon, cost };
}

export function grantMoon(state, moonId) {
  if (!POWER_MOON_BY_ID[moonId] || state.moons.includes(moonId)) return false;
  state.moons.push(moonId);
  state.stats.moonsPurchased += 1;
  return true;
}

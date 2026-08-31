import { describe, expect, test } from 'vitest';
import { D } from '../src/core/numbers.js';
import { createInitialState } from '../src/core/state.js';
import { getEconomySnapshot } from '../src/core/economy.js';
import { PRODUCERS } from '../src/data/buildings.js';
import { BUILDING_UPGRADES } from '../src/data/building-upgrades.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';
import { POWER_MOONS } from '../src/data/power-moons.js';
import { BOO_OUTCOMES, BOO_PROBABILITY_TOTAL } from '../src/data/boo-outcomes.js';
import { COSMETICS } from '../src/data/cosmetics.js';
import { SHINE_OUTCOMES } from '../src/data/shine-outcomes.js';
import { evaluateAchievements } from '../src/systems/achievements.js';
import { getVisibleMoons, purchaseMoon } from '../src/systems/moons.js';

describe('finite collections and authored content', () => {
  test('contains the complete Grand Tour collections', () => {
    expect(PRODUCERS).toHaveLength(40);
    expect(BUILDING_UPGRADES).toHaveLength(460);
    expect(ACHIEVEMENTS).toHaveLength(700);
    expect(POWER_MOONS).toHaveLength(50);
    expect(COSMETICS).toHaveLength(21);
    expect(SHINE_OUTCOMES).toHaveLength(9);
  });

  test('producer upgrade IDs and flavour text are unique', () => {
    expect(new Set(BUILDING_UPGRADES.map(({ id }) => id)).size).toBe(BUILDING_UPGRADES.length);
    expect(new Set(BUILDING_UPGRADES.map(({ flavour }) => flavour)).size).toBe(BUILDING_UPGRADES.length);
  });

  test('achievement IDs, names, and descriptions are unique and non-empty', () => {
    for (const field of ['id', 'name', 'flavour']) {
      const values = ACHIEVEMENTS.map((achievement) => achievement[field]);
      expect(values.every((value) => typeof value === 'string' && value.trim())).toBe(true);
      expect(new Set(values).size).toBe(ACHIEVEMENTS.length);
    }
  });

  test('unlocks achievements from real state and records a timestamp', () => {
    const state = createInitialState();
    state.lifetimeCoins = D(100);
    const target = ACHIEVEMENTS.find(({ condition }) => condition.type === 'lifetime-coins' && D(condition.target).eq(100));
    const unlocked = evaluateAchievements(state, { now: 12_345 });
    expect(unlocked).toContainEqual(target);
    expect(state.achievements[target.id]).toEqual({ unlockedAt: 12_345 });
  });

  test('a Moon costs current coins, deducts its exact price, and can only be bought once', () => {
    const state = createInitialState();
    const moon = getVisibleMoons(state)[0];
    state.coins = D(moon.cost).add(17);
    const first = purchaseMoon(state, moon.id);
    const second = purchaseMoon(state, moon.id);
    expect(first.ok).toBe(true);
    expect(state.coins.eq(17)).toBe(true);
    expect(state.moons).toEqual([moon.id]);
    expect(second).toMatchObject({ ok: false, reason: 'Already collected.' });
  });

  test('lifetime earnings do not buy a Moon and repeated calls cannot farm the catalogue', () => {
    const state = createInitialState();
    const moon = getVisibleMoons(state)[0];
    state.lifetimeCoins = D('1e100');
    expect(purchaseMoon(state, moon.id).ok).toBe(false);
    state.coins = D(moon.cost);
    for (let index = 0; index < 5_000; index += 1) purchaseMoon(state, moon.id);
    expect(state.moons).toHaveLength(1);
    expect(state.stats.moonsPurchased).toBe(1);
  });

  test('sparse imported Moon ownership still reveals the next two unowned entries', () => {
    const state = createInitialState();
    state.moons = [POWER_MOONS[1].id];
    state.lifetimeCoins = D(POWER_MOONS[2].cost);
    expect(getVisibleMoons(state).map(({ id }) => id)).toEqual([POWER_MOONS[0].id, POWER_MOONS[2].id]);
  });

  test('Moon bonuses flow through the same production snapshot used by the UI', () => {
    const state = createInitialState();
    state.producers['frog-capture'] = 1;
    const before = getEconomySnapshot(state).byId['frog-capture'].effectivePerUnit;
    state.moons.push('moon-first-stamp');
    const after = getEconomySnapshot(state).byId['frog-capture'].effectivePerUnit;
    expect(after.eq(before.mul(1.1))).toBe(true);
  });

  test('every tenth collectible is a substantially stronger Multi Moon', () => {
    const multis = POWER_MOONS.filter(({ isMulti }) => isMulti);
    expect(multis.map((moon) => POWER_MOONS.indexOf(moon) + 1)).toEqual([10, 20, 30, 40, 50]);
    for (const moon of multis) {
      expect(moon.effects.some(({ type, multiplier }) => type === 'global-multiplier' && multiplier >= 3)).toBe(true);
    }
    for (const index of [9, 19, 29, 39, 49]) {
      expect(D(POWER_MOONS[index].cost).div(POWER_MOONS[index - 1].cost).gte('1e5')).toBe(true);
    }
  });

  test('the King Boo outcome probability table is complete and normalized', () => {
    expect(BOO_OUTCOMES).toHaveLength(18);
    expect(BOO_PROBABILITY_TOTAL).toBeCloseTo(1, 12);
    expect(new Set(BOO_OUTCOMES.map(({ id }) => id)).size).toBe(18);
  });
});

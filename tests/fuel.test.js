import { describe, expect, test } from 'vitest';
import { D } from '../src/core/numbers.js';
import { getEconomySnapshot, getPriceMultiplier } from '../src/core/economy.js';
import { createInitialState } from '../src/core/state.js';
import { deserializeState, serializeState } from '../src/core/save.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';
import { BUILDING_UPGRADES } from '../src/data/building-upgrades.js';
import { PRODUCERS } from '../src/data/buildings.js';
import { FUEL_MODULES } from '../src/data/fuel-modules.js';
import { POWER_MOONS } from '../src/data/power-moons.js';
import { getFuelProfile, purchaseFuelModule } from '../src/systems/fuel.js';
import { getOfflineCapHours } from '../src/systems/offline.js';

function finishCollections(state) {
  state.achievements = Object.fromEntries(ACHIEVEMENTS.map(({ id }) => [id, { unlockedAt: 1 }]));
  state.upgrades = BUILDING_UPGRADES.map(({ id }) => id);
  state.moons = POWER_MOONS.map(({ id }) => id);
  state.discoveredProducers = PRODUCERS.map(({ id }) => id);
  state.stats.shinesClaimed = 100;
}

describe('Odyssey Fuel', () => {
  test('blends permanent voyage progress into one bounded tank', () => {
    const state = createInitialState();
    const starting = getFuelProfile(state);
    expect(starting.percent).toBeGreaterThan(0);
    expect(starting.percent).toBeLessThan(1);

    finishCollections(state);
    const complete = getFuelProfile(state);
    expect(complete.percent).toBe(100);
    expect(complete.units).toBe(complete.capacity);
    expect(complete.tier.name).toBe('Grand Tour Infinity');
  });

  test('engine modules require fuel and coins, then remain permanent save data', () => {
    const state = createInitialState();
    const first = FUEL_MODULES[0];
    expect(purchaseFuelModule(state, first.id)).toMatchObject({ ok: false });

    finishCollections(state);
    state.coins = D(first.cost);
    expect(purchaseFuelModule(state, first.id)).toMatchObject({ ok: true, module: { id: first.id } });
    expect(state.coins.eq(0)).toBe(true);
    expect(state.stats.fuelModulesPurchased).toBe(1);

    const restored = deserializeState(serializeState(state));
    expect(restored.fuelModules).toEqual([first.id]);
  });

  test('installed parts scale production and specialist bonuses with tank fill', () => {
    const state = createInitialState();
    state.producers['frog-capture'] = 10;
    finishCollections(state);
    const baseline = getEconomySnapshot(state).totalCps;

    state.fuelModules = ['badge-boiler', 'cascade-carburettor', 'moon-condensate-tank'];
    const powered = getEconomySnapshot(state).totalCps;
    expect(powered.gt(baseline)).toBe(true);
    expect(getPriceMultiplier(state, 'frog-capture')).toBeLessThan(1);
    expect(getOfflineCapHours(state)).toBeGreaterThan(8);
  });
});

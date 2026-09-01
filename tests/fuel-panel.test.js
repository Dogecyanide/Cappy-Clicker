import { describe, expect, test } from 'vitest';
import { D } from '../src/core/numbers.js';
import { createInitialState } from '../src/core/state.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';
import { BUILDING_UPGRADES } from '../src/data/building-upgrades.js';
import { PRODUCERS } from '../src/data/buildings.js';
import { FUEL_MODULES } from '../src/data/fuel-modules.js';
import { POWER_MOONS } from '../src/data/power-moons.js';
import { fuelPanelHtml } from '../src/ui/fuel-panel.js';

describe('Odyssey Fuel panel', () => {
  test('shows the permanent blend, every source, and the full engine ladder', () => {
    const html = fuelPanelHtml(createInitialState());
    expect(html).toContain('Odyssey Fuel');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('Passport stamps');
    expect(html).toContain('Multi Moon pressure');
    for (const module of FUEL_MODULES) expect(html).toContain(module.name);
  });

  test('turns a completed tank and purchased hardware into visible current output', () => {
    const state = createInitialState();
    state.achievements = Object.fromEntries(ACHIEVEMENTS.map(({ id }) => [id, { unlockedAt: 1 }]));
    state.upgrades = BUILDING_UPGRADES.map(({ id }) => id);
    state.moons = POWER_MOONS.map(({ id }) => id);
    state.discoveredProducers = PRODUCERS.map(({ id }) => id);
    state.stats.shinesClaimed = 100;
    state.fuelModules = FUEL_MODULES.map(({ id }) => id);
    state.coins = D('1e400');

    const html = fuelPanelHtml(state);
    expect(html).toContain('100.0%');
    expect(html).toContain('Grand Tour Infinity');
    expect(html).toContain('global production');
    expect(html.match(/FITTED/g)).toHaveLength(FUEL_MODULES.length);
  });
});

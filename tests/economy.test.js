import { describe, expect, test } from 'vitest';
import { D, Decimal, format, isFiniteDecimal } from '../src/core/numbers.js';
import {
  getAffordableAmount,
  getBulkCost,
  getEconomySnapshot,
  getProducerCost,
} from '../src/core/economy.js';
import { createInitialState } from '../src/core/state.js';
import { PRODUCERS, PRODUCER_GROWTH } from '../src/data/buildings.js';
import { BUILDING_UPGRADES } from '../src/data/building-upgrades.js';
import { POWER_MOONS } from '../src/data/power-moons.js';
import { purchaseProducer } from '../src/systems/buildings.js';
import { getProducerRateDisplay } from '../src/ui/building-shop.js';

const FROG = 'frog-capture';

describe('canonical economy', () => {
  test('calculates the next producer price from the geometric cost curve', () => {
    expect(getProducerCost(FROG, 0).eq(15)).toBe(true);
    expect(getProducerCost(FROG, 1).eq(18)).toBe(true);
    expect(getProducerCost(FROG, 25).eq(D(15).mul(Decimal.pow(PRODUCER_GROWTH, 25)).ceil())).toBe(true);
  });

  test('calculates bulk prices with one geometric-series formula', () => {
    const expected = D(15)
      .mul(Decimal.pow(PRODUCER_GROWTH, 10).sub(1))
      .div(PRODUCER_GROWTH - 1)
      .ceil();
    expect(getBulkCost(FROG, 0, 10).eq(expected)).toBe(true);
    expect(getBulkCost(FROG, 0, 0).eq(0)).toBe(true);
  });

  test('Buy Max spends no more than the budget and cannot afford one more', () => {
    const state = createInitialState(1_000);
    state.coins = D(10_000);
    const amount = getAffordableAmount(state, FROG);
    const result = purchaseProducer(state, FROG, 'max', { now: 1_000 });
    expect(result.ok).toBe(true);
    expect(result.quantity).toBe(amount);
    expect(state.coins.gte(0)).toBe(true);
    expect(getBulkCost(FROG, amount, 1).gt(state.coins)).toBe(true);
  });

  test('Buy Max stays bounded and finite at extreme values', () => {
    const state = createInitialState();
    state.coins = D('1e100000');
    expect(getAffordableAmount(state, FROG, state.coins, 10_000)).toBe(10_000);
    expect(isFiniteDecimal(getBulkCost(FROG, 0, 10_000))).toBe(true);
  });

  test('temporary surge pricing increases costs while discounts stay capped', () => {
    const state = createInitialState();
    state.activeEffects = [{ type: 'price-multiplier', multiplier: 1.5, expiresAt: 10_000 }];
    expect(getBulkCost(FROG, 0, 1, { priceMultiplier: 1.5 }).eq(23)).toBe(true);
    expect(getBulkCost(FROG, 0, 1, { priceMultiplier: 0.1 }).eq(9)).toBe(true);
    state.coins = D(22);
    expect(getAffordableAmount(state, FROG, state.coins, 100, { now: 5_000 })).toBe(0);
  });

  test('reports base, per-unit, producer-total, total CPS, and contribution together', () => {
    const state = createInitialState();
    state.producers[FROG] = 5;
    const snapshot = getEconomySnapshot(state);
    const frog = snapshot.byId[FROG];
    expect(frog.basePerUnit.eq('0.4')).toBe(true);
    expect(frog.effectivePerUnit.eq('0.4')).toBe(true);
    expect(frog.effectiveTotal.eq(2)).toBe(true);
    expect(snapshot.totalCps.eq(2)).toBe(true);
    expect(frog.contribution).toBeCloseTo(100);
  });

  test('milestone upgrades mix production gains with route-specific discounts', () => {
    const state = createInitialState();
    state.producers[FROG] = 5;
    state.producers['bonneton-tailor'] = 1;
    state.upgrades = [`${FROG}--5`];
    let snapshot = getEconomySnapshot(state);
    expect(snapshot.byId[FROG].localMultiplier.eq(2)).toBe(true);
    expect(snapshot.byId[FROG].effectivePerUnit.eq('0.8')).toBe(true);
    expect(snapshot.byId['bonneton-tailor'].effectivePerUnit.eq('2.4')).toBe(true);

    state.upgrades.push(`${FROG}--15`, `${FROG}--25`);
    snapshot = getEconomySnapshot(state);
    expect(snapshot.byId[FROG].localMultiplier.eq(4)).toBe(true);
    expect(snapshot.byId[FROG].effectivePerUnit.eq('1.6')).toBe(true);
    expect(snapshot.upgradeBonuses.producerDiscounts[FROG]).toBeCloseTo(0.03);
  });

  test('permanent global bonuses add while temporary effects multiply', () => {
    const state = createInitialState();
    state.producers[FROG] = 1;
    state.moons = ['moon-first-stamp', 'moon-pocket-constellation'];
    state.activeEffects = [
      { type: 'production-multiplier', multiplier: 2, expiresAt: 10_000 },
      { type: 'production-multiplier', multiplier: 1.5, expiresAt: 10_000, source: 'second' },
    ];
    const frog = getEconomySnapshot(state, { now: 5_000 }).byId[FROG];
    expect(frog.additiveMultiplier).toBeCloseTo(1.3);
    expect(frog.temporaryMultiplier).toBeCloseTo(3);
    expect(frog.effectivePerUnit.eq(D('0.4').mul(1.3).mul(3))).toBe(true);
  });

  test('Power Moon producer modifiers are included in effective UI rates', () => {
    const state = createInitialState();
    state.producers[FROG] = 5;
    state.moons = ['moon-red-eye'];
    const snapshot = getEconomySnapshot(state);
    expect(snapshot.byId[FROG].producerMultiplier).toBe(2);
    expect(snapshot.byId[FROG].effectivePerUnit.eq('0.8')).toBe(true);
    expect(getProducerRateDisplay(snapshot, FROG)).toEqual({
      each: format(snapshot.byId[FROG].effectivePerUnit),
      total: format(snapshot.byId[FROG].effectiveTotal),
    });
  });

  test('a disabled producer contributes exactly zero', () => {
    const state = createInitialState();
    state.producers[FROG] = 100;
    state.activeEffects = [{ type: 'producer-disabled', producerId: FROG, expiresAt: 10_000 }];
    const frog = getEconomySnapshot(state, { now: 5_000 }).byId[FROG];
    expect(frog.disabled).toBe(true);
    expect(frog.effectivePerUnit.eq(0)).toBe(true);
    expect(frog.effectiveTotal.eq(0)).toBe(true);
  });

  test('late-game production never becomes NaN or Infinity', () => {
    const state = createInitialState();
    for (const producer of PRODUCERS) state.producers[producer.id] = 1_000_000_000;
    state.upgrades = BUILDING_UPGRADES.map(({ id }) => id);
    state.moons = POWER_MOONS.map(({ id }) => id);
    state.activeEffects = [{ type: 'production-multiplier', multiplier: 5, expiresAt: 10_000 }];
    const snapshot = getEconomySnapshot(state, { now: 5_000 });
    expect(isFiniteDecimal(snapshot.totalCps)).toBe(true);
    expect(snapshot.totalCps.gt(0)).toBe(true);
    for (const item of snapshot.producers) {
      expect(isFiniteDecimal(item.effectivePerUnit)).toBe(true);
      expect(isFiniteDecimal(item.effectiveTotal)).toBe(true);
      expect(Number.isFinite(item.contribution)).toBe(true);
    }
  });
});

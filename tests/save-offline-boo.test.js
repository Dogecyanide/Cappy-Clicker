import { afterEach, describe, expect, test, vi } from 'vitest';
import { D, Decimal } from '../src/core/numbers.js';
import { createGameLoop } from '../src/core/game-loop.js';
import { createStore } from '../src/core/store.js';
import { cloneState, createInitialState } from '../src/core/state.js';
import { deserializeState, importSave, serializeState, exportSave } from '../src/core/save.js';
import { getEconomySnapshot } from '../src/core/economy.js';
import { applyOfflineEarnings, calculateOfflineEarnings } from '../src/systems/offline.js';
import {
  addTimedEffect,
  applyCommittedBooSpin,
  forceBooOutcome,
} from '../src/systems/king-boo.js';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('save, offline progress, and King Boo persistence', () => {
  test('serializes and deserializes big-number state without losing Decimal values', () => {
    const state = createInitialState(1_000);
    state.coins = D('1.2345e456');
    state.lifetimeCoins = D('9e999');
    state.producers['frog-capture'] = 25;
    state.upgrades = ['frog-capture--5'];
    const restored = deserializeState(serializeState(state), 2_000);
    expect(restored.coins).toBeInstanceOf(Decimal);
    expect(restored.coins.eq(state.coins)).toBe(true);
    expect(restored.lifetimeCoins.eq(state.lifetimeCoins)).toBe(true);
    expect(restored.producers['frog-capture']).toBe(25);
    expect(restored.upgrades).toEqual(['frog-capture--5']);
  });

  test('round-trips the portable CAPPY2 export format', () => {
    const state = createInitialState();
    state.coins = D(987_654);
    expect(importSave(exportSave(state)).coins.eq(987_654)).toBe(true);
  });

  test('clones state without stripping Decimal arithmetic', () => {
    const state = createInitialState();
    state.coins = D('1e500');
    const cloned = cloneState(state);
    expect(cloned).not.toBe(state);
    expect(cloned.coins).toBeInstanceOf(Decimal);
    expect(cloned.coins.mul(2).gt(state.coins)).toBe(true);
  });

  test('rejects malformed, legacy, negative, and non-finite saves', () => {
    expect(() => deserializeState('{not json')).toThrow('not valid JSON');
    expect(() => deserializeState({ version: 1 })).toThrow('not a Cappy Clicker v2 save');
    expect(() => deserializeState({ version: 2, coins: '-1', lifetimeCoins: '0' })).toThrow('cannot be negative');
    expect(() => deserializeState({ version: 2, coins: 'Infinity', lifetimeCoins: '0' })).toThrow('Invalid coins');
  });

  test('sanitizes malformed nested save data before it reaches the game loop or UI', () => {
    const raw = JSON.parse(serializeState(createInitialState()));
    raw.stats.playDays = null;
    raw.stats.performanceModesUsed = '<img src=x onerror=alert(1)>';
    raw.settings.performance = '<script>bad()</script>';
    raw.activeEffects = [
      { type: '<img src=x>', multiplier: 'NaN', expiresAt: 99_999 },
      { type: 'production-multiplier', multiplier: 'NaN', expiresAt: 99_999 },
    ];
    raw.boo.history = [{ outcomeId: 'royal-jackpot', title: '<img src=x>', tier: 'evil', at: 1 }];
    const restored = deserializeState(raw, 5_000);
    expect(restored.stats.playDays).toEqual(expect.any(Array));
    expect(restored.stats.performanceModesUsed).toEqual(['full']);
    expect(restored.settings.performance).toBe('full');
    expect(restored.activeEffects).toEqual([expect.objectContaining({ type: 'production-multiplier', multiplier: 1 })]);
    expect(restored.boo.history[0]).toMatchObject({ title: 'Royal Flush-ish', tier: 'positive' });
    expect(() => getEconomySnapshot(restored, { now: 5_000 })).not.toThrow();
  });

  test('offline earnings use effective CPS and obey the current cap', () => {
    const then = 1_000;
    const state = createInitialState(then);
    state.lastSaveAt = then;
    state.producers['frog-capture'] = 10;
    const expectedCps = getEconomySnapshot(state, { now: then }).totalCps;
    const report = calculateOfflineEarnings(state, then + 12 * 3600 * 1_000);
    expect(report.capHours).toBe(8);
    expect(report.creditedSeconds).toBe(8 * 3600);
    expect(report.averageCps.toNumber()).toBeCloseTo(expectedCps.toNumber(), 12);
    expect(report.earned.eq(expectedCps.mul(8 * 3600))).toBe(true);
    expect(applyOfflineEarnings(state, report)).toBe(true);
    expect(state.coins.eq(report.earned)).toBe(true);
  });

  test('offline-cap Moons increase the cap but never beyond 24 hours', () => {
    const state = createInitialState(1_000);
    state.lastSaveAt = 1_000;
    state.producers['frog-capture'] = 1;
    state.moons = ['moon-sleeper-car', 'moon-long-weekend'];
    const report = calculateOfflineEarnings(state, 1_000 + 40 * 3600 * 1_000);
    expect(report.capHours).toBe(20);
    expect(report.creditedSeconds).toBe(20 * 3600);
  });

  test('offline production is integrated across timed-effect expiration boundaries', () => {
    const state = createInitialState(1_000);
    state.lastSaveAt = 1_000;
    state.producers['frog-capture'] = 10;
    state.activeEffects = [{ type: 'production-multiplier', multiplier: 0.5, expiresAt: 61_000 }];
    const report = calculateOfflineEarnings(state, 121_000);
    const normal = D('0.4').mul(10);
    expect(report.earned.eq(normal.mul(0.5).mul(60).add(normal.mul(60)))).toBe(true);
    expect(report.averageCps.toNumber()).toBeCloseTo(3, 12);
  });

  test('the game loop expires timed effects and records restored producers', () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    const state = createInitialState(9_000);
    state.lastTickAt = 10_000;
    state.activeEffects = [{ type: 'producer-disabled', producerId: 'frog-capture', expiresAt: 9_999 }];
    const store = createStore(state);
    const onEffectsExpired = vi.fn();
    const loop = createGameLoop(store, { storage: { setItem: vi.fn() }, onEffectsExpired });
    loop.tick();
    expect(state.activeEffects).toEqual([]);
    expect(state.stats.effectsExpired).toBe(1);
    expect(state.stats.producersRestored).toBe(1);
    expect(onEffectsExpired).toHaveBeenCalledOnce();
  });

  test('related timed effects replace or extend rather than multiply-stack', () => {
    const state = createInitialState();
    addTimedEffect(state, { type: 'production-multiplier', multiplier: 0.75, expiresAt: 2_000, source: 'a' });
    addTimedEffect(state, { type: 'production-multiplier', multiplier: 0.5, expiresAt: 5_000, source: 'b' });
    expect(state.activeEffects).toHaveLength(1);
    expect(state.activeEffects[0]).toMatchObject({ multiplier: 0.5, expiresAt: 5_000, source: 'b' });
  });

  test('positive and negative multipliers coexist without extending each other', () => {
    const state = createInitialState();
    addTimedEffect(state, { type: 'production-multiplier', multiplier: 0.5, expiresAt: 2_000, source: 'bad' });
    addTimedEffect(state, { type: 'production-multiplier', multiplier: 2, expiresAt: 5_000, source: 'good' });
    expect(state.activeEffects).toHaveLength(2);
    expect(getEconomySnapshot(state, { now: 1_000 }).byId['frog-capture'].temporaryMultiplier).toBe(1);
  });

  test('repeated producer-disable curses cannot fan out across the roster', () => {
    const state = createInitialState();
    addTimedEffect(state, { type: 'producer-disabled', producerId: 'frog-capture', expiresAt: 2_000, source: 'one' });
    addTimedEffect(state, { type: 'producer-disabled', producerId: 'bonneton-tailor', expiresAt: 5_000, source: 'two' });
    expect(state.activeEffects).toHaveLength(1);
    expect(state.activeEffects[0]).toMatchObject({ producerId: 'frog-capture', expiresAt: 5_000 });
  });

  test('a committed Boo spin survives save/reload and applies exactly once', () => {
    const state = createInitialState(1_000);
    state.coins = D(1_000);
    state.producers['frog-capture'] = 10;
    const spin = forceBooOutcome(state, 'house-always-wins', 2_000);
    const restored = deserializeState(serializeState(state), 2_500);
    expect(restored.boo.committedSpin).toMatchObject({
      outcomeId: 'house-always-wins',
      symbols: ['boo', 'boo', 'boo'],
      loss: spin.loss,
      revealAt: spin.revealAt,
      applied: false,
    });

    const result = applyCommittedBooSpin(restored, spin.revealAt);
    expect(result.outcome.id).toBe('house-always-wins');
    expect(restored.coins.eq(650)).toBe(true);
    expect(restored.activeEffects).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'producer-disabled', producerId: 'frog-capture' }),
      expect.objectContaining({ type: 'purple-curse' }),
    ]));
    expect(getEconomySnapshot(restored, { now: spin.revealAt }).byId['frog-capture'].effectiveTotal.eq(0)).toBe(true);
    expect(applyCommittedBooSpin(restored, spin.revealAt + 1)).toBeNull();
    expect(restored.coins.eq(650)).toBe(true);
  });
});

import { describe, expect, test } from 'vitest';
import { createAudio } from '../src/core/audio.js';
import { createInitialState, randomShineDelay } from '../src/core/state.js';
import { D, format, shortScaleName } from '../src/core/numbers.js';
import { deserializeState, serializeState } from '../src/core/save.js';
import { COSMETICS } from '../src/data/cosmetics.js';
import { purchaseCosmetic, equipCosmetic } from '../src/systems/cosmetics.js';
import { claimShine, forceShineOutcome, spawnShine } from '../src/systems/shines.js';

describe('Grand Tour expansion systems', () => {
  test('names large numbers through centillion before falling back to scientific notation', () => {
    expect(shortScaleName(21)).toBe('vigintillion');
    expect(shortScaleName(22)).toBe('unvigintillion');
    expect(shortScaleName(101)).toBe('centillion');
    expect(format('1e63')).toBe('1.000 vigintillion');
    expect(format('1e66')).toBe('1.000 unvigintillion');
    expect(format('1e303')).toBe('1.000 centillion');
    expect(format('1e306')).toMatch(/e306$/);
  });

  test('critical throws remain deliberately silent', () => {
    const audio = createAudio();
    expect(() => audio.click(true)).not.toThrow();
  });

  test('rare Shine scheduling stays between nine and sixteen active minutes', () => {
    expect(randomShineDelay(() => 0)).toBe(9 * 60 * 1000);
    expect(randomShineDelay(() => 1)).toBe(16 * 60 * 1000);
  });

  test('normal Shines pay out, track the outcome, and schedule the next appearance', () => {
    const state = createInitialState(1_000);
    state.producers['frog-capture'] = 10;
    expect(spawnShine(state, { now: 2_000, random: () => 1 })).toBe(true);
    const result = claimShine(state, { now: 3_000, random: () => 0 });
    expect(result).toMatchObject({ ok: true, kind: 'normal' });
    expect(D(result.amount).gte(100)).toBe(true);
    expect(state.stats.shinesClaimed).toBe(1);
    expect(state.stats.shineOutcomeCounts['coin-sunshower']).toBe(1);
    expect(state.shine.nextSpawnAt).toBeGreaterThan(3_000);
  });

  test('a corrupted Shine is visibly riskier but cannot make coins negative', () => {
    const state = createInitialState(1_000);
    state.coins = D(1_000);
    expect(spawnShine(state, { now: 2_000, random: () => 0 })).toBe(true);
    const result = claimShine(state, { now: 3_000, random: () => 0 });
    expect(result).toMatchObject({ ok: true, kind: 'corrupted', loss: '120', receiptExpiresAt: 8_000 });
    expect(state.coins.eq(880)).toBe(true);
    expect(state.stats.corruptedShines).toBe(1);
  });

  test('the Developer Lab can force every exact Shine result deterministically', () => {
    const state = createInitialState(1_000);
    state.coins = D(1_000);
    const result = forceShineOutcome(state, 'gloom-toll', { now: 2_000, random: () => 0.5 });
    expect(result).toMatchObject({ ok: true, kind: 'corrupted', outcome: { id: 'gloom-toll' }, loss: '120' });
    expect(state.stats.shinesSeen).toBe(1);
    expect(state.stats.shinesClaimed).toBe(1);
    expect(state.stats.shineOutcomeCounts['gloom-toll']).toBe(1);
  });

  test('Gloom Shines pair severe penalties with a four-percent Black Sun jackpot', () => {
    const state = createInitialState(1_000);
    state.coins = D(1_000);
    const penalty = forceShineOutcome(state, 'eclipse-shift', { now: 2_000 });
    expect(penalty).toMatchObject({ beneficial: false, receiptExpiresAt: 92_000 });
    expect(state.activeEffects).toContainEqual(expect.objectContaining({ multiplier: 0.15, expiresAt: 92_000 }));

    const jackpot = forceShineOutcome(state, 'black-sun-jackpot', { now: 3_000 });
    expect(jackpot).toMatchObject({ kind: 'corrupted', beneficial: true, outcome: { title: 'Black Sun Jackpot' }, receiptExpiresAt: 8_000 });
    expect(D(jackpot.amount).gte(220)).toBe(true);
  });

  test('expanded collection completions do not inherit obsolete save badges', () => {
    const raw = JSON.parse(serializeState(createInitialState(1_000)));
    raw.achievements['cosmetics-owned-21'] = { unlockedAt: 1_000 };
    raw.achievements['cosmetics-backdrop-7'] = { unlockedAt: 1_000 };
    raw.achievements['shine-outcome-grand-shine-jackpot'] = { unlockedAt: 1_000 };
    raw.stats.shineOutcomeCounts['grand-shine-jackpot'] = 1;

    const restored = deserializeState(raw, 2_000);
    expect(restored.achievements['cosmetics-owned-21']).toBeUndefined();
    expect(restored.achievements['cosmetics-backdrop-7']).toBeUndefined();
    expect(restored.achievements['shine-outcome-grand-shine-jackpot']).toBeUndefined();
    expect(restored.stats.shineOutcomeCounts['grand-shine-jackpot']).toBeUndefined();
  });

  test('cosmetics cost current coins, remain owned, and equip by category', () => {
    const state = createInitialState();
    const cosmetic = COSMETICS.find(({ id }) => id === 'cappy-gold');
    state.coins = D(cosmetic.cost);
    expect(purchaseCosmetic(state, cosmetic.id).ok).toBe(true);
    expect(state.coins.eq(0)).toBe(true);
    expect(equipCosmetic(state, cosmetic.id).ok).toBe(true);
    expect(state.cosmetics.equipped.cappy).toBe(cosmetic.id);
  });

  test('new collection and integrity fields survive save round trips', () => {
    const state = createInitialState(1_000);
    state.cosmetics.owned.push('cappy-gold');
    state.cosmetics.equipped.cappy = 'cappy-gold';
    state.integrity.imported = true;
    state.stats.shinesClaimed = 4;
    const restored = deserializeState(serializeState(state), 2_000);
    expect(restored.cosmetics.equipped.cappy).toBe('cappy-gold');
    expect(restored.integrity.imported).toBe(true);
    expect(restored.stats.shinesClaimed).toBe(4);
  });
});

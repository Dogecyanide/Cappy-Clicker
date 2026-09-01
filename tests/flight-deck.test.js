import { describe, expect, test } from 'vitest';
import { describeShineReceipt } from '../src/ui/flight-deck.js';

describe('pinned flight-deck readout', () => {
  test('states the exact coin payout for a normal Shine', () => {
    const receipt = describeShineReceipt({
      kind: 'normal',
      amount: '123456',
      loss: '0',
      outcome: { title: 'Coin Sunshower', description: 'Coins arrive.', effect: { type: 'coins-cps', seconds: 120 } },
    });
    expect(receipt).toMatchObject({ tone: 'shine', title: 'Coin Sunshower' });
    expect(receipt.reward).toBe('+123 thousand Kingdom Coins');
  });

  test('states the exact penalty for a Gloom Shine', () => {
    const receipt = describeShineReceipt({
      kind: 'corrupted',
      amount: '0',
      loss: '300',
      outcome: { title: 'Gloom Toll', description: 'A fee.', effect: { type: 'coin-loss', fraction: 0.03 } },
    });
    expect(receipt).toMatchObject({ tone: 'gloom', title: 'Gloom Toll' });
    expect(receipt.reward).toBe('−300 Kingdom Coins');
  });

  test('does not mislabel a rounded-to-zero Gloom toll as an effect', () => {
    const receipt = describeShineReceipt({
      kind: 'corrupted',
      amount: '0',
      loss: '0',
      prevented: '1',
      outcome: { title: 'Gloom Toll', description: 'The filter catches it.', effect: { type: 'coin-loss', fraction: 0.03 } },
    });
    expect(receipt.reward).toBe('No coins stolen · 1 protected');
  });

  test('states the strength and duration of timed effects', () => {
    const receipt = describeShineReceipt({
      kind: 'normal',
      amount: '0',
      loss: '0',
      outcome: { title: 'Solar Overtime', description: 'Routes brighten.', effect: { type: 'production-multiplier', multiplier: 3, duration: 45 } },
    });
    expect(receipt.reward).toBe('Production ×3 for 45s');
  });
});

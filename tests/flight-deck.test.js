import { describe, expect, test } from 'vitest';
import { createInitialState } from '../src/core/state.js';
import { createFlightDeck, describeShineReceipt, getShineReceiptDeadline } from '../src/ui/flight-deck.js';
import { createShineWidget, randomShinePosition } from '../src/ui/shine-widget.js';

describe('pinned flight-deck readout', () => {
  test('states the exact coin payout for a normal Shine', () => {
    const receipt = describeShineReceipt({
      kind: 'normal',
      amount: '123456',
      loss: '0',
      outcome: { title: 'Coin Sunshower', description: 'Coins arrive.', effect: { type: 'coins-cps', seconds: 120 } },
    });
    expect(receipt).toMatchObject({ tone: 'shine', title: 'Coin Sunshower' });
    expect(receipt.reward).toBe('+123.456 thousand Kingdom Coins');
  });

  test('states the exact penalty for a Gloom Shine', () => {
    const receipt = describeShineReceipt({
      kind: 'corrupted',
      amount: '0',
      loss: '300',
      outcome: { title: 'Gloom Toll', description: 'A fee.', effect: { type: 'coin-loss', fraction: 0.03 } },
    });
    expect(receipt).toMatchObject({ tone: 'gloom', title: 'Gloom Toll' });
    expect(receipt.reward).toBe('−300.000 Kingdom Coins');
  });

  test('does not mislabel a rounded-to-zero Gloom toll as an effect', () => {
    const receipt = describeShineReceipt({
      kind: 'corrupted',
      amount: '0',
      loss: '0',
      prevented: '1',
      outcome: { title: 'Gloom Toll', description: 'The filter catches it.', effect: { type: 'coin-loss', fraction: 0.03 } },
    });
    expect(receipt.reward).toBe('No coins stolen · 1.000 protected');
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

  test('keeps immediate receipts for five seconds and timed receipts until the effect deadline', () => {
    expect(getShineReceiptDeadline({ claimedAt: 1_000, outcome: { effect: { type: 'coins-cps' } } }, 1_000)).toBe(6_000);
    expect(getShineReceiptDeadline({ claimedAt: 1_000, receiptExpiresAt: 46_000, outcome: { effect: { duration: 45 } } }, 1_000)).toBe(46_000);
  });

  test('hides the receipt as soon as its reward deadline passes', () => {
    let now = 1_000;
    const fixture = flightDeckFixture();
    const deck = createFlightDeck(fixture.element, { state: createInitialState(1_000) }, { now: () => now });
    deck.showShineReceipt({
      kind: 'normal', beneficial: true, claimedAt: 1_000, receiptExpiresAt: 6_000,
      amount: '100', loss: '0', outcome: { title: 'Coin Sunshower', description: 'Coins arrive.', effect: { type: 'coins-cps' } },
    });
    expect(fixture.receipt.hidden).toBe(false);
    now = 5_999;
    deck.update(createInitialState(), fuelProfile());
    expect(fixture.receipt.hidden).toBe(false);
    now = 6_000;
    deck.update(createInitialState(), fuelProfile());
    expect(fixture.receipt.hidden).toBe(true);
  });

  test('styles the rare Gloom jackpot as a tempting miracle', () => {
    const receipt = describeShineReceipt({
      kind: 'corrupted', beneficial: true, amount: '1000', loss: '0',
      outcome: { title: 'Black Sun Jackpot', description: 'The forgery pays.', effect: { type: 'grand-coins' } },
    });
    expect(receipt).toMatchObject({ tone: 'gloom-prize', kicker: 'Gloom Shine miracle', reward: '+1.000 thousand Kingdom Coins' });
  });

  test('chooses bounded, independently randomized screen coordinates for each Shine', () => {
    const rolls = [0, 1, 0.25, 0.75];
    const random = () => rolls.shift();
    expect(randomShinePosition(random)).toEqual({ leftVw: 3, topVh: 93 });
    expect(randomShinePosition(random)).toEqual({ leftVw: 25.5, topVh: 70.5 });
  });

  test('moves every new Shine spawn and advertises the Gloom jackpot odds', () => {
    const properties = {};
    const timer = { textContent: '' };
    const element = {
      innerHTML: '',
      style: { setProperty: (name, value) => { properties[name] = value; } },
      classList: { toggle() {} },
      addEventListener() {}, setAttribute() {},
      querySelector: () => timer,
    };
    const rolls = [0.1, 0.2, 0.7, 0.8];
    const widget = createShineWidget(element, {}, { random: () => rolls.shift() });
    const state = createInitialState(1_000);
    state.shine = { kind: 'corrupted', spawnedAt: 2_000, visibleUntil: Date.now() + 10_000 };
    widget.update(state);
    const first = { ...properties };
    expect(element.innerHTML).toContain('GLOOM? · 4% JACKPOT');
    state.shine.spawnedAt = 3_000;
    widget.update(state);
    expect(properties).not.toEqual(first);
  });
});

function flightDeckFixture() {
  const node = () => ({
    textContent: '', hidden: false, dataset: {}, style: { height: '' },
    setAttribute() {},
    classList: { add() {}, remove() {} },
    offsetWidth: 1,
  });
  const receipt = node();
  const nodes = {
    '[data-fuel-depth-liquid]': node(), '[data-fuel-depth]': node(), '[data-fuel-percent]': node(),
    '[data-fuel-units]': node(), '[data-fuel-grade]': node(), '[data-fuel-next]': node(),
    '[data-shine-receipt]': receipt, '[data-shine-receipt-icon]': node(), '[data-shine-receipt-kicker]': node(),
    '[data-shine-receipt-title]': node(), '[data-shine-receipt-reward]': node(), '[data-shine-receipt-description]': node(),
  };
  return { receipt, element: { querySelector: (selector) => nodes[selector], addEventListener() {} } };
}

function fuelProfile() {
  return { percent: 10, units: 10, capacity: 100, tier: { name: 'Test Fuel' }, nextTier: { name: 'Next Fuel', at: 20 } };
}

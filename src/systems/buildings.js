import { D } from '../core/numbers.js';
import { getAffordableAmount, getBulkCost, getOwned, getPriceMultiplier } from '../core/economy.js';
import { PRODUCER_BY_ID, PRODUCERS } from '../data/buildings.js';

export function purchaseProducer(state, producerId, requested = 1, context = {}) {
  const producer = PRODUCER_BY_ID[producerId];
  if (!producer) return { ok: false, reason: 'Unknown producer.' };
  if (!state.discoveredProducers.includes(producerId)) return { ok: false, reason: 'That destination is not discovered yet.' };
  const owned = getOwned(state, producerId);
  const priceMultiplier = getPriceMultiplier(state, producerId, context);
  const quantity = requested === 'max'
    ? getAffordableAmount(state, producerId, state.coins, 1_000_000, context)
    : Math.max(0, Math.floor(Number(requested)));
  if (quantity < 1) return { ok: false, reason: 'Not enough coins.' };
  const cost = getBulkCost(producerId, owned, quantity, { priceMultiplier });
  if (D(state.coins).lt(cost)) return { ok: false, reason: 'Not enough coins.' };

  state.coins = D(state.coins).sub(cost).max(0);
  state.producers[producerId] = owned + quantity;
  state.stats.producersPurchased += quantity;
  state.stats.largestBulkPurchase = Math.max(state.stats.largestBulkPurchase ?? 0, quantity);
  if (requested === 'max') state.stats.buyMaxUses = (state.stats.buyMaxUses ?? 0) + 1;
  if (state.coins.eq(0)) state.stats.zeroAfterPurchase = (state.stats.zeroAfterPurchase ?? 0) + 1;
  if (state.coins.lt(1)) state.stats.tinyLeftover = (state.stats.tinyLeftover ?? 0) + 1;
  return { ok: true, producer, quantity, cost, owned: owned + quantity };
}

export function updateProducerDiscovery(state) {
  const discovered = new Set(state.discoveredProducers);
  for (let index = 0; index < PRODUCERS.length; index += 1) {
    const producer = PRODUCERS[index];
    if (index < 2 || D(state.lifetimeCoins).gte(D(producer.baseCost).mul(0.25))) discovered.add(producer.id);
  }
  const before = state.discoveredProducers.length;
  state.discoveredProducers = PRODUCERS.filter(({ id }) => discovered.has(id)).map(({ id }) => id);
  return state.discoveredProducers.length > before
    ? state.discoveredProducers.slice(before)
    : [];
}

export function getProducerVisibility(state) {
  const discovered = new Set(state.discoveredProducers);
  const cards = [];
  let teaserAdded = false;
  for (const producer of PRODUCERS) {
    if (discovered.has(producer.id)) {
      cards.push({ producer, discovered: true, teaser: false });
      continue;
    }
    if (!teaserAdded && D(state.lifetimeCoins).gte(D(producer.baseCost).mul(0.08))) {
      cards.push({ producer, discovered: false, teaser: true });
      teaserAdded = true;
    }
    break;
  }
  return cards;
}


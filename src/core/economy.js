import { D, Decimal, sum } from './numbers.js';
import { PRODUCERS, PRODUCER_BY_ID, PRODUCER_GROWTH } from '../data/buildings.js';
import { POWER_MOON_BY_ID } from '../data/power-moons.js';

const nowFrom = (context) => context?.now ?? Date.now();

export function getOwned(state, producerId) {
  return Math.max(0, Math.floor(Number(state.producers[producerId] ?? 0)));
}

export function getProducerCost(producerId, owned = 0) {
  const producer = PRODUCER_BY_ID[producerId];
  if (!producer) return D(0);
  return D(producer.baseCost).mul(Decimal.pow(PRODUCER_GROWTH, Math.max(0, owned))).ceil();
}

export function getBulkCost(producerId, owned = 0, quantity = 1, modifiers = {}) {
  const producer = PRODUCER_BY_ID[producerId];
  if (!producer || quantity <= 0) return D(0);
  const count = Math.max(0, Math.floor(quantity));
  const first = D(producer.baseCost).mul(Decimal.pow(PRODUCER_GROWTH, Math.max(0, owned)));
  const geometric = Decimal.pow(PRODUCER_GROWTH, count).sub(1).div(PRODUCER_GROWTH - 1);
  const priceMultiplier = Math.max(0.75, Math.min(3, Number(modifiers.priceMultiplier ?? 1)));
  return first.mul(geometric).mul(priceMultiplier).ceil();
}

export function getPriceMultiplier(state, producerId, context = {}) {
  const now = nowFrom(context);
  let multiplier = 1;
  for (const effect of activeEffects(state, now)) {
    if (effect.type === 'price-multiplier' && (!effect.producerId || effect.producerId === producerId)) {
      multiplier *= Number(effect.multiplier ?? 1);
    }
  }
  const moonDiscount = getMoonBonuses(state).priceDiscount;
  return Math.max(0.75, multiplier * (1 - moonDiscount));
}

export function getAffordableAmount(state, producerId, budget = state.coins, cap = 1_000_000, context = {}) {
  const producer = PRODUCER_BY_ID[producerId];
  if (!producer) return 0;
  const owned = getOwned(state, producerId);
  const available = D(budget);
  const priceMultiplier = getPriceMultiplier(state, producerId, context);
  if (available.lt(getBulkCost(producerId, owned, 1, { priceMultiplier }))) return 0;

  const first = D(producer.baseCost).mul(Decimal.pow(PRODUCER_GROWTH, owned)).mul(priceMultiplier);
  const estimated = available.mul(PRODUCER_GROWTH - 1).div(first).add(1).log(PRODUCER_GROWTH);
  let quantity = Math.max(1, Math.min(cap, Math.floor(estimated)));
  while (quantity < cap && getBulkCost(producerId, owned, quantity + 1, { priceMultiplier }).lte(available)) quantity += 1;
  while (quantity > 0 && getBulkCost(producerId, owned, quantity, { priceMultiplier }).gt(available)) quantity -= 1;
  return quantity;
}

export function activeEffects(state, now = Date.now()) {
  return (state.activeEffects ?? []).filter((effect) => Number(effect.expiresAt) > now);
}

export function getMoonBonuses(state) {
  const bonuses = {
    globalAdditive: 0,
    clickMultiplier: 1,
    offlineHours: 8,
    priceDiscount: 0,
    groupMultipliers: {},
    eventLuck: 0,
  };
  for (const moonId of state.moons ?? []) {
    const effect = POWER_MOON_BY_ID[moonId]?.effect;
    if (!effect) continue;
    if (effect.type === 'global-additive') bonuses.globalAdditive += effect.amount;
    if (effect.type === 'click-multiplier') bonuses.clickMultiplier *= effect.multiplier;
    if (effect.type === 'offline-hours') bonuses.offlineHours += effect.hours;
    if (effect.type === 'price-discount') bonuses.priceDiscount += effect.amount;
    if (effect.type === 'producer-group') {
      for (const producerId of effect.producerIds) bonuses.groupMultipliers[producerId] = (bonuses.groupMultipliers[producerId] ?? 1) * effect.multiplier;
    }
    if (effect.type === 'event-luck') bonuses.eventLuck += effect.amount;
  }
  bonuses.priceDiscount = Math.min(0.2, bonuses.priceDiscount);
  return bonuses;
}

export function getProducerBreakdown(state, producerId, context = {}) {
  const producer = PRODUCER_BY_ID[producerId];
  if (!producer) return null;
  const now = nowFrom(context);
  const owned = getOwned(state, producerId);
  const upgradeCount = (state.upgrades ?? []).filter((id) => id.startsWith(`${producerId}--`)).length;
  const localMultiplier = Decimal.pow(2, upgradeCount);
  const moonBonuses = getMoonBonuses(state);
  const achievementAdditive = Math.min(0.1, Object.keys(state.achievements ?? {}).length * 0.0004);
  let globalAdditive = achievementAdditive + moonBonuses.globalAdditive;
  let temporaryMultiplier = 1;
  let producerMultiplier = moonBonuses.groupMultipliers[producerId] ?? 1;
  let disabled = false;

  for (const effect of activeEffects(state, now)) {
    if (effect.type === 'global-additive') globalAdditive += Number(effect.amount ?? 0);
    if (effect.type === 'production-multiplier') temporaryMultiplier *= Number(effect.multiplier ?? 1);
    if (effect.type === 'producer-multiplier' && effect.producerId === producerId) producerMultiplier *= Number(effect.multiplier ?? 1);
    if (effect.type === 'producer-disabled' && effect.producerId === producerId) disabled = true;
  }

  const additiveMultiplier = Math.max(0, 1 + globalAdditive);
  const basePerUnit = D(producer.baseCps);
  const effectivePerUnit = disabled
    ? D(0)
    : basePerUnit.mul(localMultiplier).mul(additiveMultiplier).mul(producerMultiplier).mul(Math.max(0, temporaryMultiplier));
  const effectiveTotal = effectivePerUnit.mul(owned);

  return {
    producer,
    owned,
    basePerUnit,
    upgradeCount,
    localMultiplier,
    globalAdditive,
    additiveMultiplier,
    producerMultiplier,
    temporaryMultiplier,
    disabled,
    effectivePerUnit,
    effectiveTotal,
    contribution: 0,
  };
}

export function getEconomySnapshot(state, context = {}) {
  const producers = PRODUCERS.map(({ id }) => getProducerBreakdown(state, id, context));
  const totalCps = sum(producers.map(({ effectiveTotal }) => effectiveTotal));
  for (const breakdown of producers) {
    breakdown.contribution = totalCps.gt(0) ? breakdown.effectiveTotal.div(totalCps).mul(100).toNumber() : 0;
  }
  return { totalCps, producers, byId: Object.fromEntries(producers.map((item) => [item.producer.id, item])) };
}

export function getClickValue(state, context = {}) {
  const moonBonuses = getMoonBonuses(state);
  let multiplier = moonBonuses.clickMultiplier;
  for (const effect of activeEffects(state, nowFrom(context))) {
    if (effect.type === 'click-multiplier') multiplier *= Number(effect.multiplier ?? 1);
  }
  const productionAssist = getEconomySnapshot(state, context).totalCps.mul(0.01);
  return D(1).add(productionAssist).mul(multiplier);
}

export function strongestProducerId(state, context = {}) {
  const snapshot = getEconomySnapshot(state, context);
  return [...snapshot.producers].sort((a, b) => b.effectiveTotal.cmp(a.effectiveTotal))[0]?.producer.id ?? PRODUCERS[0].id;
}

import { D, Decimal, sum } from './numbers.js';
import { PRODUCERS, PRODUCER_BY_ID, PRODUCER_GROWTH_SEGMENTS } from '../data/buildings.js';
import { BUILDING_UPGRADE_BY_ID } from '../data/building-upgrades.js';
import { POWER_MOON_BY_ID } from '../data/power-moons.js';
import { getFuelProfile } from '../systems/fuel.js';

const nowFrom = (context) => context?.now ?? Date.now();

export function getOwned(state, producerId) {
  return Math.max(0, Math.floor(Number(state.producers[producerId] ?? 0)));
}

export function getProducerCost(producerId, owned = 0) {
  const producer = PRODUCER_BY_ID[producerId];
  if (!producer) return D(0);
  return D(producer.baseCost).mul(producerGrowthFactor(Math.max(0, owned))).ceil();
}

export function getBulkCost(producerId, owned = 0, quantity = 1, modifiers = {}) {
  const producer = PRODUCER_BY_ID[producerId];
  if (!producer || quantity <= 0) return D(0);
  const count = Math.max(0, Math.floor(quantity));
  const priceMultiplier = Math.max(0.55, Math.min(3, Number(modifiers.priceMultiplier ?? 1)));
  return producerBulkGrowthFactor(Math.max(0, owned), count)
    .mul(producer.baseCost)
    .mul(priceMultiplier)
    .ceil();
}

function producerGrowthFactor(owned) {
  let cursor = 0;
  let factor = D(1);
  for (const segment of PRODUCER_GROWTH_SEGMENTS) {
    if (owned <= cursor) break;
    const length = Math.min(owned, segment.until) - cursor;
    if (length > 0) factor = factor.mul(Decimal.pow(segment.growth, length));
    cursor += length;
  }
  return factor;
}

function producerBulkGrowthFactor(owned, quantity) {
  let cursor = owned;
  let remaining = quantity;
  let total = D(0);
  while (remaining > 0) {
    const segment = PRODUCER_GROWTH_SEGMENTS.find(({ until }) => cursor < until) ?? PRODUCER_GROWTH_SEGMENTS.at(-1);
    const length = Math.min(remaining, Number.isFinite(segment.until) ? segment.until - cursor : remaining);
    const first = producerGrowthFactor(cursor);
    const geometric = Decimal.pow(segment.growth, length).sub(1).div(segment.growth - 1);
    total = total.add(first.mul(geometric));
    cursor += length;
    remaining -= length;
  }
  return total;
}

export function activeEffects(state, now = Date.now()) {
  return (state.activeEffects ?? []).filter((effect) => Number(effect.expiresAt) > now);
}

export function getMoonBonuses(state) {
  const bonuses = {
    globalAdditive: 0,
    globalMultiplier: 1,
    flatClickMultiplier: 1,
    offlineHours: 8,
    priceDiscount: 0,
    groupMultipliers: {},
    eventLuck: 0,
    shinePayout: 1,
    fusionMultiplier: 1,
  };
  for (const moonId of state.moons ?? []) {
    const moon = POWER_MOON_BY_ID[moonId];
    for (const effect of moon?.effects ?? (moon?.effect ? [moon.effect] : [])) {
      if (effect.type === 'global-additive') bonuses.globalAdditive += effect.amount;
      if (effect.type === 'global-multiplier') bonuses.globalMultiplier *= effect.multiplier;
      if (effect.type === 'flat-click-multiplier') bonuses.flatClickMultiplier *= effect.multiplier;
      if (effect.type === 'click-multiplier') bonuses.flatClickMultiplier *= effect.multiplier;
      if (effect.type === 'offline-hours') bonuses.offlineHours += effect.hours;
      if (effect.type === 'price-discount') bonuses.priceDiscount += effect.amount;
      if (effect.type === 'producer-group') {
        for (const producerId of effect.producerIds) {
          bonuses.groupMultipliers[producerId] = (bonuses.groupMultipliers[producerId] ?? 1) * effect.multiplier;
        }
      }
      if (effect.type === 'event-luck') bonuses.eventLuck += effect.amount;
      if (effect.type === 'shine-payout') bonuses.shinePayout *= effect.multiplier;
      if (effect.type === 'fusion-multiplier') bonuses.fusionMultiplier *= effect.multiplier;
    }
  }
  bonuses.priceDiscount = Math.min(0.2, bonuses.priceDiscount);
  bonuses.eventLuck = Math.min(0.1, bonuses.eventLuck);
  return bonuses;
}

export function getUpgradeBonuses(state, moonBonuses = getMoonBonuses(state), fuelBonuses = getFuelProfile(state).bonuses) {
  const bonuses = {
    producerMultipliers: {},
    producerDiscounts: {},
    seriesMultipliers: {},
    fusionMultipliers: {},
    globalAdditive: 0,
    globalPriceDiscount: 0,
    flatClickMultiplier: 1,
    clickAssist: fuelBonuses.clickAssist ?? 0,
    criticalChance: 0.05 + (fuelBonuses.criticalChance ?? 0),
    criticalMultiplier: 5,
    comboWindow: 700,
    offlineHours: 0,
    offlineProductionMultiplier: 1,
    eventLuck: 0,
    shineDuration: fuelBonuses.shineDuration ?? 0,
    shinePayout: 1,
    gloomLossReduction: fuelBonuses.gloomLossReduction ?? 0,
  };
  for (const id of state.upgrades ?? []) {
    const upgrade = BUILDING_UPGRADE_BY_ID[id];
    if (!upgrade) continue;
    for (const effect of upgrade.effects ?? []) {
      if (effect.type === 'producer-multiplier') {
        bonuses.producerMultipliers[effect.producerId] = (bonuses.producerMultipliers[effect.producerId] ?? 1) * effect.multiplier;
      }
      if (effect.type === 'producer-discount') {
        bonuses.producerDiscounts[effect.producerId] = (bonuses.producerDiscounts[effect.producerId] ?? 0) + effect.amount;
      }
      if (effect.type === 'series-multiplier') {
        bonuses.seriesMultipliers[effect.series] = (bonuses.seriesMultipliers[effect.series] ?? 1) * effect.multiplier;
      }
      if (effect.type === 'fusion') {
        const multiplier = 1 + (effect.multiplier - 1) * moonBonuses.fusionMultiplier * fuelBonuses.fusionMultiplier;
        bonuses.fusionMultipliers[effect.producerId] = (bonuses.fusionMultipliers[effect.producerId] ?? 1) * multiplier;
        bonuses.fusionMultipliers[effect.partnerId] = (bonuses.fusionMultipliers[effect.partnerId] ?? 1) * multiplier;
      }
      if (effect.type === 'global-additive') bonuses.globalAdditive += effect.amount;
      if (effect.type === 'fuel-scaled-global-additive') bonuses.globalAdditive += effect.maxAmount * (fuelBonuses.ratio ?? 0);
      if (effect.type === 'global-price-discount') bonuses.globalPriceDiscount += effect.amount;
      if (effect.type === 'flat-click-multiplier') bonuses.flatClickMultiplier *= effect.multiplier;
      if (effect.type === 'fuel-scaled-flat-click-multiplier') bonuses.flatClickMultiplier *= 1 + effect.maxAmount * (fuelBonuses.ratio ?? 0);
      if (effect.type === 'click-assist-add') bonuses.clickAssist += effect.amount;
      if (effect.type === 'fuel-scaled-click-assist') bonuses.clickAssist += effect.maxAmount * (fuelBonuses.ratio ?? 0);
      if (effect.type === 'critical-chance-add') bonuses.criticalChance += effect.amount;
      if (effect.type === 'critical-multiplier-add') bonuses.criticalMultiplier += effect.amount;
      if (effect.type === 'combo-window-add') bonuses.comboWindow += effect.milliseconds;
      if (effect.type === 'offline-hours-add') bonuses.offlineHours += effect.hours;
      if (effect.type === 'offline-production-multiplier') bonuses.offlineProductionMultiplier *= effect.multiplier;
      if (effect.type === 'event-luck-add') bonuses.eventLuck += effect.amount;
      if (effect.type === 'shine-duration-add') bonuses.shineDuration += effect.seconds;
      if (effect.type === 'shine-payout') bonuses.shinePayout *= effect.multiplier;
      if (effect.type === 'gloom-loss-reduction') bonuses.gloomLossReduction += effect.amount;
    }
  }
  bonuses.criticalChance = Math.min(0.08, bonuses.criticalChance);
  bonuses.comboWindow = Math.min(1_200, bonuses.comboWindow);
  bonuses.clickAssist = Math.min(0.01, bonuses.clickAssist);
  bonuses.globalPriceDiscount = Math.min(0.05, bonuses.globalPriceDiscount);
  bonuses.offlineHours = Math.min(3, bonuses.offlineHours);
  bonuses.offlineProductionMultiplier = Math.min(1.5, bonuses.offlineProductionMultiplier);
  bonuses.eventLuck = Math.min(0.1, bonuses.eventLuck);
  bonuses.gloomLossReduction = Math.min(0.65, bonuses.gloomLossReduction);
  return bonuses;
}

export function getPriceMultiplier(state, producerId, context = {}) {
  const now = nowFrom(context);
  let multiplier = 1;
  for (const effect of activeEffects(state, now)) {
    if (effect.type === 'price-multiplier' && (!effect.producerId || effect.producerId === producerId)) {
      multiplier *= Number(effect.multiplier ?? 1);
    }
  }
  const moonBonuses = context.moonBonuses ?? getMoonBonuses(state);
  const fuelProfile = context.fuelProfile ?? getFuelProfile(state);
  const fuelBonuses = context.fuelBonuses ?? fuelProfile.bonuses;
  const upgradeBonuses = context.upgradeBonuses ?? getUpgradeBonuses(state, moonBonuses, fuelBonuses);
  const permanentDiscount = moonBonuses.priceDiscount + fuelBonuses.priceDiscount + upgradeBonuses.globalPriceDiscount + (upgradeBonuses.producerDiscounts[producerId] ?? 0);
  return Math.max(0.55, multiplier * (1 - Math.min(0.45, permanentDiscount)));
}

export function getAffordableAmount(state, producerId, budget = state.coins, cap = 1_000_000, context = {}) {
  const producer = PRODUCER_BY_ID[producerId];
  if (!producer) return 0;
  const owned = getOwned(state, producerId);
  const available = D(budget);
  const priceMultiplier = getPriceMultiplier(state, producerId, context);
  if (available.lt(getBulkCost(producerId, owned, 1, { priceMultiplier }))) return 0;
  let lower = 1;
  let upper = 1;
  while (upper < cap && getBulkCost(producerId, owned, upper, { priceMultiplier }).lte(available)) {
    lower = upper;
    upper = Math.min(cap, upper * 2);
  }
  if (upper === cap && getBulkCost(producerId, owned, upper, { priceMultiplier }).lte(available)) return cap;
  while (lower + 1 < upper) {
    const middle = Math.floor((lower + upper) / 2);
    if (getBulkCost(producerId, owned, middle, { priceMultiplier }).lte(available)) lower = middle;
    else upper = middle;
  }
  return lower;
}

export function getProducerBreakdown(state, producerId, context = {}) {
  const producer = PRODUCER_BY_ID[producerId];
  if (!producer) return null;
  const now = nowFrom(context);
  const owned = getOwned(state, producerId);
  const moonBonuses = context.moonBonuses ?? getMoonBonuses(state);
  const fuelProfile = context.fuelProfile ?? getFuelProfile(state);
  const fuelBonuses = context.fuelBonuses ?? fuelProfile.bonuses;
  const upgradeBonuses = context.upgradeBonuses ?? getUpgradeBonuses(state, moonBonuses, fuelBonuses);
  const upgradeCount = (state.upgrades ?? []).filter((id) => BUILDING_UPGRADE_BY_ID[id]?.producerId === producerId).length;
  const localMultiplier = D(upgradeBonuses.producerMultipliers[producerId] ?? 1);
  const achievementCount = context.achievementCount ?? Object.keys(state.achievements ?? {}).length;
  const achievementAdditive = Math.min(0.14, achievementCount * 0.0002);
  let globalAdditive = achievementAdditive + moonBonuses.globalAdditive + upgradeBonuses.globalAdditive + fuelBonuses.globalAdditive;
  let globalMultiplier = moonBonuses.globalMultiplier * fuelBonuses.globalMultiplier;
  let temporaryMultiplier = 1;
  let producerMultiplier = (moonBonuses.groupMultipliers[producerId] ?? 1)
    * (upgradeBonuses.seriesMultipliers[producer.series] ?? 1)
    * (upgradeBonuses.fusionMultipliers[producerId] ?? 1);
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
    : basePerUnit.mul(localMultiplier).mul(additiveMultiplier).mul(globalMultiplier).mul(producerMultiplier).mul(temporaryMultiplier);
  const effectiveTotal = effectivePerUnit.mul(owned);

  return {
    producer, owned, basePerUnit, upgradeCount, localMultiplier, globalAdditive,
    additiveMultiplier, globalMultiplier, producerMultiplier, temporaryMultiplier,
    disabled, effectivePerUnit, effectiveTotal, contribution: 0,
  };
}

export function getEconomySnapshot(state, context = {}) {
  const moonBonuses = context.moonBonuses ?? getMoonBonuses(state);
  const fuelProfile = context.fuelProfile ?? getFuelProfile(state);
  const fuelBonuses = context.fuelBonuses ?? fuelProfile.bonuses;
  const upgradeBonuses = context.upgradeBonuses ?? getUpgradeBonuses(state, moonBonuses, fuelBonuses);
  const shared = { ...context, moonBonuses, fuelProfile, fuelBonuses, upgradeBonuses, achievementCount: fuelProfile.achievementCount };
  const producers = PRODUCERS.map(({ id }) => getProducerBreakdown(state, id, shared));
  const totalCps = sum(producers.map(({ effectiveTotal }) => effectiveTotal));
  for (const breakdown of producers) {
    breakdown.contribution = totalCps.gt(0) ? breakdown.effectiveTotal.div(totalCps).mul(100).toNumber() : 0;
  }
  return {
    totalCps, producers, moonBonuses, fuelProfile, fuelBonuses, upgradeBonuses,
    byId: Object.fromEntries(producers.map((item) => [item.producer.id, item])),
  };
}

export function getClickProfile(state, context = {}) {
  const snapshot = context.snapshot ?? getEconomySnapshot(state, context);
  const moonBonuses = snapshot.moonBonuses;
  const fuelBonuses = snapshot.fuelBonuses ?? getFuelProfile(state).bonuses;
  const upgradeBonuses = snapshot.upgradeBonuses;
  let flatMultiplier = moonBonuses.flatClickMultiplier * fuelBonuses.flatClickMultiplier * upgradeBonuses.flatClickMultiplier;
  let assistMultiplier = 1;
  for (const effect of activeEffects(state, nowFrom(context))) {
    if (effect.type === 'click-multiplier') {
      flatMultiplier *= Number(effect.multiplier ?? 1);
      assistMultiplier *= Math.min(2, Number(effect.multiplier ?? 1));
    }
  }
  const assistRatio = Math.min(0.015, 0.005 + upgradeBonuses.clickAssist);
  const flat = D(1).mul(flatMultiplier);
  const assist = snapshot.totalCps.mul(assistRatio).mul(assistMultiplier);
  return {
    value: flat.add(assist),
    flat,
    assist,
    assistRatio,
    criticalChance: upgradeBonuses.criticalChance,
    criticalMultiplier: upgradeBonuses.criticalMultiplier,
    comboWindow: upgradeBonuses.comboWindow,
    shineDuration: upgradeBonuses.shineDuration,
    shinePayout: moonBonuses.shinePayout * fuelBonuses.shinePayout * upgradeBonuses.shinePayout,
    gloomLossReduction: upgradeBonuses.gloomLossReduction,
  };
}

export function getClickValue(state, context = {}) {
  return getClickProfile(state, context).value;
}

export function strongestProducerId(state, context = {}) {
  const snapshot = getEconomySnapshot(state, context);
  return [...snapshot.producers].sort((a, b) => b.effectiveTotal.cmp(a.effectiveTotal))[0]?.producer.id ?? PRODUCERS[0].id;
}

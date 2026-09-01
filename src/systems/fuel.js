import { D } from '../core/numbers.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { BUILDING_UPGRADES } from '../data/building-upgrades.js';
import { PRODUCERS } from '../data/buildings.js';
import { FUEL_MODULES, FUEL_MODULE_BY_ID } from '../data/fuel-modules.js';
import { POWER_MOON_BY_ID, POWER_MOONS } from '../data/power-moons.js';

const SHINE_FUEL_CAP = 100;
const FUEL_TIERS = [
  { at: 0, name: 'Starter Fumes', note: 'The gauge is technically awake.' },
  { at: 8, name: 'Cascade Blend', note: 'Damp, energetic, and only a little geological.' },
  { at: 18, name: 'Delfino Super', note: 'Sun-cured fuel with a clean municipal sparkle.' },
  { at: 30, name: 'Metro Premium', note: 'Enough octane to make every taxi look over.' },
  { at: 45, name: 'Luma Reserve', note: 'Bottled starlight with a very patient glow.' },
  { at: 62, name: 'Rainbow Rocket', note: 'Leaves a route line the map cannot erase.' },
  { at: 80, name: 'Comet Grade', note: 'Observatory-approved for irresponsible distances.' },
  { at: 95, name: 'Grand Tour Infinity', note: 'The needle has begun negotiating with space.' },
];

export const FUEL_CAPACITY = ACHIEVEMENTS.length
  + POWER_MOONS.length * 3
  + POWER_MOONS.filter(({ isMulti }) => isMulti).length * 12
  + PRODUCERS.length * 3
  + BUILDING_UPGRADES.length * 0.5
  + SHINE_FUEL_CAP;

export function getFuelProfile(state) {
  const achievements = Math.min(ACHIEVEMENTS.length, Object.keys(state.achievements ?? {}).length);
  const validMoonIds = [...new Set(state.moons ?? [])].filter((id) => POWER_MOON_BY_ID[id]);
  const moons = validMoonIds.length;
  const multiMoons = validMoonIds.filter((id) => POWER_MOON_BY_ID[id]?.isMulti).length;
  const routes = Math.min(PRODUCERS.length, new Set(state.discoveredProducers ?? []).size);
  const upgrades = Math.min(BUILDING_UPGRADES.length, new Set(state.upgrades ?? []).size);
  const shines = Math.min(SHINE_FUEL_CAP, Math.max(0, Number(state.stats?.shinesClaimed ?? 0)));
  const components = [
    { id: 'badges', label: 'Passport stamps', icon: '★', amount: achievements, units: achievements, maxUnits: ACHIEVEMENTS.length },
    { id: 'moons', label: 'Moon condensate', icon: '☾', amount: moons, units: moons * 3, maxUnits: POWER_MOONS.length * 3 },
    { id: 'multi', label: 'Multi Moon pressure', icon: '☽', amount: multiMoons, units: multiMoons * 12, maxUnits: POWER_MOONS.filter(({ isMulti }) => isMulti).length * 12 },
    { id: 'routes', label: 'Route samples', icon: '⌖', amount: routes, units: routes * 3, maxUnits: PRODUCERS.length * 3 },
    { id: 'upgrades', label: 'Workshop filings', icon: '⚙', amount: upgrades, units: upgrades * 0.5, maxUnits: BUILDING_UPGRADES.length * 0.5 },
    { id: 'shines', label: 'Shine residue', icon: '☀', amount: shines, units: shines, maxUnits: SHINE_FUEL_CAP },
  ];
  const units = components.reduce((total, component) => total + component.units, 0);
  const ratio = Math.max(0, Math.min(1, units / FUEL_CAPACITY));
  const percent = ratio * 100;
  const tier = [...FUEL_TIERS].reverse().find(({ at }) => percent >= at) ?? FUEL_TIERS[0];
  const nextTier = FUEL_TIERS.find(({ at }) => at > percent) ?? null;
  const bonuses = {
    globalAdditive: 0,
    globalMultiplier: 1,
    flatClickMultiplier: 1,
    offlineHours: 0,
    priceDiscount: 0,
    fusionMultiplier: 1,
    shinePayout: 1,
  };
  const installed = [];
  for (const id of state.fuelModules ?? []) {
    const module = FUEL_MODULE_BY_ID[id];
    if (!module) continue;
    installed.push(module);
    for (const effect of module.effects) applyFuelEffect(bonuses, effect, ratio);
  }
  bonuses.priceDiscount = Math.min(0.05, bonuses.priceDiscount);
  bonuses.offlineHours = Math.min(4, bonuses.offlineHours);
  return { units, capacity: FUEL_CAPACITY, ratio, percent, tier, nextTier, components, bonuses, installed, achievementCount: achievements };
}

function applyFuelEffect(bonuses, effect, ratio) {
  const scaled = Number(effect.maxAmount ?? 0) * ratio;
  if (effect.type === 'global-additive') bonuses.globalAdditive += scaled;
  if (effect.type === 'global-multiplier') bonuses.globalMultiplier *= 1 + scaled;
  if (effect.type === 'flat-click-multiplier') bonuses.flatClickMultiplier *= 1 + scaled;
  if (effect.type === 'offline-hours') bonuses.offlineHours += scaled;
  if (effect.type === 'price-discount') bonuses.priceDiscount += scaled;
  if (effect.type === 'fusion-multiplier') bonuses.fusionMultiplier *= 1 + scaled;
  if (effect.type === 'shine-payout') bonuses.shinePayout *= 1 + scaled;
}

export function getFuelModuleStatus(state, module, profile = getFuelProfile(state)) {
  if ((state.fuelModules ?? []).includes(module.id)) return 'installed';
  return profile.percent >= module.unlockPercent ? 'available' : 'locked';
}

export function purchaseFuelModule(state, moduleId) {
  const module = FUEL_MODULE_BY_ID[moduleId];
  if (!module) return { ok: false, reason: 'Unknown Odyssey engine module.' };
  if ((state.fuelModules ?? []).includes(moduleId)) return { ok: false, reason: 'That engine module is already installed.' };
  const profile = getFuelProfile(state);
  if (profile.percent < module.unlockPercent) return { ok: false, reason: `The tank must reach ${module.unlockPercent}% first.` };
  if (D(state.coins).lt(module.cost)) return { ok: false, reason: 'Not enough coins for this engine module.' };
  state.coins = D(state.coins).sub(module.cost);
  state.fuelModules ??= [];
  state.fuelModules.push(module.id);
  state.stats.fuelModulesPurchased = Number(state.stats.fuelModulesPurchased ?? 0) + 1;
  return { ok: true, module, cost: module.cost, profile: getFuelProfile(state) };
}

export function getNextFuelModule(state) {
  return FUEL_MODULES.find(({ id }) => !(state.fuelModules ?? []).includes(id)) ?? null;
}

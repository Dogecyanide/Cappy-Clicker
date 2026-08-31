import { D } from '../core/numbers.js';
import { BUILDING_UPGRADES, BUILDING_UPGRADE_BY_ID, MILESTONES } from '../data/building-upgrades.js';

export function getAvailableUpgrades(state) {
  const purchased = new Set(state.upgrades);
  return BUILDING_UPGRADES.filter((upgrade) => {
    if (purchased.has(upgrade.id) || (state.producers[upgrade.producerId] ?? 0) < upgrade.milestone) return false;
    const index = MILESTONES.indexOf(upgrade.milestone);
    if (index === 0) return true;
    return purchased.has(`${upgrade.producerId}--${MILESTONES[index - 1]}`);
  });
}

export function purchaseUpgrade(state, upgradeId) {
  const upgrade = BUILDING_UPGRADE_BY_ID[upgradeId];
  if (!upgrade) return { ok: false, reason: 'Unknown upgrade.' };
  if (state.upgrades.includes(upgradeId)) return { ok: false, reason: 'Already installed.' };
  if (!getAvailableUpgrades(state).some(({ id }) => id === upgradeId)) return { ok: false, reason: 'Milestone not reached.' };
  const cost = D(upgrade.cost);
  if (D(state.coins).lt(cost)) return { ok: false, reason: 'Not enough coins.' };
  state.coins = D(state.coins).sub(cost);
  state.upgrades.push(upgradeId);
  state.stats.upgradesPurchased += 1;
  return { ok: true, upgrade, cost };
}

export function getInstalledUpgradeGroups(state) {
  const groups = new Map();
  for (const id of state.upgrades) {
    const upgrade = BUILDING_UPGRADE_BY_ID[id];
    if (!upgrade) continue;
    if (!groups.has(upgrade.producerId)) groups.set(upgrade.producerId, []);
    groups.get(upgrade.producerId).push(upgrade);
  }
  return groups;
}


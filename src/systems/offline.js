import { D } from '../core/numbers.js';
import { getEconomySnapshot, getMoonBonuses, getUpgradeBonuses } from '../core/economy.js';
import { getFuelProfile } from './fuel.js';

export function calculateOfflineEarnings(state, now = Date.now()) {
  const startedAt = Number(state.lastSaveAt || now);
  return calculateEarningsBetween(state, startedAt, now);
}

export function calculateEarningsBetween(state, startedAt, now = Date.now()) {
  const elapsedSeconds = Math.max(0, (now - startedAt) / 1000);
  const capHours = getOfflineCapHours(state);
  const creditedSeconds = Math.min(elapsedSeconds, capHours * 3600);
  const creditedUntil = startedAt + creditedSeconds * 1000;
  const boundaries = [...new Set((state.activeEffects ?? [])
    .map(({ expiresAt }) => Number(expiresAt))
    .filter((expiresAt) => expiresAt > startedAt && expiresAt < creditedUntil))]
    .sort((a, b) => a - b);
  let cursor = startedAt;
  let earned = D(0);
  for (const boundary of [...boundaries, creditedUntil]) {
    const segmentSeconds = Math.max(0, (boundary - cursor) / 1000);
    if (segmentSeconds > 0) {
      // Sample just inside the interval so an effect expiring at the boundary
      // applies to the preceding segment, not the following one.
      const sampleAt = Math.min(boundary - 1, cursor + 1);
      const snapshot = getEconomySnapshot(state, { now: sampleAt });
      earned = earned.add(snapshot.totalCps.mul(segmentSeconds).mul(offlineProductionMultiplier(snapshot)));
    }
    cursor = boundary;
  }
  const averageCps = creditedSeconds > 0 ? earned.div(creditedSeconds) : getEconomySnapshot(state, { now }).totalCps;
  return { elapsedSeconds, creditedSeconds, capHours, averageCps, earned };
}

export function getOfflineCapHours(state) {
  const moonBonuses = getMoonBonuses(state);
  const fuelBonuses = getFuelProfile(state).bonuses;
  const upgradeBonuses = getUpgradeBonuses(state, moonBonuses, fuelBonuses);
  return Math.min(24, Math.max(0, moonBonuses.offlineHours + fuelBonuses.offlineHours + upgradeBonuses.offlineHours));
}

export function getOfflineProductionMultiplier(state) {
  return offlineProductionMultiplier(getEconomySnapshot(state));
}

export function applyOfflineEarnings(state, report) {
  if (!report || report.creditedSeconds < 30 || D(report.earned).lte(0)) return false;
  state.coins = D(state.coins).add(report.earned);
  state.lifetimeCoins = D(state.lifetimeCoins).add(report.earned);
  state.stats.coinsFromProduction = D(state.stats.coinsFromProduction).add(report.earned);
  state.stats.offlineEarned = D(state.stats.offlineEarned).add(report.earned);
  state.stats.offlineClaims += 1;
  state.stats.longestOfflineSeconds = Math.max(state.stats.longestOfflineSeconds, report.elapsedSeconds);
  return true;
}

function offlineProductionMultiplier(snapshot) {
  return Math.min(2, Math.max(1,
    Number(snapshot.fuelBonuses?.offlineProductionMultiplier ?? 1)
      * Number(snapshot.upgradeBonuses?.offlineProductionMultiplier ?? 1),
  ));
}

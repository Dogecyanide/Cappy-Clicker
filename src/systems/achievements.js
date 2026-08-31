import { D } from '../core/numbers.js';
import { activeEffects, getClickValue, getEconomySnapshot } from '../core/economy.js';
import { ACHIEVEMENTS } from '../data/achievements.js';

const DECIMAL_TYPES = new Set(['lifetime-coins', 'total-cps', 'click-value', 'manual-coins', 'offline-coins', 'boo-coins-lost']);

export function getAchievementProgress(state, achievement, context = {}) {
  const { type, scope } = achievement.condition;
  const stats = state.stats;
  switch (type) {
    case 'producer-owned': return state.producers[scope] ?? 0;
    case 'lifetime-coins': return D(state.lifetimeCoins);
    case 'total-cps': return getEconomySnapshot(state, context).totalCps;
    case 'total-tosses': return stats.totalClicks;
    case 'critical-tosses': return stats.criticalClicks;
    case 'max-combo': return stats.longestCombo;
    case 'click-value': return getClickValue(state, context);
    case 'manual-coins': return D(stats.coinsFromClicks);
    case 'upgrades-owned': return state.upgrades.length;
    case 'moon-collected': return state.moons.includes(scope) ? 1 : 0;
    case 'boo-encounters': return stats.booEncounters;
    case 'boo-spins': return stats.booSpins;
    case 'boo-positive': return stats.booPositive;
    case 'boo-negative': return stats.booNegative;
    case 'boo-neutral': return stats.booNeutral;
    case 'boo-tier-seen': return stats.booTierCounts?.[scope] ?? 0;
    case 'boo-outcome-seen': return stats.booOutcomeCounts?.[scope] ?? 0;
    case 'boo-ignored': return stats.booIgnored;
    case 'boo-distinct': return stats.booDistinct?.length ?? 0;
    case 'boo-streak': return stats.booStreak?.tier === scope ? stats.booStreak.count : 0;
    case 'effects-expired': return stats.effectsExpired;
    case 'producer-restored': return stats.producersRestored;
    case 'boo-coins-lost': return D(stats.booCoinsLost);
    case 'producer-discovered': return state.discoveredProducers.includes(scope) ? 1 : 0;
    case 'offline-claims': return stats.offlineClaims;
    case 'longest-offline': return stats.longestOfflineSeconds;
    case 'offline-coins': return D(stats.offlineEarned);
    case 'save-exports': return stats.saveExports;
    case 'save-imports': return stats.saveImports;
    case 'buy-max-uses': return stats.buyMaxUses;
    case 'largest-bulk': return stats.largestBulkPurchase;
    case 'producer-types-owned': return Object.values(state.producers).filter((amount) => amount > 0).length;
    case 'producer-types-discovered': return state.discoveredProducers.length;
    case 'zero-after-purchase': return stats.zeroAfterPurchase;
    case 'tiny-leftover': return stats.tinyLeftover;
    case 'simultaneous-effects': return activeEffects(state, context.now).length;
    case 'unique-news': return stats.uniqueNewsSeen?.length ?? 0;
    case 'backdrops-seen': return stats.backdropsSeen?.length ?? 0;
    case 'play-seconds': return stats.playSeconds;
    case 'play-days': return stats.playDays?.length ?? 0;
    case 'autosaves': return stats.autosaves;
    case 'performance-modes': return stats.performanceModesUsed?.length ?? 0;
    case 'other-achievements': return Object.keys(state.achievements).length;
    default: return 0;
  }
}

export function isAchievementMet(state, achievement, context = {}) {
  const progress = getAchievementProgress(state, achievement, context);
  const target = achievement.condition.target;
  return DECIMAL_TYPES.has(achievement.condition.type)
    ? D(progress).gte(D(target))
    : Number(progress) >= Number(target);
}

export function evaluateAchievements(state, context = {}) {
  const now = context.now ?? Date.now();
  const unlocked = [];
  for (const achievement of ACHIEVEMENTS) {
    if (state.achievements[achievement.id]) continue;
    if (isAchievementMet(state, achievement, { ...context, now })) {
      state.achievements[achievement.id] = { unlockedAt: now };
      unlocked.push(achievement);
    }
  }
  return unlocked;
}

export function getAchievementFraction(state, achievement, context = {}) {
  if (state.achievements[achievement.id]) return 1;
  const progress = getAchievementProgress(state, achievement, context);
  const target = achievement.condition.target;
  if (DECIMAL_TYPES.has(achievement.condition.type)) {
    if (D(target).lte(0)) return 1;
    return Math.max(0, Math.min(1, D(progress).div(target).toNumber()));
  }
  return Math.max(0, Math.min(1, Number(progress) / Number(target)));
}


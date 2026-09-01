import { D, Decimal } from './numbers.js';
import { PRODUCERS } from '../data/buildings.js';
import { DEFAULT_COSMETICS, DEFAULT_EQUIPPED_COSMETICS } from '../data/cosmetics.js';

export const SAVE_VERSION = 2;

export function createInitialState(now = Date.now()) {
  return {
    version: SAVE_VERSION,
    coins: D(0),
    lifetimeCoins: D(0),
    producers: Object.fromEntries(PRODUCERS.map(({ id }) => [id, 0])),
    upgrades: [],
    fuelModules: [],
    achievements: {},
    moons: [],
    cosmetics: {
      owned: [...DEFAULT_COSMETICS],
      equipped: { ...DEFAULT_EQUIPPED_COSMETICS },
    },
    discoveredProducers: PRODUCERS.slice(0, 2).map(({ id }) => id),
    activeEffects: [],
    stats: {
      startedAt: now,
      totalClicks: 0,
      criticalClicks: 0,
      coinsFromClicks: D(0),
      coinsFromProduction: D(0),
      producersPurchased: 0,
      upgradesPurchased: 0,
      moonsPurchased: 0,
      booEncounters: 0,
      booSpins: 0,
      booPositive: 0,
      booNegative: 0,
      booCatastrophes: 0,
      booSevere: 0,
      longestCombo: 0,
      offlineEarned: D(0),
      playSeconds: 0,
      booNeutral: 0,
      booIgnored: 0,
      booCoinsLost: D(0),
      booOutcomeCounts: {},
      booTierCounts: {},
      booDistinct: [],
      booStreak: { tier: '', count: 0 },
      effectsExpired: 0,
      producersRestored: 0,
      offlineClaims: 0,
      longestOfflineSeconds: 0,
      saveExports: 0,
      saveImports: 0,
      buyMaxUses: 0,
      largestBulkPurchase: 0,
      zeroAfterPurchase: 0,
      tinyLeftover: 0,
      uniqueNewsSeen: [],
      backdropsSeen: ['cascade'],
      playDays: [new Date(now).toISOString().slice(0, 10)],
      autosaves: 0,
      performanceModesUsed: ['full'],
      shinesSeen: 0,
      shinesClaimed: 0,
      shinesMissed: 0,
      corruptedShines: 0,
      shineCoins: D(0),
      shineEffects: 0,
      shineOutcomeCounts: {},
      shineStreak: 0,
      cosmeticsPurchased: 0,
      cosmeticSwaps: 0,
      leaderboardSubmissions: 0,
      fuelModulesPurchased: 0,
    },
    combo: { count: 0, lastClickAt: 0 },
    boo: {
      nextSpawnAt: now + randomBooDelay(),
      visibleUntil: 0,
      committedSpin: null,
      history: [],
    },
    shine: {
      nextSpawnAt: now + randomShineDelay(),
      visibleUntil: 0,
      spawnedAt: 0,
      kind: 'normal',
    },
    settings: {
      performance: 'full',
      sound: true,
      numberFormat: 'words',
      reducedMotion: false,
      leaderboardName: '',
    },
    integrity: {
      imported: false,
      devLabUsed: false,
    },
    news: [],
    lastSaveAt: now,
    lastTickAt: now,
  };
}

export function randomBooDelay(random = Math.random) {
  return (4 + random() * 4) * 60 * 1000;
}

export function randomShineDelay(random = Math.random) {
  return (9 + random() * 7) * 60 * 1000;
}

export function cloneState(state) {
  if (state instanceof Decimal) return new Decimal(state);
  if (Array.isArray(state)) return state.map((value) => cloneState(value));
  if (state && typeof state === 'object') {
    return Object.fromEntries(Object.entries(state).map(([key, value]) => [key, cloneState(value)]));
  }
  return state;
}

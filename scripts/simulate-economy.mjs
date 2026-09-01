import { D, isFiniteDecimal } from '../src/core/numbers.js';
import { createInitialState } from '../src/core/state.js';
import {
  getBulkCost,
  getClickProfile,
  getAffordableAmount,
  getEconomySnapshot,
  getProducerCost,
  getPriceMultiplier,
} from '../src/core/economy.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';
import { BOO_OUTCOMES } from '../src/data/boo-outcomes.js';
import { PRODUCERS } from '../src/data/buildings.js';
import { BUILDING_UPGRADES, MILESTONES } from '../src/data/building-upgrades.js';
import { FUEL_MODULES } from '../src/data/fuel-modules.js';
import { POWER_MOONS } from '../src/data/power-moons.js';
import { SHINE_OUTCOMES } from '../src/data/shine-outcomes.js';
import { purchaseProducer, updateProducerDiscovery } from '../src/systems/buildings.js';
import { evaluateAchievements } from '../src/systems/achievements.js';
import { getFuelModuleStatus, getFuelProfile, purchaseFuelModule } from '../src/systems/fuel.js';
import { getAvailableUpgrades, purchaseUpgrade } from '../src/systems/upgrades.js';
import { getVisibleMoons, purchaseMoon } from '../src/systems/moons.js';
import { getOfflineCapHours, getOfflineProductionMultiplier } from '../src/systems/offline.js';

const DAY = 24 * 3600;
const YEAR = 365 * DAY;
const HORIZON_SECONDS = 10 * YEAR;
const ROUTE_CHECKPOINTS = [5, 10, 15, 20, 30, 40];
const MOON_CHECKPOINTS = [10, 20, 30, 40, 50];
const FUEL_CHECKPOINTS = [5, 10, 15, 18];
const UPGRADE_CHECKPOINTS = [100, 250, 400, 480];
const OWNERSHIP_CHECKPOINTS = [100, 350, 500, 750, 1_000];
const TARGETS = {
  firstUpgrade: [60, 3 * 60],
  tier5: [20 * 60, 60 * 60],
  tier10: [3 * 3600, 12 * 3600],
  tier15: [2 * 24 * 3600, 8 * 24 * 3600],
  tier20: [7 * 24 * 3600, 21 * 24 * 3600],
};

const STRATEGIES = [
  { id: 'active', label: 'Active grand tour', clicksPerSecond: 4, activeHoursPerDay: 2, mode: 'balanced' },
  { id: 'balanced', label: 'Balanced grand tour', clicksPerSecond: 2, activeHoursPerDay: 1, mode: 'balanced' },
  { id: 'idle', label: 'Idle after first Frog', clicksPerSecond: 0, activeHoursPerDay: 0, mode: 'balanced', seedFrog: true },
];

const results = STRATEGIES.map(simulate);
const bounds = auditSystemBounds();
printResults(results);
validateResults(results, bounds);

function auditSystemBounds() {
  const state = createInitialState();
  for (const producer of PRODUCERS) state.producers[producer.id] = 1_000;
  state.discoveredProducers = PRODUCERS.map(({ id }) => id);
  state.upgrades = BUILDING_UPGRADES.map(({ id }) => id);
  state.moons = POWER_MOONS.map(({ id }) => id);
  state.fuelModules = FUEL_MODULES.map(({ id }) => id);
  state.achievements = Object.fromEntries(ACHIEVEMENTS.map(({ id }) => [id, { unlockedAt: 1 }]));
  state.stats.shinesClaimed = 100;
  const snapshot = getEconomySnapshot(state);
  const click = getClickProfile(state, { snapshot });
  const criticalExpectation = 1 + click.criticalChance * (click.criticalMultiplier - 1);
  const fourClickShare = click.value.mul(4 * criticalExpectation).div(snapshot.totalCps.add(click.value.mul(4 * criticalExpectation))).toNumber();
  const gloomFraction = Math.max(...SHINE_OUTCOMES.filter(({ kind }) => kind === 'corrupted').map(({ effect }) => effect.fraction ?? 0));
  const kingBooBankLoss = Math.max(...BOO_OUTCOMES.map(({ effect }) => effect.bankLoss ?? effect.amount ?? effect.bankCap ?? 0));
  const costSamples = [0, 50, 100, 200, 350, 500, 750, 1_000, 1_001].map((owned) => getProducerCost(PRODUCERS.at(-1).id, owned));
  return {
    finiteCps: isFiniteDecimal(snapshot.totalCps),
    fourClickShare,
    offlineCap: getOfflineCapHours(state),
    offlineMultiplier: getOfflineProductionMultiplier(state),
    shinePayout: click.shinePayout,
    effectiveGloomBankLoss: gloomFraction * (1 - click.gloomLossReduction),
    kingBooBankLoss,
    eventLuck: Math.min(0.2, snapshot.moonBonuses.eventLuck + snapshot.fuelBonuses.eventLuck + snapshot.upgradeBonuses.eventLuck),
    monotonicCosts: costSamples.every((cost, index) => index === 0 || cost.gt(costSamples[index - 1])),
  };
}

function simulate(strategy) {
  const state = createInitialState(0);
  state.boo.nextSpawnAt = Number.MAX_SAFE_INTEGER;
  let seconds = 0;
  let actions = 0;
  let ticks = 0;
  let lastAchievementEvaluation = -60;
  const milestones = { firstUpgrade: null, firstMoon: null, allRoutes: null };
  for (const tier of ROUTE_CHECKPOINTS) milestones[`tier${tier}`] = null;
  for (const count of MOON_CHECKPOINTS) milestones[`moon${count}`] = null;
  for (const count of FUEL_CHECKPOINTS) milestones[`fuel${count}`] = null;
  for (const count of UPGRADE_CHECKPOINTS) milestones[`upgrade${count}`] = null;
  for (const count of OWNERSHIP_CHECKPOINTS) milestones[`firstRoute${count}`] = null;
  for (const count of [100, 350, 500]) milestones[`allRoutes${count}`] = null;
  let automaticEarned = D(0);
  let manualEarned = D(0);
  let peakClickShare = 0;

  if (strategy.seedFrog) {
    state.coins = D(15);
    state.lifetimeCoins = D(15);
    const seeded = purchaseProducer(state, PRODUCERS[0].id, 1, { now: 0 });
    if (!seeded.ok) throw new Error('Idle seed failed to buy the first Frog.');
    actions += 1;
  }

  recordMilestones(state, seconds, milestones);
  while (seconds < HORIZON_SECONDS) {
    const step = simulationStep(seconds);
    const snapshot = getEconomySnapshot(state, { now: seconds * 1000 });
    const automatic = snapshot.totalCps.mul(step);
    const activeFraction = seconds < 3600 ? 1 : strategy.activeHoursPerDay / 24;
    const clicks = strategy.clicksPerSecond * step * activeFraction;
    const clickProfile = getClickProfile(state, { now: seconds * 1000, snapshot });
    const expectedCriticalMultiplier = 1 + clickProfile.criticalChance * (clickProfile.criticalMultiplier - 1);
    const manual = clickProfile.value.mul(clicks * expectedCriticalMultiplier);
    const income = automatic.add(manual);
    automaticEarned = automaticEarned.add(automatic);
    manualEarned = manualEarned.add(manual);
    if (automatic.gt(0) && clicks > 0 && state.discoveredProducers.length >= 10) {
      const perSecondManual = clickProfile.value.mul(strategy.clicksPerSecond * expectedCriticalMultiplier);
      peakClickShare = Math.max(peakClickShare, perSecondManual.div(snapshot.totalCps.add(perSecondManual)).toNumber());
    }
    state.coins = D(state.coins).add(income);
    state.lifetimeCoins = D(state.lifetimeCoins).add(income);
    state.stats.coinsFromProduction = D(state.stats.coinsFromProduction).add(automatic);
    state.stats.coinsFromClicks = D(state.stats.coinsFromClicks).add(manual);
    state.stats.totalClicks += Math.floor(clicks);
    state.stats.criticalClicks += Math.floor(clicks * 0.05);
    seconds += step;
    ticks += 1;

    updateProducerDiscovery(state);
    const achievementInterval = seconds < DAY ? 600 : seconds < 30 * DAY ? 3_600 : DAY;
    if (seconds - lastAchievementEvaluation >= achievementInterval) {
      evaluateAchievements(state, { now: seconds * 1000 });
      lastAchievementEvaluation = seconds;
    }
    actions += takeActions(state, strategy.mode, seconds * 1000);
    recordMilestones(state, seconds, milestones);
    if (ticks % 20 === 0) assertFiniteState(state, strategy.label, seconds);
    if (isCatalogueComplete(state)) break;
  }

  const snapshot = getEconomySnapshot(state, { now: seconds * 1000 });
  return {
    ...strategy,
    seconds,
    actions,
    milestones,
    cps: snapshot.totalCps,
    producers: Object.values(state.producers).reduce((sum, amount) => sum + amount, 0),
    upgrades: state.upgrades.length,
    moons: state.moons.length,
    achievements: Object.keys(state.achievements).length,
    fuelModules: state.fuelModules.length,
    minOwned: Math.min(...Object.values(state.producers)),
    maxOwned: Math.max(...Object.values(state.producers)),
    automaticEarned,
    manualEarned,
    manualShare: manualEarned.add(automaticEarned).gt(0) ? manualEarned.div(manualEarned.add(automaticEarned)).toNumber() : 0,
    peakClickShare,
    fuelProfile: snapshot.fuelProfile,
    clickProfile: getClickProfile(state, { now: seconds * 1000, snapshot }),
  };
}

function simulationStep(seconds) {
  if (seconds < 3600) return 10;
  if (seconds < DAY) return 300;
  if (seconds < 30 * DAY) return 3_600;
  if (seconds < YEAR) return DAY;
  return 30 * DAY;
}

function takeActions(state, mode, now) {
  let actions = 0;
  for (let guard = 0; guard < 12; guard += 1) {
    updateProducerDiscovery(state);

    if (mode === 'balanced') {
      const moon = getVisibleMoons(state)[0];
      const moonReserve = state.moons.length >= 40 ? 1.15 : 2.5;
      if (moon && D(state.coins).gte(D(moon.cost).mul(moonReserve))) {
        const result = purchaseMoon(state, moon.id);
        if (result.ok) { actions += 1; continue; }
      }
      if (moon && state.moons.length >= 40 && canSaveWithin(state, moon.cost, now, 5 * YEAR)) return actions;

      const profile = getFuelProfile(state);
      const module = FUEL_MODULES
        .filter((candidate) => getFuelModuleStatus(state, candidate, profile) === 'available')
        .sort((a, b) => a.cost.cmp(b.cost))[0];
      const moduleReserve = state.fuelModules.length >= 15 ? 1.2 : 2.5;
      if (module && D(state.coins).gte(D(module.cost).mul(moduleReserve))) {
        const result = purchaseFuelModule(state, module.id);
        if (result.ok) { actions += 1; continue; }
      }
      if (module && state.fuelModules.length >= 15 && canSaveWithin(state, module.cost, now, 5 * YEAR)) return actions;
    }

    if (mode === 'upgrade-first' || mode === 'balanced') {
      const upgrades = getAvailableUpgrades(state).sort((a, b) => D(a.cost).cmp(b.cost));
      if (upgrades.length) {
        const techniqueNumber = Number(upgrades[0].id.split('-').at(-1));
        const reserve = upgrades[0].track === 'technique' ? (techniqueNumber >= 31 ? 1.2 : 3) : 1.2;
        if (D(state.coins).gte(D(upgrades[0].cost).mul(reserve)) && purchaseUpgrade(state, upgrades[0].id).ok) {
          actions += 1;
          continue;
        }
        if (upgrades[0].track === 'producer') break;
        if (techniqueNumber >= 31 && canSaveWithin(state, upgrades[0].cost, now, 5 * YEAR)) break;
      }
    }

    const candidate = chooseCandidate(state, mode, now);
    if (!candidate || D(state.coins).lt(candidate.cost)) break;
    const result = candidate.type === 'producer'
      ? purchaseProducer(state, candidate.id, producerBatch(state, candidate.id, now), { now })
      : purchaseUpgrade(state, candidate.id);
    if (!result.ok) break;
    actions += 1;
  }
  return actions;
}

function canSaveWithin(state, cost, now, seconds) {
  const cps = getEconomySnapshot(state, { now }).totalCps;
  return cps.gt(0) && D(cost).lte(cps.mul(seconds));
}

function producerBatch(state, producerId, now) {
  const owned = state.producers[producerId] ?? 0;
  const nextMilestone = MILESTONES.find((milestone) => milestone > owned) ?? owned + 25;
  const affordable = getAffordableAmount(state, producerId, state.coins, Math.max(1, nextMilestone - owned), { now });
  return Math.max(1, Math.min(affordable, nextMilestone - owned));
}

function chooseCandidate(state, mode, now) {
  const snapshot = getEconomySnapshot(state, { now });
  const producerCandidates = state.discoveredProducers.map((id) => {
    const breakdown = snapshot.byId[id];
    const priceMultiplier = getPriceMultiplier(state, id, { now });
    return {
      type: 'producer',
      id,
      cost: getBulkCost(id, breakdown.owned, 1, { priceMultiplier }),
      gain: breakdown.effectivePerUnit,
    };
  });
  if (mode === 'cheapest') return producerCandidates.sort((a, b) => a.cost.cmp(b.cost))[0] ?? null;

  const upgradeCandidates = getAvailableUpgrades(state).map((upgrade) => ({
    type: 'upgrade',
    id: upgrade.id,
    cost: D(upgrade.cost),
    // Technique upgrades improve clicking or event utility rather than raw CPS,
    // so the ROI-only strategy leaves them to upgrade-first/balanced play.
    gain: upgrade.producerId ? snapshot.byId[upgrade.producerId]?.effectiveTotal ?? D(0) : D(0),
  }));
  const candidates = [...producerCandidates, ...upgradeCandidates].filter(({ gain }) => D(gain).gt(0));
  candidates.sort((a, b) => a.cost.div(a.gain).cmp(b.cost.div(b.gain)) || a.cost.cmp(b.cost));
  return candidates[0] ?? producerCandidates.sort((a, b) => a.cost.cmp(b.cost))[0] ?? null;
}

function recordMilestones(state, seconds, milestones) {
  if (milestones.firstUpgrade === null && state.upgrades.length) milestones.firstUpgrade = seconds;
  if (milestones.firstMoon === null && state.moons.length) milestones.firstMoon = seconds;
  for (const tier of ROUTE_CHECKPOINTS) {
    const key = `tier${tier}`;
    if (milestones[key] === null && PRODUCERS.slice(0, tier).every(({ id }) => state.producers[id] > 0)) milestones[key] = seconds;
  }
  for (const count of MOON_CHECKPOINTS) if (milestones[`moon${count}`] === null && state.moons.length >= count) milestones[`moon${count}`] = seconds;
  for (const count of FUEL_CHECKPOINTS) if (milestones[`fuel${count}`] === null && state.fuelModules.length >= count) milestones[`fuel${count}`] = seconds;
  for (const count of UPGRADE_CHECKPOINTS) if (milestones[`upgrade${count}`] === null && state.upgrades.length >= count) milestones[`upgrade${count}`] = seconds;
  const firstOwned = state.producers[PRODUCERS[0].id] ?? 0;
  for (const count of OWNERSHIP_CHECKPOINTS) if (milestones[`firstRoute${count}`] === null && firstOwned >= count) milestones[`firstRoute${count}`] = seconds;
  for (const count of [100, 350, 500]) {
    if (milestones[`allRoutes${count}`] === null && PRODUCERS.every(({ id }) => (state.producers[id] ?? 0) >= count)) milestones[`allRoutes${count}`] = seconds;
  }
}

function isCatalogueComplete(state) {
  return state.moons.length === POWER_MOONS.length
    && state.upgrades.length === BUILDING_UPGRADES.length
    && state.fuelModules.length === FUEL_MODULES.length;
}

function assertFiniteState(state, label, seconds) {
  const snapshot = getEconomySnapshot(state, { now: seconds * 1000 });
  if (!isFiniteDecimal(state.coins) || state.coins.lt(0) || !isFiniteDecimal(snapshot.totalCps)) {
    throw new Error(`${label} produced invalid numbers at ${formatDuration(seconds)}.`);
  }
  if (state.moons.length > POWER_MOONS.length || state.upgrades.length > BUILDING_UPGRADES.length) {
    throw new Error(`${label} exceeded a finite collection cap.`);
  }
  if (Object.values(state.producers).some((amount) => !Number.isSafeInteger(amount) || amount < 0)) {
    throw new Error(`${label} produced an invalid ownership count.`);
  }
}

function printResults(simulations) {
  console.log('Cappy Clicker deterministic economy simulation');
  console.log('Assumptions: no Shine/King Boo RNG income; actual owned critical stats; first hour is an active session, then clicks are limited to each strategy’s daily play window.');
  console.log('Automatic production is continuous (equivalent to checking within the current offline cap). Idle is seeded with exactly 15 coins and one Frog because a true zero-click save correctly never starts.\n');
  const headings = ['Strategy', 'Tier 10', 'Tier 20', 'Tier 30', 'Tier 40', 'Moon 20', 'Moon 50', 'Moons', 'Fuel', 'Upgrades', 'Owned', 'Manual'];
  const rows = simulations.map((result) => [
    result.label,
    formatDuration(result.milestones.tier10),
    formatDuration(result.milestones.tier20),
    formatDuration(result.milestones.tier30),
    formatDuration(result.milestones.tier40),
    formatDuration(result.milestones.moon20),
    formatDuration(result.milestones.moon50),
    `${result.moons}/${POWER_MOONS.length}`,
    `${result.fuelModules}/${FUEL_MODULES.length}`,
    String(result.upgrades),
    `${result.minOwned}–${result.maxOwned}`,
    `${(result.manualShare * 100).toFixed(2)}%`,
  ]);
  const widths = headings.map((heading, index) => Math.max(heading.length, ...rows.map((row) => row[index].length)));
  console.log(headings.map((heading, index) => heading.padEnd(widths[index])).join('  '));
  console.log(widths.map((width) => '-'.repeat(width)).join('  '));
  for (const row of rows) console.log(row.map((value, index) => value.padEnd(widths[index])).join('  '));

  const balanced = simulations.find(({ id }) => id === 'active');
  console.log(`\nActive collection checkpoints: 100/250/400/480 upgrades ${UPGRADE_CHECKPOINTS.map((count) => formatDuration(balanced.milestones[`upgrade${count}`])).join(' / ')}.`);
  console.log(`Fuel modules 5/10/15/18: ${FUEL_CHECKPOINTS.map((count) => formatDuration(balanced.milestones[`fuel${count}`])).join(' / ')}.`);
  console.log(`First route ownership 100/350/500/750/1,000: ${OWNERSHIP_CHECKPOINTS.map((count) => formatDuration(balanced.milestones[`firstRoute${count}`])).join(' / ')}.`);
  console.log(`All routes at 100/350/500: ${[100, 350, 500].map((count) => formatDuration(balanced.milestones[`allRoutes${count}`])).join(' / ')}.`);
  console.log(`\nFull-catalogue bounds: 4 clicks/s ${(bounds.fourClickShare * 100).toFixed(2)}% of output; offline ${bounds.offlineCap.toFixed(1)}h at ×${bounds.offlineMultiplier.toFixed(2)}; Shine payout ×${bounds.shinePayout.toFixed(2)}; protected Gloom bank loss ${(bounds.effectiveGloomBankLoss * 100).toFixed(2)}%; King Boo worst bank loss ${(bounds.kingBooBankLoss * 100).toFixed(0)}%; event luck ${(bounds.eventLuck * 100).toFixed(0)}%.`);
  console.log('\nOpening pacing checks (active strategy):');
  for (const [key, [minimum, maximum]] of Object.entries(TARGETS)) {
    const actual = balanced.milestones[key];
    const pass = actual !== null && actual >= minimum && actual <= maximum;
    console.log(`  ${pass ? 'PASS' : 'WARN'} ${key}: ${formatDuration(actual)} (target ${formatDuration(minimum)}–${formatDuration(maximum)})`);
  }
}

function validateResults(simulations, systemBounds) {
  for (const result of simulations) {
    const ordered = ROUTE_CHECKPOINTS.map((tier) => result.milestones[`tier${tier}`]).filter((value) => value !== null);
    if (ordered.some((value, index) => index > 0 && value < ordered[index - 1])) throw new Error(`${result.label} has non-monotonic tier timing.`);
    if (result.peakClickShare > 0.25) throw new Error(`${result.label} lets clicking exceed 25% of established automatic production.`);
  }
  if (!systemBounds.finiteCps || !systemBounds.monotonicCosts) throw new Error('Full-catalogue values or segmented producer costs are invalid.');
  if (systemBounds.fourClickShare > 0.1) throw new Error('Full-catalogue clicking exceeds 10% of total output at four clicks per second.');
  if (systemBounds.offlineCap > 24 || systemBounds.offlineMultiplier > 2) throw new Error('Offline bonuses exceed their hard caps.');
  if (systemBounds.effectiveGloomBankLoss > 0.05 || systemBounds.kingBooBankLoss > 0.35 || systemBounds.eventLuck > 0.2) throw new Error('Rare-event risk bounds were exceeded.');
  console.log('\nHard invariants passed: finite/nonnegative economy, integer ownership, monotonic routes, bounded clicking, and finite collection caps.');
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '>10y';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
  if (seconds < 24 * 3600) return `${(seconds / 3600).toFixed(1)}h`;
  if (seconds < YEAR) return `${(seconds / DAY).toFixed(1)}d`;
  return `${(seconds / YEAR).toFixed(2)}y`;
}

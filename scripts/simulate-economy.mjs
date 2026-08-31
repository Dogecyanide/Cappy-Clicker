import { D, isFiniteDecimal } from '../src/core/numbers.js';
import { createInitialState } from '../src/core/state.js';
import {
  getBulkCost,
  getClickValue,
  getEconomySnapshot,
  getPriceMultiplier,
} from '../src/core/economy.js';
import { PRODUCERS } from '../src/data/buildings.js';
import { BUILDING_UPGRADES } from '../src/data/building-upgrades.js';
import { POWER_MOONS } from '../src/data/power-moons.js';
import { purchaseProducer, updateProducerDiscovery } from '../src/systems/buildings.js';
import { evaluateAchievements } from '../src/systems/achievements.js';
import { getAvailableUpgrades, purchaseUpgrade } from '../src/systems/upgrades.js';
import { getVisibleMoons, purchaseMoon } from '../src/systems/moons.js';

const HORIZON_SECONDS = 30 * 24 * 3600;
const EXPECTED_CRITICAL_MULTIPLIER = 0.95 + 0.05 * 5;
const TARGETS = {
  firstUpgrade: [2 * 60, 5 * 60],
  tier5: [25 * 60, 60 * 60],
  tier10: [6 * 3600, 18 * 3600],
  tier15: [3 * 24 * 3600, 8 * 24 * 3600],
  tier20: [10 * 24 * 3600, 21 * 24 * 3600],
};

const STRATEGIES = [
  { id: 'cheapest', label: 'Cheapest producer', clicksPerSecond: 2, mode: 'cheapest' },
  { id: 'roi', label: 'Fastest ROI', clicksPerSecond: 2, mode: 'roi' },
  { id: 'upgrades', label: 'Upgrade-first', clicksPerSecond: 2, mode: 'upgrade-first' },
  { id: 'balanced', label: 'Balanced + Moons', clicksPerSecond: 4, mode: 'balanced' },
  { id: 'idle', label: 'Idle after first Frog', clicksPerSecond: 0, mode: 'roi', seedFrog: true },
];

const results = STRATEGIES.map(simulate);
printResults(results);
validateResults(results);

function simulate(strategy) {
  const state = createInitialState(0);
  state.boo.nextSpawnAt = Number.MAX_SAFE_INTEGER;
  let seconds = 0;
  let actions = 0;
  let ticks = 0;
  let lastAchievementEvaluation = -60;
  const milestones = { firstUpgrade: null, tier5: null, tier10: null, tier15: null, tier17: null, tier18: null, tier19: null, tier20: null, firstMoon: null };

  if (strategy.seedFrog) {
    state.coins = D(15);
    state.lifetimeCoins = D(15);
    const seeded = purchaseProducer(state, PRODUCERS[0].id, 1, { now: 0 });
    if (!seeded.ok) throw new Error('Idle seed failed to buy the first Frog.');
    actions += 1;
  }

  recordMilestones(state, seconds, milestones);
  while (seconds < HORIZON_SECONDS && milestones.tier20 === null) {
    const step = seconds < 3600 ? 5 : seconds < 24 * 3600 ? 60 : 1_800;
    const snapshot = getEconomySnapshot(state, { now: seconds * 1000 });
    const automatic = snapshot.totalCps.mul(step);
    const clicks = strategy.clicksPerSecond * step;
    const manual = getClickValue(state, { now: seconds * 1000 }).mul(clicks * EXPECTED_CRITICAL_MULTIPLIER);
    const income = automatic.add(manual);
    state.coins = D(state.coins).add(income);
    state.lifetimeCoins = D(state.lifetimeCoins).add(income);
    state.stats.coinsFromProduction = D(state.stats.coinsFromProduction).add(automatic);
    state.stats.coinsFromClicks = D(state.stats.coinsFromClicks).add(manual);
    state.stats.totalClicks += Math.floor(clicks);
    state.stats.criticalClicks += Math.floor(clicks * 0.05);
    seconds += step;
    ticks += 1;

    updateProducerDiscovery(state);
    if (seconds - lastAchievementEvaluation >= (seconds < 3600 ? 60 : 600)) {
      evaluateAchievements(state, { now: seconds * 1000 });
      lastAchievementEvaluation = seconds;
    }
    actions += takeActions(state, strategy.mode, seconds * 1000);
    recordMilestones(state, seconds, milestones);
    if (ticks % 20 === 0) assertFiniteState(state, strategy.label, seconds);
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
  };
}

function takeActions(state, mode, now) {
  let actions = 0;
  for (let guard = 0; guard < 250; guard += 1) {
    updateProducerDiscovery(state);

    if (mode === 'balanced') {
      const moon = getVisibleMoons(state)[0];
      if (moon && D(state.coins).gte(D(moon.cost).mul(1.5))) {
        const result = purchaseMoon(state, moon.id);
        if (result.ok) { actions += 1; continue; }
      }
    }

    if (mode === 'upgrade-first' || mode === 'balanced') {
      const upgrades = getAvailableUpgrades(state).sort((a, b) => D(a.cost).cmp(b.cost));
      if (upgrades.length) {
        if (D(state.coins).lt(upgrades[0].cost)) break;
        if (purchaseUpgrade(state, upgrades[0].id).ok) { actions += 1; continue; }
      }
    }

    const candidate = chooseCandidate(state, mode, now);
    if (!candidate || D(state.coins).lt(candidate.cost)) break;
    const result = candidate.type === 'producer'
      ? purchaseProducer(state, candidate.id, 1, { now })
      : purchaseUpgrade(state, candidate.id);
    if (!result.ok) break;
    actions += 1;
  }
  return actions;
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
  for (const tier of [5, 10, 15, 17, 18, 19, 20]) {
    const key = `tier${tier}`;
    if (milestones[key] === null && PRODUCERS.slice(0, tier).every(({ id }) => state.producers[id] > 0)) milestones[key] = seconds;
  }
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
  console.log('Assumptions: no King Boo RNG; expected 5% criticals at ×5; purchases happen at each decision step.');
  console.log('Idle is seeded with exactly 15 coins and one Frog because a true zero-click save correctly never starts.\n');
  const headings = ['Strategy', 'First upgrade', 'Tier 5', 'Tier 10', 'Tier 15', 'Tier 20', 'Moons', 'Upgrades'];
  const rows = simulations.map((result) => [
    result.label,
    formatDuration(result.milestones.firstUpgrade),
    formatDuration(result.milestones.tier5),
    formatDuration(result.milestones.tier10),
    formatDuration(result.milestones.tier15),
    formatDuration(result.milestones.tier20),
    String(result.moons),
    String(result.upgrades),
  ]);
  const widths = headings.map((heading, index) => Math.max(heading.length, ...rows.map((row) => row[index].length)));
  console.log(headings.map((heading, index) => heading.padEnd(widths[index])).join('  '));
  console.log(widths.map((width) => '-'.repeat(width)).join('  '));
  for (const row of rows) console.log(row.map((value, index) => value.padEnd(widths[index])).join('  '));

  const balanced = simulations.find(({ id }) => id === 'balanced');
  console.log(`\nBalanced late ladder: tier 17 ${formatDuration(balanced.milestones.tier17)}, tier 18 ${formatDuration(balanced.milestones.tier18)}, tier 19 ${formatDuration(balanced.milestones.tier19)}.`);
  console.log('\nBalanced pacing checks:');
  for (const [key, [minimum, maximum]] of Object.entries(TARGETS)) {
    const actual = balanced.milestones[key];
    const pass = actual !== null && actual >= minimum && actual <= maximum;
    console.log(`  ${pass ? 'PASS' : 'WARN'} ${key}: ${formatDuration(actual)} (target ${formatDuration(minimum)}–${formatDuration(maximum)})`);
  }
}

function validateResults(simulations) {
  for (const result of simulations) {
    const ordered = ['tier5', 'tier10', 'tier15', 'tier20'].map((key) => result.milestones[key]).filter((value) => value !== null);
    if (ordered.some((value, index) => index > 0 && value < ordered[index - 1])) throw new Error(`${result.label} has non-monotonic tier timing.`);
  }
  console.log('\nHard invariants passed: finite/nonnegative economy, integer ownership, monotonic tiers, and finite collection caps.');
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '>30d';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
  if (seconds < 24 * 3600) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
}

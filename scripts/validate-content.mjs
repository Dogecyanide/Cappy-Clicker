import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PRODUCERS, PRODUCER_BY_ID } from '../src/data/buildings.js';
import { BUILDING_UPGRADES, MILESTONES } from '../src/data/building-upgrades.js';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORY_COUNTS, CONDITION_TYPES } from '../src/data/achievements.js';
import { POWER_MOONS, POWER_MOON_BY_ID } from '../src/data/power-moons.js';
import { BOO_OUTCOMES, BOO_PROBABILITY_TOTAL } from '../src/data/boo-outcomes.js';
import { SHINE_OUTCOMES } from '../src/data/shine-outcomes.js';
import { COSMETICS } from '../src/data/cosmetics.js';
import { FUEL_MODULES } from '../src/data/fuel-modules.js';

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const normalized = (value) => String(value).toLocaleLowerCase('en-US').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

function unique(items, field, label, normalize = false) {
  const values = items.map((item) => normalize ? normalized(item[field]) : item[field]);
  check(new Set(values).size === values.length, `${label} must have unique ${field} values.`);
  check(values.every(Boolean), `${label} must not have empty ${field} values.`);
}

function rejectSharedPhrases(items, field, label, phraseLength = 7) {
  const ownerByPhrase = new Map();
  for (const item of items) {
    const words = normalized(item[field]).split(' ').filter(Boolean);
    const phrasesInItem = new Set();
    for (let index = 0; index <= words.length - phraseLength; index += 1) {
      phrasesInItem.add(words.slice(index, index + phraseLength).join(' '));
    }
    for (const phrase of phrasesInItem) {
      const owner = ownerByPhrase.get(phrase);
      if (owner && owner !== item.id) {
        failures.push(`${label} ${owner} and ${item.id} repeat “${phrase}”.`);
      } else {
        ownerByPhrase.set(phrase, item.id);
      }
    }
  }
}

check(PRODUCERS.length === 40, `Expected 40 producers, found ${PRODUCERS.length}.`);
check(BUILDING_UPGRADES.length === 480, `Expected 480 permanent upgrades, found ${BUILDING_UPGRADES.length}.`);
check(ACHIEVEMENTS.length === 700, `Expected 700 achievements, found ${ACHIEVEMENTS.length}.`);
check(POWER_MOONS.length === 50, `Expected 50 Power Moons, found ${POWER_MOONS.length}.`);
check(COSMETICS.length === 29, `Expected 29 cosmetics, found ${COSMETICS.length}.`);
check(FUEL_MODULES.length === 18, `Expected 18 Odyssey Fuel modules, found ${FUEL_MODULES.length}.`);
check(POWER_MOONS.filter(({ isMulti }) => isMulti).length === 5, 'Expected a Multi Moon at every tenth Moon.');
check(POWER_MOONS.every((moon, index) => Boolean(moon.isMulti) === ((index + 1) % 10 === 0)), 'Multi Moons must be numbers 10, 20, 30, 40, and 50.');
check(Math.abs(BOO_PROBABILITY_TOTAL - 1) < 1e-10, `King Boo probabilities total ${BOO_PROBABILITY_TOTAL}, not 1.`);
for (const kind of ['normal', 'corrupted']) {
  const total = SHINE_OUTCOMES.filter((outcome) => outcome.kind === kind).reduce((sum, outcome) => sum + outcome.probability, 0);
  check(Math.abs(total - 1) < 1e-10, `${kind} Shine probabilities total ${total}, not 1.`);
}

unique(PRODUCERS, 'id', 'Producers');
unique(PRODUCERS, 'name', 'Producers');
unique(PRODUCERS, 'description', 'Producers', true);
unique(BUILDING_UPGRADES, 'id', 'Upgrades');
unique(BUILDING_UPGRADES, 'name', 'Upgrades');
unique(BUILDING_UPGRADES, 'flavour', 'Upgrades', true);
rejectSharedPhrases(BUILDING_UPGRADES, 'flavour', 'Upgrade flavour', 5);
unique(ACHIEVEMENTS, 'id', 'Achievements');
unique(ACHIEVEMENTS, 'name', 'Achievements');
unique(ACHIEVEMENTS, 'flavour', 'Achievements', true);
rejectSharedPhrases(ACHIEVEMENTS, 'flavour', 'Achievement flavour', 5);
unique(POWER_MOONS, 'id', 'Power Moons');
unique(POWER_MOONS, 'name', 'Power Moons');
unique(POWER_MOONS, 'flavour', 'Power Moons', true);
unique(BOO_OUTCOMES, 'id', 'King Boo outcomes');
unique(BOO_OUTCOMES, 'title', 'King Boo outcomes');
unique(BOO_OUTCOMES, 'description', 'King Boo outcomes', true);
unique(SHINE_OUTCOMES, 'id', 'Shine outcomes');
unique(SHINE_OUTCOMES, 'title', 'Shine outcomes');
unique(SHINE_OUTCOMES, 'description', 'Shine outcomes', true);
unique(COSMETICS, 'id', 'Cosmetics');
unique(COSMETICS, 'name', 'Cosmetics');
unique(COSMETICS, 'description', 'Cosmetics', true);
unique(FUEL_MODULES, 'id', 'Odyssey Fuel modules');
unique(FUEL_MODULES, 'name', 'Odyssey Fuel modules');
unique(FUEL_MODULES, 'flavour', 'Odyssey Fuel modules', true);

for (const [category, expected] of Object.entries(ACHIEVEMENT_CATEGORY_COUNTS)) {
  const actual = ACHIEVEMENTS.filter((achievement) => achievement.category === category).length;
  check(actual === expected, `Achievement category ${category} expected ${expected}, found ${actual}.`);
}

for (const upgrade of BUILDING_UPGRADES) {
  if (upgrade.producerId) check(Boolean(PRODUCER_BY_ID[upgrade.producerId]), `Upgrade ${upgrade.id} references missing producer ${upgrade.producerId}.`);
  else check(upgrade.track === 'technique', `Upgrade ${upgrade.id} has no producer and is not a Cappy technique.`);
}
for (const producer of PRODUCERS) {
  const milestones = BUILDING_UPGRADES
    .filter(({ producerId }) => producerId === producer.id)
    .map(({ milestone }) => milestone);
  check(
    milestones.length === MILESTONES.length && MILESTONES.every((milestone) => milestones.includes(milestone)),
    `${producer.name} must have authored copy for every producer milestone.`,
  );
}
for (const moon of POWER_MOONS) {
  for (const effect of moon.effects ?? [moon.effect]) {
    if (effect.type === 'producer-group') for (const id of effect.producerIds) check(Boolean(PRODUCER_BY_ID[id]), `Moon ${moon.id} references missing producer ${id}.`);
  }
}
for (const achievement of ACHIEVEMENTS) {
  check(CONDITION_TYPES.has(achievement.condition.type), `Achievement ${achievement.id} uses unknown condition ${achievement.condition.type}.`);
  if (['producer-owned', 'producer-discovered'].includes(achievement.condition.type)) check(Boolean(PRODUCER_BY_ID[achievement.condition.scope]), `Achievement ${achievement.id} references missing producer.`);
  if (achievement.condition.type === 'moon-collected') check(Boolean(POWER_MOON_BY_ID[achievement.condition.scope]), `Achievement ${achievement.id} references missing Moon.`);
}

const assetPaths = [
  ...PRODUCERS.map(({ icon }) => `public/assets/producers/${icon}`),
  ...new Set(POWER_MOONS.map(({ art }) => `public/assets/moons/${art}`)),
  'public/assets/cappy/cappy-hero.svg', 'public/assets/misc/odyssey-ship.webp',
  'public/assets/ui/kingdom-coin.webp', 'public/assets/ui/og-cappy-clicker.png',
  ...['cap', 'cascade', 'sand', 'wooded', 'lake', 'metro', 'snow', 'luncheon'].map((name) => `public/assets/kingdoms/${name}.webp`),
  ...COSMETICS.filter(({ backdrop }) => backdrop?.mode === 'fixed').map(({ backdrop }) => `public/assets/kingdoms/${backdrop.file}`),
  ...['king-boo', 'slot-machine', 'symbol-pineapple', 'symbol-stu', 'symbol-boo'].map((name) => `public/assets/boo/${name}.webp`),
  'public/assets/shines/shine-sprite.webp', 'public/assets/shines/gloom-shine.webp',
  'public/assets/audio/moon-get.mp3', 'public/assets/audio/multi-moon-get.mp3',
];
for (const path of assetPaths) {
  try { await access(resolve(path)); } catch { failures.push(`Missing local asset: ${path}`); }
}

for (const runtimeFile of ['index.html', 'src/main.js', 'src/ui/app.js', 'src/styles/main.css']) {
  const source = await readFile(resolve(runtimeFile), 'utf8');
  check(!/https?:\/\//i.test(source), `Runtime source ${runtimeFile} contains a remote URL.`);
}

if (failures.length) {
  console.error(`Content validation failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Cappy Clicker content is valid.');
  console.log(`  Producers: ${PRODUCERS.length}`);
  console.log(`  Producer upgrades: ${BUILDING_UPGRADES.length}`);
  console.log(`  Achievements: ${ACHIEVEMENTS.length}`);
  console.log(`  Power Moons: ${POWER_MOONS.length}`);
  console.log(`  Cosmetics: ${COSMETICS.length}`);
  console.log(`  Odyssey Fuel modules: ${FUEL_MODULES.length}`);
  console.log(`  Shine outcomes: ${SHINE_OUTCOMES.length}`);
  console.log(`  King Boo outcomes: ${BOO_OUTCOMES.length}`);
  console.log(`  Local assets checked: ${assetPaths.length}`);
}

export const SHINE_OUTCOMES = [
  { id: 'coin-sunshower', kind: 'normal', probability: 0.36, title: 'Coin Sunshower', description: 'Two minutes of production arrive immediately in one warm, jingling burst.', effect: { type: 'coins-cps', seconds: 120 } },
  { id: 'solar-overtime', kind: 'normal', probability: 0.26, title: 'Solar Overtime', description: 'Every route produces three times as much for forty-five bright seconds.', effect: { type: 'production-multiplier', multiplier: 3, duration: 45 } },
  { id: 'shine-sale', kind: 'normal', probability: 0.17, title: 'Shine Sale', description: 'Producer prices drop by twenty-five percent for ninety seconds.', effect: { type: 'price-multiplier', multiplier: 0.75, duration: 90 } },
  { id: 'cappy-corona', kind: 'normal', probability: 0.11, title: 'Cappy Corona', description: 'Manual throws glow three times brighter for thirty seconds.', effect: { type: 'click-multiplier', multiplier: 3, duration: 30 } },
  { id: 'portable-daylight', kind: 'normal', probability: 0.1, title: 'Portable Daylight', description: 'A temporary fifty-percent global production bonus fills the brochure.', effect: { type: 'global-additive', amount: 0.5, duration: 60 } },
  { id: 'gloom-toll', kind: 'corrupted', probability: 0.4, title: 'Gloom Toll', description: 'The counterfeit Shine pockets twelve percent of your current coins and vanishes.', effect: { type: 'coin-loss', fraction: 0.12 } },
  { id: 'eclipse-shift', kind: 'corrupted', probability: 0.36, title: 'Eclipse Shift', description: 'Every route crashes to fifteen percent production for ninety murky seconds.', effect: { type: 'production-multiplier', multiplier: 0.15, duration: 90 } },
  { id: 'blackout-clause', kind: 'corrupted', probability: 0.2, title: 'Blackout Clause', description: 'Your strongest route loses all power for seventy-five seconds.', effect: { type: 'strongest-producer-disabled', duration: 75 } },
  { id: 'black-sun-jackpot', kind: 'corrupted', probability: 0.04, title: 'Black Sun Jackpot', description: 'The forgery cracks open: one hour of production plus a quarter of your treasury pours out.', temptation: true, effect: { type: 'grand-coins', seconds: 3600, currentFraction: 0.25 } },
];

export const SHINE_OUTCOME_BY_ID = Object.fromEntries(SHINE_OUTCOMES.map((outcome) => [outcome.id, outcome]));

export const SHINE_PROBABILITY_TOTALS = Object.freeze(Object.fromEntries(
  ['normal', 'corrupted'].map((kind) => [kind, SHINE_OUTCOMES
    .filter((outcome) => outcome.kind === kind)
    .reduce((total, outcome) => total + outcome.probability, 0)]),
));

export const GLOOM_TEMPTATION_CHANCE = SHINE_OUTCOMES
  .filter((outcome) => outcome.kind === 'corrupted' && outcome.temptation)
  .reduce((total, outcome) => total + outcome.probability, 0);

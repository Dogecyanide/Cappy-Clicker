export const SHINE_OUTCOMES = [
  { id: 'coin-sunshower', kind: 'normal', probability: 0.34, title: 'Coin Sunshower', description: 'Two minutes of production arrive immediately in one warm, jingling burst.', effect: { type: 'coins-cps', seconds: 120 } },
  { id: 'solar-overtime', kind: 'normal', probability: 0.24, title: 'Solar Overtime', description: 'Every route produces three times as much for forty-five bright seconds.', effect: { type: 'production-multiplier', multiplier: 3, duration: 45 } },
  { id: 'shine-sale', kind: 'normal', probability: 0.16, title: 'Shine Sale', description: 'Producer prices drop by twenty-five percent for ninety seconds.', effect: { type: 'price-multiplier', multiplier: 0.75, duration: 90 } },
  { id: 'cappy-corona', kind: 'normal', probability: 0.11, title: 'Cappy Corona', description: 'Manual throws glow three times brighter for thirty seconds.', effect: { type: 'click-multiplier', multiplier: 3, duration: 30 } },
  { id: 'portable-daylight', kind: 'normal', probability: 0.1, title: 'Portable Daylight', description: 'A temporary fifty-percent global production bonus fills the brochure.', effect: { type: 'global-additive', amount: 0.5, duration: 60 } },
  { id: 'grand-shine-jackpot', kind: 'normal', probability: 0.05, title: 'Grand Shine Jackpot', description: 'Five minutes of production and a small slice of your treasury flash into view.', effect: { type: 'grand-coins', seconds: 300, currentFraction: 0.02 } },
  { id: 'gloom-toll', kind: 'corrupted', probability: 0.45, title: 'Gloom Toll', description: 'The counterfeit Shine pockets three percent of your current coins and vanishes.', effect: { type: 'coin-loss', fraction: 0.03 } },
  { id: 'eclipse-shift', kind: 'corrupted', probability: 0.35, title: 'Eclipse Shift', description: 'Production is cut in half for thirty-five seconds while the sky apologizes.', effect: { type: 'production-multiplier', multiplier: 0.5, duration: 35 } },
  { id: 'blackout-clause', kind: 'corrupted', probability: 0.2, title: 'Blackout Clause', description: 'Your strongest route loses power for twenty seconds.', effect: { type: 'strongest-producer-disabled', duration: 20 } },
];

export const SHINE_OUTCOME_BY_ID = Object.fromEntries(SHINE_OUTCOMES.map((outcome) => [outcome.id, outcome]));

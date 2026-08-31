export const BOO_SYMBOLS = {
  coin: 'Kingdom Coin', crown: 'Golden Crown', cap: 'Cappy', banana: 'Banana Peel',
  boo: 'Boo', onion: 'Turnip', shell: 'Shell', nothing: 'Empty Pocket',
};

export const BOO_OUTCOMES = [
  { id: 'royal-jackpot', tier: 'positive', probability: 0.09, symbols: ['crown', 'crown', 'coin'], title: 'Royal Flush-ish', description: 'Gain five minutes of current production.', effect: { type: 'cps-payout', seconds: 300 } },
  { id: 'double-shift', tier: 'positive', probability: 0.09, symbols: ['coin', 'coin', 'crown'], title: 'Double Shift', description: 'Automatic production ×2 for 60 seconds.', effect: { type: 'production-multiplier', multiplier: 2, duration: 60 } },
  { id: 'cap-carnival', tier: 'positive', probability: 0.08, symbols: ['cap', 'cap', 'crown'], title: 'Cap Carnival', description: 'Cappy clicks ×10 for 20 seconds.', effect: { type: 'click-multiplier', multiplier: 10, duration: 20 } },
  { id: 'favourite-customer', tier: 'positive', probability: 0.08, symbols: ['crown', 'cap', 'coin'], title: 'Favourite Customer', description: 'Your strongest producer works ×5 for 90 seconds.', effect: { type: 'strongest-producer-multiplier', multiplier: 5, duration: 90 } },
  { id: 'coin-room-key', tier: 'positive', probability: 0.07, symbols: ['coin', 'crown', 'coin'], title: 'Coin Room Key', description: 'Gain three minutes of current production plus 100 coins.', effect: { type: 'cps-payout', seconds: 180, flat: 100 } },
  { id: 'house-comps-dessert', tier: 'positive', probability: 0.07, symbols: ['onion', 'coin', 'crown'], title: 'House Comps Dessert', description: 'All production rises 50% for two minutes.', effect: { type: 'production-multiplier', multiplier: 1.5, duration: 120 } },

  { id: 'professional-laugh', tier: 'neutral', probability: 0.05, symbols: ['boo', 'nothing', 'boo'], title: 'Professional Laugh', description: 'King Boo laughs from the diaphragm and awards nothing.', effect: { type: 'none' } },
  { id: 'consultation-fee', tier: 'neutral', probability: 0.05, symbols: ['nothing', 'coin', 'nothing'], title: 'Free Consultation Fee', description: 'You receive seven coins and an invoice for seven coins.', effect: { type: 'flat-payout', amount: 0 } },
  { id: 'decorative-banana', tier: 'neutral', probability: 0.05, symbols: ['banana', 'banana', 'cap'], title: 'Decorative Banana', description: 'A banana appears on your passport for sixty seconds. It does nothing.', effect: { type: 'cosmetic', duration: 60 } },

  { id: 'sticky-buttons', tier: 'mild-negative', probability: 0.08, symbols: ['banana', 'cap', 'banana'], title: 'Sticky Buttons', description: 'Cappy clicks lose 25% power for 30 seconds.', effect: { type: 'click-multiplier', multiplier: 0.75, duration: 30 } },
  { id: 'parking-ticket', tier: 'mild-negative', probability: 0.08, symbols: ['shell', 'coin', 'banana'], title: 'Inter-Kingdom Parking Ticket', description: 'Lose up to 45 seconds of current production.', effect: { type: 'cps-loss', seconds: 45, bankCap: 0.08 } },
  { id: 'union-break', tier: 'mild-negative', probability: 0.07, symbols: ['nothing', 'onion', 'boo'], title: 'Mandatory Union Break', description: 'Your strongest producer works at half speed for one minute.', effect: { type: 'strongest-producer-multiplier', multiplier: 0.5, duration: 60 } },
  { id: 'surge-pricing', tier: 'mild-negative', probability: 0.07, symbols: ['coin', 'banana', 'shell'], title: 'Surge Pricing', description: 'Producer prices rise 20% for one minute.', effect: { type: 'price-multiplier', multiplier: 1.2, duration: 60 } },

  { id: 'lights-out', tier: 'severe-negative', probability: 0.02, symbols: ['boo', 'shell', 'boo'], title: 'Lights Out', description: 'Your strongest producer is disabled for two minutes.', effect: { type: 'strongest-producer-disabled', duration: 120 } },
  { id: 'premium-cover-charge', tier: 'severe-negative', probability: 0.015, symbols: ['crown', 'banana', 'boo'], title: 'Premium Cover Charge', description: 'All producer prices rise 50% for two minutes.', effect: { type: 'price-multiplier', multiplier: 1.5, duration: 120 } },
  { id: 'bank-inspection', tier: 'severe-negative', probability: 0.015, symbols: ['coin', 'boo', 'shell'], title: 'Bank Inspection', description: 'King Boo confiscates 10% of your current bank.', effect: { type: 'bank-percent-loss', amount: 0.1 } },
  { id: 'cold-table', tier: 'severe-negative', probability: 0.015, symbols: ['nothing', 'boo', 'crown'], title: 'Cold Table', description: 'Automatic production is cut in half for 90 seconds.', effect: { type: 'production-multiplier', multiplier: 0.5, duration: 90 } },

  { id: 'house-always-wins', tier: 'catastrophic', probability: 0.005, symbols: ['boo', 'boo', 'boo'], title: 'THE HOUSE ALWAYS WINS', description: 'Lose 35% of your coins. Your strongest producer is disabled for five minutes.', effect: { type: 'catastrophe', bankLoss: 0.35, duration: 300 } },
];

export const BOO_OUTCOME_BY_ID = Object.fromEntries(BOO_OUTCOMES.map((outcome) => [outcome.id, outcome]));
export const BOO_PROBABILITY_TOTAL = BOO_OUTCOMES.reduce((total, outcome) => total + outcome.probability, 0);


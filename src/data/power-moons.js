import { D } from '../core/numbers.js';
import { PRODUCERS } from './buildings.js';

const LEGACY_MOONS = [
  ['moon-first-stamp', 'First Stamp on the Passport', 'The brochure called it priceless. The cashier had a more specific opinion.'],
  ['moon-cap-trick', 'Moonlit Cap Trick', 'Cappy learns the ancient technique of returning with exact change.'],
  ['moon-red-eye', 'Red-Eye to the Sand Kingdom', 'Includes one checked suitcase and unlimited mysterious desert wind.'],
  ['moon-sleeper-car', 'Odyssey Sleeper Car', 'The seats recline. The economy refuses to.'],
  ['moon-botanical-overtime', 'Botanical Overtime', 'Every watering can now has a tiny motivational whistle.'],
  ['moon-coupon', 'Suspiciously Valid Moon Coupon', 'No expiration date. Several claw marks. Accepted reluctantly.'],
  ['moon-metropolitan', 'Metropolitan Moonpass', 'Good for scooters, taxis, and one accidental trip up a skyscraper.'],
  ['moon-lucky-lining', 'Silver Lining, Gold Receipt', 'King Boo hates the fine print, which is the strongest endorsement available.'],
  ['moon-pocket-constellation', 'Pocket Constellation', 'Folds neatly. Absolutely do not iron the stars.'],
  ['moon-industrial-tour', 'Tenfold Multi Moon', 'Three Moons arrived together and immediately requested a much larger display shelf.'],
  ['moon-long-weekend', 'Very Long Lunar Weekend', 'Set your out-of-office reply to “collecting celestial rocks.”'],
  ['moon-wholesale-orbit', 'Wholesale Orbit Permit', 'Purchased directly from the moon, cutting out at least two middlemen.'],
  ['moon-ruined-sky', 'A Better Class of Ruined Sky', 'Dragon-tested, Sphinx-questioned, Broodal-invoiced.'],
  ['moon-golden-itinerary', 'The Golden Itinerary', 'Every route is scenic when the map is plated in gold.'],
  ['moon-return-ticket', 'Return Ticket to Everywhere', 'Stamped by twenty kingdoms and one confused customs Goomba.'],
  ['moon-darker-side-postcard', 'Postcard from the Darker Side', '“Wish you were here.” You are here. The postcard remains smug.'],
];

// Existing save IDs retain their original bonuses. Moon #10 layers its former
// industrial-route bonus into the new Multi Moon reward.
const LEGACY_EFFECTS = {
  'moon-first-stamp': [{ type: 'global-additive', amount: 0.1 }],
  'moon-cap-trick': [{ type: 'click-multiplier', multiplier: 3 }],
  'moon-red-eye': [{ type: 'producer-group', producerIds: ['frog-capture', 'bonneton-tailor', 'goomba-stack', 'chain-chomp-quarry'], multiplier: 2 }],
  'moon-sleeper-car': [{ type: 'offline-hours', hours: 4 }],
  'moon-botanical-overtime': [{ type: 'producer-group', producerIds: ['uproot-nursery', 'jaxi-express', 'lake-boutique', 'steam-gardener-workshop'], multiplier: 2.5 }],
  'moon-coupon': [{ type: 'price-discount', amount: 0.05 }],
  'moon-metropolitan': [{ type: 'producer-group', producerIds: ['new-donk-scooters', 'shiverian-racing', 'gushen-couriers', 'volbono-kitchen'], multiplier: 3 }],
  'moon-lucky-lining': [{ type: 'event-luck', amount: 0.08 }],
  'moon-pocket-constellation': [{ type: 'global-additive', amount: 0.2 }],
  'moon-industrial-tour': [{ type: 'producer-group', producerIds: ['pokio-mint', 'sherm-foundry', 'trex-expedition', 'odyssey-crew'], multiplier: 3.5 }],
  'moon-long-weekend': [{ type: 'offline-hours', hours: 8 }],
  'moon-wholesale-orbit': [{ type: 'price-discount', amount: 0.05 }],
  'moon-ruined-sky': [{ type: 'producer-group', producerIds: ['sphinx-observatory', 'broodal-agency', 'ruined-dragon-hoard', 'darker-side-armada'], multiplier: 4 }],
  'moon-golden-itinerary': [{ type: 'global-additive', amount: 0.3 }],
  'moon-return-ticket': [{ type: 'click-multiplier', multiplier: 10 }],
  'moon-darker-side-postcard': [{ type: 'global-additive', amount: 0.5 }],
};

const EXTRA_TITLES = [
  'Star Bit Expense Account', 'Delfino Night Ferry', 'Battlefield Picnic Permit', 'Moonlit Warp-Pipe Transfer',
  'Bell Hill Moon Chime', 'Galaxy Garden Lease', 'Coconut Mall After Hours', 'Paper-Thin Orbit',
  'Beanbean Boarding Pass', 'Lunar Lost-Luggage Desk', 'Poltergust Lunar Filter', 'Rainbow Road Layover',
  'Honeyhive Night Shift', 'Whomp-Proof Moon Crate', 'Ricco Harbor Tide Table', 'Comet Tail Warranty',
  'Cappy’s Astral Pocket', 'Shine Gate Moon Visa', 'Mount Wario Ski Lift', 'Celestial Transfer Window',
  'Rogueport Customs Stamp', 'Yoshi Egg Eclipse', 'New Donk Grid Reserve', 'Cat-Bell Constellation',
  'Toad Town Moon Market', 'World Crown Dress Rehearsal', 'Odyssey Emergency Orbit', 'Darker Side Return Address',
  'Grand Tour Celestial Key', 'Moonbeam Frequent-Flyer Card', 'Luma-Approved Ledger', 'The Last Moon Before Breakfast',
  'Impossible Souvenir Orbit', 'Passport Full of Starlight',
];

const FLAVOUR_TEMPLATES = [
  (name) => `${name} came with a velvet pouch and several avoidable handling fees.`,
  (name) => `The Odyssey files ${name} under “fragile, luminous, and somehow taxable.”`,
  (name) => `${name} makes a fine night-light and an alarming line item.`,
  (name) => `Customs waved ${name} through after it promised not to affect the tides.`,
  (name) => `A Toad appraiser valued ${name} at one gasp and two clipboards.`,
  (name) => `${name} refuses to orbit anything with a lower credit rating.`,
  (name) => `The brochure describes ${name} as “nearby” in the astronomical sense.`,
  (name) => `${name} was found behind a suspiciously moon-shaped lost-and-found ticket.`,
  (name) => `Three Lumas polished ${name}; a fourth prepared the invoice.`,
  (name) => `${name} adds one more stamp and removes several reasonable expectations.`,
];

const MULTI_LABELS = {
  10: 'MULTI MOON: global ×3 and industrial routes ×3.5',
  20: 'MULTI MOON: global ×4 and +4 offline hours',
  30: 'MULTI MOON: global ×5 and fusions ×1.25',
  40: 'MULTI MOON: global ×7 and Shine payouts ×2',
  50: 'FINAL MULTI MOON: global ×10 and every producer ×2',
};

const MULTI_NAMES = {
  10: 'Tenfold Multi Moon',
  20: 'Twentyfold Multi Moon',
  30: 'Thirtyfold Multi Moon',
  40: 'Fortyfold Multi Moon',
  50: 'Fiftyfold Multi Moon',
};

function moonCost(number) {
  let cost = D('2.5e4');
  for (let index = 2; index <= number; index += 1) cost = cost.mul(index % 10 === 0 ? 1e5 : 100);
  return cost.toString();
}

function regularEffects(number) {
  const decade = Math.floor((number - 1) / 10);
  const position = ((number - 1) % 10) + 1;
  const groupOffset = position === 7 ? 4 : 0;
  const producerIds = PRODUCERS.slice(decade * 8 + groupOffset, decade * 8 + groupOffset + 4).map(({ id }) => id);
  if (position === 1) return [{ type: 'global-additive', amount: 0.1 }];
  if (position === 2 || position === 7) return [{ type: 'producer-group', producerIds, multiplier: 2 }];
  if (position === 3) return [{ type: 'price-discount', amount: 0.04 }];
  if (position === 4) return [{ type: 'flat-click-multiplier', multiplier: 2 }];
  if (position === 5) return [{ type: 'offline-hours', hours: [2, 3, 3, 4, 4][decade] }];
  if (position === 6) return [{ type: 'shine-payout', multiplier: 1.12 }];
  if (position === 8) return [{ type: 'fusion-multiplier', multiplier: 1.1 }];
  return [{ type: 'event-luck', amount: 0.02 }];
}

function multiEffects(number) {
  if (number === 10) return [{ type: 'global-multiplier', multiplier: 3 }];
  if (number === 20) return [{ type: 'global-multiplier', multiplier: 4 }, { type: 'offline-hours', hours: 4 }];
  if (number === 30) return [{ type: 'global-multiplier', multiplier: 5 }, { type: 'fusion-multiplier', multiplier: 1.25 }];
  if (number === 40) return [{ type: 'global-multiplier', multiplier: 7 }, { type: 'shine-payout', multiplier: 2 }];
  return [{ type: 'global-multiplier', multiplier: 10 }, { type: 'producer-group', producerIds: PRODUCERS.map(({ id }) => id), multiplier: 2 }];
}

function effectLabel(number, effects) {
  if (MULTI_LABELS[number]) return MULTI_LABELS[number];
  const effect = effects[0];
  if (effect.type === 'global-additive') return '+10% global production';
  if (effect.type === 'producer-group') return `${effect.producerIds.length} route producers ×2`;
  if (effect.type === 'price-discount') return 'Producer prices −4%';
  if (effect.type === 'flat-click-multiplier') return 'Cappy’s flat click value ×2';
  if (effect.type === 'offline-hours') return `+${effect.hours} hour offline cap`;
  if (effect.type === 'shine-payout') return 'Rare Shine payouts ×1.12';
  if (effect.type === 'fusion-multiplier') return 'Producer fusion bonuses ×1.10';
  return 'King Boo odds lean 2% kinder';
}

export const POWER_MOONS = Array.from({ length: 50 }, (_, index) => {
  const number = index + 1;
  const legacy = LEGACY_MOONS[index];
  const title = MULTI_NAMES[number] ?? legacy?.[1] ?? EXTRA_TITLES[index - LEGACY_MOONS.length];
  const isMulti = number % 10 === 0;
  const legacyEffects = legacy ? LEGACY_EFFECTS[legacy[0]] : null;
  const effects = isMulti
    ? [...multiEffects(number), ...(number === 10 ? legacyEffects ?? [] : [])]
    : legacyEffects ?? regularEffects(number);
  return {
    id: legacy?.[0] ?? `moon-grand-tour-${number}`,
    name: title,
    cost: moonCost(number),
    art: 'power-moon.svg',
    flavour: legacy?.[2] ?? FLAVOUR_TEMPLATES[index % FLAVOUR_TEMPLATES.length](title),
    effects,
    effect: effects[0],
    effectLabel: effectLabel(number, effects),
    isMulti,
  };
});

export const POWER_MOON_BY_ID = Object.fromEntries(POWER_MOONS.map((moon) => [moon.id, moon]));

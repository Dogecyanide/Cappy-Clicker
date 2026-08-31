export const POWER_MOONS = [
  {
    id: 'moon-first-stamp', name: 'First Stamp on the Passport', cost: '2.5e4', art: 'power-moon.svg',
    flavour: 'The brochure called it priceless. The cashier had a more specific opinion.',
    effect: { type: 'global-additive', amount: 0.1 }, effectLabel: '+10% global production',
  },
  {
    id: 'moon-cap-trick', name: 'Moonlit Cap Trick', cost: '1.5e6', art: 'power-moon.svg',
    flavour: 'Cappy learns the ancient technique of returning with exact change.',
    effect: { type: 'click-multiplier', multiplier: 3 }, effectLabel: 'Cappy clicks ×3',
  },
  {
    id: 'moon-red-eye', name: 'Red-Eye to the Sand Kingdom', cost: '9e7', art: 'power-moon.svg',
    flavour: 'Includes one checked suitcase and unlimited mysterious desert wind.',
    effect: { type: 'producer-group', producerIds: ['frog-capture', 'bonneton-tailor', 'goomba-stack', 'chain-chomp-quarry'], multiplier: 2 }, effectLabel: 'First four producers ×2',
  },
  {
    id: 'moon-sleeper-car', name: 'Odyssey Sleeper Car', cost: '6e9', art: 'power-moon.svg',
    flavour: 'The seats recline. The economy refuses to.',
    effect: { type: 'offline-hours', hours: 4 }, effectLabel: '+4 hour offline cap',
  },
  {
    id: 'moon-botanical-overtime', name: 'Botanical Overtime', cost: '5e11', art: 'power-moon.svg',
    flavour: 'Every watering can now has a tiny motivational whistle.',
    effect: { type: 'producer-group', producerIds: ['uproot-nursery', 'jaxi-express', 'lake-boutique', 'steam-gardener-workshop'], multiplier: 2.5 }, effectLabel: 'Producers 5–8 ×2.5',
  },
  {
    id: 'moon-coupon', name: 'Suspiciously Valid Moon Coupon', cost: '4e13', art: 'power-moon.svg',
    flavour: 'No expiration date. Several claw marks. Accepted reluctantly.',
    effect: { type: 'price-discount', amount: 0.05 }, effectLabel: 'Producer prices −5%',
  },
  {
    id: 'moon-metropolitan', name: 'Metropolitan Moonpass', cost: '4e15', art: 'power-moon.svg',
    flavour: 'Good for scooters, taxis, and one accidental trip up a skyscraper.',
    effect: { type: 'producer-group', producerIds: ['new-donk-scooters', 'shiverian-racing', 'gushen-couriers', 'volbono-kitchen'], multiplier: 3 }, effectLabel: 'Producers 9–12 ×3',
  },
  {
    id: 'moon-lucky-lining', name: 'Silver Lining, Gold Receipt', cost: '5e17', art: 'power-moon.svg',
    flavour: 'King Boo hates the fine print, which is the strongest endorsement available.',
    effect: { type: 'event-luck', amount: 0.08 }, effectLabel: 'Boo outcomes lean slightly kinder',
  },
  {
    id: 'moon-pocket-constellation', name: 'Pocket Constellation', cost: '8e19', art: 'power-moon.svg',
    flavour: 'Folds neatly. Absolutely do not iron the stars.',
    effect: { type: 'global-additive', amount: 0.2 }, effectLabel: '+20% global production',
  },
  {
    id: 'moon-industrial-tour', name: 'Industrial Tourism Board', cost: '2e22', art: 'power-moon.svg',
    flavour: 'The complimentary helmet is mostly ceremonial.',
    effect: { type: 'producer-group', producerIds: ['pokio-mint', 'sherm-foundry', 'trex-expedition', 'odyssey-crew'], multiplier: 3.5 }, effectLabel: 'Producers 13–16 ×3.5',
  },
  {
    id: 'moon-long-weekend', name: 'Very Long Lunar Weekend', cost: '7e24', art: 'power-moon.svg',
    flavour: 'Set your out-of-office reply to “collecting celestial rocks.”',
    effect: { type: 'offline-hours', hours: 8 }, effectLabel: '+8 hour offline cap',
  },
  {
    id: 'moon-wholesale-orbit', name: 'Wholesale Orbit Permit', cost: '3e27', art: 'power-moon.svg',
    flavour: 'Purchased directly from the moon, cutting out at least two middlemen.',
    effect: { type: 'price-discount', amount: 0.05 }, effectLabel: 'Producer prices −5% more',
  },
  {
    id: 'moon-ruined-sky', name: 'A Better Class of Ruined Sky', cost: '2e30', art: 'power-moon.svg',
    flavour: 'Dragon-tested, Sphinx-questioned, Broodal-invoiced.',
    effect: { type: 'producer-group', producerIds: ['sphinx-observatory', 'broodal-agency', 'ruined-dragon-hoard', 'darker-side-armada'], multiplier: 4 }, effectLabel: 'Final four producers ×4',
  },
  {
    id: 'moon-golden-itinerary', name: 'The Golden Itinerary', cost: '2e33', art: 'power-moon.svg',
    flavour: 'Every route is scenic when the map is plated in gold.',
    effect: { type: 'global-additive', amount: 0.3 }, effectLabel: '+30% global production',
  },
  {
    id: 'moon-return-ticket', name: 'Return Ticket to Everywhere', cost: '3e36', art: 'power-moon.svg',
    flavour: 'Stamped by twenty kingdoms and one confused customs Goomba.',
    effect: { type: 'click-multiplier', multiplier: 10 }, effectLabel: 'Cappy clicks ×10',
  },
  {
    id: 'moon-darker-side-postcard', name: 'Postcard from the Darker Side', cost: '6e39', art: 'power-moon.svg',
    flavour: '“Wish you were here.” You are here. The postcard remains smug.',
    effect: { type: 'global-additive', amount: 0.5 }, effectLabel: '+50% global production',
  },
];

export const POWER_MOON_BY_ID = Object.fromEntries(POWER_MOONS.map((moon) => [moon.id, moon]));

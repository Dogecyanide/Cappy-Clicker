export const PRODUCER_GROWTH = 1.15;

export const PRODUCERS = [
  { id: 'frog-capture', name: 'Frog Capture', kingdom: 'Cascade', baseCost: '15', baseCps: '0.4', icon: 'frog.webp', description: 'Small hops, formal moustaches, surprisingly tidy ledgers.' },
  { id: 'bonneton-tailor', name: 'Bonneton Tailor', kingdom: 'Cap', baseCost: '100', baseCps: '2.4', icon: 'bonneton-tailor.webp', description: 'Stitches ambition into every brim and invoices by the feather.' },
  { id: 'goomba-stack', name: 'Goomba Stack', kingdom: 'Mushroom', baseCost: '1.1e3', baseCps: '18', icon: 'goomba-stack.webp', description: 'Vertically integrated management with very questionable balance.' },
  { id: 'chain-chomp-quarry', name: 'Chain Chomp Quarry', kingdom: 'Cascade', baseCost: '1.3e4', baseCps: '115', icon: 'chain-chomp.webp', description: 'Turns geology into gravel, then demands walkies.' },
  { id: 'uproot-nursery', name: 'Uproot Nursery', kingdom: 'Wooded', baseCost: '1.7e5', baseCps: '780', icon: 'uproot.webp', description: 'Cultivates long legs, tall flowers, and aggressive workplace growth.' },
  { id: 'jaxi-express', name: 'Jaxi Express', kingdom: 'Sand', baseCost: '2.3e6', baseCps: '9.2e3', icon: 'jaxi.webp', description: 'The meter starts before you finish screaming.' },
  { id: 'lake-boutique', name: 'Lake Kingdom Boutique', kingdom: 'Lake', baseCost: '3.5e7', baseCps: '8.75e4', icon: 'lake-boutique.webp', description: 'High fashion, low oxygen, immaculate waterproof receipts.' },
  { id: 'steam-gardener-workshop', name: 'Steam Gardener Workshop', kingdom: 'Wooded', baseCost: '5.5e8', baseCps: '9.2e5', icon: 'steam-gardener.webp', description: 'Waters flowers with industrial precision and union-approved steam.' },
  { id: 'new-donk-scooters', name: 'New Donk Scooter Fleet', kingdom: 'Metro', baseCost: '9e9', baseCps: '1.2e7', icon: 'new-donk-scooter.webp', description: 'Every curb is a ramp when the insurance form is already signed.' },
  { id: 'shiverian-racing', name: 'Shiverian Racing League', kingdom: 'Snow', baseCost: '1e11', baseCps: '1.15e8', icon: 'shiverian-racer.webp', description: 'Round athletes, sharp corners, zero leftover cake.' },
  { id: 'gushen-couriers', name: 'Gushen Courier Fleet', kingdom: 'Seaside', baseCost: '3e12', baseCps: '1.36e9', icon: 'gushen.webp', description: 'Express delivery by seawater jet. Dry parcels cost extra.' },
  { id: 'volbono-kitchen', name: 'Volbono Kitchen', kingdom: 'Luncheon', baseCost: '6e13', baseCps: '1.72e10', icon: 'volbonans.webp', description: 'Simmering soup, molten cheese, and one extremely confident fork.' },
  { id: 'pokio-mint', name: 'Pokio Mint', kingdom: 'Bowser', baseCost: '1.3e15', baseCps: '2.17e11', icon: 'pokio.webp', description: 'Pecks legal tender from walls no auditor has dared to inspect.' },
  { id: 'sherm-foundry', name: 'Sherm Foundry', kingdom: 'Metro', baseCost: '3e16', baseCps: '3e12', icon: 'sherm.webp', description: 'Heavy industry improves when the machinery has a moustache.' },
  { id: 'trex-expedition', name: 'T-Rex Expedition', kingdom: 'Cascade', baseCost: '7.5e17', baseCps: '4.17e13', icon: 't-rex.webp', description: 'An archaeological dig where the exhibit handles the shovel.' },
  { id: 'odyssey-crew', name: 'Odyssey Crew', kingdom: 'Worldwide', baseCost: '2e19', baseCps: '6.25e14', icon: 'odyssey-crew.webp', description: 'Keeps the sails polished and the globe pointed toward profit.' },
  { id: 'sphinx-observatory', name: 'Sphinx Observatory', kingdom: 'Moon', baseCost: '6e20', baseCps: '1e16', icon: 'sphynx.webp', description: 'Answers cosmic questions, provided you phrase the invoice correctly.' },
  { id: 'broodal-agency', name: 'Broodal Wedding Agency', kingdom: 'Moon', baseCost: '2e22', baseCps: '1.67e17', icon: 'broodals.webp', description: 'Plans unforgettable ceremonies and conveniently forgettable liabilities.' },
  { id: 'ruined-dragon-hoard', name: 'Ruined Dragon Hoard', kingdom: 'Ruined', baseCost: '8e23', baseCps: '6e19', icon: 'ruined-dragon.webp', description: 'Ancient treasure guarded by a dragon with modern portfolio theory.' },
  { id: 'darker-side-armada', name: 'Darker Side Armada', kingdom: 'Darker Side', baseCost: '4e25', baseCps: '2e21', icon: 'darker-side.webp', description: 'A moonlit fleet sailing beyond reason, gravity, and budget approval.' },
];

export const PRODUCER_BY_ID = Object.fromEntries(PRODUCERS.map((producer) => [producer.id, producer]));

export const PRODUCER_GROWTH = 1.15;

// Early fleets keep the familiar 15% clicker curve. Large operations earn
// increasingly efficient bulk logistics so the 350–1,000 ownership game is a
// long-term climb rather than an exponential dead end.
export const PRODUCER_GROWTH_SEGMENTS = [
  { until: 50, growth: PRODUCER_GROWTH },
  { until: 100, growth: 1.07 },
  { until: 200, growth: 1.03 },
  { until: 350, growth: 1.01 },
  { until: 500, growth: 1.006 },
  { until: 750, growth: 1.003 },
  { until: 1_000, growth: 1.0015 },
  { until: Number.POSITIVE_INFINITY, growth: PRODUCER_GROWTH },
];

// The route deliberately interleaves Mario series. Existing ids stay stable so
// older CAPPY2 saves keep every producer they already owned.
export const PRODUCERS = [
  { id: 'frog-capture', name: 'Frog Capture', kingdom: 'Cascade', series: 'Odyssey', baseCost: '15', baseCps: '0.4', icon: 'frog.webp', artMode: 'cutout', description: 'Small hops, formal moustaches, surprisingly tidy ledgers.' },
  { id: 'bonneton-tailor', name: 'Bonneton Tailor', kingdom: 'Cap', series: 'Odyssey', baseCost: '100', baseCps: '2.4', icon: 'bonneton-tailor.webp', artMode: 'cutout', description: 'Stitches ambition into every brim and invoices by the feather.' },
  { id: 'bobomb-battlefield', name: 'Bob-omb Battlefield Battery', kingdom: 'Mushroom', series: 'Super Mario 64', baseCost: '1.1e3', baseCps: '18', icon: 'bobomb-battlefield.webp', artMode: 'scenic', description: 'A mountain of cannon permits, red coins, and highly motivated explosives.' },
  { id: 'goomba-stack', name: 'Goomba Stack', kingdom: 'Mushroom', series: 'Odyssey', baseCost: '1.3e4', baseCps: '115', icon: 'goomba-stack.webp', artMode: 'cutout', description: 'Vertically integrated management with very questionable balance.' },
  { id: 'delfino-plaza', name: 'Delfino Plaza Boardwalk', kingdom: 'Isle Delfino', series: 'Sunshine', baseCost: '1.7e5', baseCps: '780', icon: 'delfino-plaza.webp', artMode: 'scenic', description: 'Sunshine, fruit stalls, and a municipal obsession with unusual plumbing.' },
  { id: 'chain-chomp-quarry', name: 'Chain Chomp Quarry', kingdom: 'Cascade', series: 'Odyssey', baseCost: '2.3e6', baseCps: '9.2e3', icon: 'chain-chomp.webp', artMode: 'cutout', description: 'Turns geology into gravel, then demands walkies.' },
  { id: 'cat-bell-hills', name: 'Cat-Bell Hills Bellworks', kingdom: 'Sprixie', series: '3D World', baseCost: '3.5e7', baseCps: '8.75e4', icon: 'super-bell-hill.webp', artMode: 'scenic', description: 'Green hills manufacture golden bells and an alarming amount of cat confidence.' },
  { id: 'uproot-nursery', name: 'Uproot Nursery', kingdom: 'Wooded', series: 'Odyssey', baseCost: '5.5e8', baseCps: '9.2e5', icon: 'uproot.webp', artMode: 'cutout', description: 'Cultivates long legs, tall flowers, and aggressive workplace growth.' },
  { id: 'choco-mountain', name: 'Choco Mountain Railway', kingdom: 'Mushroom Cup', series: 'Mario Kart', baseCost: '9e9', baseCps: '1.2e7', icon: 'choco-mountain.webp', artMode: 'cutout', description: 'Moves freight by rockslide because switchbacks were apparently too sensible.' },
  { id: 'jaxi-express', name: 'Jaxi Express', kingdom: 'Sand', series: 'Odyssey', baseCost: '1e11', baseCps: '1.15e8', icon: 'jaxi.webp', artMode: 'cutout', description: 'The meter starts before you finish screaming.' },
  { id: 'yoshis-island', name: "Yoshi's Island Egg Co-op", kingdom: "Yoshi's Island", series: "Yoshi's Island", baseCost: '3e12', baseCps: '1.36e9', icon: 'yoshis-island.webp', artMode: 'scenic', description: 'Turns fruit into eggs, eggs into logistics, and logistics into cheerful panic.' },
  { id: 'lake-boutique', name: 'Lake Kingdom Boutique', kingdom: 'Lake', series: 'Odyssey', baseCost: '6e13', baseCps: '1.72e10', icon: 'lake-boutique.webp', artMode: 'cutout', description: 'High fashion, low oxygen, immaculate waterproof receipts.' },
  { id: 'toad-town-bazaar', name: 'Toad Town Bazaar', kingdom: 'Mushroom', series: 'Paper Mario', baseCost: '1.3e15', baseCps: '2.17e11', icon: 'toad-town.webp', artMode: 'scenic', description: 'A paper-thin commercial district with surprisingly three-dimensional margins.' },
  { id: 'steam-gardener-workshop', name: 'Steam Gardener Workshop', kingdom: 'Wooded', series: 'Odyssey', baseCost: '3e16', baseCps: '3e12', icon: 'steam-gardener.webp', artMode: 'cutout', description: 'Waters flowers with industrial precision and union-approved steam.' },
  { id: 'gusty-garden', name: 'Gusty Garden Conservatory', kingdom: 'Galaxy', series: 'Galaxy', baseCost: '7.5e17', baseCps: '4.17e13', icon: 'gusty-garden.webp', artMode: 'scenic', description: 'Bottles planetoid breezes and sells them back to gravity by the gust.' },
  { id: 'new-donk-scooters', name: 'New Donk Scooter Fleet', kingdom: 'Metro', series: 'Odyssey', baseCost: '2e19', baseCps: '6.25e14', icon: 'new-donk-scooter.webp', artMode: 'cutout', description: 'Every curb is a ramp when the insurance form is already signed.' },
  { id: 'shiverian-racing', name: 'Shiverian Racing League', kingdom: 'Snow', series: 'Odyssey', baseCost: '6e20', baseCps: '1e16', icon: 'shiverian-racer.webp', artMode: 'cutout', description: 'Round athletes, sharp corners, zero leftover cake.' },
  { id: 'volbono-kitchen', name: 'Volbono Kitchen', kingdom: 'Luncheon', series: 'Odyssey', baseCost: '2e22', baseCps: '1.67e17', icon: 'volbonans.webp', artMode: 'cutout', description: 'Simmering soup, molten cheese, and one extremely confident fork.' },
  { id: 'ruined-dragon-hoard', name: 'Ruined Dragon Hoard', kingdom: 'Ruined', series: 'Odyssey', baseCost: '8e23', baseCps: '6e19', icon: 'ruined-dragon.webp', artMode: 'cutout', description: 'Ancient treasure guarded by a dragon with modern portfolio theory.' },
  { id: 'darker-side-armada', name: 'Darker Side Armada', kingdom: 'Darker Side', series: 'Odyssey', baseCost: '4e25', baseCps: '2e21', icon: 'darker-side.webp', artMode: 'scenic', description: 'A moonlit fleet sailing beyond reason, gravity, and budget approval.' },
  { id: 'comet-observatory', name: 'Comet Observatory', kingdom: 'Cosmos', series: 'Galaxy', baseCost: '1.6e27', baseCps: '6.8e22', icon: 'comet-observatory.webp', artMode: 'cutout', description: 'Rosalina approves the itinerary; the Lumas approve the snack budget.' },
  { id: 'new-donk-generator', name: 'New Donk City Power Generator', kingdom: 'Metro', series: 'Odyssey', baseCost: '6.4e28', baseCps: '2.3e24', icon: 'new-donk-power.webp', artMode: 'cutout', description: 'Keeps every streetlamp, taxi, and suspiciously musical manhole humming.' },
  { id: 'gushen-couriers', name: 'Gushen Stratosphere Couriers', kingdom: 'Seaside', series: 'Odyssey', baseCost: '2.6e30', baseCps: '7.9e25', icon: 'gushen.webp', artMode: 'cutout', description: 'Express delivery by seawater jet. Dry parcels cost extra.' },
  { id: 'pokio-mint', name: 'Pokio Mint', kingdom: 'Bowser', series: 'Odyssey', baseCost: '1e32', baseCps: '2.7e27', icon: 'pokio.webp', artMode: 'cutout', description: 'Pecks legal tender from walls no auditor has dared to inspect.' },
  { id: 'shine-gate', name: 'Shine Gate', kingdom: 'Isle Delfino', series: 'Sunshine', baseCost: '4.1e33', baseCps: '9.1e28', icon: 'shine-gate.webp', artMode: 'scenic', description: 'Every imported coin is inspected, polished, and held dramatically toward the sun.' },
  { id: 'sherm-foundry', name: 'Sherm Foundry', kingdom: 'Metro', series: 'Odyssey', baseCost: '1.6e35', baseCps: '3.1e30', icon: 'sherm.webp', artMode: 'cutout', description: 'Heavy industry improves when the machinery has a moustache.' },
  { id: 'whomps-fortress', name: "Whomp's Fortress Construction", kingdom: 'Mushroom', series: 'Super Mario 64', baseCost: '6.6e36', baseCps: '1.1e32', icon: 'whomps-fortress.webp', artMode: 'scenic', description: 'Stone contractors fall flat for every project and still beat the deadline.' },
  { id: 'trex-expedition', name: 'T-Rex Expedition', kingdom: 'Cascade', series: 'Odyssey', baseCost: '2.6e38', baseCps: '3.6e33', icon: 't-rex.webp', artMode: 'cutout', description: 'An archaeological dig where the exhibit handles the shovel.' },
  { id: 'ricco-harbor', name: 'Ricco Harbor Shipping', kingdom: 'Isle Delfino', series: 'Sunshine', baseCost: '1e40', baseCps: '1.2e35', icon: 'ricco-harbor.webp', artMode: 'scenic', description: 'A maze of girders where freight, Blooper races, and liability all arrive by sea.' },
  { id: 'odyssey-crew', name: 'Odyssey Crew', kingdom: 'Worldwide', series: 'Odyssey', baseCost: '4.2e41', baseCps: '4.1e36', icon: 'odyssey-crew.webp', artMode: 'cutout', description: 'Keeps the sails polished and the globe pointed toward profit.' },
  { id: 'mount-wario', name: 'Mount Wario Transit', kingdom: 'Mushroom Cup', series: 'Mario Kart', baseCost: '1.7e43', baseCps: '1.4e38', icon: 'mount-wario.webp', artMode: 'scenic', description: 'A one-way alpine logistics network with no brakes and excellent television coverage.' },
  { id: 'sphinx-observatory', name: 'Sphinx Observatory', kingdom: 'Moon', series: 'Odyssey', baseCost: '6.7e44', baseCps: '4.8e39', icon: 'sphynx.webp', artMode: 'cutout', description: 'Answers cosmic questions, provided you phrase the invoice correctly.' },
  { id: 'honeyhive-galaxy', name: 'Honeyhive Galaxy Apiary', kingdom: 'Galaxy', series: 'Galaxy', baseCost: '2.7e46', baseCps: '1.6e41', icon: 'honeyhive-galaxy.webp', artMode: 'scenic', description: 'Zero-gravity honey production run by bees with stellar zoning authority.' },
  { id: 'broodal-agency', name: 'Broodal Wedding Agency', kingdom: 'Moon', series: 'Odyssey', baseCost: '1.1e48', baseCps: '5.5e42', icon: 'broodals.webp', artMode: 'cutout', description: 'Plans unforgettable ceremonies and conveniently forgettable liabilities.' },
  { id: 'coconut-mall', name: 'Coconut Mall Exchange', kingdom: 'Mushroom Cup', series: 'Mario Kart', baseCost: '4.3e49', baseCps: '1.9e44', icon: 'coconut-mall.webp', artMode: 'scenic', description: 'Retail velocity measured in escalators, convertibles, and startled Miis.' },
  { id: 'rogueport', name: 'Rogueport Trade Port', kingdom: 'Paper', series: 'Paper Mario', baseCost: '1.7e51', baseCps: '6.4e45', icon: 'rogueport.webp', artMode: 'scenic', description: 'A cheerful free market if you ignore the gallows and read no small print.' },
  { id: 'beanbean-airport', name: 'Beanbean Airport', kingdom: 'Beanbean', series: 'Mario & Luigi', baseCost: '6.9e52', baseCps: '2.2e47', icon: 'beanbean-airport.webp', artMode: 'scenic', description: 'International bean traffic handled with impeccable smiles and explosive luggage checks.' },
  { id: 'luigis-mansion', name: "Luigi's Mansion Paranormal Realty", kingdom: 'Evershade', series: "Luigi's Mansion", baseCost: '2.7e54', baseCps: '7.4e48', icon: 'luigis-mansion.webp', artMode: 'scenic', description: 'Every room has character; most of the characters have been dead for years.' },
  { id: 'rainbow-road', name: 'Rainbow Road Freightway', kingdom: 'Special Cup', series: 'Mario Kart', baseCost: '1.1e56', baseCps: '2.5e50', icon: 'rainbow-road.webp', artMode: 'scenic', description: 'Interstellar shipping with no guardrails, no atmosphere, and a perfect safety poster.' },
  { id: 'world-crown', name: 'World Crown Citadel', kingdom: 'Sprixie', series: '3D World', baseCost: '4.4e57', baseCps: '8.5e51', icon: 'world-crown.webp', artMode: 'scenic', description: 'The final route ends where champions clock in and ordinary maps quietly resign.' },
];

export const PRODUCER_BY_ID = Object.fromEntries(PRODUCERS.map((producer) => [producer.id, producer]));

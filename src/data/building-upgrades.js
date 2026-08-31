import { D, Decimal } from '../core/numbers.js';
import { PRODUCERS } from './buildings.js';

export const MILESTONES = [5, 15, 25, 50, 100, 150, 200, 350, 500, 750, 1000];

// Every chain has its own voice. Keeping this copy beside the data makes it easy to
// replace art or rebalance prices without touching the upgrade system.
const COPY = {
  'frog-capture': [
    ['Pond School', 'Five frogs enrolled; the pond immediately elected a hall monitor.', '🎓'],
    ['Amphibian Assembly', 'Parliament was too formal, so they formed a damp little committee.', '🫧'],
    ['Leapfrog Logistics', "Every shortcut now includes one colleague's head.", '↗'],
    ['Crowned Chorus', 'Fifty voices, one note, absolutely no indoor volume.', '♬'],
    ['Moonlit Marshals', 'The night shift carries tiny lanterns and very large opinions.', '🏮'],
    ['Royal Ribbit Reserve', 'Their emergency fund is mostly flies and misplaced crowns.', '♛'],
    ['The Great Green Getaway', 'Two hundred frogs leave at once; nobody checks the lily-pad manifest.', '🧳'],
  ],
  'bonneton-tailor': [
    ['First-Fit Feathers', 'The fitting room now offers compliments in three ghostly accents.', '🪶'],
    ['Spectral Stitchwork', 'Needles sew themselves, but still demand a tea break.', '🪡'],
    ['Hatbox Assembly Line', 'Boxes enter empty and leave with suspiciously good posture.', '▣'],
    ['Brim & Proper', 'Every brim is pressed to the legal limit of jauntiness.', '✦'],
    ['Needles After Midnight', 'The late shift works quietly enough to hear fabric gossip.', '☾'],
    ['Millinery Moonshift', 'Moonlight makes silver thread; accountants call it depreciation.', '🧵'],
    ['The Thousand-Hat Waltz', 'Nobody ordered a thousand hats, which has never stopped fashion.', '♪'],
  ],
  'goomba-stack': [
    ['Two-High Orientation', 'The new hire learns that the floor is another Goomba.', '⇧'],
    ['Load-Bearing Eyebrows', 'Structural engineers approve the brows but avoid eye contact.', '⌒'],
    ['Stack Safety Seminar', 'Rule one: wobbling is communication, not failure.', '⛑'],
    ['Fungal Formation', 'They arrange by height and discover this changes nothing.', '⬆'],
    ['Towering Ambition', 'At this altitude, every stomp requires paperwork.', '▤'],
    ['Cloudline Conga', 'The top row reports excellent weather and poor snacks.', '☁'],
    ['The Very Tall Shortcut', 'The tower reaches the destination before anyone agrees where it was.', '🏙'],
  ],
  'chain-chomp-quarry': [
    ['Reinforced Leashes', "The leash passed inspection; the inspector's clipboard did not.", '⛓'],
    ['Bite-Sized Blasting', 'Why rent explosives when enthusiasm has teeth?', '🦷'],
    ['Granite Fetch', 'The quarry throws a boulder and regrets teaching retrieval.', '↩'],
    ['Jawbreaker Crew', 'Their dental plan is one very nervous blacksmith.', '⚒'],
    ['Obsidian Obedience', 'Sit, stay, and please stop polishing the cliff with your jaw.', '◆'],
    ['Deep-Mine Doghouse', 'The break room is underground, round, and constantly growling.', '⌂'],
    ['Quarry Unchained', 'Production soars the instant everyone stops asking who holds the leash.', '💥'],
  ],
  'uproot-nursery': [
    ['Good Soil Gossip', 'The seedlings grow faster whenever the compost knows a secret.', '❧'],
    ['Extra-Long Shoots', 'A higher shelf is installed; the plants take that personally.', '📏'],
    ['Sunbeam Scheduling', 'Every sprout receives nine minutes of premium sunshine.', '☀'],
    ['Root Rotation', 'Crop rotation is easier when the crops can walk away.', '⟳'],
    ['Canopy Catapults', 'Ripe produce now arrives before anyone asks how.', '🌿'],
    ['Perennial Overtime', 'The flowers clock out each winter and immediately clock back in.', '⏱'],
    ['Skygarden Stampede', 'The nursery reaches the clouds, dragging the watering cans behind it.', '☁'],
  ],
  'jaxi-express': [
    ['Sandproof Saddles', 'The warranty covers dunes, dust, and one dramatic shortcut.', '🏜'],
    ['Desert Fare Meter', 'It charges by the mile, the scream, and the lost sandal.', '◴'],
    ['Shortcut Whiskers', 'Every whisker points toward a route maps refuse to print.', '⌖'],
    ['Dune Dispatch', 'The dispatcher owns one bell and no concept of caution.', '🔔'],
    ['Mirage Mileage', 'Passengers arrive before the oasis finishes pretending.', '≋'],
    ['Thunder Across Tostarena', 'The desert hears hoofbeats and files a noise complaint.', 'ϟ'],
    ['No-Brakes Night Shift', 'After sunset, the stars become lane markers.', '★'],
  ],
  'lake-boutique': [
    ['Waterproof Price Tags', 'The ink survives three tides and one customer asking for a discount.', '💧'],
    ['Bubble-Wrap Couture', 'Every outfit arrives buoyant, elegant, and fun to pop.', '◌'],
    ['Sequin Current', 'The sequins swim upstream to meet their deadlines.', '✧'],
    ['Coral Cutting Room', 'The mannequins keep growing branches between fittings.', '✂'],
    ['Runway Undertow', 'Models enter from stage left and exit somewhere near the reef.', '〰'],
    ['Pearl Rush Hour', 'Oysters now commute in lanes; nobody signals.', '●'],
    ['Haute Tide Empire', 'Fashion rises with the water and invoices the moon.', '♔'],
  ],
  'steam-gardener-workshop': [
    ['Fresh Kettle Gaskets', 'Steam stays inside the machine for almost an entire meeting.', '⚙'],
    ['Petal-Powered Pistons', 'Each blossom pushes once and requests more sunlight.', '❀'],
    ['Bouquet Blueprint', 'The plans smell lovely and explain absolutely nothing.', '▧'],
    ['Pressure-Grown Produce', 'Vegetables emerge pre-cooked and mildly surprised.', '🌡'],
    ['Brassleaf Automation', 'Metal leaves never wilt, only submit maintenance tickets.', '🍃'],
    ['Midnight Watering Union', 'Every hose gets a break, a badge, and collective pressure.', '🤝'],
    ['Industrial Bloom', 'The factory flowers on schedule and sheds bolts in spring.', '🏭'],
  ],
  'new-donk-scooters': [
    ['Fresh Helmets', 'The fleet looks safer and somehow drives faster.', '⛑'],
    ['Curbside Coin Cups', 'Loose change now has a designated landing zone.', '🥤'],
    ['Yellow-Line Hustle', 'Every avenue becomes a suggestion with paint.', '⤴'],
    ['Avenue Relay', 'Scooters pass the package without technically stopping.', '📦'],
    ['Rush-Hour Slalom', 'Traffic cones develop trust issues.', '⚠'],
    ['Rooftop Ramp Network', 'Street level is optional once enough plywood is involved.', '⌁'],
    ['Citywide Green Light', 'Every signal turns green out of professional courtesy.', '🚦'],
  ],
  'shiverian-racing': [
    ['Studded Snowshoes', 'More grip means less sliding and far less dignity.', '❄'],
    ['Crumb-Trail Course', 'The route is delicious, which complicates navigation.', '•'],
    ['Blizzard Batons', 'Relay exchanges now occur by mitten-based intuition.', '↝'],
    ["Champion's Crust", 'A perfect golden edge is worth three seconds per lap.', '◯'],
    ['Avalanche Overtake', 'Passing on the inside is legal if the mountain does it first.', '🏔'],
    ['Grand Prix Pantry', 'Every racer gets a snack sponsor and a very fast lunch.', '🏁'],
    ['Finish-Line Feast', 'The banquet begins before the final crumb crosses.', '🏆'],
  ],
  'gushen-couriers': [
    ['Pressure-Tested Parcels', 'Packages are rated for rain, wind, and enthusiastic forehead jets.', '📦'],
    ['Nozzle Navigation', 'Left, right, and upward are now official delivery directions.', '⌖'],
    ['Headwind Handlers', 'The crew labels every gale Return to Sender.', '↶'],
    ['Jetstream Sorting', 'Express parcels take the blue current; complaints take the scenic route.', '≋'],
    ['Cloud-Cut Delivery', 'The fleet slices the sky into neat postal districts.', '✉'],
    ['Express Through the Eye', 'Storm centers now include a convenient service window.', '◉'],
    ['Signed, Sealed, Soaked', 'The recipient signs in ink that was dry several clouds ago.', '✒'],
  ],
  'volbono-kitchen': [
    ['Saucepan Scouts', 'They taste every route and occasionally the map.', '🍲'],
    ['Forklift Forks', 'Dinner service finally has industrial lifting capacity.', '🍴'],
    ['Lava-Proof Ladles', 'The soup is hotter than policy allows and twice as productive.', '♨'],
    ['Simmer Shift', 'Night cooks keep the burners low and the gossip boiling.', '☾'],
    ['Golden Broth Bureau', 'Every stockpot receives a seal, a serial number, and more salt.', '◎'],
    ['Continental Course', 'Seven courses cross three borders without leaving the kitchen.', '🌐'],
    ['The Endless Tasting Menu', 'The final dish is always the next one.', '∞'],
  ],
  'pokio-mint': [
    ['Beak-Press Apprentices', 'The first coins are stamped slightly off-center and very proudly.', '◉'],
    ['Foil Feathering', 'Each blank receives a shine before the serious pecking begins.', '🪶'],
    ['Wall-Peck Dies', 'Vertical minting saves floor space and terrifies visitors.', '⬙'],
    ['Counterfeit Countermeasures', 'Fake coins fail the official bounce-off-a-cliff test.', '🛡'],
    ['High-Cliff Coinage', "Altitude adds value, according to the mint's least qualified economist.", '⛰'],
    ['Needle-Nose Night Shift', 'After dark, sparks replace the usual timecards.', '✺'],
    ['Legal Tender, Questionably', 'Every coin is accepted once the cashier sees the beak.', '?'],
  ],
  'sherm-foundry': [
    ['Fresh Treads', 'The foundry floor survives longer when the machinery stops skating.', '▰'],
    ['Target Calibration', 'Accuracy improves after someone labels the target side.', '◎'],
    ['Barrel-Roll Bearings', 'The barrel turns smoothly; nearby mugs are less fortunate.', '⟳'],
    ['Smelter Sightlines', 'Heat haze is now included in the aiming calculation.', '⌖'],
    ['Recoil Recycling', 'Every backward lurch winds the next machine.', '↩'],
    ['Molten Maneuvers', 'Production drills continue while the floor is technically lava.', '♨'],
    ['Full-Bore Fabrication', 'The assembly line fires finished parts directly into inventory.', '⚙'],
  ],
  'trex-expedition': [
    ['Trail-Sized Snacks', 'One lunch crate feeds the guide or delays the dinosaur briefly.', '🥪'],
    ['Gentle Giant Waiver', 'Everyone signs; nobody reads the footprint clause.', '📝'],
    ['Footprint Cartography', 'Maps are simpler when each step redraws the road.', '🗺'],
    ['Paleontologist Panic Button', 'It summons help, applause, or a faster paleontologist.', '🔴'],
    ['Cretaceous Convoy', 'Supply wagons follow at the safest possible definition of near.', '▱'],
    ['Thunder-Lizard Logistics', 'The schedule is measured in roars and missing fences.', 'ϟ'],
    ["History's Loudest Field Trip", 'Two hundred expeditions depart; prehistory asks for quiet.', '🦖'],
  ],
  'odyssey-crew': [
    ['Deckhand Hats', 'A proper hat improves morale and complicates strong winds.', '⚓'],
    ['Balloon Patch Kit', 'Every patch adds character, drag, and one reassuring squeak.', '🩹'],
    ['Cabin-Coin Cart', 'Loose treasure now receives room service.', '🛒'],
    ['Propeller Choir', 'Four blades hold one note better than the navigator.', '♫'],
    ['World-Map Overtime', 'The crew redraws every border after each wrong turn.', '🌍'],
    ['Red-Sail Relay', 'Fresh canvas reaches the mast before the old sail notices.', '⛵'],
    ['One More Lap Around the Moon', 'The voyage ends exactly one orbit after never.', '☾'],
  ],
  'sphinx-observatory': [
    ['Riddle Index Cards', 'Questions are filed by difficulty, answer, and likelihood of causing groans.', '?'],
    ['Constellation Clues', 'Stars connect more neatly when the telescope stops blinking.', '✦'],
    ['Telescope Eyebrows', 'A raised brow improves magnification and judgment.', '⌒'],
    ['Answer-Key Astrolabe', 'It points north unless north has not done the reading.', '⌖'],
    ['Midnight Question Desk', 'The night clerk accepts answers in complete constellations.', '☾'],
    ['Paradox Parallax', 'Two impossible viewpoints reveal one billable observation.', '◉'],
    ['The Last Riddle Is Overtime', 'The answer was productivity; nobody is pleased.', '⏱'],
  ],
  'broodal-agency': [
    ['Emergency Boutonnieres', 'Every crisis looks formal after adding one flower.', '🌼'],
    ['Contractual Confetti', 'The fine print now explodes when both parties initial it.', '🎊'],
    ['Moonlit Seating Chart', 'Guests are arranged by orbit, appetite, and feud radius.', '☾'],
    ['Cake-Safe Carriages', 'Suspension testing uses frosting and extremely nervous drivers.', '🍰'],
    ['Rival-Proof Rehearsal', 'The aisle includes trapdoors, decoys, and a backup aisle.', '🛡'],
    ['Cathedral Calendar', 'Three weddings per hour leaves six minutes for dramatic objections.', '▤'],
    ['Till Debt Do Us Part', 'Love is eternal; the invoice renews monthly.', '💍'],
  ],
  'ruined-dragon-hoard': [
    ['Smokeless Coin Polish', 'The treasure gleams without triggering a single inconvenient cough.', '✧'],
    ['Scale-Safe Shovels', 'Rounded edges protect both the dragon and workplace morale.', '♢'],
    ['Vault Echo Census', 'Accountants count each clang twice, just to be dragon-sure.', '◖'],
    ['Stormproof Strongboxes', 'Lightning now charges the locks instead of opening them.', 'ϟ'],
    ['Lightning-Stamped Ledger', 'Every entry arrives signed by weather.', '📖'],
    ['Treasury Under Thunder', 'Audits proceed between booms, never during the dramatic ones.', '☂'],
    ['The Hoard That Audits Back', 'The coins have organized and would like to see your receipts.', '🧐'],
  ],
  'darker-side-armada': [
    ['Vacuum-Sealed Rations', 'Lunch no longer escapes during sharp orbital corrections.', '🥫'],
    ['Crater Course Plotter', 'Every hole becomes a waypoint if the map is optimistic.', '⌖'],
    ['Black-Sky Beacons', 'The lights point home, assuming home is still behind us.', '✷'],
    ['Zero-Gravity Payroll', 'Coins float past accounting and are counted on the rebound.', '🪙'],
    ['Eclipse Engine Room', 'The machinery runs best when the sun politely steps aside.', '◐'],
    ['Far-Side Formation', 'Ships hold position where nobody can accuse them of sightseeing.', '⋰'],
    ['Beyond the Last Postcard', 'The armada sails past the edge and mails back a blank souvenir.', '✉'],
  ],
};

const GENERIC_TITLES = [
  'Opening Shift', 'Bulk Fare Contract', 'Second Stamp', 'Cross-Route Fusion', 'Century Engine',
  'Series Reunion', 'Double-Century Drive', 'Grand Tour Gearbox', 'Network Jubilee',
  'Seven-Fifty Skyline', 'One-Thousand Mastery',
];
const GENERIC_FLAVOUR = [
  'The first workshop crate contains one useful lever and three decorative springs.',
  'Future tickets are printed smaller, cheaper, and with considerably more confidence.',
  'A second production line appears behind a curtain nobody remembers hanging.',
  'Two neighbouring routes exchange blueprints and several extremely confused employees.',
  'One hundred units agree that moderation was a tutorial mechanic.',
  'Old friends from the same series arrive carrying multipliers and embarrassing photographs.',
  'Two hundred units turn the workshop manual into a load-bearing wall.',
  'The machinery now runs on ambition, souvenir grease, and numbers with commas.',
  'Five hundred units form a network large enough to have its own weather forecast.',
  'At seven hundred fifty, the skyline becomes mostly payroll.',
  'One thousand units sign the mastery ledger; the pen immediately requests retirement.',
];
const GENERIC_MOTIFS = ['◆', '٪', '✦', '∞', 'Ⅽ', '◎', 'Ⅱ', '⚙', '⌁', '♜', '♛'];

function copyFor(producer, index) {
  const authored = COPY[producer.id]?.[index];
  if (authored) return authored;
  return [
    `${producer.name}: ${GENERIC_TITLES[index]}`,
    `${producer.name} — ${GENERIC_FLAVOUR[index]}`,
    GENERIC_MOTIFS[index],
  ];
}

function producerEffects(producer, producerIndex, milestone) {
  const partner = PRODUCERS[(producerIndex + 1) % PRODUCERS.length];
  if (milestone === 5) return [{ type: 'producer-multiplier', producerId: producer.id, multiplier: 2 }];
  if (milestone === 15) return [{ type: 'producer-discount', producerId: producer.id, amount: 0.03 }];
  if (milestone === 25) return [{ type: 'producer-multiplier', producerId: producer.id, multiplier: 2 }];
  if (milestone === 50) return [{ type: 'fusion', producerId: producer.id, partnerId: partner.id, multiplier: 1.5 }];
  if (milestone === 100) return [{ type: 'producer-multiplier', producerId: producer.id, multiplier: 3 }];
  if (milestone === 150) return [{ type: 'series-multiplier', series: producer.series, multiplier: 1.15 }];
  if (milestone === 200) return [{ type: 'producer-multiplier', producerId: producer.id, multiplier: 3 }];
  if (milestone === 350) return [{ type: 'producer-multiplier', producerId: producer.id, multiplier: 4 }];
  if (milestone === 500) return [
    { type: 'producer-multiplier', producerId: producer.id, multiplier: 2 },
    { type: 'producer-discount', producerId: producer.id, amount: 0.05 },
  ];
  if (milestone === 750) return [{ type: 'producer-multiplier', producerId: producer.id, multiplier: 5 }];
  return [
    { type: 'producer-multiplier', producerId: producer.id, multiplier: 10 },
    { type: 'global-additive', amount: 0.0025 },
  ];
}

function producerEffectLabel(producer, producerIndex, milestone) {
  const partner = PRODUCERS[(producerIndex + 1) % PRODUCERS.length];
  if (milestone === 15) return `${producer.name} future prices −3%`;
  if (milestone === 50) return `Fusion: ${producer.name} + ${partner.name} ×1.5`;
  if (milestone === 150) return `${producer.series} producers ×1.15`;
  if (milestone === 500) return `${producer.name} ×2 and future prices −5%`;
  if (milestone === 1000) return `${producer.name} ×10 and +0.25% global production`;
  return `${producer.name} production ×${({ 5: 2, 25: 2, 100: 3, 200: 3, 350: 4, 750: 5 })[milestone]}`;
}

export const PRODUCER_UPGRADES = PRODUCERS.flatMap((producer, producerIndex) =>
  MILESTONES.map((milestone, index) => {
    const copy = copyFor(producer, index);
    return {
      id: `${producer.id}--${milestone}`,
      track: 'producer',
      producerId: producer.id,
      milestone,
      previousId: index ? `${producer.id}--${MILESTONES[index - 1]}` : null,
      effects: producerEffects(producer, producerIndex, milestone),
      effectLabel: producerEffectLabel(producer, producerIndex, milestone),
      name: copy[0],
      flavour: copy[1],
      motif: copy[2],
      cost: D(producer.baseCost)
        .mul(Decimal.pow(1.15, milestone))
        .mul(6 + milestone * 1.8)
        .ceil()
        .toString(),
    };
  }),
);

const TECHNIQUE_COPY = [
  ['Reinforced Brim', 'Cappy receives a sturdier inner band and a tiny certificate of structural drama.', '🧢', '1e5', { type: 'flat-click-multiplier', multiplier: 1.5 }],
  ['Payroll Ricochet', 'A sliver of production follows every returning throw without leaving its desk.', '↩', '1e7', { type: 'click-assist-add', amount: 0.0005 }],
  ['Lucky Stitch', 'One red thread is statistically significant and refuses to explain why.', '✦', '1e9', { type: 'critical-chance-add', amount: 0.005 }],
  ['Longer Follow-Through', 'The combo clock learns patience in increments of one tenth of a second.', '⏱', '1e11', { type: 'combo-window-add', milliseconds: 100 }],
  ['Sunspot Radar', 'Cappy notices rare Shines two seconds before everybody else starts yelling.', '☀', '1e13', { type: 'shine-duration-add', seconds: 2 }],
  ['Boomerang Bookkeeping', 'Every return flight now carries a second, smaller receipt.', '↻', '1e16', { type: 'flat-click-multiplier', multiplier: 1.5 }],
  ['Crew-Powered Toss', 'The route contributes a polite fraction of its output to each manual throw.', '⚙', '1e19', { type: 'click-assist-add', amount: 0.0005 }],
  ['Review-Proof Crown', 'Critical acclaim arrives half a percent more often and wears white gloves.', '♕', '1e22', { type: 'critical-chance-add', amount: 0.005 }],
  ['Elastic Rhythm', 'The combo window stretches without becoming an invitation to autoclick.', '♬', '1e25', { type: 'combo-window-add', milliseconds: 100 }],
  ['Shine RSVP Card', 'Rare guests remain visible long enough to sign the celestial guest book.', '✉', '1e28', { type: 'shine-duration-add', seconds: 2 }],
  ['Triple-Lined Crown', 'Three layers of felt turn one coin into a modestly larger argument.', 'Ⅲ', '1e31', { type: 'flat-click-multiplier', multiplier: 1.5 }],
  ['Census Slingshot', 'Every owned route adds a harmless speck of momentum to Cappy’s return.', '⌁', '1e34', { type: 'click-assist-add', amount: 0.0005 }],
  ['Probability Feather', 'The feather points toward the luckier five thousandths of possibility.', '🪶', '1e37', { type: 'critical-chance-add', amount: 0.005 }],
  ['Metronome Passport', 'Border control grants combos one additional beat to present their papers.', '▥', '1e40', { type: 'combo-window-add', milliseconds: 100 }],
  ['Solar Lure', 'A tasteful glint encourages Shines to linger without making waiting optimal.', '◉', '1e43', { type: 'shine-duration-add', seconds: 3 }],
  ['Orbiting Inner Band', 'The hat now contains a very small orbit with surprisingly good leverage.', '◎', '1e46', { type: 'flat-click-multiplier', multiplier: 1.5 }],
  ['Grand-Tour Assist', 'Automation lends one final fraction of a percent to the throwing department.', '🗺', '1e49', { type: 'click-assist-add', amount: 0.0005 }],
  ['Critic’s Moon Pin', 'The pin attracts praise, lightning, and another half-percent of criticals.', '☾', '1e52', { type: 'critical-chance-add', amount: 0.005 }],
  ['Five-Star Impact', 'Critical throws hit half a step harder without changing their silent dignity.', '★', '1e55', { type: 'critical-multiplier-add', amount: 0.5 }],
  ['Celestial Finder’s Fee', 'Rare Shine rewards pay a little extra for being spotted the old-fashioned way.', '✺', '1e58', { type: 'shine-payout', multiplier: 1.25 }],
];

export const TECHNIQUE_UPGRADES = TECHNIQUE_COPY.map(([name, flavour, motif, unlockAt, effect], index) => ({
  id: `cappy-technique-${index + 1}`,
  track: 'technique',
  producerId: null,
  milestone: null,
  previousId: index ? `cappy-technique-${index}` : null,
  unlockAt,
  effects: [effect],
  effectLabel: techniqueEffectLabel(effect),
  name,
  flavour,
  motif,
  cost: D(unlockAt).mul(5).toString(),
}));

function techniqueEffectLabel(effect) {
  if (effect.type === 'flat-click-multiplier') return `Flat Cappy value ×${effect.multiplier}`;
  if (effect.type === 'click-assist-add') return `Cappy production assist +${effect.amount * 100}%`;
  if (effect.type === 'critical-chance-add') return `Critical chance +${effect.amount * 100}%`;
  if (effect.type === 'critical-multiplier-add') return `Critical power +${effect.amount}×`;
  if (effect.type === 'combo-window-add') return `Combo window +${effect.milliseconds}ms`;
  if (effect.type === 'shine-duration-add') return `Rare Shines linger +${effect.seconds}s`;
  return `Rare Shine payouts ×${effect.multiplier}`;
}

export const BUILDING_UPGRADES = [...PRODUCER_UPGRADES, ...TECHNIQUE_UPGRADES];
export const BUILDING_UPGRADE_BY_ID = Object.fromEntries(BUILDING_UPGRADES.map((upgrade) => [upgrade.id, upgrade]));

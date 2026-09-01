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

// These routes joined the itinerary after the original Odyssey set. Their first
// seven workshop stories are deliberately hand-authored; no producer name is
// pasted onto a shared sentence.
const NEW_ROUTE_COPY = {
  'bobomb-battlefield': [
    ['Fusebox Briefing', 'Red and black crews compare fuse lengths, then quietly swap name tags.', '💣'],
    ['Cannonball Procurement', 'The quartermaster orders ammunition by altitude and expected amount of yelling.', '●'],
    ['Floating Island Tender', 'A bridge contract reaches the island long before the bridge does.', '☁'],
    ['Cascade-Cartridge Exchange', 'Quarry stones return from the partnership with surprisingly precise bore holes.', '↔'],
    ['Summit Powder Room', 'The mountain peak reserves one closet for kegs and two for paperwork.', '⛰'],
    ['Sixty-Four-Gun Salute', 'Veterans of the castle courtyard reunite and immediately dispute the cannon angle.', '♜'],
    ["King Bob-omb's Pension", 'Royal retirement benefits mature exactly one spark before detonation.', '♛'],
  ],
  'delfino-plaza': [
    ['Pianta Permit Desk', 'Fruit vendors receive licenses sturdy enough to survive a charging Chuckster.', '☀'],
    ['Fruit-Crate Cartography', 'Every durian, coconut, and pineapple gets its own boardwalk delivery arrow.', '🍍'],
    ['FLUDD Rinse Cycle', 'The paving stones are washed until municipal history becomes briefly legible.', '💧'],
    ['Chain-Safe Canal Works', 'Quarry crews line the waterways while the Chain Chomps inspect by biting.', '↔'],
    ['Corona Mountain Ferry', 'The timetable lists lava delays under ordinary island weather.', '⛴'],
    ['Sunshine Sister-City Pass', 'Delfino stamps every visiting route with a smiling, slightly damp sun.', '✺'],
    ['Plaza After Dark', 'When the ferries sleep, Piantas count coins beneath the bell tower.', '☾'],
  ],
  'cat-bell-hills': [
    ['Bell-Clapper Apprentices', 'New smiths learn that every perfect bell summons at least one tail.', '🔔'],
    ['Paw-Print Payroll', 'Timecards accept toe beans after the inkpad develops a mind of its own.', '🐾'],
    ['Clear-Pipe Foundry', 'Molten brass takes the scenic route through transparent plumbing.', '◫'],
    ['Uproot Catwalk Exchange', 'Long-legged gardeners test the runway while cats patrol beneath it.', '↔'],
    ['Double-Cherry Bell Choir', 'Identical ringers produce harmony and a deeply confusing attendance sheet.', '🍒'],
    ['Sprixie Shift Swap', 'Fairies cover lunch breaks in exchange for bells small enough to carry.', '🧚'],
    ['Flagpole Feline Bureau', 'Every completed order ends with a climb nobody included in the invoice.', '⚑'],
  ],
  'choco-mountain': [
    ['Cocoa-Safe Couplings', 'Fresh rail joints resist heat, cold, and curious teeth from the dining car.', '🍫'],
    ['Falling-Rock Timetable', 'Departures move forward whenever the mountain rolls something backward.', '◒'],
    ['Ribbon-Road Surveyors', 'Engineers measure curves in hairpins, bruises, and missing guard posts.', '〰'],
    ['Jaxi Junction', 'A desert taxi meets the railway and demands the express lane.', '↔'],
    ['Chocolate Tunnel Tempering', 'Cooler vents stop the walls from becoming an unscheduled fondue service.', '❄'],
    ['Karting Alumni Express', 'Retired racers return as conductors and still refuse to announce braking.', '🏁'],
    ['Sixty-Four Switchbacks', 'The old mountain route finally admits how many corners it was hiding.', '64'],
  ],
  'yoshis-island': [
    ['Fruit Intake Window', 'Watermelons, apples, and one suspicious cactus enter the cooperative smiling.', '🍉'],
    ['Egg-Carton Aerodynamics', 'Cardboard wings keep spotted cargo level through a full flutter jump.', '🥚'],
    ['Flutter-Freight Dispatch', 'Late parcels gain altitude by kicking the air until it cooperates.', '🪽'],
    ['Boutique Basket Exchange', 'Lake seamstresses line every egg hamper with waterproof satin.', '↔'],
    ['Melon Mortgage', 'Thirty seeds down secures one extremely juicy piece of agricultural property.', '•'],
    ["Island Reunion Picnic", 'Storks, Yoshis, and babies compare routes over a table nobody can overturn.', '🌼'],
    ['Stork-Proof Dispatch', 'Outgoing crates are labeled clearly enough to defeat even magical misdelivery.', '☁'],
  ],
  'toad-town-bazaar': [
    ['Folded Stall Awnings', 'Paper roofs pop open at sunrise and fold around the first rain cloud.', '▱'],
    ['Mushroom Change Trays', 'Every coin receives a tiny circular bed before entering the till.', '🍄'],
    ['Badge-Shop Backroom', 'Rare stock appears behind a curtain whenever somebody says action command.', '★'],
    ['Steam-Pressed Partnership', 'Wooded machinery flattens invoices without flattening the shopkeepers.', '↔'],
    ["Peach's Market Bell", 'One royal chime starts trading, lunch, and three unrelated side quests.', '🔔'],
    ['Paper Route Reunion', 'Merchants from every chapter arrive with creases in exactly the old places.', '📖'],
    ['Thousand-Fold Receipts', 'The till prints a proof of purchase that doubles as local architecture.', '▤'],
  ],
  'gusty-garden': [
    ['Windmill Seed Packets', 'Each envelope contains six flowers and one carefully folded tailwind.', '🌼'],
    ['Bunny-Chase Couriers', 'Delivery times improve once the parcels learn to hop away first.', '🐇'],
    ['Gravity-Bent Trellis', 'Vines climb sideways, loop once around the moon, and clock in early.', '◎'],
    ['Metro Gust Exchange', 'Scooter ramps bottle spare updrafts for the conservatory commute.', '↔'],
    ['Planetoid Petal Census', 'Gardeners count every bloom twice when it crosses the underside.', '❀'],
    ['Galactic Garden Club', 'Rosalina brings tea; the bees bring minutes written in pollen.', '☄'],
    ["Major Burrows' Stopwatch", 'The foreman times each orbit from somewhere safely below the soil.', '⏱'],
  ],
  'comet-observatory': [
    ['Luma Snack Ledger', 'Star Bits leave the pantry only after glowing approval from accounting.', '★'],
    ['Dome Rotation Schedule', 'Each room takes a turn facing tomorrow before breakfast.', '◎'],
    ['Star-Bit Sifters', 'Prism-shaped crumbs are sorted by color, flavor, and navigational value.', '✦'],
    ['Metro Voltage Umbilical', 'New Donk sends power upward through a cable that refuses to sag.', '↔'],
    ['Library of Moving Maps', 'The atlas reshelves itself whenever a galaxy drifts out of alphabetical order.', '📚'],
    ['Galaxy Orchestra Reunion', 'Old domes tune their instruments to the hum of a familiar engine room.', '♫'],
    ['Beacon Between Galaxies', 'Lost travelers follow the light; lost paperwork follows Rosalina.', '✺'],
  ],
  'new-donk-generator': [
    ['Manhole Dynamo Crew', 'A street drummer counts the beat while turbines keep municipal time.', '⚡'],
    ["Mayor's Meter Seal", 'Pauline signs the casing and the entire avenue stands a little straighter.', '♬'],
    ['Underground Cable Choir', 'Copper lines harmonize beneath taxis that never notice the key change.', '〽'],
    ['Seaside Pressure Coupling', 'Gushen jets cool the grid and accidentally power three fountains.', '↔'],
    ['Festival Current', 'The city plugs its celebration directly into the evening rush.', '🎺'],
    ['Metro Grid Reunion', 'Every borough brings an extension cord and a very old set list.', '🏙'],
    ["Blackout's Exit Interview", 'The last dark window explains that it is leaving for personal reasons.', '☀'],
  ],
  'shine-gate': [
    ['Sun-Crest Turnstile', 'Each arrival spins beneath a crest polished brighter than the visitor.', '☀'],
    ['Pianta Passport Ink', 'The stamp dries instantly unless the traveler is still dripping seawater.', '▣'],
    ['Bell-Tower Mirrors', 'Morning light reaches customs before the first ferry clears the harbor.', '◇'],
    ['Mustachioed Customs Cannon', 'Sherm inspectors approve cargo by firing exactly around it.', '↔'],
    ['Corona Crownlight', 'A lens from the mountain turns noon into official gate business.', '✺'],
    ['Sunshine Port Picnic', 'Delfino officers reunite over fruit and mutually misplaced forms.', '🍍'],
    ["Gatekeeper's Golden Hour", 'For sixty minutes, every declaration looks honest in the light.', '⌛'],
  ],
  'whomps-fortress': [
    ['Bandage-Grade Mortar', 'New masonry flexes just enough to survive another face-first inspection.', '▧'],
    ['Backside Safety Paint', 'Bright arrows finally explain which surface is not a landing pad.', '⚠'],
    ['Fortress Rotation Crane', 'The whole tower turns because carrying the scaffolding seemed harder.', '↻'],
    ['Fossil-Footing Contract', 'T-Rex crews stamp foundations flat with prehistoric punctuality.', '↔'],
    ['Tower-to-Sky Warranty', 'Cloud damage is covered unless the cloud was clearly minding itself.', '☁'],
    ["Sixty-Four Masons' Reunion", 'Old stoneworkers compare cracks and insist every one is load-bearing.', '64'],
    ['Thwomp-Proof Break Room', 'The ceiling rises whenever lunch hears an angry rumble.', '⌂'],
  ],
  'ricco-harbor': [
    ['Blooper-Proof Bill of Lading', 'Ink stains count as signatures only when they arrive at racing speed.', '✒'],
    ['Girder-Side Toll Booth', 'Cargo pays once at the pier and again for looking nervous overhead.', '▥'],
    ['Goop-Tanker Registry', 'Every leaking vessel receives a number and an optimistic cleanup date.', '⚓'],
    ['Red-Sail Freight Pact', 'The Odyssey takes high cargo while Ricco handles everything below gull level.', '↔'],
    ['Harbor Crane Ballet', 'Steel arms pirouette containers between ships without dropping the orchestra.', '⚙'],
    ['Sunshine Shipping Reunion', 'Veteran dockhands toast old routes with water nobody recommends drinking.', '☀'],
    ['Polluted-Water Surcharge', 'The invoice grows greener each time a crate touches the bay.', '▧'],
  ],
  'mount-wario': [
    ['Summit Check-In Shed', 'Freight signs the waiver before noticing the road only points down.', '🏔'],
    ['Ski-Lift Cargo Hooks', 'Crates ride uphill once so gravity can invoice the return journey.', '⌁'],
    ['Dam-Side Drift School', 'Drivers learn to countersteer while the turbines grade from below.', '〰'],
    ['Moon-Riddle Shuttle', 'Sphinx passengers answer one question before boarding and six during descent.', '↔'],
    ['Factory Finish Chute', 'Assembly parts become race parts somewhere between conveyor and snowbank.', '🏭'],
    ['Kart Cup Transit Pact', 'Every circuit contributes one shortcut and denies knowing the others.', '🏁'],
    ['One-Lap Mountain', 'The railway redraws an entire alpine range as a single finish line.', '◯'],
  ],
  'honeyhive-galaxy': [
    ['Bee-Suit Cloakroom', 'Visitors check their hats and receive stripes with pockets.', '🐝'],
    ['Nectar Orbit Permits', 'Flowers file flight plans before releasing anything sweet into space.', '✿'],
    ['Honeycomb Launchpad', 'Wax hexagons withstand ignition provided nobody mentions candles.', '⬡'],
    ['Wedding-Cake Pollination', 'Broodal bakers trade frosting for a precisely scheduled cloud of bees.', '↔'],
    ["Queen Bee's Gravity Waiver", 'The royal signature floats above the clause about sudden black holes.', '♛'],
    ["Galaxy Apiarists' Picnic", 'Keepers from distant hives share sandwiches and competitive buzzing.', '☄'],
    ['Honeyfall Reservoir', 'Golden rivers are dammed with toast and released before breakfast.', '🍯'],
  ],
  'coconut-mall': [
    ['Escalator Pit Crew', 'Mechanics tune every moving stair for peak shopping-lap velocity.', '↗'],
    ['Food-Court Slipstream', 'Trays draft behind convertibles and reach tables before the napkins.', '🥤'],
    ['Parking-Lot Price Scanner', 'Barcodes remain readable through tire smoke, mostly.', '▥'],
    ['Rogueport Retail Ferry', 'Paper merchants unload bargains through the fountain after closing.', '↔'],
    ['Mii Management Seminar', 'Every face receives a lanyard and immediately forgets the agenda.', '🙂'],
    ['Karting Franchise Mixer', 'Cup champions network beside a kiosk still selling last season.', '🏁'],
    ['Closing-Time Grand Prix', 'The shutters descend one lap behind the final customer.', '🏆'],
  ],
  'rogueport': [
    ['Gutter-Safe Ledgers', 'Waterproof books protect profits from rain and unrelated rooftop trouble.', '📖'],
    ['Pianta-Parlor Tokens', 'The arcade accepts local coinage after a short and muscular negotiation.', '●'],
    ['Contact-Lens Lost Property', 'The help desk catalogues tiny lenses by owner, shine, and dramatic timing.', '◉'],
    ['Beanbean Customs Pact', 'Airport beans waive duties on cargo thin enough to fold.', '↔'],
    ['Trouble Center Retainer', 'Every shipment includes one side quest and a stamped apology.', '!'],
    ["Paper Partners' Reunion", 'Former companions gather at the inn and argue over turn order.', '★'],
    ['Thousand-Year Lease', 'The basement clause matures several chapters before anyone reads it.', '⌛'],
  ],
  'beanbean-airport': [
    ['Beanstar Baggage Tags', 'Suitcases hum when routed correctly and cackle at lost-property staff.', '🫘'],
    ['Chuckola Security Sip', 'Each bottle passes inspection after telling one extremely flat joke.', '🥤'],
    ['Runway Teehee Lights', 'Green lamps giggle in sequence whenever a flight lands on time.', '✦'],
    ['Poltergust Cargo Lane', "Luigi's vacuum clears the carousel without misplacing more than one ghost.", '↔'],
    ['Border-Brothers Fast Track', 'Passengers jump the queue in synchronized overalls and impeccable paperwork.', '↗'],
    ['Superstar Staff Picnic', 'Veteran agents toast with soda strong enough to dissolve the cups.', '★'],
    ["Queen Bean's Arrival Board", 'Royal flights appear in gold and every delay politely disappears.', '♛'],
  ],
  'luigis-mansion': [
    ['Poltergust Deposit Bag', 'Captured tenants leave coins, dust, and no forwarding address.', '👻'],
    ['Boo Tenant Screening', 'Applicants must provide three references who can still see them.', '◉'],
    ['Dark-Light Deeds', 'Invisible ownership records glow purple under E. Gadd-approved scrutiny.', '🔦'],
    ['Rainbow Eviction Shuttle', 'Freightway drivers relocate ghosts without touching a single guardrail.', '↔'],
    ["E. Gadd's Closing Costs", 'The professor itemizes ectoplasm separately from ordinary wall damage.', '🧾'],
    ['Mansion Alumni Séance', 'Former residents attend remotely, which is also how they attend locally.', '☾'],
    ['Vacancy With a Pulse', 'One living tenant doubles the property value and alarms the neighbors.', '♥'],
  ],
  'rainbow-road': [
    ['Anti-Gravity Manifest', 'Crates list top, bottom, and preferred direction of accidental orbit.', '🌈'],
    ['Star-Rail Reflectors', 'Fresh prisms make the road visible from several inconvenient galaxies.', '✧'],
    ['Blue-Shell Insurance', 'The policy pays only after confirming the client was comfortably ahead.', '🛡'],
    ['Crown-Citadel Skybridge', 'World Crown extends a clear pipe to the nearest strip of color.', '↔'],
    ['Special-Cup Night Freight', 'Midnight cargo follows taillights through a vacuum with no shoulders.', '☾'],
    ['Karting Constellation Convoy', 'Every cup sends one champion and three arguments about shortcuts.', '★'],
    ['Last Guardrail Memorial', 'A tasteful plaque marks where safety equipment was discussed and rejected.', '▯'],
  ],
  'world-crown': [
    ["Champion's Bellhop", 'Only cleared save files may leave luggage at the golden desk.', '♛'],
    ['Mystery-House Keyring', 'Ten doors share one key and none admit which lock comes first.', '🗝'],
    ['Clear-Pipe Throne Lift', 'Royal cargo travels vertically while remaining visible to the entire court.', '▥'],
    ['Frog-Capture Victory Lap', 'Cascade ambassadors hop through the final course carrying the partnership flag.', '↔'],
    ['Sprixie Crown Registry', 'Seven fairies notarize each jewel in seven different colors.', '♦'],
    ['3D World Cast Call', 'Cats, clones, and captains reunite for one impossible group photo.', '★'],
    ['Last Flagpole Office', 'The clerk stamps every journey just before the pennant touches down.', '⚑'],
  ],
};

// Milestones 350–1,000 are where each route becomes wonderfully unreasonable.
// They are written as individual finales instead of reskinned “gearbox” copy.
const FINAL_CHAPTERS = {
  'frog-capture': [
    ['Marsh Frequency', 'Lantern signals coordinate ponds too distant to hear the evening chorus.', '📡'],
    ['Lily-Pad Franchise', 'Each new wetland receives a crown, a ledger, and five starter flies.', '♕'],
    ['Continental Croak', 'One booming ribbit crosses every border without presenting a passport.', '🌐'],
    ['Planetwide Pond', 'A thousand frogs hop at once and move the shoreline several inches.', '🌍'],
  ],
  'bonneton-tailor': [
    ['Self-Hemming Mooncloth', 'Silver fabric finishes its own seams while the ghosts choose buttons.', '☾'],
    ['Brim Futures Exchange', 'Next season’s hats sell out before anyone agrees which way they tilt.', '↗'],
    ['Hatmospheric Pressure', 'So many tall crowns gather that Bonneton develops indoor weather.', '☁'],
    ['Milliner of a Thousand Moons', 'The final hat fits the sky and leaves room for one feather.', '🪶'],
  ],
  'bobomb-battlefield': [
    ['Capless Detonation Desk', 'Uncrowned supervisors approve sparks with a stamp shaped like defeat.', '💥'],
    ['Cannon Foundry Dividend', 'Every paid shareholder receives one shell and extremely distant seating.', '●'],
    ['Battlefield Airspace', 'The mountain schedules cannonballs between clouds with military politeness.', '☁'],
    ['Fuse Heard Round the World', 'A thousand batteries light one cord and geography braces for applause.', '🗺'],
  ],
  'goomba-stack': [
    ['Stratospheric Supervisors', 'Upper management now wears oxygen masks and identical worried expressions.', '☁'],
    ['Mushroom Tower Bonds', 'Investors back the stack after being promised a ground-floor position.', '▤'],
    ['Eyebrow Horizon', 'From either side of the kingdom, the entire skyline looks concerned.', '⌒'],
    ['One Thousand Floors', 'The elevator is just more Goombas and has never missed a stop.', '↥'],
  ],
  'delfino-plaza': [
    ['Turbo-Nozzle Tram', 'Commuters hydroplane between market stalls without bruising the fruit.', '💦'],
    ['Pianta Plaza Conglomerate', 'Every awning joins one cheerful corporation run from a beach chair.', '🏖'],
    ['Islandwide Shine Tax', 'Sunlight is assessed by the ray and paid entirely in sunglasses.', '🕶'],
    ['Eternal Summer Ordinance', 'The council outlaws winter after confirming nobody invited it.', '☀'],
  ],
  'chain-chomp-quarry': [
    ['Bedrock Chew Toy', 'The deepest seam becomes a ball after one enthusiastic afternoon.', '●'],
    ['Quarry Collar Cooperative', 'Workers share ownership, leash duty, and one reinforced throwing glove.', '⛓'],
    ['Continental Fetch', 'A boulder launched at dawn returns from another time zone by lunch.', '↩'],
    ['Planet-Cracking Walkies', 'One thousand leashes pull taut and the horizon follows obediently.', '🌍'],
  ],
  'cat-bell-hills': [
    ['Pounce-Powered Bellpress', 'A padded platform converts feline landings into perfectly tuned brass.', '🔔'],
    ['Nine-Lived Foundry', 'The furnace survives eight accidents and frames the ninth certificate.', '🐾'],
    ['Feline Skyline', 'Golden ears appear above every hill whenever the bells change shift.', '🏙'],
    ['The Great Bellening', 'A thousand chimes ring; the whole kingdom grows whiskers briefly.', '♬'],
  ],
  'uproot-nursery': [
    ['Trellis Above Weather', 'Climbing vines pass the rain clouds and begin watering from upstairs.', '🌧'],
    ['Walking Orchard Trust', 'Mobile trees pool their fruit and elect a particularly tall pear.', '🍐'],
    ['Cloud-Root Canopy', 'The tallest shoots plant fresh seedlings on the underside of noon.', '☁'],
    ['Botanical Beanstalk Bureau', 'A thousand Uproots certify the route from topsoil to storybook altitude.', '🌱'],
  ],
  'choco-mountain': [
    ['Rockslide Signal Box', 'Falling boulders receive green lights and still ignore the schedule.', '🚦'],
    ['Tempered Track Dividend', 'Cool rails pay investors in chocolate shavings and punctual freight.', '🍫'],
    ['Cocoa Ridge Megaline', 'One locomotive crosses the entire mountain before the tunnel softens.', '🚂'],
    ['Mountain That Never Melts', 'A thousand trains circulate enough cold air to stabilize dessert geology.', '❄'],
  ],
  'jaxi-express': [
    ['Moon-Sand Taxi Rank', 'Silver dunes gain curb markers that last until the first passenger.', '☾'],
    ['Whiskerway Franchise', 'Every desert licenses one shortcut visible only to enormous feline faces.', '⌖'],
    ['Horizon Fare', 'The meter charges beyond the sunset and rounds terror down generously.', '🌅'],
    ['One-Thousandth Shortcut', 'Jaxi discovers a route so direct that departure arrives second.', '⚡'],
  ],
  'yoshis-island': [
    ['Flutter-Freight Airspace', 'Clouds reserve lower lanes for eggs traveling under kick power.', '☁'],
    ['Egg Reserve Bank', 'Spotted shells earn interest while staying warm in the vault.', '🥚'],
    ['Islandwide Melon Season', 'Every field ripens together and overwhelms the seed-counting office.', '🍉'],
    ['The Great Hatch Dispatch', 'A thousand crates crack open exactly where the manifest predicted.', '🐣'],
  ],
  'lake-boutique': [
    ['Abyssal Hemline', 'Designers lower the runway until even the deep fish request fittings.', '≋'],
    ['Pearl Futures', 'Oysters presell next tide’s collection from velvet-lined shell desks.', '●'],
    ['Runway Over the Horizon', 'One silk train circles the lake and returns in next season’s color.', '〰'],
    ["Ocean's Largest Fitting Room", 'A thousand boutiques draw the curtain and briefly divide the sea.', '🌊'],
  ],
  'toad-town-bazaar': [
    ['Pop-Up Kingdom', 'An entire shopping district unfolds between two panels before breakfast.', '▧'],
    ['Bazaar Bond Stall', 'Merchants sell shares beside turnips and wrap both in yesterday’s map.', '📈'],
    ['Paper-City Market Fold', 'Seven hundred fifty shops crease themselves into one crowded block.', '▤'],
    ['Infinite Item Shop', 'The thousandth counter opens inside the first shop’s back wall.', '∞'],
  ],
  'steam-gardener-workshop': [
    ['Boiler Garden District', 'Greenhouses heat neighboring streets and invoice them as seasonal mulch.', '♨'],
    ['Brass Petal Dividend', 'Metal blossoms distribute tiny washers to every patient shareholder.', '❀'],
    ['Greenhouse Megaworks', 'Glass roofs spread beyond the forest and request their own rainfall.', '🏭'],
    ['Factory That Learned Spring', 'One thousand workshops bloom simultaneously when the whistle sings.', '🌼'],
  ],
  'gusty-garden': [
    ['Wind-Riding Orchard', 'Fruit circles each planetoid until a basket politely intercepts it.', '🍎'],
    ['Gravity Garden Trust', 'Plots pool their down directions and invest in better trellises.', '◎'],
    ['Petals Across Orbit', 'A blossom trail becomes visible from observatories three galaxies away.', '❀'],
    ['Conservatory of a Thousand Worlds', 'Every tiny planet opens one flower toward the same wandering sun.', '☀'],
  ],
  'new-donk-scooters': [
    ['Vertical Parking Charter', 'The fleet stores itself on fire escapes under an adventurous zoning rule.', '🏙'],
    ['Municipal Ramp Bonds', 'Citizens fund plywood infrastructure through carefully airborne interest.', '↗'],
    ['Skyline Delivery Grid', 'Riders cross rooftops in neat lanes while taxis complain below.', '▥'],
    ['Every Light Is Green', 'A thousand scooters enter the avenue and traffic law simply salutes.', '🚦'],
  ],
  'shiverian-racing': [
    ['Powder-Cake Aerodynamics', 'Frosting fins keep racers stable through the blizzard chicane.', '🍰'],
    ['Frosted Finish Franchise', 'Each new circuit receives a bakery, a podium, and warmer mittens.', '🏁'],
    ['Polar Victory Circuit', 'The course wraps around winter and overtakes the calendar.', '❄'],
    ['Lap Around Winter', 'One thousand racers finish before the snowflake that started them lands.', '🏆'],
  ],
  'volbono-kitchen': [
    ['Volcano Sous-Chef Corps', 'Aproned cooks season eruptions before they reach the dining room.', '🌋'],
    ['Golden Stock Reserve', 'The central bank keeps bullion simmering with onions and thyme.', '🍲'],
    ['Continental Dinner Bell', 'One clang seats every kingdom at an impossibly extended table.', '🔔'],
    ['Kitchen at the End of the Menu', 'A thousand cooks plate the course printed after infinity.', '∞'],
  ],
  'ruined-dragon-hoard': [
    ['Thunderproof Counting House', 'Clerks total the vault beneath lightning rods shaped like abacuses.', '⚡'],
    ['Hoard Holdings', 'The dragon diversifies into gold, gems, and controlling interest in caves.', '♦'],
    ['Storm-Crown Treasury', 'Thunder circles the vault as a noisy but effective security system.', '♛'],
    ["Dragon's Final Decimal", 'The thousandth hoard adds another zero and singes the calculator.', '0'],
  ],
  'darker-side-armada': [
    ['Vacuum-Dock Foundry', 'Shipwrights weld by starlight where sparks have nowhere sensible to fall.', '✷'],
    ['Eclipse Fleet Trust', 'Captains pool their shadows and purchase a controlling share of night.', '◐'],
    ['Far-Side Shipping Lane', 'Beacon buoys mark a route the moon itself cannot watch.', '⋰'],
    ['Armada Beyond Arithmetic', 'A thousand ships pass the last number and keep formation anyway.', '∞'],
  ],
  'comet-observatory': [
    ['Engine-Room Luma Nursery', 'Young stars nap beside the turbines and dream in navigational coordinates.', '★'],
    ['Observatory Endowment', 'Distant galaxies contribute gravity, light, and one very slow cheque.', '☄'],
    ['Constellation Transit Authority', 'Star lines connect every dome without asking space to hold still.', '⌁'],
    ['Library at the Center of Orbit', 'A thousand observatories revolve around the book Rosalina has not finished.', '📚'],
  ],
  'new-donk-generator': [
    ['Moonlit Substation', 'Silver transformers keep the jazz district bright past the last encore.', '☾'],
    ['City Current Futures', 'Tomorrow’s electricity trades today from a humming basement desk.', '⚡'],
    ['Five-Borough Thunder', 'The expanded grid makes every skyline window blink on the downbeat.', '🏙'],
    ['Grid That Powers the Moon', 'One thousand generators send the night sky a surprisingly modest bill.', '🌕'],
  ],
  'gushen-couriers': [
    ['Stratospheric Sorting Buoy', 'A floating depot redirects parcels by cloud shape and forehead pressure.', '☁'],
    ['Cloud-Mail Cooperative', 'Couriers share jet fuel, rain stamps, and one enormous umbrella.', '☂'],
    ['Jetstream Postal Union', 'Upper winds carry signed contracts farther than any grievance committee.', '✉'],
    ['Parcel at the Edge of Sky', 'The thousandth courier delivers upward until blue runs out.', '↟'],
  ],
  'pokio-mint': [
    ['Obsidian Coin Die', 'A volcanic stamp leaves every crown sharp enough to climb with.', '◆'],
    ['Beak Standard Reserve', 'Currency value is pegged to one officially calibrated peck.', '◉'],
    ['Cliffside Currency Union', 'Mountain mints share walls, sparks, and a single impossible ladder.', '⛰'],
    ['Thousand-Peck Sovereign', 'The final coin rings for an hour and buys the entire echo.', '♛'],
  ],
  'shine-gate': [
    ['Solar Customs Carousel', 'Golden luggage circles until every ray clears inspection.', '☀'],
    ['Delfino Gold Standard', 'The island backs its coins with sunlight stored beneath the tower.', '✺'],
    ['Sunlit Trade Meridian', 'Every bright route crosses the gate at precisely local noon.', '⌖'],
    ['Gate That Taxes Dawn', 'A thousand inspectors stamp sunrise before releasing it to the plaza.', '🌅'],
  ],
  'sherm-foundry': [
    ['Foundry Fire-Control', 'Turret crews shape molten steel by firing colder arguments at it.', '◎'],
    ['Recoil Capital Works', 'Backward motion funds the assembly line’s next ambitious expansion.', '↩'],
    ['Moustached Industrial Belt', 'Factories encircle Metro Kingdom with uniformly excellent facial hair.', '🏭'],
    ['One-Thousand-Gun Assembly', 'Every barrel fires one finished part into a perfectly shocked warehouse.', '💥'],
  ],
  'whomps-fortress': [
    ['Fortress Flattop Foundry', 'Whomps press stone slabs by demonstrating their signature management style.', '▧'],
    ['Masonry Mutual', 'Contractors insure each other against cracks, falls, and heroic ground pounds.', '🛡'],
    ['Sky-High Stoneworks', 'New battlements cast shadows across clouds that never requested renovations.', '☁'],
    ['Monument to Falling Upward', 'A thousand fortresses topple in sequence and somehow build a staircase.', '↥'],
  ],
  'trex-expedition': [
    ['Cretaceous Field Office', 'The mobile lab files fossils before the owner notices them missing.', '🦴'],
    ['Fossil Futures Fund', 'Investors purchase tomorrow’s discoveries from several million years ago.', '📈'],
    ['Epoch-Spanning Convoy', 'Supply trucks stretch from the waterfall back to the late Jurassic.', '▱'],
    ['Expedition Before Timeclock', 'One thousand crews arrive so early the museum has not evolved yet.', '🦖'],
  ],
  'ricco-harbor': [
    ['Offshore Girder Grid', 'Steel walkways spread over water too polluted to reflect them.', '▥'],
    ['Harbor Freight Dividend', 'Dock shares pay in coins, rope, and priority Blooper lanes.', '⚓'],
    ['Islewide Cargo Current', 'One synchronized tide carries every crate around Delfino before tea.', '≋'],
    ['Port Without a Pier', 'A thousand shipping offices cover the bay until land becomes optional.', '🌊'],
  ],
  'odyssey-crew': [
    ['Globe-Spanning Watch', 'Deckhands cover every time zone and argue about when lunch begins.', '🌍'],
    ['Red-Sail Company Store', 'Crew pay returns as patches, postcards, and suspicious balloon polish.', '⛵'],
    ['Balloon Fleet Horizon', 'Crimson sails fill the sky farther than the telescope can invoice.', '🎈'],
    ['Odyssey Without a Return Ticket', 'A thousand crews depart in every direction and all call it forward.', '⌖'],
  ],
  'mount-wario': [
    ['Alpine Assembly Chute', 'Factory parts descend through snow and arrive pre-tested by impact.', '🏭'],
    ['Downhill Transit Trust', 'Investors earn speed instead of interest and cannot redeem uphill.', '↘'],
    ['Summit-to-Sea Express', 'One timetable covers ski jump, dam, forest, mine, and terrified coast.', '🌊'],
    ['Mountain in One Lap', 'A thousand trains leave the peak and wear the landscape as a track.', '🏁'],
  ],
  'sphinx-observatory': [
    ['Riddle Relay Array', 'Telescopes pass one question across craters without dropping the premise.', '?'],
    ['Paradox Research Grant', 'Funding arrives yesterday for conclusions due several tomorrows ago.', '∞'],
    ['Question Across the Cosmos', 'Every star blinks once, which creates considerably more paperwork.', '✦'],
    ['Answer That Employs Everyone', 'A thousand observatories solve the riddle and create a larger department.', '◎'],
  ],
  'honeyhive-galaxy': [
    ['Comet-Pollinated Comb', 'Traveling stars dust each hexagon with bright, slightly crunchy nectar.', '☄'],
    ['Royal Jelly Reserve', 'The hive stores golden liquidity in jars guarded by tiny crowns.', '🍯'],
    ['Galactic Honey Belt', 'Bee lanes wrap the system in a fragrant amber orbit.', '🐝'],
    ['Hive With Its Own Moon', 'A thousand apiaries hum strongly enough to capture a satellite.', '🌕'],
  ],
  'broodal-agency': [
    ['Lunar Honeymoon Bureau', 'Newlyweds receive a crater suite and separate gravity waivers.', '☾'],
    ['Cathedral Contract Trust', 'The agency invests every deposit in taller cakes and firmer clauses.', '▤'],
    ['Wedding Bells in Orbit', 'Bouquets circle the moon while guests pretend this was rehearsed.', '💐'],
    ['Till Production Do Us Part', 'One thousand agencies renew their vows to the monthly invoice.', '💍'],
  ],
  'coconut-mall': [
    ['Escalator Exchange Floor', 'Retailers trade shelf space while moving steadily toward housewares.', '↗'],
    ['Food-Court Futures', 'Tomorrow’s lunch is already sold with a refill and tire marks.', '🥤'],
    ['Mallwide Motorway', 'Every aisle receives lanes, starting lights, and kiosk-side grandstands.', '🏎'],
    ['Checkout at the Finish Line', 'A thousand tills scan the winning cart before its wheels stop.', '🏁'],
  ],
  'rogueport': [
    ['Thousand-Door Warehouse', 'Each paper entrance opens into a storeroom folded behind the last.', '🚪'],
    ['Trouble Center Holdings', 'Side quests become securities after the clerk staples enough disclaimers.', '!'],
    ['Port Folded Around the World', 'Rogueport creases the horizon until every harbor becomes adjacent.', '🌐'],
    ['Lease Beneath the Gallows', 'The thousandth tenant signs because the rent remains suspiciously competitive.', '✒'],
  ],
  'beanbean-airport': [
    ['Chuckola Jet Fuel', 'Laughing soda propels aircraft and tells jokes throughout the safety briefing.', '🥤'],
    ['Beanstar Duty-Free Trust', 'Royal luggage shelters profits beneath a very sparkly customs exemption.', '★'],
    ['International Teehee Terminal', 'Giggling gates serve every kingdom without once announcing a straight face.', '✈'],
    ['Flight Beyond the Border Jump', 'A thousand departures clear customs with one perfectly timed leap.', '↗'],
  ],
  'luigis-mansion': [
    ['Dark-Light Title Office', 'Hidden deeds glow into view beside tenants who wish they had not.', '🔦'],
    ['Spectral Property Trust', 'Ghost landlords pool their mansions while remaining individually transparent.', '👻'],
    ['Mansion District Beyond Maps', 'Hallways annex neighboring streets whenever E. Gadd turns around.', '⌂'],
    ['One Thousand Vacant Rooms', 'Every door says empty; every doorknob laughs differently.', '🚪'],
  ],
  'rainbow-road': [
    ['Orbital Pit Lane', 'Mechanics change tires in freefall while the road keeps curving away.', '🔧'],
    ['Spectrum Freight Futures', 'Tomorrow’s cargo travels today along violet, then settles in green.', '🌈'],
    ['Constellation Causeway', 'Prismatic lanes stitch stars into a map with no safe shoulder.', '★'],
    ['Road Past the Last Star', 'A thousand convoys continue after the rainbow runs out of colors.', '∞'],
  ],
  'world-crown': [
    ['Mystery-House Annex', 'Bonus rooms multiply behind the throne whenever someone checks completion.', '🗝'],
    ["Champion's Treasury", 'Every green star earns a velvet drawer and its own victory fanfare.', '★'],
    ['Sprixie Crown Megapolis', 'Clear pipes braid seven kingdoms into one glittering capital.', '♦'],
    ['Flagpole at the End of Everything', 'A thousand citadels raise one pennant beyond the final world number.', '⚑'],
  ],
};

function copyFor(producer, index) {
  const authored = COPY[producer.id]?.[index];
  if (authored) return authored;
  const newRouteChapter = NEW_ROUTE_COPY[producer.id]?.[index];
  if (newRouteChapter) return newRouteChapter;
  const finale = FINAL_CHAPTERS[producer.id]?.[index - 7];
  if (finale) return finale;
  throw new Error(`Missing authored upgrade copy for ${producer.id} milestone ${MILESTONES[index]}.`);
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

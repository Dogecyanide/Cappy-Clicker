import { PRODUCERS } from './buildings.js';
import { POWER_MOONS } from './power-moons.js';

const ownershipTargets = [1, 25, 50, 100, 200];

const ownershipCopy = {
  'frog-capture': [
    ['First Contact: Amphibian Division', 'A frog joined the payroll and immediately requested a damp office.'],
    ['Pondemonium', 'The pond now has a waiting list and a dress code.'],
    ['Ribbit Dividend', 'Your portfolio is liquid in several senses.'],
    ['Frog Industrial Complex', 'Nobody remembers approving the tadpole annex.'],
    ['Croak and Dagger', 'Two hundred tiny agents refuse to disclose their mission.'],
  ],
  'bonneton-tailor': [
    ['Measure Once, Panic Twice', 'The first tailor insists your hat has an inseam.'],
    ['Hat Trick Department', 'Twenty-five needles are unionizing around one heroic thimble.'],
    ['Seam Team Supreme', 'Fifty tailors can hem a cape before it finishes billowing.'],
    ['Haute Cap-ital', "Bonneton's runway now has its own customs checkpoint."],
    ['Thread Zeppelin', 'So many spools arrived that the skyline became mostly cotton.'],
  ],
  'goomba-stack': [
    ['Entry-Level Management', 'One Goomba climbed another in spirit, if not yet in height.'],
    ['Vertical Ambition', 'The stack entered local airspace without filing paperwork.'],
    ['Goomba High-Rise', 'Elevator service remains two Goombas carrying a third.'],
    ['Stack Market', 'Analysts rate the tower brown, wobbly, and somehow bullish.'],
    ['Brownstone Skyline', 'Sunset over two hundred Goombas is alarmingly scenic.'],
  ],
  'chain-chomp-quarry': [
    ['Rock and Roll', "The quarry's first employee ate the safety whistle."],
    ['Quarry Quite Contrary', 'Twenty-five Chain Chomps disagree with every load-bearing wall.'],
    ['Bite the Bedrock', 'Geologists have started labeling strata by tooth marks.'],
    ['Aggregate Aggression', 'The gravel is now produced under active intimidation.'],
    ['Chompany Town', 'Every street ends at a post, and every post looks nervous.'],
  ],
  'uproot-nursery': [
    ['Root Access', 'The nursery password was apparently just turnip.'],
    ['Plant Overtime', 'Twenty-five Uproots stayed late and grew taller out of spite.'],
    ['Stem Education', 'The curriculum is ninety percent stretching and ten percent screaming.'],
    ['Nursery Rhyme Scheme', 'A hundred synchronized sprouts have weaponized whimsy.'],
    ['Photosynthesis Syndicate', 'Sunlight enters freely; coins leave in unmarked pots.'],
  ],
  'jaxi-express': [
    ['Meter Running', 'Your first Jaxi charged extra for sand in the upholstery.'],
    ['Desert Dispatch', 'Twenty-five rides circle the pyramid yelling shortcut.'],
    ['Fare and Square', 'The fleet accepts coins, compliments, and reckless optimism.'],
    ['Jaxi Taxonomy', 'Scholars classified the herd as fast, loud, and nonrefundable.'],
    ['Ride-Share Pharaohs', 'Two hundred drivers have five stars and zero detectable brakes.'],
  ],
  'lake-boutique': [
    ['Dressed to Swim', "The boutique's first garment is waterproof above the ankles."],
    ['Zipper Current', 'Twenty-five designers discovered that tides are seasonal.'],
    ['Couture Undertow', 'Fifty mannequins stare elegantly into the abyss.'],
    ['Runway Below Sea Level', 'The collection debuts to thunderous, slightly muffled applause.'],
    ['The Deep-End Collection', 'Two hundred boutiques agree that oxygen clashes with everything.'],
  ],
  'steam-gardener-workshop': [
    ['Hot Under the Collar', 'The first gardener watered a rose with plausible deniability.'],
    ['Botanical Boiler Room', 'Twenty-five kettles whistle in the key of chlorophyll.'],
    ['Steamwork Makes Dream Work', 'Fifty gardeners have unionized the fog.'],
    ['Petal to the Metal', 'The workshop now grows bouquets at unsafe velocities.'],
    ['Garden of Industrial Delights', 'Two hundred factories prove nature needed more valves.'],
  ],
  'new-donk-scooters': [
    ['Kickstart Capital', 'One scooter has been parked across three promising revenue streams.'],
    ['Sidewalk Conglomerate', 'Pedestrians now require merger approval to cross the block.'],
    ['Peak Commute', 'Fifty scooters arrived early by ignoring several dimensions.'],
    ['Scooter State of Mind', 'The city anthem is one long, apologetic bell ring.'],
    ['Rush Hour Forever', 'Two hundred vehicles achieved gridlock without a single car.'],
  ],
  'shiverian-racing': [
    ['Cold Start', 'The first racer warmed up by complaining about summer.'],
    ['Snow Business', 'Twenty-five entrants consider traction a personal insult.'],
    ['Laplandlords', 'Fifty racers own every curve and sublet the straightaways.'],
    ['Pole Position Pastry', 'A hundred competitors carb-load with structurally ambitious cake.'],
    ['Frost and Flurrious', 'At two hundred racers, the finish line applied for witness protection.'],
  ],
  'gushen-couriers': [
    ['Express Yourself', 'The first courier delivered a parcel and several unsolicited opinions.'],
    ['Jet Stream Team', 'Twenty-five Gushen have made the sky a loading zone.'],
    ['Pressurized Delivery', 'Fifty packages arrive before their tracking numbers exist.'],
    ['Squid Pro Quo', 'A hundred couriers trade altitude for extremely reasonable fees.'],
    ['Air Mail Armada', 'Two hundred tentacled pilots have annexed the updraft.'],
  ],
  'volbono-kitchen': [
    ['Mise en Coins', 'The first kitchen plated one coin beneath a very confident leaf.'],
    ['Forkful Thinking', 'Twenty-five chefs are reducing sauce and workplace serenity.'],
    ['Simmer Down Now', 'Fifty burners refuse to discuss their feelings.'],
    ['Culinary Combustion', 'A hundred kitchens flambé the concept of moderation.'],
    ['Michelin Impossible', 'Two hundred brigades earned a star visible from space.'],
  ],
  'pokio-mint': [
    ['Legal Tenderbeak', 'The first Pokio stamped a coin and pecked the receipt.'],
    ['Pecking Order', 'Twenty-five minters established seniority by wall height.'],
    ['Mint Condition', 'Fifty beaks polish currency to a suspicious sparkle.'],
    ['Coin-Operated Birdhouse', 'A hundred Pokio turned loose change into zoning law.'],
    ['Beakonomics Department', 'Two hundred economists concur: walls are graphs if you stab them.'],
  ],
  'sherm-foundry': [
    ['Tank You Kindly', 'The first Sherm asked where to park the artillery.'],
    ['Heavy Metallurgy', 'Twenty-five foundries make subtlety by the metric ton.'],
    ['Shell Corporation', 'Fifty tanks incorporated somewhere with very wide doorways.'],
    ['Cannonical Industry', 'A hundred Sherms insist every blueprint needs more barrel.'],
    ['Arms Race to Lunch', 'Two hundred tanks reached the cafeteria simultaneously.'],
  ],
  'trex-expedition': [
    ['Jurassic Profit', 'The first expedition found an asset with tiny quarterly reports.'],
    ['Fossil-Fuelled Forecast', 'Twenty-five researchers predict a strong chance of screaming.'],
    ['Apex Expenses', 'Fifty T-Rexes ate the budget and the budget committee.'],
    ['Cretaceous Cashflow', 'A hundred ancient mouths turned scarcity into an appetizer.'],
    ['Tyrannical Holdings', 'Two hundred apex investors diversified into everything that moved.'],
  ],
  'odyssey-crew': [
    ['All Aboard-ish', 'The first crewmate boarded after the ship had technically departed.'],
    ['Deck Hands Full', 'Twenty-five sailors can now point at the horizon in shifts.'],
    ['Frequent Flyer Program', 'Fifty crew earned miles on a vessel with no odometer.'],
    ['Red Sail Enterprise', 'A hundred uniforms make every landing look intentional.'],
    ['Voyage Incorporated', 'Two hundred employees, one hat-shaped ship, no expense policy.'],
  ],
  'sphinx-observatory': [
    ['Riddle Me Revenue', 'The first observatory asked a question invoiced by the hour.'],
    ['Questionable Assets', 'Twenty-five Sphinxes classify certainty as a rounding error.'],
    ['Enigma Machine Shop', 'Fifty riddles entered; one confused receipt emerged.'],
    ['Observatory Effect', 'A hundred telescopes changed the answer by looking at it.'],
    ['Answer Pending', 'Two hundred sages agreed to circle back after eternity.'],
  ],
  'broodal-agency': [
    ['Love at First Invoice', 'The first agency booked a venue before finding a couple.'],
    ['Something Billed', 'Twenty-five planners found old, new, borrowed, and taxable.'],
    ['Bouquet Bureaucracy', 'Fifty florists require three forms per petal.'],
    ['Matrimonial Monopoly', 'A hundred agencies own every aisle worth walking down.'],
    ['Till Debt Do Us Party', 'Two hundred weddings later, the cake has legal counsel.'],
  ],
  'ruined-dragon-hoard': [
    ['Hoard Starter', 'The first dragon deposited one coin and slept on the paperwork.'],
    ['Asset Scales', 'Twenty-five hoards appreciate faster when glared at.'],
    ['Cave Equity', 'Fifty vaults added lava-facing balconies.'],
    ['Liquid Fire Reserve', 'A hundred dragons hedge against rain with combustion.'],
    ['Diversified Dragon', 'Two hundred hoards spread risk across gold, gems, and trespassers.'],
  ],
  'darker-side-armada': [
    ['One Small Fleet', 'The first ship launched with a countdown and a missing manual.'],
    ['Launch Window Shopping', 'Twenty-five captains browsed orbit without committing.'],
    ['Lunar Logistics', 'Fifty vessels made vacuum eligible for next-day delivery.'],
    ['Fleet Expectations', 'A hundred ships arrived precisely where optimism predicted.'],
    ['Darker Side of the Boom', 'Two hundred engines taught silence to file a noise complaint.'],
  ],
};

const row = (category, id, name, flavour, type, target, scope) => ({
  id, category, name, flavour,
  condition: { type, target, ...(scope === undefined ? {} : { scope }) },
});

const producerAchievements = PRODUCERS.flatMap((producer) => ownershipCopy[producer.id].map(([name, flavour], index) =>
  row('producer_ownership', `own-${producer.id}-${ownershipTargets[index]}`, name, flavour, 'producer-owned', ownershipTargets[index], producer.id),
));

const economy = [
  ['100', 'Coin Purse Person', 'The purse jingles loudly enough to qualify as a tiny parade.'],
  ['1e3', 'Four-Digit Souvenir', 'You bought nothing sensible and kept the receipt anyway.'],
  ['1e4', 'Walking-Around Money', 'Ten thousand coins learned to follow you between kingdoms.'],
  ['1e5', 'A Very Serious Jar', 'The rainy-day fund now has weather of its own.'],
  ['1e6', 'Million-Hat March', 'Seven figures file past while Cappy conducts with the brim.'],
  ['1e8', 'Treasury with a View', 'The vault brochure promises natural light and unnatural interest.'],
  ['1e10', 'The Ten-Billion Ticket', 'It is nonrefundable, transferable, and much too large for your pocket.'],
  ['1e12', 'Trillion-Mile Club', 'Your balance traveled farther than the Odyssey and complained less.'],
  ['1e15', 'Quadrillion Reasons', 'At least one of them probably explains the extra comma.'],
  ['1e18', 'Pocket Dimension Fund', 'Conventional pockets resigned from the assignment.'],
  ['1e21', 'Sextillion Souvenirs', 'Customs would like a word about all that commemorative currency.'],
  ['1e27', 'Decimal Migration', 'The decimal point left for a quieter kingdom.'],
  ['1e36', 'Astronomical Allowance', 'Even the observatory needs a wider ledger.'],
  ['1e48', 'Currency Event Horizon', 'Coins go in; financial advisors send postcards.'],
  ['1e60', 'Bank Beyond Language', 'Accountants now communicate exclusively through stunned gestures.'],
].map(([target, name, flavour]) => row('economy', `lifetime-${target}`, name, flavour, 'lifetime-coins', target));

economy.push(...[
  ['1', 'Drip Feed', 'The economy learned to walk without holding your hand.'],
  ['10', 'Coin Conveyor', 'Ten coins arrive each second, all pretending not to know one another.'],
  ['100', 'Triple-Digit Weather', 'Forecast: one hundred coins per second with localized jingling.'],
  ['1e3', 'Thousandfold Faucet', 'The tap is stuck open and the plumber accepts only coins.'],
  ['1e4', 'Five-Figure Fountain', 'Tourists have started throwing wishes back at the money.'],
  ['1e6', 'Million-a-Second Minute', 'Every sixty seconds, arithmetic asks for hazard pay.'],
  ['1e9', "Blink and You're a Billionaire", 'Looking away is now a recognized investment strategy.'],
  ['1e12', 'Trillion Ticker', 'The counter makes a noise normally associated with helicopters.'],
  ['1e15', 'Quadrillion Current', 'The coin stream has tides, undertow, and maritime law.'],
  ['1e18', 'Quintillion Conveyor', 'Factory inspectors quietly backed out of the room.'],
  ['1e24', 'Septillion Squall', 'Loose currency is now a severe weather event.'],
  ['1e30', 'Nonillion Now', 'Tomorrow was deemed too slow for this balance sheet.'],
  ['1e40', 'Numbers Need Seatbelts', 'The exponent has exceeded the posted speed limit.'],
  ['1e50', 'Scientific Windfall', 'Notation put on a lab coat and stopped answering questions.'],
  ['1e60', 'Coins Before Time', 'Production finishes several seconds before causality begins.'],
].map(([target, name, flavour]) => row('economy', `cps-${target}`, name, flavour, 'total-cps', target)));

const clicking = [
  ['tosses-1', 'Hat in the Ring', 'Cappy has officially entered the throwing business.', 'total-tosses', 1],
  ['tosses-10', 'Toss Salad', 'Ten throws, lightly dressed with reckless wrist movement.', 'total-tosses', 10],
  ['tosses-100', 'Return Policy', 'Cappy came back one hundred times without asking for store credit.', 'total-tosses', 100],
  ['tosses-1e3', "Milliner's Elbow", 'A thousand tosses reveal muscles unknown to medical science.', 'total-tosses', 1e3],
  ['tosses-1e4', 'Throw Business', 'Ten thousand launches make this less of a hobby and more of a concern.', 'total-tosses', 1e4],
  ['tosses-1e5', 'Wrist of the North Star', 'One hundred thousand throws have made pointing dramatically unnecessary.', 'total-tosses', 1e5],
  ['tosses-1e6', 'Million-Toss March', 'Cappy requests frequent-flier miles and a tiny ice pack.', 'total-tosses', 1e6],
  ['crit-1', 'Critical Acclaim', 'One perfect throw received a glowing review from gravity.', 'critical-tosses', 1],
  ['crit-10', 'Crit Happens', 'Ten lucky impacts suggest probability has taken a personal interest.', 'critical-tosses', 10],
  ['crit-100', 'Red-Hot Brim', 'A hundred critical throws have voided the hat warranty.', 'critical-tosses', 100],
  ['crit-1e3', 'Statistical Outlier', 'One thousand criticals forced the bell curve into hiding.', 'critical-tosses', 1e3],
  ['crit-1e4', 'The Critics Union', 'Ten thousand perfect hits now demand top billing.', 'critical-tosses', 1e4],
  ['combo-5', 'Five-Throw Forecast', 'A brief shower of hats is moving in from the left.', 'max-combo', 5],
  ['combo-10', 'Combover', 'Ten uninterrupted tosses conceal every gap in the technique.', 'max-combo', 10],
  ['combo-25', 'Unbroken Brim', 'Twenty-five throws passed without rhythm filing a complaint.', 'max-combo', 25],
  ['combo-50', 'Hat Trickster', 'Fifty chained tosses made the mouse consider early retirement.', 'max-combo', 50],
  ['combo-100', 'Century of Cappy', 'A hundred-hit combo turned clicking into choreography.', 'max-combo', 100],
  ['click-value-10', 'Premium Brim', 'A single toss is now worth lunch in a very small kingdom.', 'click-value', '10'],
  ['click-value-100', 'Hundred-Coin Hello', 'Cappy greets the economy with triple-digit enthusiasm.', 'click-value', '100'],
  ['click-value-1e3', 'Heavy Hat Economics', 'Each throw lands with one thousand coins of fiscal momentum.', 'click-value', '1e3'],
  ['click-value-1e6', 'Million-Dollar Toss', 'Insurance has classified your wrist as heavy machinery.', 'click-value', '1e6'],
  ['click-value-1e12', 'Fiscal Boomerang', 'A trillion coins leave and return before the auditors can duck.', 'click-value', '1e12'],
  ['manual-1e3', 'Handcrafted Income', 'The first thousand was made locally with artisanal finger pressure.', 'manual-coins', '1e3'],
  ['manual-1e9', 'Artisanal Billion', 'Every coin is small-batch, ethically tossed, and wildly impractical.', 'manual-coins', '1e9'],
  ['manual-1e18', 'Wrist-Made Empire', 'Automation watches your manual fortune with professional jealousy.', 'manual-coins', '1e18'],
].map(([id, name, flavour, type, target]) => row('clicking', id, name, flavour, type, target));

const upgrades = [
  [1, 'Read the Manual', 'One upgrade installed; several warning labels remain decorative.'],
  [3, 'Three Easy Payments', 'The fourth payment was replaced by suspicious efficiency.'],
  [5, 'Five-Star Hardware', 'Every star was awarded by the machine being reviewed.'],
  [7, 'Lucky Number Lever', 'Seven improvements and only one lever marked probably.'],
  [10, 'Ten Hats Ahead', 'The upgrade shelf has entered double digits and mild disarray.'],
  [15, 'Retrofit Tourist', 'Fifteen modifications later, the warranty speaks only in riddles.'],
  [20, 'Twenty Tweaks Later', 'The original blueprint is now considered historical fiction.'],
  [25, 'Quarter-Century Warranty', 'Coverage lasts until someone asks what all the buttons do.'],
  [30, 'Thirty Under the Hood', 'There is no room left beneath the hood, so upgrades use the roof.'],
  [40, 'Forty Winks, Zero Downtime', 'The machinery sleeps with both eyes open and one cog turning.'],
  [50, 'Fifty Fine Adjustments', 'Precision has been calibrated to the nearest dramatic flourish.'],
  [60, 'Sixty-Cog Salute', 'Every gear turned at once and briefly spelled congratulations.'],
  [70, 'Half the Catalogue', 'Seventy upgrades down; the instruction binder has gained sentience.'],
  [80, 'Eighty Little Miracles', 'Engineering insists these are features, not repeated divine intervention.'],
  [90, 'Ninety-Day Retrofit', 'The renovation finished early in every timezone except this one.'],
  [100, 'Triple-Digit Toolkit', 'One hundred installed improvements require a tool chest with zoning approval.'],
  [110, 'Eleven Tens of Trouble', 'The machines run beautifully and laugh when nobody is looking.'],
  [120, 'One-Twenty Vision', 'At this resolution, inefficiency is no longer visible.'],
  [130, 'Ten Left in the Box', 'The remaining slots stare back with unbearable expectation.'],
  [140, 'Every Switch Flipped', 'All one hundred forty upgrades glow; the power bill refuses to comment.'],
].map(([target, name, flavour]) => row('upgrades', `upgrades-${target}`, name, flavour, 'upgrades-owned', target));

const moonCopy = [
  ['Mantelpiece Orbit', 'It lights the room and judges every lesser souvenir.'],
  ['A Tricky Little Satellite', 'This moon returned from a cap toss wearing a smug expression.'],
  ['Desert Red-Eye', 'Sand in your shoes is complimentary; sleep remains an upgrade.'],
  ['Bedtime Above the Clouds', 'The Odyssey finally stocks pillows that understand turbulence.'],
  ['Greenhouse in the Sky', 'A celestial watering can has complicated local weather.'],
  ['Coupon Celestial', 'The cashier checked it twice and sighed with professional defeat.'],
  ['Neon Nightlight', 'New Donk finally found a sign bright enough to advertise space.'],
  ['Ghost in the Fine Print', 'For once, invisible terms and conditions are on your side.'],
  ['Pocket-Sized Universe', 'The constellation folds neatly but refuses to fit beside your keys.'],
  ['Hard-Hat Holiday', 'The industrial tour ends at a gift shop made entirely of warning signs.'],
  ['Lunar Long Weekend', 'Your out-of-office reply now has its own gravitational pull.'],
  ['Wholesale Moonbeam', 'Buying direct saves money and angers three orbital distributors.'],
  ['Thunder Deposit', 'The vault contains one moon and a very nervous lightning rod.'],
  ['Itinerary of Gold', 'Every route is scenic when the map is too expensive to fold.'],
  ['Frequent Flyer Forever', 'Cappy earned enough miles to circle causality.'],
  ['Grand Moon Tour', 'The final brochure promised breathtaking views and delivered vacuum.'],
];

const moons = POWER_MOONS.map((moon, index) => row(
  'moons', `badge-${moon.id}`, moonCopy[index][0], moonCopy[index][1], 'moon-collected', 1, moon.id,
));

const kingBoo = [
  ['boo-seen-1', 'Unlicensed Gaming Establishment', 'The casino appeared without permits, walls, or a credible return address.', 'boo-encounters', 1],
  ['boo-spin-1', 'Just One Spin', 'The lever felt sticky in a financially significant way.', 'boo-spins', 1],
  ['boo-spin-10', 'Known to the Dealer', 'King Boo remembers your face and none of your alleged winnings.', 'boo-spins', 10],
  ['boo-spin-50', 'Comped Parking', 'Fifty spins earned one imaginary voucher for a nonexistent garage.', 'boo-spins', 50],
  ['boo-spin-100', 'The Loyalty Trap', 'One hundred visits unlocked platinum-tier regret.', 'boo-spins', 100],
  ['boo-positive-10', 'Boo-nanza', 'Ten friendly outcomes suggest the machine briefly mistook you for management.', 'boo-positive', 10],
  ['boo-negative-10', 'Occupational Hazard', 'Ten bad results qualify you for a helmet and absolutely no compensation.', 'boo-negative', 10],
  ['boo-neutral-10', 'Comedy Payout', 'Ten joke results paid entirely in haunted punchlines.', 'boo-neutral', 10],
  ['boo-severe-1', 'Purple Alert', 'The reels stopped smiling and so did the balance sheet.', 'boo-tier-seen', 1, 'severe-negative'],
  ['boo-catastrophe-1', 'The House Always Wins', 'Thirty-five percent vanished while three Boos celebrated fiscal violence.', 'boo-tier-seen', 1, 'catastrophic'],
  ['boo-jackpot-1', 'Triple-Crown Review', 'Against professional advice, the casino accidentally paid you.', 'boo-outcome-seen', 1, 'royal-jackpot'],
  ['boo-ignored-1', 'Ghosted the Ghost', 'King Boo discovered what unread notifications feel like.', 'boo-ignored', 1],
  ['boo-ignored-10', 'Do Not Disturb', 'Ten silent rejections have made the haunting oddly personal.', 'boo-ignored', 10],
  ['boo-distinct-10', 'Sample Platter', 'You tasted ten varieties of risk and one suspicious garnish.', 'boo-distinct', 10],
  ['boo-distinct-18', 'Whole Boo-fet', 'Every outcome proves the menu needs a warning label.', 'boo-distinct', 18],
  ['boo-positive-streak-3', 'Hot Hand, Cold Ghost', 'Three wins in a row made King Boo check the wiring.', 'boo-streak', 3, 'positive'],
  ['boo-negative-streak-3', 'Bad Things in Threes', 'The reels delivered a trilogy with no satisfying conclusion.', 'boo-streak', 3, 'negative'],
  ['boo-effects-expired-5', 'Statute of Limbo-tations', 'Five curses expired before their paperwork could be renewed.', 'effects-expired', 5],
  ['boo-restored-1', 'Back on the Payroll', 'Your strongest producer returned from an involuntary ghost-sponsored holiday.', 'producer-restored', 1],
  ['boo-losses-1e12', 'Casino Tax Deduction', 'A trillion lost coins have been reclassified as spectral tuition.', 'boo-coins-lost', '1e12'],
].map(([id, name, flavour, type, target, scope]) => row('king_boo', id, name, flavour, type, target, scope));

const discoveryCopy = [
  ['A Leap Abroad', 'Your voyage begins with one frog and no defensible itinerary.'],
  ['Checked In at Bonneton', 'The border agent stamped your passport and adjusted your collar.'],
  ['Stack Exchange', 'A vertical market appeared where common sense used to stand.'],
  ['Quarry on My Way', 'The scenic route contains gravel, teeth, and no refunds.'],
  ['Uprooted Itinerary', 'Your travel plans have grown legs and an alarming amount of height.'],
  ['Sand in the Fare', 'Fast travel is unlocked; comfortable travel remains under review.'],
  ['Lakefront Listing', 'The newest destination includes tailoring, tides, and damp receipts.'],
  ['Garden Pressure', 'Industry blooms wherever the boiler stops leaking.'],
  ['New Donk, New You', 'The city gave you a scooter map and several conflicting traffic laws.'],
  ['Chilled Reception', 'The welcome committee passed you at tremendous speed.'],
  ['Special Delivery: Sky', 'Your package is out for delivery somewhere above cloud level.'],
  ['Table for a Kingdom', 'The reservation includes lava seating and a courageous napkin.'],
  ['Money on the Wall', 'A bird with a sharp beak has reinvented monetary policy.'],
  ['Please Mind the Tank', 'The factory tour begins after everyone clears the firing lane.'],
  ['Past Due', 'This destination has been waiting roughly sixty-six million years.'],
  ['The Red Sail Route', 'Your transport finally has staff, luggage tags, and plausible direction.'],
  ['Ask Me Anything Later', 'The observatory offers answers in exchange for better questions.'],
  ['Wedding Crash Course', 'The brochure promises romance, rabbits, and aggressive scheduling.'],
  ['Here Be Receipts', 'The dragon kept immaculate records and several scorched accountants.'],
  ['The Last Departure', 'Beyond this gate, even the travel insurance starts laughing.'],
];

const discovery = PRODUCERS.map((producer, index) => row(
  'discovery', `discover-${producer.id}`, discoveryCopy[index][0], discoveryCopy[index][1], 'producer-discovered', 1, producer.id,
));

const misc = [
  ['offline-return', 'Welcome Back, Probably', 'The producers worked unsupervised and only some furniture is missing.', 'offline-claims', 1],
  ['offline-8h', 'Eight-Hour Souvenir', 'A full capped absence returned with coins and an implausible alibi.', 'longest-offline', 28800],
  ['offline-1e12', 'While You Were Gone', 'The idle shift earned a trillion coins and used all the good mugs.', 'offline-coins', '1e12'],
  ['export-save', 'Paper Trailblazer', 'Your entire voyage now fits inside a deeply suspicious block of text.', 'save-exports', 1],
  ['import-save', 'Customs Cleared', 'The imported adventure passed inspection without losing a single Goomba.', 'save-imports', 1],
  ['buy-max', 'Maximum Overbuy', 'You pressed Max and let arithmetic make the emotional decisions.', 'buy-max-uses', 1],
  ['bulk-100', 'Wholesale Hat District', 'One transaction acquired one hundred producers and several logistics problems.', 'largest-bulk', 100],
  ['one-each', 'Everybody Gets a Desk', 'Every producer type owns at least one chair, post, cave, or launchpad.', 'producer-types-owned', 20],
  ['all-discovered', 'Atlas, Completed', 'Every destination is marked, though several maps are singed.', 'producer-types-discovered', 20],
  ['exact-zero', 'Exact Change', 'A purchase left precisely zero coins and one extremely satisfied cashier.', 'zero-after-purchase', 1],
  ['under-one', 'Penny-Pinched', 'You completed a transaction with less than one coin of breathing room.', 'tiny-leftover', 1],
  ['three-effects', 'Status Effect Collector', 'Three timers are running and none agree what kind of day this is.', 'simultaneous-effects', 3],
  ['news-40', 'News Cycle Survivor', 'You read forty headlines without demanding journalistic standards.', 'unique-news', 40],
  ['backdrops-5', 'Scenic Route', 'Five kingdom panoramas passed by without a single wrong turn being admitted.', 'backdrops-seen', 5],
  ['session-2h', 'Long Session, Short Break', 'Two active hours disappeared into the highly regulated hat economy.', 'play-seconds', 7200],
  ['days-7', 'Week-Long Layover', 'Seven separate days now qualify this clicker as a travel arrangement.', 'play-days', 7],
  ['autosaves-100', 'Saved by the Bell', 'One hundred autosaves protected the voyage from dramatic browser exits.', 'autosaves', 100],
  ['performance-all', 'Three-Speed Tourist', 'Full, Reduced, and Potato modes have each witnessed your management style.', 'performance-modes', 3],
  ['other-249', 'The Final Stamp', 'Every other badge is present; this one closes the overstuffed passport.', 'other-achievements', 249],
].map(([id, name, flavour, type, target]) => row('misc', `misc-${id}`, name, flavour, type, target));

export const ACHIEVEMENTS = [
  ...producerAchievements, ...economy, ...clicking, ...upgrades, ...moons, ...kingBoo, ...discovery, ...misc,
];

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((achievement) => [achievement.id, achievement]));

export const ACHIEVEMENT_CATEGORY_COUNTS = {
  producer_ownership: 100,
  economy: 30,
  clicking: 25,
  upgrades: 20,
  moons: 16,
  king_boo: 20,
  discovery: 20,
  misc: 19,
};

export const CONDITION_TYPES = new Set([
  'producer-owned', 'lifetime-coins', 'total-cps', 'total-tosses', 'critical-tosses', 'max-combo',
  'click-value', 'manual-coins', 'upgrades-owned', 'moon-collected', 'boo-encounters', 'boo-spins',
  'boo-positive', 'boo-negative', 'boo-neutral', 'boo-tier-seen', 'boo-outcome-seen', 'boo-ignored',
  'boo-distinct', 'boo-streak', 'effects-expired', 'producer-restored', 'boo-coins-lost',
  'producer-discovered', 'offline-claims', 'longest-offline', 'offline-coins', 'save-exports',
  'save-imports', 'buy-max-uses', 'largest-bulk', 'producer-types-owned', 'producer-types-discovered',
  'zero-after-purchase', 'tiny-leftover', 'simultaneous-effects', 'unique-news', 'backdrops-seen',
  'play-seconds', 'play-days', 'autosaves', 'performance-modes', 'other-achievements',
]);


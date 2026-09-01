export const COSMETICS = [
  { id: 'cappy-classic', category: 'cappy', name: 'Classic Red', cost: '0', preview: '🧢', value: 'classic', description: 'The original red travel companion, freshly brushed.' },
  { id: 'cappy-gold', category: 'cappy', name: 'Golden Brim', cost: '1e6', preview: '✦', value: 'gold', description: 'Polished until every toss looks financially irresponsible.' },
  { id: 'cappy-luigi', category: 'cappy', name: 'Green Thunder', cost: '1e12', preview: 'L', value: 'luigi', description: 'A green tint with excellent traction and nervous courage.' },
  { id: 'cappy-galaxy', category: 'cappy', name: 'Galaxy Felt', cost: '1e22', preview: '☄', value: 'galaxy', description: 'A midnight brim dusted with entirely domesticated starlight.' },
  { id: 'cappy-shadow', category: 'cappy', name: 'Shadow Stitch', cost: '1e36', preview: '◐', value: 'shadow', description: 'Dark tailoring for dramatic landings and suspicious postcards.' },
  { id: 'cappy-ruby', category: 'cappy', name: 'Ruby Royal', cost: '1e52', preview: '♦', value: 'ruby', description: 'A jewel-red finish with a crown-shaped dry-cleaning bill.' },
  { id: 'cappy-aurora', category: 'cappy', name: 'Aurora Crown', cost: '1e70', preview: '≈', value: 'aurora', description: 'The colors move even when the hat insists it is sitting still.' },

  { id: 'backdrop-postcard', category: 'backdrop', name: 'Grand-Tour Postcard', cost: '0', preview: '▧', value: 'postcard', backdrop: { mode: 'journey', label: 'Current Grand Tour destination' }, description: 'The sunny paper-and-stamps look that started the voyage.' },
  { id: 'backdrop-delfino', category: 'backdrop', name: 'Delfino Sunset', cost: '1e8', preview: '☀', value: 'delfino', backdrop: { mode: 'fixed', file: 'backdrop-delfino-plaza.webp', label: 'Delfino Plaza across the turquoise bay at golden hour' }, description: 'The real island plaza, warmed by an evening tint and a dubious legal memory.' },
  { id: 'backdrop-ricco', category: 'backdrop', name: 'Ricco Harbor Noon', cost: '1e12', preview: '⚓', value: 'ricco', backdrop: { mode: 'fixed', file: 'backdrop-ricco-harbor.webp', label: 'Ricco Harbor cranes and ships beneath Corona Mountain' }, description: 'Cranes, cargo boats, and water clean enough to make every dockworker suspicious.' },
  { id: 'backdrop-battlefield', category: 'backdrop', name: 'Battlefield Field Guide', cost: '1e16', preview: '⛰', value: 'battlefield', backdrop: { mode: 'fixed', file: 'backdrop-bobomb-battlefield.webp', label: "Bob-omb Battlefield's illustrated mountain course map" }, description: 'The authentic course survey, including cannon routes and one very territorial monarch.' },
  { id: 'backdrop-gusty', category: 'backdrop', name: 'Gusty Garden Bloom', cost: '1e22', preview: '✿', value: 'gusty', backdrop: { mode: 'fixed', file: 'backdrop-gusty-garden.webp', label: 'The flower-covered planetoids of Gusty Garden Galaxy' }, description: 'A floating garden where gravity is optional but watering duty is not.' },
  { id: 'backdrop-comet', category: 'backdrop', name: 'Comet Night', cost: '1e28', preview: '☄', value: 'comet', backdrop: { mode: 'fixed', file: 'backdrop-comet-observatory.webp', label: 'The Comet Observatory suspended in a deep starfield' }, description: 'Rosalina parked the genuine observatory where its Luma lights show best.' },
  { id: 'backdrop-super-bell', category: 'backdrop', name: 'Super Bell Picnic', cost: '1e34', preview: '♢', value: 'super-bell', backdrop: { mode: 'fixed', file: 'backdrop-super-bell-hill.webp', label: 'Cat-suited friends celebrating on Super Bell Hill' }, description: 'A sunny hilltop reserved for bells, flowers, and coordinated cat posing.' },
  { id: 'backdrop-neon', category: 'backdrop', name: 'New Donk Neon', cost: '1e42', preview: '▥', value: 'neon', backdrop: { mode: 'fixed', file: 'metro.webp', label: 'The towers and festival billboards of New Donk City' }, description: 'Midnight skyscrapers powered by rhythm and municipal generators.' },
  { id: 'backdrop-coconut', category: 'backdrop', name: 'Coconut Mall Rush', cost: '1e50', preview: '◫', value: 'coconut', backdrop: { mode: 'fixed', file: 'backdrop-coconut-mall.webp', label: 'The palm-lined front entrance of Coconut Mall' }, description: 'Bright storefronts and escalators that absolutely count as motorsport infrastructure.' },
  { id: 'backdrop-rainbow', category: 'backdrop', name: 'Rainbow Road', cost: '1e58', preview: '⌁', value: 'rainbow', backdrop: { mode: 'fixed', file: 'backdrop-rainbow-road.webp', label: 'Mario Kart 8 Rainbow Road curling through its orbital station' }, description: 'The actual guardrail-free spectrum, now running directly behind the paperwork.' },
  { id: 'backdrop-mount-wario', category: 'backdrop', name: 'Mount Wario Descent', cost: '1e64', preview: '◆', value: 'mount-wario', backdrop: { mode: 'fixed', file: 'backdrop-mount-wario.webp', label: 'The snowy Mount Wario downhill starting gate' }, description: 'A frozen downhill run where the office brakes remain largely ceremonial.' },
  { id: 'backdrop-rogueport', category: 'backdrop', name: 'Rogueport Storybook', cost: '1e68', preview: '▤', value: 'rogueport', backdrop: { mode: 'fixed', file: 'backdrop-rogueport.webp', label: 'The paper-built town square and gallows of Rogueport' }, description: 'Cobblestones, crooked roofs, and commerce drawn with very sharp edges.' },
  { id: 'backdrop-toad-town', category: 'backdrop', name: 'Toad Town Festival', cost: '1e71', preview: '✣', value: 'toad-town', backdrop: { mode: 'fixed', file: 'backdrop-toad-town.webp', label: 'Origami decorations filling Toad Town with color' }, description: 'A paper festival where every folded decoration has plausible deniability.' },
  { id: 'backdrop-gloom', category: 'backdrop', name: 'Gloom Eclipse', cost: '1e74', preview: '◉', value: 'gloom', backdrop: { mode: 'fixed', file: 'backdrop-luigis-mansion.webp', label: "Luigi approaching his haunted mansion beneath a sickly moon" }, description: 'An actual haunted estate for captains who find ordinary night insufficient.' },
  { id: 'backdrop-yoshi', category: 'backdrop', name: "Yoshi's Island Atlas", cost: '1e78', preview: '◒', value: 'yoshi', backdrop: { mode: 'fixed', file: 'backdrop-yoshis-island.webp', label: "The hand-drawn Super Mario World 2 Yoshi's Island map" }, description: 'Crayon mountains and storybook surf from the island that raised a hero.' },

  { id: 'sound-classic', category: 'sound', name: 'Classic Synth', cost: '0', preview: '♪', value: 'classic', description: 'The crisp little bleeps already installed in the Odyssey.' },
  { id: 'sound-soft', category: 'sound', name: 'Soft Felt', cost: '1e5', preview: '♩', value: 'soft', description: 'Quieter, rounder tones suitable for late-night empires.' },
  { id: 'sound-arcade', category: 'sound', name: 'Arcade Cabinet', cost: '1e14', preview: '♫', value: 'arcade', description: 'Square-wave optimism from a machine that definitely takes coins.' },
  { id: 'sound-bells', category: 'sound', name: 'Bell Hill Chimes', cost: '1e24', preview: '♬', value: 'bells', description: 'Bright bell tones with no cats hidden inside, probably.' },
  { id: 'sound-cosmic', category: 'sound', name: 'Cosmic Glass', cost: '1e38', preview: '✧', value: 'cosmic', description: 'Airy orbital notes approved by a committee of Lumas.' },
  { id: 'sound-sunshine', category: 'sound', name: 'Sunshine Brass', cost: '1e54', preview: '☀', value: 'sunshine', description: 'Warm island pings bottled under ideal beach conditions.' },
  { id: 'sound-ghost', category: 'sound', name: 'Boo Basement', cost: '1e72', preview: '♭', value: 'ghost', description: 'A spooky little register that remains polite about the volume.' },
];

export const COSMETIC_BY_ID = Object.fromEntries(COSMETICS.map((item) => [item.id, item]));
export const DEFAULT_COSMETICS = ['cappy-classic', 'backdrop-postcard', 'sound-classic'];
export const DEFAULT_EQUIPPED_COSMETICS = {
  cappy: 'cappy-classic',
  backdrop: 'backdrop-postcard',
  sound: 'sound-classic',
};

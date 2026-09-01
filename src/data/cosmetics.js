export const COSMETICS = [
  { id: 'cappy-classic', category: 'cappy', name: 'Classic Red', cost: '0', preview: '🧢', value: 'classic', description: 'The original red travel companion, freshly brushed.' },
  { id: 'cappy-gold', category: 'cappy', name: 'Golden Brim', cost: '1e6', preview: '✦', value: 'gold', description: 'Polished until every toss looks financially irresponsible.' },
  { id: 'cappy-luigi', category: 'cappy', name: 'Green Thunder', cost: '1e12', preview: 'L', value: 'luigi', description: 'A green tint with excellent traction and nervous courage.' },
  { id: 'cappy-galaxy', category: 'cappy', name: 'Galaxy Felt', cost: '1e22', preview: '☄', value: 'galaxy', description: 'A midnight brim dusted with entirely domesticated starlight.' },
  { id: 'cappy-shadow', category: 'cappy', name: 'Shadow Stitch', cost: '1e36', preview: '◐', value: 'shadow', description: 'Dark tailoring for dramatic landings and suspicious postcards.' },
  { id: 'cappy-ruby', category: 'cappy', name: 'Ruby Royal', cost: '1e52', preview: '♦', value: 'ruby', description: 'A jewel-red finish with a crown-shaped dry-cleaning bill.' },
  { id: 'cappy-aurora', category: 'cappy', name: 'Aurora Crown', cost: '1e70', preview: '≈', value: 'aurora', description: 'The colors move even when the hat insists it is sitting still.' },

  { id: 'backdrop-postcard', category: 'backdrop', name: 'Grand-Tour Postcard', cost: '0', preview: '▧', value: 'postcard', backdrop: { mode: 'journey', label: 'Current Grand Tour destination' }, description: 'The sunny paper-and-stamps look that started the voyage.' },
  { id: 'backdrop-delfino', category: 'backdrop', name: 'Delfino Sunset', cost: '1e8', preview: '☀', value: 'delfino', backdrop: { mode: 'fixed', file: 'lake.webp', label: 'A glassy seaside city beneath a brilliant blue lagoon' }, description: 'Warm sea air, peach skies, and no visible court summons.' },
  { id: 'backdrop-battlefield', category: 'backdrop', name: 'Battlefield Dawn', cost: '1e16', preview: '⛰', value: 'battlefield', backdrop: { mode: 'fixed', file: 'cascade.webp', label: 'Sunlit green cliffs and a roaring fossil waterfall' }, description: 'Green hills under a sky that has heard at least one cannon.' },
  { id: 'backdrop-comet', category: 'backdrop', name: 'Comet Night', cost: '1e28', preview: '☄', value: 'comet', backdrop: { mode: 'fixed', file: 'cap.webp', label: 'Bonneton beneath an enormous golden moon' }, description: 'Deep space with enough Luma glow to find the purchase buttons.' },
  { id: 'backdrop-neon', category: 'backdrop', name: 'New Donk Neon', cost: '1e42', preview: '▥', value: 'neon', backdrop: { mode: 'fixed', file: 'metro.webp', label: 'The towers and festival billboards of New Donk City' }, description: 'Midnight skyscrapers powered by rhythm and municipal generators.' },
  { id: 'backdrop-rainbow', category: 'backdrop', name: 'Rainbow Road', cost: '1e58', preview: '⌁', value: 'rainbow', backdrop: { mode: 'fixed', file: 'luncheon.webp', label: 'A candy-bright low-poly culinary kingdom' }, description: 'A guardrail-free spectrum running directly behind the paperwork.' },
  { id: 'backdrop-gloom', category: 'backdrop', name: 'Gloom Eclipse', cost: '1e74', preview: '◉', value: 'gloom', backdrop: { mode: 'fixed', file: 'snow.webp', label: 'A lonely ice fortress in a whiteout' }, description: 'Purple moonlight for captains who find ordinary night insufficient.' },

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

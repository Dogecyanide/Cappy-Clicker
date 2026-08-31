import { D } from '../core/numbers.js';
import { COSMETIC_BY_ID } from '../data/cosmetics.js';

export function purchaseCosmetic(state, cosmeticId) {
  const cosmetic = COSMETIC_BY_ID[cosmeticId];
  if (!cosmetic) return { ok: false, reason: 'Unknown cosmetic.' };
  if (state.cosmetics.owned.includes(cosmeticId)) return { ok: false, reason: 'Already in the wardrobe.' };
  const cost = D(cosmetic.cost);
  if (D(state.coins).lt(cost)) return { ok: false, reason: 'Not enough current coins.' };
  state.coins = D(state.coins).sub(cost);
  state.cosmetics.owned.push(cosmeticId);
  state.stats.cosmeticsPurchased += 1;
  return { ok: true, cosmetic, cost };
}

export function equipCosmetic(state, cosmeticId) {
  const cosmetic = COSMETIC_BY_ID[cosmeticId];
  if (!cosmetic) return { ok: false, reason: 'Unknown cosmetic.' };
  if (!state.cosmetics.owned.includes(cosmeticId)) return { ok: false, reason: 'Buy this cosmetic first.' };
  if (state.cosmetics.equipped[cosmetic.category] === cosmeticId) return { ok: true, cosmetic, unchanged: true };
  state.cosmetics.equipped[cosmetic.category] = cosmeticId;
  state.stats.cosmeticSwaps += 1;
  return { ok: true, cosmetic };
}

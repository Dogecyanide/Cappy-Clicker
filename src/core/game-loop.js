import { D } from './numbers.js';
import { getEconomySnapshot } from './economy.js';
import { saveToStorage } from './save.js';
import { updateProducerDiscovery } from '../systems/buildings.js';
import { evaluateAchievements } from '../systems/achievements.js';
import { updateBoo } from '../systems/king-boo.js';
import { randomNews } from '../systems/events.js';

export function createGameLoop(store, hooks = {}) {
  let timer = null;
  let lastUiAt = 0;
  let lastAchievementAt = 0;
  let lastSaveAt = Date.now();
  let lastNewsAt = Date.now();

  function tick() {
    const state = store.state;
    const now = Date.now();
    const visible = typeof document === 'undefined' || !document.hidden;
    const elapsed = Math.max(0, Math.min(5, (now - state.lastTickAt) / 1000));
    state.lastTickAt = now;

    if (visible && elapsed > 0) {
      const production = getEconomySnapshot(state, { now }).totalCps.mul(elapsed);
      if (production.gt(0)) {
        state.coins = D(state.coins).add(production);
        state.lifetimeCoins = D(state.lifetimeCoins).add(production);
        state.stats.coinsFromProduction = D(state.stats.coinsFromProduction).add(production);
      }
      state.stats.playSeconds += elapsed;
      const day = new Date(now).toISOString().slice(0, 10);
      if (!state.stats.playDays.includes(day)) state.stats.playDays.push(day);
    }

    const expired = state.activeEffects.filter((effect) => effect.expiresAt <= now);
    if (expired.length) {
      state.activeEffects = state.activeEffects.filter((effect) => effect.expiresAt > now);
      state.stats.effectsExpired += expired.length;
      state.stats.producersRestored += expired.filter((effect) => effect.type === 'producer-disabled').length;
      hooks.onEffectsExpired?.(expired);
    }

    const booResult = updateBoo(state, { now, active: visible });
    if (booResult.spawned) hooks.onBooSpawn?.();
    if (booResult.ignored) hooks.onBooIgnored?.();
    if (booResult.resolved) hooks.onBooResolved?.(booResult.resolved);

    const discovered = updateProducerDiscovery(state);
    if (discovered.length) hooks.onDiscovery?.(discovered);

    if (now - lastAchievementAt >= 1_000) {
      lastAchievementAt = now;
      const unlocked = evaluateAchievements(state, { now });
      if (unlocked.length) hooks.onAchievements?.(unlocked);
    }

    if (visible && now - lastNewsAt >= 18_000) {
      lastNewsAt = now;
      hooks.onNews?.(randomNews(state, Math.random, now));
    }

    if (visible && now - lastSaveAt >= 15_000) {
      lastSaveAt = now;
      try {
        state.stats.autosaves += 1;
        saveToStorage(state, hooks.storage, now);
        hooks.onSave?.(now);
      } catch (error) {
        hooks.onSaveError?.(error);
      }
    }

    if (now - lastUiAt >= 200) {
      lastUiAt = now;
      store.notify('tick');
    }
  }

  return {
    start() {
      if (timer) return;
      timer = setInterval(tick, 100);
      tick();
    },
    stop() {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    },
    tick,
  };
}

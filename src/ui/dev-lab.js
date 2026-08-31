import { D, format } from '../core/numbers.js';
import { createInitialState } from '../core/state.js';
import { getEconomySnapshot } from '../core/economy.js';
import { serializeState } from '../core/save.js';
import { PRODUCERS } from '../data/buildings.js';
import { BUILDING_UPGRADES } from '../data/building-upgrades.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { POWER_MOONS } from '../data/power-moons.js';
import { BOO_OUTCOMES } from '../data/boo-outcomes.js';
import { forceBooOutcome, clearTemporaryEffects, spawnBoo } from '../systems/king-boo.js';
import { grantMoon } from '../systems/moons.js';

export function createDevLab(dialog, store, options = {}) {
  dialog.innerHTML = `<form method="dialog" class="dialog-card dev-lab"><header><div><span class="eyebrow">Shift + D</span><h2>Developer Lab</h2><p>Test the entire voyage without pretending patience is a debugging tool.</p></div><button value="close" aria-label="Close">×</button></header>
    <div class="dev-grid">
      <section><h3>Economy</h3><label>Add coins<input name="coins" value="1e6"></label><button type="button" data-dev="add-coins">Add coins</button><div class="button-cluster"><button type="button" data-dev="production" data-seconds="10">+10 sec</button><button type="button" data-dev="production" data-seconds="60">+1 min</button><button type="button" data-dev="production" data-seconds="3600">+1 hour</button></div><button type="button" data-dev="breakdown">Inspect production breakdown</button></section>
      <section><h3>Producers</h3><label>Producer<select name="producer">${PRODUCERS.map(({ id, name }) => `<option value="${id}">${name}</option>`).join('')}</select></label><label>Set amount<input name="amount" type="number" min="0" max="1000000" value="5"></label><button type="button" data-dev="set-producer">Set amount</button><div class="button-cluster"><button type="button" data-dev="reveal-next">Reveal next</button><button type="button" data-dev="reveal-all">Reveal all</button></div><button type="button" data-dev="grant-upgrade">Install next eligible upgrade</button></section>
      <section><h3>King Boo</h3><label>Exact outcome<select name="boo">${BOO_OUTCOMES.map(({ id, title, tier }) => `<option value="${id}">${title} · ${tier}</option>`).join('')}</select></label><div class="button-cluster"><button type="button" data-dev="boo-spawn">Trigger invite</button><button type="button" data-dev="boo-force">Force result</button></div><button type="button" data-dev="boo-catastrophe">Force THE HOUSE ALWAYS WINS</button><div class="button-cluster"><button type="button" data-dev="clear-effects">Clear effects</button><button type="button" data-dev="advance-effects">Advance timers 60s</button></div></section>
      <section><h3>Collections</h3><label>Power Moon<select name="moon">${POWER_MOONS.map(({ id, name }) => `<option value="${id}">${name}</option>`).join('')}</select></label><div class="button-cluster"><button type="button" data-dev="moon-money">Grant Moon price</button><button type="button" data-dev="moon-grant">Unlock Moon</button></div><button type="button" data-dev="achievements">Unlock all achievements</button><button type="button" data-dev="dump">Dump game state</button></section>
    </div>
    <pre data-dev-output>Lab output appears here.</pre>
    <footer><button type="button" class="danger-button" data-dev="reset-economy">Reset economy</button><button type="button" class="danger-button" data-dev="hard-reset">Hard reset everything</button><button value="close">Done</button></footer>
  </form>`;

  const output = dialog.querySelector('[data-dev-output]');
  const form = dialog.querySelector('form');

  window.addEventListener('keydown', (event) => {
    if (event.shiftKey && event.key.toLowerCase() === 'd' && !event.repeat) {
      event.preventDefault();
      dialog.open ? dialog.close() : dialog.showModal();
    }
  });

  dialog.addEventListener('click', (event) => {
    const button = event.target.closest('[data-dev]');
    if (!button) return;
    const action = button.dataset.dev;
    store.mutate(`dev-${action}`, (state) => {
      if (action === 'add-coins') addCoins(state, form.elements.coins.value);
      if (action === 'production') addProduction(state, Number(button.dataset.seconds));
      if (action === 'set-producer') state.producers[form.elements.producer.value] = Math.max(0, Math.floor(Number(form.elements.amount.value) || 0));
      if (action === 'reveal-next') revealNext(state);
      if (action === 'reveal-all') state.discoveredProducers = PRODUCERS.map(({ id }) => id);
      if (action === 'grant-upgrade') grantNextUpgrade(state, form.elements.producer.value);
      if (action === 'boo-spawn') spawnBoo(state, Date.now());
      if (action === 'boo-force') forceBooOutcome(state, form.elements.boo.value);
      if (action === 'boo-catastrophe') forceBooOutcome(state, 'house-always-wins');
      if (action === 'clear-effects') clearTemporaryEffects(state);
      if (action === 'advance-effects') state.activeEffects.forEach((effect) => { effect.expiresAt -= 60_000; });
      if (action === 'moon-money') addCoins(state, POWER_MOONS.find(({ id }) => id === form.elements.moon.value)?.cost ?? 0);
      if (action === 'moon-grant') grantMoon(state, form.elements.moon.value);
      if (action === 'achievements') for (const achievement of ACHIEVEMENTS) state.achievements[achievement.id] = { unlockedAt: Date.now() };
      if (action === 'reset-economy') resetEconomy(state);
    });
    if (action === 'breakdown') output.textContent = formatBreakdown(store.state);
    else if (action === 'dump') output.textContent = serializeState(store.state);
    else if (action === 'hard-reset') options.onHardReset?.();
    else output.textContent = `${action} complete. Coins: ${format(store.state.coins)}`;
    options.onChange?.(action);
  });

  return { open: () => dialog.showModal() };
}

function addCoins(state, value) {
  const amount = D(value).max(0);
  state.coins = D(state.coins).add(amount);
  state.lifetimeCoins = D(state.lifetimeCoins).add(amount);
}

function addProduction(state, seconds) {
  const amount = getEconomySnapshot(state).totalCps.mul(seconds);
  addCoins(state, amount);
  state.stats.coinsFromProduction = D(state.stats.coinsFromProduction).add(amount);
}

function revealNext(state) {
  const next = PRODUCERS.find(({ id }) => !state.discoveredProducers.includes(id));
  if (next) state.discoveredProducers.push(next.id);
}

function grantNextUpgrade(state, producerId) {
  const upgrade = BUILDING_UPGRADES.find((item) => item.producerId === producerId && !state.upgrades.includes(item.id));
  if (!upgrade) return;
  state.producers[producerId] = Math.max(state.producers[producerId], upgrade.milestone);
  state.upgrades.push(upgrade.id);
}

function resetEconomy(state) {
  const fresh = createInitialState();
  state.coins = fresh.coins;
  state.lifetimeCoins = fresh.lifetimeCoins;
  state.producers = fresh.producers;
  state.upgrades = [];
  state.moons = [];
  state.activeEffects = [];
}

function formatBreakdown(state) {
  const snapshot = getEconomySnapshot(state);
  return snapshot.producers.filter(({ owned }) => owned > 0).map((item) => `${item.producer.name}\n  ${format(item.basePerUnit)} base × ${format(item.localMultiplier)} upgrades × ${item.additiveMultiplier.toFixed(3)} global\n  ${format(item.effectivePerUnit)}/sec each × ${item.owned} = ${format(item.effectiveTotal)}/sec (${item.contribution.toFixed(2)}%)`).join('\n\n') || 'No producers owned yet.';
}


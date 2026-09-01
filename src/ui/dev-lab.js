import { D, format } from '../core/numbers.js';
import { createInitialState } from '../core/state.js';
import { getEconomySnapshot } from '../core/economy.js';
import { serializeState } from '../core/save.js';
import { PRODUCERS } from '../data/buildings.js';
import { BUILDING_UPGRADES } from '../data/building-upgrades.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { POWER_MOONS } from '../data/power-moons.js';
import { BOO_OUTCOMES } from '../data/boo-outcomes.js';
import { SHINE_OUTCOMES } from '../data/shine-outcomes.js';
import { FUEL_MODULES } from '../data/fuel-modules.js';
import { forceBooOutcome, clearTemporaryEffects, spawnBoo } from '../systems/king-boo.js';
import { grantMoon } from '../systems/moons.js';
import { forceShineOutcome, spawnShine } from '../systems/shines.js';

export function createDevLab(dialog, store, options = {}) {
  dialog.innerHTML = `<form method="dialog" class="dialog-card dev-lab"><header><div><span class="eyebrow">Shift + D</span><h2>Developer Lab</h2><p>Test the entire voyage without pretending patience is a debugging tool.</p></div><button value="close" aria-label="Close">×</button></header>
    <div class="dev-grid">
      <section><h3>Economy</h3><label>Add coins<input name="coins" value="1e6"></label><button type="button" data-dev="add-coins">Add coins</button><div class="button-cluster"><button type="button" data-dev="production" data-seconds="10">+10 sec</button><button type="button" data-dev="production" data-seconds="60">+1 min</button><button type="button" data-dev="production" data-seconds="3600">+1 hour</button></div><button type="button" data-dev="breakdown">Inspect production breakdown</button></section>
      <section><h3>Producers</h3><label>Producer<select name="producer">${PRODUCERS.map(({ id, name }) => `<option value="${id}">${name}</option>`).join('')}</select></label><label>Set amount<input name="amount" type="number" min="0" max="1000000" value="5"></label><button type="button" data-dev="set-producer">Set amount</button><div class="button-cluster"><button type="button" data-dev="reveal-next">Reveal next</button><button type="button" data-dev="reveal-all">Reveal all</button></div><button type="button" data-dev="grant-upgrade">Install next eligible upgrade</button></section>
      <section><h3>King Boo</h3><label>Exact outcome<select name="boo">${BOO_OUTCOMES.map(({ id, title, tier }) => `<option value="${id}">${title} · ${tier}</option>`).join('')}</select></label><div class="button-cluster"><button type="button" data-dev="boo-spawn">Trigger invite</button><button type="button" data-dev="boo-force">Force result</button></div><button type="button" data-dev="boo-catastrophe">Force THE HOUSE ALWAYS WINS</button><div class="button-cluster"><button type="button" data-dev="clear-effects">Clear effects</button><button type="button" data-dev="advance-effects">Advance timers 60s</button></div></section>
      <section><h3>Rare Shines</h3><p>Put either visitor on screen, or apply one exact result immediately.</p><div class="button-cluster"><button type="button" data-dev="shine-normal">Spawn Shine</button><button type="button" data-dev="shine-gloom">Spawn Gloom Shine</button></div><label>Exact result<select name="shine">${SHINE_OUTCOMES.map(({ id, title, kind }) => `<option value="${id}">${kind === 'corrupted' ? 'Gloom' : 'Shine'} · ${title}</option>`).join('')}</select></label><button type="button" data-dev="shine-force">Apply exact result</button></section>
      <section><h3>Odyssey Fuel</h3><p>Fill every ingredient at once or fit engine hardware without paying for a test voyage.</p><button type="button" data-dev="fuel-fill">Fill the fuel tank</button><label>Engine module<select name="fuelModule">${FUEL_MODULES.map(({ id, name }) => `<option value="${id}">${name}</option>`).join('')}</select></label><div class="button-cluster"><button type="button" data-dev="fuel-module">Fit selected</button><button type="button" data-dev="fuel-all-modules">Fit all modules</button></div></section>
      <section><h3>Collections</h3><label>Power Moon<select name="moon">${POWER_MOONS.map(({ id, name }) => `<option value="${id}">${name}</option>`).join('')}</select></label><div class="button-cluster"><button type="button" data-dev="moon-money">Grant Moon price</button><button type="button" data-dev="moon-grant">Unlock Moon</button></div><button type="button" data-dev="achievements">Unlock all achievements</button><button type="button" data-dev="dump">Dump game state</button></section>
    </div>
    <pre data-dev-output>Lab output appears here.</pre>
    <footer><button type="button" class="danger-button" data-dev="reset-economy">Reset economy</button><button type="button" class="danger-button" data-dev="hard-reset">Hard reset everything</button><button value="close">Done</button></footer>
  </form>`;

  const output = dialog.querySelector('[data-dev-output]');
  const form = dialog.querySelector('form');

  dialog.addEventListener('click', (event) => {
    const button = event.target.closest('[data-dev]');
    if (!button) return;
    const action = button.dataset.dev;
    let shineResult = null;
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
      if (action === 'shine-normal') shineResult = spawnShine(state, { kind: 'normal', replace: true });
      if (action === 'shine-gloom') shineResult = spawnShine(state, { kind: 'corrupted', replace: true });
      if (action === 'shine-force') shineResult = forceShineOutcome(state, form.elements.shine.value);
      if (action === 'fuel-fill') fillFuelTank(state);
      if (action === 'fuel-module' && !state.fuelModules.includes(form.elements.fuelModule.value)) state.fuelModules.push(form.elements.fuelModule.value);
      if (action === 'fuel-all-modules') state.fuelModules = FUEL_MODULES.map(({ id }) => id);
      if (action === 'moon-money') addCoins(state, POWER_MOONS.find(({ id }) => id === form.elements.moon.value)?.cost ?? 0);
      if (action === 'moon-grant') grantMoon(state, form.elements.moon.value);
      if (action === 'achievements') for (const achievement of ACHIEVEMENTS) state.achievements[achievement.id] = { unlockedAt: Date.now() };
      if (action === 'reset-economy') resetEconomy(state);
    });
    if (action === 'breakdown') output.textContent = formatBreakdown(store.state);
    else if (action === 'dump') output.textContent = serializeState(store.state);
    else if (action === 'hard-reset') options.onHardReset?.();
    else if (action === 'shine-normal') output.textContent = 'Normal Shine spawned. Close the Lab and catch it before the timer ends.';
    else if (action === 'shine-gloom') output.textContent = 'Gloom Shine spawned. Close the Lab and click the suspicious purple visitor.';
    else if (action === 'shine-force') output.textContent = formatShineResult(shineResult);
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
  state.fuelModules = [];
  state.moons = [];
  state.activeEffects = [];
}

function fillFuelTank(state) {
  for (const achievement of ACHIEVEMENTS) state.achievements[achievement.id] = { unlockedAt: Date.now() };
  state.upgrades = BUILDING_UPGRADES.map(({ id }) => id);
  state.moons = POWER_MOONS.map(({ id }) => id);
  state.discoveredProducers = PRODUCERS.map(({ id }) => id);
  state.stats.shinesClaimed = Math.max(100, state.stats.shinesClaimed);
}

function formatBreakdown(state) {
  const snapshot = getEconomySnapshot(state);
  return snapshot.producers.filter(({ owned }) => owned > 0).map((item) => `${item.producer.name}\n  ${format(item.basePerUnit)} base × ${format(item.localMultiplier)} upgrades × ${item.additiveMultiplier.toFixed(3)} global\n  ${format(item.effectivePerUnit)}/sec each × ${item.owned} = ${format(item.effectiveTotal)}/sec (${item.contribution.toFixed(2)}%)`).join('\n\n') || 'No producers owned yet.';
}

function formatShineResult(result) {
  if (!result?.ok) return result?.reason ?? 'The selected Shine result could not be applied.';
  const receipt = result.amount !== '0'
    ? `Coins awarded: ${format(result.amount)}`
    : result.loss !== '0'
      ? `Coins lost: ${format(result.loss)}`
      : 'Temporary effect installed.';
  return `${result.kind === 'corrupted' ? 'Gloom Shine' : 'Shine'} · ${result.outcome.title}\n${result.outcome.description}\n${receipt}`;
}

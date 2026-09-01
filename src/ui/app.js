import { format } from '../core/numbers.js';
import { createInitialState } from '../core/state.js';
import { createStore } from '../core/store.js';
import { createGameLoop } from '../core/game-loop.js';
import { exportSave, importSave, loadFromStorage, saveToStorage, SAVE_KEY } from '../core/save.js';
import { getEconomySnapshot } from '../core/economy.js';
import { createAudio } from '../core/audio.js';
import { createLeaderboardClient } from '../core/leaderboard.js';
import { PRODUCER_BY_ID } from '../data/buildings.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { COSMETIC_BY_ID } from '../data/cosmetics.js';
import { calculateEarningsBetween, calculateOfflineEarnings, applyOfflineEarnings } from '../systems/offline.js';
import { evaluateAchievements } from '../systems/achievements.js';
import { reactiveNews, pushNews } from '../systems/events.js';
import { applyCommittedBooSpin, clearTemporaryEffects, forceBooOutcome, spawnBoo } from '../systems/king-boo.js';
import { spawnShine } from '../systems/shines.js';
import { createCappyStage } from './cappy-stage.js';
import { createBuildingShop } from './building-shop.js';
import { createRightRail } from './right-rail.js';
import { createKingBooWidget } from './king-boo-widget.js';
import { createShineWidget } from './shine-widget.js';
import { createNotifications } from './notifications.js';
import { createKingdomBackground } from '../visuals/background.js';

export function createGame(root, dependencies = {}) {
  const storage = dependencies.storage ?? localStorage;
  const base = import.meta.env.BASE_URL;
  root.innerHTML = appTemplate(base);
  installImageFallbacks(root);
  const shell = {
    coins: root.querySelector('[data-coins]'),
    cps: root.querySelector('[data-cps]'),
    badges: root.querySelector('[data-badges]'),
    news: root.querySelector('[data-news-text]'),
    saveIndicator: root.querySelector('[data-save-indicator]'),
  };
  let settingsSignature = '';

  const notifications = createNotifications(root.querySelector('[data-notifications]'));
  const audio = createAudio();
  const leaderboard = createLeaderboardClient(storage, dependencies.leaderboardEndpoint);
  let loadError = null;
  let state;
  try { state = loadFromStorage(storage); }
  catch (error) { state = createInitialState(); loadError = error; }

  const resolvedWhileAway = applyCommittedBooSpin(state, Date.now());
  const offline = calculateOfflineEarnings(state);
  const hadOfflineEarnings = applyOfflineEarnings(state, offline);
  let startupSaveError = null;
  if (hadOfflineEarnings || resolvedWhileAway) {
    try { saveToStorage(state, storage); }
    catch (error) { startupSaveError = error; }
  }
  const store = createStore(state);
  const cappyStage = createCappyStage(root.querySelector('[data-cappy-stage]'), store, {
    audio: audioProxy(),
    onClick: (result) => {
      unlockNow();
    },
  });
  const buildingShop = createBuildingShop(root.querySelector('[data-producer-list]'), store, {
    audio: audioProxy(),
    onPurchase: (result, requested) => {
      reactiveNews(store.state, result.owned === 5 || result.owned === 15 || result.owned === 25 ? 'milestone' : 'purchase', { name: result.producer.name, amount: result.owned });
      notifications.show(`${result.quantity} joined the voyage for ${format(result.cost)} coins.`, { title: result.producer.name, icon: '🎟', tone: 'success' });
      if (requested === 'max') store.state.stats.buyMaxUses = Math.max(1, store.state.stats.buyMaxUses);
      unlockNow();
      persist('purchase');
    },
    onError: showError,
  });
  const rightRail = createRightRail(root.querySelector('[data-right-rail]'), store, {
    audio: audioProxy(),
    onUpgrade: ({ upgrade }) => {
      const subject = PRODUCER_BY_ID[upgrade.producerId]?.name ?? 'Cappy';
      notifications.show(`${subject}: ${upgrade.effectLabel}`, { title: upgrade.name, icon: upgrade.motif, tone: 'success' });
      unlockNow(); persist('upgrade');
    },
    onMoon: ({ moon }) => {
      reactiveNews(store.state, 'moon', { name: moon.name });
      notifications.show(moon.effectLabel, { title: `${moon.name} collected!`, icon: '☾', tone: 'moon', duration: 6_000 });
      unlockNow(); persist('moon');
    },
    onCosmetic: ({ cosmetic, unchanged }) => {
      notifications.show(unchanged ? 'Already wearing this one.' : `${cosmetic.name} is now equipped.`, { title: 'Wardrobe updated', icon: cosmetic.preview, tone: 'success' });
      unlockNow(); persist('cosmetic');
    },
    onFuel: ({ module }) => {
      pushNews(store.state, `${module.name} is now bolted into the Odyssey. The warranty has quietly left the room.`);
      notifications.show(module.effectLabel, { title: `${module.name} installed!`, icon: module.motif, tone: 'moon', duration: 6_000 });
      unlockNow(); persist('fuel-module');
    },
    leaderboard,
    onPersist: persist,
    onLeaderboardSubmit: () => notifications.show('Your latest score is on the friendly Open League board.', { title: 'Score submitted', icon: '🏁', tone: 'success' }),
    onError: showError,
  });
  const booWidget = createKingBooWidget(root.querySelector('[data-boo-widget]'), store, {
    audio: audioProxy(),
    onCommit: () => persist('boo-commit'),
  });
  const shineWidget = createShineWidget(root.querySelector('[data-shine-widget]'), store, {
    audio: audioProxy(),
    onClaim: (result) => {
      reactiveNews(store.state, 'shine', { name: result.outcome.title });
      const coinLine = result.amount !== '0' ? ` You caught ${format(result.amount)} coins.` : result.loss !== '0' ? ` It stole ${format(result.loss)} coins.` : '';
      notifications.show(`${result.outcome.description}${coinLine}`, {
        title: result.kind === 'corrupted' ? `Gloom: ${result.outcome.title}` : result.outcome.title,
        icon: result.kind === 'corrupted' ? '◉' : '☀',
        tone: result.kind === 'corrupted' ? 'danger' : 'success',
        duration: 7_000,
      });
      unlockNow(); rightRail.renderAll(true); persist('shine');
    },
  });
  const background = createKingdomBackground(root.querySelector('[data-kingdom-backdrop]'), root.querySelector('[data-journey]'), store);
  const devDialog = root.querySelector('[data-dev-dialog]');
  let devLabPromise = null;

  function loadDevLab() {
    if (!devLabPromise) {
      devLabPromise = import('./dev-lab.js').then(({ createDevLab }) => createDevLab(devDialog, store, {
        onChange: (action) => {
          if (!['breakdown', 'dump', 'hard-reset'].includes(action)) store.state.integrity.devLabUsed = true;
          unlockNow(); persist('dev'); rightRail.renderAll(true); buildingShop.renderStructure(true);
        },
        onHardReset: () => hardReset(true),
      }));
    }
    return devLabPromise;
  }

  async function openDevLab() {
    try {
      const devLab = await loadDevLab();
      if (!devDialog.open) devLab.open();
    } catch (error) {
      showError(`The Developer Lab could not open: ${error.message}`);
    }
  }

  const loop = createGameLoop(store, {
    storage,
    onSave: updateSaveIndicator,
    onSaveError: (error) => notifications.show(error.message, { title: 'Autosave failed', tone: 'danger' }),
    onAchievements: announceAchievements,
    onDiscovery: (ids) => {
      for (const id of ids) {
        const producer = PRODUCER_BY_ID[id];
        reactiveNews(store.state, 'purchase', { name: producer.name });
        notifications.show(`${producer.kingdom} Kingdom is now on the map.`, { title: producer.name, icon: '⌖', tone: 'success', duration: 5_000 });
      }
      buildingShop.renderStructure(true);
      rightRail.renderAll(true);
      persist('discovery');
    },
    onBooSpawn: () => {
      pushNews(store.state, 'King Boo Casino passes another inspection conducted by King Boo.');
      notifications.show('He leaves in 10 seconds if ignored. No penalty.', { title: "King Boo's Bonus", icon: '👻', tone: 'boo' });
    },
    onBooIgnored: () => pushNews(store.state, 'King Boo leaves after nobody validates his business model.'),
    onBooResolved: ({ outcome }) => {
      reactiveNews(store.state, 'boo', { name: outcome.title });
      const bad = outcome.tier.includes('negative') || outcome.tier === 'catastrophic';
      audioProxy().boo(bad);
      notifications.show(outcome.description, { title: outcome.title, icon: bad ? '☠' : '♛', tone: bad ? 'danger' : 'success', duration: 7_000 });
      unlockNow(); rightRail.renderAll(true); persist('boo-result');
    },
    onShineSpawn: () => {
      pushNews(store.state, store.state.shine.kind === 'corrupted' ? 'A deeply unofficial Shine has appeared. Its warranty is already void.' : 'A rare Shine has appeared somewhere over the voyage!');
      notifications.show('It will only stay for a few seconds.', { title: store.state.shine.kind === 'corrupted' ? 'Suspicious Shine!' : 'Rare Shine!', icon: store.state.shine.kind === 'corrupted' ? '◉' : '☀', tone: store.state.shine.kind === 'corrupted' ? 'danger' : 'moon' });
    },
    onShineMissed: () => pushNews(store.state, 'A rare Shine drifted away unclaimed. The waiting game remains a bad investment.'),
    onEffectsExpired: () => rightRail.renderAll(true),
  });

  function audioProxy() {
    return new Proxy(audio, { get(target, property) { return (...args) => store.state.settings.sound && target[property](...args); } });
  }

  function unlockNow() {
    const unlocked = evaluateAchievements(store.state);
    if (unlocked.length) announceAchievements(unlocked);
  }

  function announceAchievements(unlocked) {
    rightRail.renderAll(true);
    for (const achievement of unlocked.slice(0, 4)) notifications.show(achievement.flavour, { title: `Badge: ${achievement.name}`, icon: '★', tone: 'badge', duration: 5_500 });
    if (unlocked.length > 4) notifications.show(`${unlocked.length - 4} more stamps landed in the passport.`, { title: 'Badge bonanza', icon: '★', tone: 'badge' });
    persist('achievement');
  }

  function persist(_reason = 'manual') {
    try {
      const at = saveToStorage(store.state, storage);
      updateSaveIndicator(at);
    } catch (error) {
      notifications.show(error.message, { title: 'Save failed', tone: 'danger' });
    }
  }

  function updateSaveIndicator(at = Date.now()) {
    const indicator = shell.saveIndicator;
    indicator.textContent = `Saved ${new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    indicator.classList.add('is-saved');
    window.setTimeout(() => indicator.classList.remove('is-saved'), 900);
  }

  function update(state, reason) {
    const snapshot = getEconomySnapshot(state);
    setText(shell.coins, format(state.coins));
    setText(shell.cps, format(snapshot.totalCps));
    setText(shell.badges, `${Object.keys(state.achievements).length}/${ACHIEVEMENTS.length}`);
    const news = shell.news;
    const currentNews = state.news[0]?.text ?? 'The Odyssey is fuelled, the passport is blank, and the first frog is negotiating.';
    if (news.textContent !== currentNews) { news.classList.remove('is-changing'); void news.offsetWidth; news.textContent = currentNews; news.classList.add('is-changing'); }
    cappyStage.update(state);
    buildingShop.update(state);
    rightRail.update(state);
    booWidget.update(state);
    shineWidget.update(state);
    background.update(state);
    applySettings(state);
    if (reason !== 'tick') updateSaveDeskSummary();
  }

  store.subscribe(update);
  bindShellActions();
  update(store.state, 'initial');

  function bindShellActions() {
    root.addEventListener('click', (event) => {
      if (event.target.closest('[data-open-settings]')) openSettings();
      if (event.target.closest('[data-open-save]')) openSaveDesk();
      if (event.target.closest('[data-open-dev]')) openDevLab();
      if (event.target.closest('[data-close-dialog]')) event.target.closest('dialog')?.close();
      if (event.target.closest('[data-export-save]')) exportCurrentSave();
      if (event.target.closest('[data-download-save]')) downloadCurrentSave();
      if (event.target.closest('[data-choose-save-file]')) root.querySelector('[data-save-file]').click();
      if (event.target.closest('[data-import-save]')) importCurrentSave();
      if (event.target.closest('[data-reset-save]')) hardReset(false);
      if (event.target.closest('[data-copy-save]')) copySaveText();
    });

    root.querySelector('[data-save-file]').addEventListener('change', importSaveFile);

    window.addEventListener('keydown', (event) => {
      if (!event.shiftKey || event.key.toLowerCase() !== 'd' || event.repeat) return;
      event.preventDefault();
      if (devDialog.open) devDialog.close();
      else openDevLab();
    });

    const settingsDialog = root.querySelector('[data-settings-dialog]');
    settingsDialog.addEventListener('change', (event) => {
      const { name, value, checked, type } = event.target;
      store.mutate('settings', (state) => {
        if (name === 'performance') {
          state.settings.performance = value;
          if (!state.stats.performanceModesUsed.includes(value)) state.stats.performanceModesUsed.push(value);
        }
        if (name === 'sound') state.settings.sound = type === 'checkbox' ? checked : value === 'on';
        if (name === 'reducedMotion') state.settings.reducedMotion = checked;
      });
      persist('settings');
    });

    let hiddenAt = 0;
    const creditHiddenProgress = (now = Date.now()) => {
      if (!hiddenAt) return false;
      const report = calculateEarningsBetween(store.state, hiddenAt, now);
      const credited = applyOfflineEarnings(store.state, report);
      hiddenAt = 0;
      return credited;
    };
    window.addEventListener('beforeunload', () => {
      creditHiddenProgress();
      persist('unload');
    });
    document.addEventListener('visibilitychange', () => {
      document.body.classList.toggle('is-hidden', document.hidden);
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt) {
        store.mutate('hidden-progress', () => creditHiddenProgress());
      }
    });
  }

  function openSettings() {
    const dialog = root.querySelector('[data-settings-dialog]');
    dialog.querySelector(`[name="performance"][value="${store.state.settings.performance}"]`).checked = true;
    dialog.querySelector('[name="sound"]').checked = store.state.settings.sound;
    dialog.querySelector('[name="reducedMotion"]').checked = store.state.settings.reducedMotion;
    dialog.showModal();
  }

  function openSaveDesk() {
    updateSaveDeskSummary();
    root.querySelector('[data-save-dialog]').showModal();
  }

  function updateSaveDeskSummary() {
    const summary = root.querySelector('[data-save-summary]');
    if (summary) summary.textContent = `${format(store.state.coins)} coins · ${store.state.upgrades.length} upgrades · ${store.state.moons.length} Moons · ${Object.keys(store.state.achievements).length} badges`;
  }

  function exportCurrentSave() {
    store.state.stats.saveExports += 1;
    const textarea = root.querySelector('[data-save-text]');
    textarea.value = exportSave(store.state);
    textarea.select();
    persist('export');
    unlockNow();
    return textarea.value;
  }

  function downloadCurrentSave() {
    const value = exportCurrentSave();
    const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cappy-clicker-${new Date().toISOString().slice(0, 10)}.cappy2.txt`;
    link.click();
    URL.revokeObjectURL(url);
    notifications.show('A portable save file was downloaded.', { title: 'Voyage packed', icon: '⬇', tone: 'success' });
  }

  async function importSaveFile(event) {
    const [file] = event.target.files ?? [];
    if (!file) return;
    try {
      root.querySelector('[data-save-text]').value = await file.text();
      importCurrentSave();
    } catch (error) { showError(error.message); }
    event.target.value = '';
  }

  async function copySaveText() {
    const textarea = root.querySelector('[data-save-text]');
    if (!textarea.value) exportCurrentSave();
    try { await navigator.clipboard.writeText(textarea.value); notifications.show('Save text copied to the clipboard.', { title: 'Packed for travel', icon: '📋', tone: 'success' }); }
    catch { textarea.select(); notifications.show('The save text is selected. Press Ctrl+C to copy it.', { title: 'Clipboard unavailable', icon: '📋' }); }
  }

  function importCurrentSave() {
    const textarea = root.querySelector('[data-save-text]');
    try {
      const imported = importSave(textarea.value);
      imported.stats.saveImports += 1;
      imported.integrity.imported = true;
      store.replace(imported, 'save-import');
      persist('import');
      notifications.show('The imported voyage is now active.', { title: 'Customs cleared', icon: '🧳', tone: 'success' });
      root.querySelector('[data-save-dialog]').close();
    } catch (error) { showError(error.message); }
  }

  function hardReset(skipConfirm) {
    if (!skipConfirm && !window.confirm('Permanently erase this Cappy Clicker v2 voyage? Exporting first is recommended.')) return;
    storage.removeItem(SAVE_KEY);
    store.replace(createInitialState(), 'hard-reset');
    root.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
    notifications.show('A fresh passport is ready. The previous local save cannot be recovered unless you exported it.', { title: 'Voyage reset', icon: '🗑', tone: 'danger', duration: 7_000 });
    persist('reset');
  }

  function showOffline(report) {
    const dialog = root.querySelector('[data-offline-dialog]');
    dialog.querySelector('[data-away-time]').textContent = duration(report.elapsedSeconds);
    dialog.querySelector('[data-offline-earned]').textContent = format(report.earned);
    dialog.querySelector('[data-offline-cps]').textContent = format(report.averageCps);
    dialog.querySelector('[data-offline-cap]').textContent = `${report.capHours} hours`;
    dialog.showModal();
  }

  function showError(message) {
    notifications.show(message, { title: 'Not this time', icon: '!', tone: 'danger' });
  }

  function applySettings(state) {
    const now = Date.now();
    const cursed = state.activeEffects.some((effect) => effect.type === 'purple-curse' && effect.expiresAt > now);
    const banana = state.activeEffects.some((effect) => effect.type === 'cosmetic-banana' && effect.expiresAt > now);
    const cappy = COSMETIC_BY_ID[state.cosmetics.equipped.cappy]?.value ?? 'classic';
    const backdrop = COSMETIC_BY_ID[state.cosmetics.equipped.backdrop]?.value ?? 'postcard';
    const sound = COSMETIC_BY_ID[state.cosmetics.equipped.sound]?.value ?? 'classic';
    const nextSignature = [state.settings.performance, state.settings.reducedMotion, cappy, backdrop, sound, cursed, banana].join('|');
    if (nextSignature === settingsSignature) return;
    settingsSignature = nextSignature;
    document.body.dataset.performance = state.settings.performance;
    document.body.classList.toggle('force-reduced-motion', state.settings.reducedMotion);
    document.body.classList.toggle('has-purple-curse', cursed);
    document.body.classList.toggle('has-banana', banana);
    document.body.dataset.cappyStyle = cappy;
    document.body.dataset.backdropStyle = backdrop;
    document.body.dataset.soundStyle = sound;
    audio.setProfile(sound);
  }

  if (loadError) notifications.show(loadError.message, { title: 'Saved voyage could not be read', icon: '!', tone: 'danger', duration: 8_000 });
  if (startupSaveError) notifications.show(startupSaveError.message, { title: 'Offline progress could not be saved', icon: '!', tone: 'danger', duration: 8_000 });
  if (!store.state.news.length) pushNews(store.state, 'Local Frog Denies Involvement in Sudden Coin Surplus');
  if (hadOfflineEarnings && offline.elapsedSeconds >= 60) window.setTimeout(() => showOffline(offline), 350);

  return {
    store,
    start() { loop.start(); },
    stop() { loop.stop(); persist('stop'); },
    save: persist,
    reset: () => hardReset(false),
    debug: {
      spawnBoo: () => store.mutate('debug-boo', (state) => spawnBoo(state)),
      forceBoo: (id) => store.mutate('debug-boo-force', (state) => forceBooOutcome(state, id)),
      catastrophe: () => store.mutate('debug-catastrophe', (state) => forceBooOutcome(state, 'house-always-wins')),
      clearEffects: () => store.mutate('debug-clear-effects', (state) => clearTemporaryEffects(state)),
      spawnShine: (kind = 'normal') => store.mutate('debug-shine', (state) => {
        spawnShine(state, { random: () => kind === 'corrupted' ? 0 : 1 });
      }),
    },
  };
}

function appTemplate(base) {
  return `<div class="kingdom-backdrop" data-kingdom-backdrop aria-hidden="true"></div>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="${base}" aria-label="Cappy Clicker home"><span class="brand__stamp">CC</span><span><strong>Cappy Clicker</strong><small>Grand Tour · v2</small></span></a>
      <div class="headline-counters"><div class="coin-counter"><img src="${base}assets/ui/kingdom-coin.webp" alt=""><span><b data-coins>0</b><small>Kingdom Coins</small></span></div><div><b data-cps>0</b><small>per second</small></div><div><b data-badges>0/${ACHIEVEMENTS.length}</b><small>passport stamps</small></div></div>
      <div class="topbar-actions"><span class="save-indicator" data-save-indicator>Fresh voyage</span><button type="button" data-open-save aria-label="Open save desk">Save</button><button type="button" data-open-settings aria-label="Open settings">⚙</button></div>
    </header>
    <section class="news-ticker" aria-label="Kingdom news"><span class="news-ticker__label">KINGDOM NEWS</span><div><span data-news-text>Loading the latest nonsense…</span></div></section>
    <main class="game-layout">
      <section class="cappy-stage panel-paper" data-cappy-stage aria-labelledby="cappy-title">
        <div class="postcard-pin postcard-pin--left"></div><div class="postcard-pin postcard-pin--right"></div>
        <header><span class="eyebrow">Cap Kingdom departure gate</span><h1 id="cappy-title">Toss Cappy.<br><em>Fund the voyage.</em></h1><p>Every throw rattles loose a few more Kingdom Coins.</p></header>
        <div class="cappy-arena">
          <canvas data-particle-canvas aria-hidden="true"></canvas><div data-click-feedback aria-hidden="true"></div>
          <div class="cappy-orbit cappy-orbit--1"></div><div class="cappy-orbit cappy-orbit--2"></div>
          <button type="button" class="cappy-button" data-cappy-button aria-label="Toss Cappy for coins"><img src="${base}assets/cappy/cappy-hero.svg" alt="Cappy"><span class="cappy-fallback" aria-hidden="true">🧢</span></button>
        </div>
        <div class="click-stats"><div><span data-click-value>1 coin / toss</span><small>effective click value</small></div><div><span data-combo>Build a toss combo</span><small>keep throwing</small></div></div>
        <div class="stage-ticket"><span>Tip</span><p>Press <kbd>Space</kbd> anywhere outside a text box, or focus Cappy and press Enter.</p></div>
      </section>
      <section class="producer-shop" aria-labelledby="shop-title"><header class="shop-heading"><div><span class="eyebrow">Crazy Cap travel desk</span><h2 id="shop-title">Kingdom Producers</h2><p>Only destinations you have discovered appear here. Every number is the actual effective rate.</p></div><span class="shop-sticker">BUY<br>SMART-ISH</span></header><div class="producer-list" data-producer-list></div></section>
      <aside class="right-rail" data-right-rail><nav class="rail-tabs" role="tablist" aria-label="Collections"><button type="button" role="tab" data-tab="upgrades">Upgrades</button><button type="button" role="tab" data-tab="moons">Moons</button><button type="button" role="tab" data-tab="achievements">Badges</button><button type="button" role="tab" data-tab="fuel">Fuel</button><button type="button" role="tab" data-tab="style">Style</button><button type="button" role="tab" data-tab="voyage">Voyage</button><button type="button" role="tab" data-tab="ranks">Ranks</button></nav><div class="rail-panel" data-panel="upgrades"></div><div class="rail-panel" data-panel="moons" hidden></div><div class="rail-panel" data-panel="achievements" hidden></div><div class="rail-panel" data-panel="fuel" hidden></div><div class="rail-panel" data-panel="style" hidden></div><div class="rail-panel" data-panel="voyage" hidden></div><div class="rail-panel" data-panel="ranks" hidden></div></aside>
    </main>
    <section class="journey" data-journey aria-label="Kingdom journey progress"></section>
    <footer class="site-footer"><span>A personal, non-commercial fan project.</span><button type="button" data-open-dev title="Developer Lab is also available with Shift+D">Lab</button><span>Not affiliated with Nintendo.</span></footer>
  </div>
  <aside class="boo-widget" data-boo-widget aria-hidden="true"></aside>
  <aside class="shine-widget" data-shine-widget aria-hidden="true"></aside>
  <div class="notification-stack" data-notifications aria-live="polite"></div>
  <dialog data-settings-dialog>${settingsDialog()}</dialog>
  <dialog data-save-dialog>${saveDialog()}</dialog>
  <dialog data-offline-dialog>${offlineDialog()}</dialog>
  <dialog data-dev-dialog></dialog>
  <div class="banana-sticker" aria-hidden="true">🍌</div>`;
}

function settingsDialog() {
  return `<form method="dialog" class="dialog-card settings-dialog"><header><div><span class="eyebrow">Cabin controls</span><h2>Settings</h2></div><button value="close" aria-label="Close">×</button></header><fieldset><legend>Performance</legend><label><input type="radio" name="performance" value="full"> <span><b>Full</b><small>All backgrounds, particles, and travel-brochure fuss.</small></span></label><label><input type="radio" name="performance" value="reduced"> <span><b>Reduced</b><small>Fewer particles and quieter background movement.</small></span></label><label><input type="radio" name="performance" value="potato"> <span><b>Potato</b><small>Minimal decoration; every game mechanic stays intact.</small></span></label></fieldset><fieldset><legend>Comfort</legend><label><input type="checkbox" name="sound"> <span><b>Synthesized sound effects</b><small>No music or streamed audio.</small></span></label><label><input type="checkbox" name="reducedMotion"> <span><b>Reduce motion</b><small>Also respects your device preference.</small></span></label></fieldset><footer><button value="close">Done</button></footer></form>`;
}

function saveDialog() {
  return `<form method="dialog" class="dialog-card save-dialog"><header><div><span class="eyebrow">Royal archive</span><h2>Save Desk</h2><p data-save-summary></p></div><button value="close" aria-label="Close">×</button></header><label>Export or paste a CAPPY2 save<textarea data-save-text rows="8" spellcheck="false" placeholder="Your exported save appears here."></textarea></label><input type="file" accept=".txt,.cappy2,text/plain" data-save-file hidden><div class="button-cluster"><button type="button" data-export-save>Show export text</button><button type="button" data-download-save>Download file</button><button type="button" data-copy-save>Copy</button><button type="button" data-import-save>Import text</button><button type="button" data-choose-save-file>Import file…</button></div><p class="dialog-note">Imports are validated before the current voyage is replaced. Imported or Developer Lab voyages can view, but not submit to, the friendly online leaderboard.</p><footer><button type="button" class="danger-button" data-reset-save>Delete local save…</button><button value="close">Done</button></footer></form>`;
}

function offlineDialog() {
  return `<form method="dialog" class="dialog-card offline-dialog"><div class="offline-moon">☾</div><span class="eyebrow">Welcome back, captain</span><h2>The crew kept working.</h2><div class="offline-summary"><div><span>Time away</span><b data-away-time>—</b></div><div><span>Coins earned</span><b data-offline-earned>—</b></div><div><span>Average CPS</span><b data-offline-cps>—</b></div><div><span>Current cap</span><b data-offline-cap>—</b></div></div><p>No King Boo encounters were generated while the game was closed. Even he has office hours.</p><button value="close">Collect and continue</button></form>`;
}

function setText(element, value) {
  if (element.textContent !== value) element.textContent = value;
}

function duration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return [hours ? `${hours}h` : '', minutes ? `${minutes}m` : '', `${secs}s`].filter(Boolean).join(' ');
}

function installImageFallbacks(root) {
  root.addEventListener('error', (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;
    image.classList.add('image-failed');
    image.setAttribute('aria-hidden', 'true');
    image.closest('.producer-card__art, .moon-card, .boo-invite, .boo-machine__header, .coin-counter, .journey-stop, .journey-track, .cappy-button')
      ?.classList.add('has-image-fallback');
  }, true);
}

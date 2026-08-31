import { format, formatInteger } from '../core/numbers.js';
import { getEconomySnapshot } from '../core/economy.js';
import { PRODUCERS, PRODUCER_BY_ID } from '../data/buildings.js';
import { BUILDING_UPGRADES, BUILDING_UPGRADE_BY_ID, MILESTONES, TECHNIQUE_UPGRADES } from '../data/building-upgrades.js';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORY_COUNTS } from '../data/achievements.js';
import { POWER_MOONS } from '../data/power-moons.js';
import { COSMETICS, COSMETIC_BY_ID } from '../data/cosmetics.js';
import { getAvailableUpgrades, getInstalledUpgradeGroups, purchaseUpgrade } from '../systems/upgrades.js';
import { getVisibleMoons, purchaseMoon } from '../systems/moons.js';
import { getAchievementFraction, getAchievementProgress } from '../systems/achievements.js';
import { equipCosmetic, purchaseCosmetic } from '../systems/cosmetics.js';

const CATEGORY_LABELS = {
  producer_ownership: 'Producer Stamps', economy: 'Coin & CPS', clicking: 'Cappy Tosses', upgrades: 'Workshop',
  moons: 'Power Moons', king_boo: 'King Boo Casino', discovery: 'Kingdom Atlas', shines: 'Rare Shines',
  cosmetics: 'Wardrobe', misc: 'Oddities',
};
const ACHIEVEMENT_PAGE_SIZE = 40;

export function createRightRail(root, store, options = {}) {
  const tabs = [...root.querySelectorAll('[data-tab]')];
  const panels = [...root.querySelectorAll('[data-panel]')];
  let active = 'upgrades';
  let achievementCategory = 'producer_ownership';
  let achievementPage = 0;
  let renderKey = '';
  let leaderboardMetric = 'lifetime';
  let leaderboardState = {
    loading: false,
    loaded: false,
    available: Boolean(options.leaderboard?.available),
    entries: [],
    ownRank: null,
    message: '',
    error: '',
  };

  for (const tab of tabs) tab.addEventListener('click', () => setTab(tab.dataset.tab));
  root.addEventListener('click', async (event) => {
    const upgradeButton = event.target.closest('[data-buy-upgrade]');
    if (upgradeButton) {
      let result;
      store.mutate('upgrade-purchase', (state) => { result = purchaseUpgrade(state, upgradeButton.dataset.buyUpgrade); });
      if (result.ok) { options.audio?.purchase(); options.onUpgrade?.(result); renderAll(true); }
      else options.onError?.(result.reason);
      return;
    }
    const moonButton = event.target.closest('[data-buy-moon]');
    if (moonButton) {
      let result;
      store.mutate('moon-purchase', (state) => { result = purchaseMoon(state, moonButton.dataset.buyMoon); });
      if (result.ok) { options.audio?.moon(); options.onMoon?.(result); renderAll(true); }
      else options.onError?.(result.reason);
      return;
    }
    const cosmeticButton = event.target.closest('[data-cosmetic-action]');
    if (cosmeticButton) {
      const id = cosmeticButton.dataset.cosmeticAction;
      const owned = store.state.cosmetics.owned.includes(id);
      let result;
      store.mutate(owned ? 'cosmetic-equip' : 'cosmetic-purchase', (state) => {
        result = owned ? equipCosmetic(state, id) : purchaseCosmetic(state, id);
        if (result.ok && !owned) equipCosmetic(state, id);
      });
      if (result.ok) { options.audio?.purchase(); options.onCosmetic?.(result); renderAll(true); }
      else options.onError?.(result.reason);
      return;
    }
    const categoryButton = event.target.closest('[data-achievement-category]');
    if (categoryButton) {
      achievementCategory = categoryButton.dataset.achievementCategory;
      achievementPage = 0;
      renderAchievements(store.state);
      return;
    }
    const achievementPageButton = event.target.closest('[data-achievement-page]');
    if (achievementPageButton) {
      achievementPage = Math.max(0, achievementPage + Number(achievementPageButton.dataset.achievementPage));
      renderAchievements(store.state);
      return;
    }
    const metricButton = event.target.closest('[data-leaderboard-metric]');
    if (metricButton) {
      leaderboardMetric = metricButton.dataset.leaderboardMetric;
      await refreshLeaderboard();
      return;
    }
    if (event.target.closest('[data-leaderboard-refresh]')) {
      await refreshLeaderboard();
      return;
    }
    if (event.target.closest('[data-leaderboard-submit]')) {
      await submitLeaderboard();
    }
  });

  function setTab(name) {
    active = name;
    for (const tab of tabs) {
      const selected = tab.dataset.tab === name;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', String(selected));
    }
    for (const panel of panels) panel.hidden = panel.dataset.panel !== name;
    options.onTab?.(name);
    if (name === 'ranks' && !leaderboardState.loaded && !leaderboardState.loading) refreshLeaderboard();
  }

  function renderAll(force = false) {
    const state = store.state;
    const availableUpgrades = getAvailableUpgrades(state);
    const visibleMoons = getVisibleMoons(state);
    const key = [
      state.upgrades.length, state.moons.length, state.cosmetics.owned.length,
      Object.keys(state.achievements).length, state.discoveredProducers.length, state.boo.history.length,
      state.settings.leaderboardName, active, achievementCategory, achievementPage,
      leaderboardState.loading, leaderboardState.entries.length, leaderboardMetric,
      ...Object.values(state.producers),
      ...availableUpgrades.map(({ id, cost }) => `${id}:${state.coins.gte(cost)}`),
      ...visibleMoons.map(({ id, cost }) => `${id}:${state.coins.gte(cost)}`),
      ...COSMETICS.filter(({ id }) => !state.cosmetics.owned.includes(id)).map(({ id, cost }) => `${id}:${state.coins.gte(cost)}`),
    ].join(':');
    if (!force && key === renderKey) return;
    renderKey = key;
    renderUpgrades(state);
    renderMoons(state);
    renderAchievements(state);
    renderVoyage(state);
    renderCosmetics(state);
    renderRanks(state);
  }

  function renderUpgrades(state) {
    const panel = root.querySelector('[data-panel="upgrades"]');
    const available = getAvailableUpgrades(state);
    const groups = getInstalledUpgradeGroups(state);
    panel.innerHTML = `<section class="rail-section">
      <div class="section-heading"><div><span class="eyebrow">Milestones, fusions & Cappy tech</span><h2>Available Upgrades</h2></div><span class="count-pill">${available.length}</span></div>
      <div class="upgrade-list">${available.length ? available.map((upgrade) => {
        const producer = upgrade.producerId ? PRODUCER_BY_ID[upgrade.producerId] : null;
        const affordable = state.coins.gte(upgrade.cost);
        const requirement = producer ? `${producer.name} · ${upgrade.milestone} owned` : `Cappy technique · ${format(upgrade.unlockAt)} lifetime`;
        return `<article class="upgrade-ticket ${affordable ? 'is-affordable' : ''} ${upgrade.track === 'technique' ? 'is-technique' : ''}">
          <span class="upgrade-ticket__motif">${upgrade.motif}</span><div><span class="eyebrow">${escapeHtml(requirement)}</span><h3>${escapeHtml(upgrade.name)}</h3><p>${escapeHtml(upgrade.flavour)}</p><strong>${escapeHtml(upgrade.effectLabel)}</strong></div>
          <button type="button" data-buy-upgrade="${upgrade.id}" ${affordable ? '' : 'disabled'}><span>Install</span><small>${format(upgrade.cost)} coins</small></button>
        </article>`;
      }).join('') : '<div class="empty-ticket"><span>🔧</span><p>Reach the next ownership or lifetime milestone to reveal another upgrade.</p></div>'}</div>
    </section>
    <section class="rail-section installed-section"><div class="section-heading"><div><span class="eyebrow">Permanent collection</span><h2>Installed</h2></div><span class="count-pill">${state.upgrades.length}/${BUILDING_UPGRADES.length}</span></div>
      ${groups.size ? [...groups.entries()].map(([groupId, upgrades]) => {
        const technique = groupId === 'technique';
        const label = technique ? 'Cappy Techniques' : PRODUCER_BY_ID[groupId]?.name ?? groupId;
        const total = technique ? TECHNIQUE_UPGRADES.length : MILESTONES.length;
        return `<details class="installed-group"><summary><span>${escapeHtml(label)}</span><b>${upgrades.length}/${total}</b></summary><div>${upgrades.map((upgrade) => `<span title="${escapeHtml(upgrade.flavour)}">${upgrade.motif} ${escapeHtml(upgrade.name)}</span>`).join('')}</div></details>`;
      }).join('') : '<p class="muted">Purchased upgrades settle here permanently.</p>'}
    </section>`;
  }

  function renderMoons(state) {
    const panel = root.querySelector('[data-panel="moons"]');
    const visible = getVisibleMoons(state);
    const base = import.meta.env.BASE_URL;
    panel.innerHTML = `<section class="rail-section moon-section"><div class="section-heading"><div><span class="eyebrow">Every tenth is a Multi Moon</span><h2>Power Moon Album</h2></div><span class="count-pill moon-count">${state.moons.length}/${POWER_MOONS.length}</span></div>
      <div class="moon-offers">${visible.length ? visible.map((moon, index) => `<article class="moon-card moon-card--${(POWER_MOONS.indexOf(moon) % 5) + 1} ${moon.isMulti ? 'is-multi' : ''}" data-moon-number="${POWER_MOONS.indexOf(moon) + 1}">
        <div class="moon-card__art">${moon.isMulti ? '<span>☾</span><span>☾</span><span>☾</span>' : `<img src="${base}assets/moons/power-moon.svg" alt="" loading="lazy">`}</div><div><span class="eyebrow">${moon.isMulti ? 'MULTI MOON MILESTONE' : index === 0 ? 'Next on the itinerary' : 'Coming into view'}</span><h3>${escapeHtml(moon.name)}</h3><p>${escapeHtml(moon.flavour)}</p><strong>${escapeHtml(moon.effectLabel)}</strong></div>
        <button type="button" data-buy-moon="${moon.id}" ${state.coins.gte(moon.cost) ? '' : 'disabled'}><span>Collect once</span><small>${format(moon.cost)} coins</small></button>
      </article>`).join('') : '<div class="empty-ticket"><span>🌙</span><p>All fifty Power Moons are safely collected.</p></div>'}</div>
      <div class="moon-album">${POWER_MOONS.map((moon, index) => `<div class="moon-stamp ${moon.isMulti ? 'is-multi' : ''} ${state.moons.includes(moon.id) ? 'is-collected' : ''}" title="${state.moons.includes(moon.id) ? escapeHtml(moon.name) : moon.isMulti ? 'Uncollected Multi Moon' : 'Uncollected Power Moon'}"><span>${index + 1}</span></div>`).join('')}</div>
    </section>`;
  }

  function renderAchievements(state) {
    const panel = root.querySelector('[data-panel="achievements"]');
    const unlocked = Object.keys(state.achievements).length;
    const categoryEntries = ACHIEVEMENTS.filter((achievement) => achievement.category === achievementCategory);
    const pageCount = Math.max(1, Math.ceil(categoryEntries.length / ACHIEVEMENT_PAGE_SIZE));
    achievementPage = Math.min(achievementPage, pageCount - 1);
    const entries = categoryEntries.slice(achievementPage * ACHIEVEMENT_PAGE_SIZE, (achievementPage + 1) * ACHIEVEMENT_PAGE_SIZE);
    const snapshot = getEconomySnapshot(state);
    panel.innerHTML = `<section class="rail-section"><div class="section-heading"><div><span class="eyebrow">A genuinely long passport</span><h2>Achievements</h2></div><span class="count-pill">${unlocked}/${ACHIEVEMENTS.length}</span></div>
      <div class="passport-progress"><div><span>Passport completion</span><b>${(unlocked / ACHIEVEMENTS.length * 100).toFixed(1)}%</b></div><div class="meter"><span style="width:${unlocked / ACHIEVEMENTS.length * 100}%"></span></div><small>Each badge adds +0.02% global production, capped at +14% only when all 700 are complete.</small></div>
      <div class="achievement-category-tabs">${Object.entries(ACHIEVEMENT_CATEGORY_COUNTS).map(([category, count]) => {
        const owned = ACHIEVEMENTS.filter((achievement) => achievement.category === category && state.achievements[achievement.id]).length;
        return `<button type="button" class="${category === achievementCategory ? 'is-active' : ''}" data-achievement-category="${category}"><span>${CATEGORY_LABELS[category]}</span><b>${owned}/${count}</b></button>`;
      }).join('')}</div>
      <div class="badge-grid">${entries.map((achievement) => {
        const isUnlocked = Boolean(state.achievements[achievement.id]);
        const context = { snapshot };
        const fraction = getAchievementFraction(state, achievement, context);
        const progress = getAchievementProgress(state, achievement, context);
        return `<article class="badge ${isUnlocked ? 'is-unlocked' : ''}" title="${escapeHtml(achievement.flavour)}"><span class="badge__icon">${isUnlocked ? badgeIcon(achievement.category) : '?'}</span><div><h3>${escapeHtml(isUnlocked ? achievement.name : 'Unstamped')}</h3><p>${escapeHtml(isUnlocked ? achievement.flavour : achievement.name)}</p>${isUnlocked ? '<small>Stamped!</small>' : `<div class="mini-meter"><span style="width:${fraction * 100}%"></span></div><small>${formatProgress(progress)} / ${formatProgress(achievement.condition.target)}</small>`}</div></article>`;
      }).join('')}</div>
      ${pageCount > 1 ? `<div class="page-controls"><button type="button" data-achievement-page="-1" ${achievementPage === 0 ? 'disabled' : ''}>← Previous</button><span>Page ${achievementPage + 1} / ${pageCount}</span><button type="button" data-achievement-page="1" ${achievementPage + 1 === pageCount ? 'disabled' : ''}>Next →</button></div>` : ''}
    </section>`;
  }

  function renderVoyage(state) {
    const panel = root.querySelector('[data-panel="voyage"]');
    const snapshot = getEconomySnapshot(state);
    const maxOwned = Math.max(1, ...Object.values(state.producers));
    panel.innerHTML = `<section class="rail-section"><div class="section-heading"><div><span class="eyebrow">Voyage log</span><h2>Stats & Census</h2></div></div>
      <div class="stat-grid">
        <div><span>Lifetime coins</span><b data-stat-lifetime>${format(state.lifetimeCoins)}</b></div><div><span>Total CPS</span><b data-stat-cps>${format(snapshot.totalCps)}</b></div>
        <div><span>Cappy tosses</span><b>${formatInteger(state.stats.totalClicks)}</b></div><div><span>Critical tosses</span><b>${formatInteger(state.stats.criticalClicks)}</b></div>
        <div><span>Producers bought</span><b>${formatInteger(state.stats.producersPurchased)}</b></div><div><span>Shines caught</span><b>${formatInteger(state.stats.shinesClaimed)}</b></div>
      </div>
      <h3 class="subheading">Route census</h3><div class="route-census">${PRODUCERS.filter(({ id }) => state.discoveredProducers.includes(id)).map((producer, index) => {
        const owned = state.producers[producer.id] ?? 0;
        const width = owned ? Math.max(3, Math.log10(owned + 1) / Math.log10(maxOwned + 1) * 100) : 0;
        return `<div title="${escapeHtml(producer.name)}: ${formatInteger(owned)}"><span>${index + 1}</span><div><i style="width:${width}%"></i></div><b>${formatInteger(owned)}</b></div>`;
      }).join('')}</div>
      <h3 class="subheading">Active effects</h3><div data-active-effects class="effect-list"></div>
      <h3 class="subheading">King Boo receipts</h3><div class="boo-history">${state.boo.history.length ? state.boo.history.slice(0, 12).map((record) => `<article class="boo-receipt boo-receipt--${record.tier}"><span>${new Date(record.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><div><b>${escapeHtml(record.title)}</b><small>${record.payout !== '0' ? `+${format(record.payout)}` : record.loss !== '0' ? `−${format(record.loss)}` : 'No coin change'}</small></div></article>`).join('') : '<p class="muted">No suspicious casino receipts yet.</p>'}</div>
      <div class="voyage-actions"><button type="button" data-open-settings>Settings</button><button type="button" data-open-save>Save desk</button></div>
    </section>`;
  }

  function renderCosmetics(state) {
    const panel = root.querySelector('[data-panel="style"]');
    panel.innerHTML = `<section class="rail-section"><div class="section-heading"><div><span class="eyebrow">Permanent coin-bought collection</span><h2>Cosmetics</h2></div><span class="count-pill">${state.cosmetics.owned.length}/${COSMETICS.length}</span></div>
      ${['cappy', 'backdrop', 'sound'].map((category) => `<h3 class="subheading">${({ cappy: 'Cappy styles', backdrop: 'Voyage backdrops', sound: 'Sound packs' })[category]}</h3><div class="cosmetic-grid">${COSMETICS.filter((item) => item.category === category).map((item) => {
        const owned = state.cosmetics.owned.includes(item.id);
        const equipped = state.cosmetics.equipped[category] === item.id;
        const affordable = state.coins.gte(item.cost);
        return `<article class="cosmetic-card ${owned ? 'is-owned' : ''} ${equipped ? 'is-equipped' : ''}"><span class="cosmetic-preview cosmetic-preview--${item.value}">${item.preview}</span><div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p></div><button type="button" data-cosmetic-action="${item.id}" ${!owned && !affordable ? 'disabled' : ''}>${equipped ? 'Equipped' : owned ? 'Equip' : `Buy · ${format(item.cost)}`}</button></article>`;
      }).join('')}</div>`).join('')}
    </section>`;
  }

  function renderRanks(state) {
    const panel = root.querySelector('[data-panel="ranks"]');
    const eligible = !state.integrity.imported && !state.integrity.devLabUsed;
    const entries = leaderboardState.entries;
    panel.innerHTML = `<section class="rail-section"><div class="section-heading"><div><span class="eyebrow">Self-reported, just for fun</span><h2>Open League</h2></div><span class="count-pill">${leaderboardState.available ? 'ONLINE' : 'OFFLINE'}</span></div>
      <div class="leaderboard-metrics"><button type="button" class="${leaderboardMetric === 'lifetime' ? 'is-active' : ''}" data-leaderboard-metric="lifetime">Lifetime coins</button><button type="button" class="${leaderboardMetric === 'cps' ? 'is-active' : ''}" data-leaderboard-metric="cps">Base CPS</button></div>
      <label class="leaderboard-name">Playing as<input data-leaderboard-name maxlength="24" value="${escapeHtml(state.settings.leaderboardName)}" placeholder="Choose a display name"></label>
      <div class="leaderboard-actions"><button type="button" data-leaderboard-submit ${!eligible || leaderboardState.loading || !leaderboardState.available ? 'disabled' : ''}>Submit score</button><button type="button" data-leaderboard-refresh ${leaderboardState.loading ? 'disabled' : ''}>${leaderboardState.loading ? 'Refreshing…' : 'Refresh'}</button></div>
      ${!eligible ? '<p class="league-warning">This voyage used an imported save or Developer Lab, so score submission is disabled. You can still view the board.</p>' : ''}
      ${leaderboardState.error ? `<p class="league-warning">${escapeHtml(leaderboardState.error)}</p>` : leaderboardState.message ? `<p class="muted">${escapeHtml(leaderboardState.message)}</p>` : ''}
      <ol class="leaderboard-list">${entries.map((entry, index) => `<li><span>${entry.rank ?? index + 1}</span><div><b>${escapeHtml(entry.name ?? 'Anonymous Captain')}</b><small>${formatLeagueMeta(entry.metadata)}</small></div><strong>${format(entry.displayValue ?? entry.display_value ?? 0)}</strong></li>`).join('')}</ol>
      ${leaderboardState.ownRank && leaderboardState.ownRank > entries.length ? `<p class="muted">Your current rank: #${leaderboardState.ownRank}</p>` : ''}
      <p class="league-disclaimer">Scores are self-reported and not verified. Treat this as a friendly vanity board, not a record sheet.</p>
    </section>`;
  }

  async function refreshLeaderboard() {
    if (!options.leaderboard) return;
    leaderboardState = { ...leaderboardState, loading: true, error: '' };
    renderRanks(store.state);
    try {
      const result = await options.leaderboard.list(leaderboardMetric);
      leaderboardState = { ...leaderboardState, ...result, loaded: true, loading: false, error: '' };
    } catch (error) {
      leaderboardState = { ...leaderboardState, loaded: true, loading: false, error: error.message };
    }
    renderRanks(store.state);
  }

  async function submitLeaderboard() {
    if (!options.leaderboard || store.state.integrity.imported || store.state.integrity.devLabUsed) return;
    const input = root.querySelector('[data-leaderboard-name]');
    const name = input?.value.trim() ?? '';
    store.mutate('leaderboard-name', (state) => { state.settings.leaderboardName = name.slice(0, 24); });
    options.onPersist?.('leaderboard-name');
    leaderboardState = { ...leaderboardState, loading: true, error: '' };
    renderRanks(store.state);
    try {
      const result = await options.leaderboard.submit(store.state, name, leaderboardMetric);
      if (!result.available) throw new Error(result.message);
      store.mutate('leaderboard-submit', (state) => { state.stats.leaderboardSubmissions += 1; });
      options.onPersist?.('leaderboard-submit');
      options.onLeaderboardSubmit?.(result);
      await refreshLeaderboard();
    } catch (error) {
      leaderboardState = { ...leaderboardState, loading: false, error: error.message };
      renderRanks(store.state);
    }
  }

  function update(state) {
    renderAll();
    const lifetime = root.querySelector('[data-stat-lifetime]');
    const cps = root.querySelector('[data-stat-cps]');
    if (lifetime) lifetime.textContent = format(state.lifetimeCoins);
    if (cps) cps.textContent = format(getEconomySnapshot(state).totalCps);
    const effectList = root.querySelector('[data-active-effects]');
    if (effectList) {
      const activeEffects = state.activeEffects.filter((effect) => effect.expiresAt > Date.now());
      effectList.innerHTML = activeEffects.length ? activeEffects.map((effect) => `<div class="effect-chip effect-chip--${effect.multiplier < 1 || effect.type.includes('disabled') || effect.type.includes('curse') ? 'bad' : 'good'}"><span>${effectLabel(effect)}</span><b>${Math.max(0, Math.ceil((effect.expiresAt - Date.now()) / 1000))}s</b></div>`).join('') : '<p class="muted">No temporary effects. Suspiciously peaceful.</p>';
    }
  }

  setTab(active);
  renderAll(true);
  return { update, renderAll, setTab };
}

function effectLabel(effect) {
  if (effect.type === 'production-multiplier') return `Production ×${effect.multiplier}`;
  if (effect.type === 'global-additive') return `Global production +${Math.round(effect.amount * 100)}%`;
  if (effect.type === 'click-multiplier') return `Cappy ×${effect.multiplier}`;
  if (effect.type === 'price-multiplier') return `Prices ×${effect.multiplier}`;
  if (effect.type === 'producer-multiplier') return `${PRODUCER_BY_ID[effect.producerId]?.name ?? 'Producer'} ×${effect.multiplier}`;
  if (effect.type === 'producer-disabled') return `${PRODUCER_BY_ID[effect.producerId]?.name ?? 'Producer'} disabled`;
  if (effect.type === 'purple-curse') return 'Purple casino curse';
  if (effect.type === 'cosmetic-banana') return 'Decorative banana';
  return effect.type;
}

function badgeIcon(category) {
  return ({ producer_ownership: '★', economy: '¢', clicking: '↗', upgrades: '⚙', moons: '☾', king_boo: '♛', discovery: '⌖', shines: '☀', cosmetics: '♦', misc: '✦' })[category] ?? '★';
}

function formatProgress(value) {
  return typeof value === 'string' || typeof value === 'object' ? format(value) : formatInteger(value);
}

function formatLeagueMeta(metadata = {}) {
  const parts = [];
  if (metadata.achievements !== undefined) parts.push(`${formatInteger(metadata.achievements)} badges`);
  if (metadata.moons !== undefined) parts.push(`${formatInteger(metadata.moons)} Moons`);
  if (metadata.producers !== undefined) parts.push(`${formatInteger(metadata.producers)} crew`);
  return parts.join(' · ') || 'Grand Tour captain';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

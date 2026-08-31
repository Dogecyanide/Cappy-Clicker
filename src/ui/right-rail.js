import { format, formatInteger } from '../core/numbers.js';
import { getEconomySnapshot } from '../core/economy.js';
import { PRODUCER_BY_ID } from '../data/buildings.js';
import { BUILDING_UPGRADE_BY_ID } from '../data/building-upgrades.js';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORY_COUNTS } from '../data/achievements.js';
import { POWER_MOONS } from '../data/power-moons.js';
import { getAvailableUpgrades, getInstalledUpgradeGroups, purchaseUpgrade } from '../systems/upgrades.js';
import { getVisibleMoons, purchaseMoon } from '../systems/moons.js';
import { getAchievementFraction, getAchievementProgress } from '../systems/achievements.js';

const CATEGORY_LABELS = {
  producer_ownership: 'Producer Stamps', economy: 'Coin & CPS', clicking: 'Cappy Tosses', upgrades: 'Workshop',
  moons: 'Power Moons', king_boo: 'King Boo Casino', discovery: 'Kingdom Atlas', misc: 'Oddities',
};

export function createRightRail(root, store, options = {}) {
  const tabs = [...root.querySelectorAll('[data-tab]')];
  const panels = [...root.querySelectorAll('[data-panel]')];
  let active = 'upgrades';
  let renderKey = '';

  for (const tab of tabs) tab.addEventListener('click', () => setTab(tab.dataset.tab));
  root.addEventListener('click', (event) => {
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
  }

  function renderAll(force = false) {
    const state = store.state;
    const availableUpgrades = getAvailableUpgrades(state);
    const visibleMoons = getVisibleMoons(state);
    const key = [
      state.upgrades.length,
      state.moons.length,
      Object.keys(state.achievements).length,
      state.discoveredProducers.length,
      state.boo.history.length,
      ...Object.values(state.producers),
      ...availableUpgrades.map(({ id, cost }) => `${id}:${state.coins.gte(cost)}`),
      ...visibleMoons.map(({ id, cost }) => `${id}:${state.coins.gte(cost)}`),
    ].join(':');
    if (!force && key === renderKey) return;
    renderKey = key;
    renderUpgrades(state);
    renderMoons(state);
    renderAchievements(state);
    renderVoyage(state);
  }

  function renderUpgrades(state) {
    const panel = root.querySelector('[data-panel="upgrades"]');
    const available = getAvailableUpgrades(state);
    const groups = getInstalledUpgradeGroups(state);
    panel.innerHTML = `<section class="rail-section">
      <div class="section-heading"><div><span class="eyebrow">Milestone workshop</span><h2>Available Upgrades</h2></div><span class="count-pill">${available.length}</span></div>
      <div class="upgrade-list">${available.length ? available.map((upgrade) => {
        const producer = PRODUCER_BY_ID[upgrade.producerId];
        const affordable = state.coins.gte(upgrade.cost);
        return `<article class="upgrade-ticket ${affordable ? 'is-affordable' : ''}">
          <span class="upgrade-ticket__motif">${upgrade.motif}</span><div><span class="eyebrow">${escapeHtml(producer.name)} · ${upgrade.milestone} owned</span><h3>${escapeHtml(upgrade.name)}</h3><p>${escapeHtml(upgrade.flavour)}</p><strong>${escapeHtml(producer.name)} production ×2</strong></div>
          <button type="button" data-buy-upgrade="${upgrade.id}" ${affordable ? '' : 'disabled'}><span>Install</span><small>${format(upgrade.cost)} coins</small></button>
        </article>`;
      }).join('') : '<div class="empty-ticket"><span>🔧</span><p>Reach a producer milestone to reveal its next workshop upgrade.</p></div>'}</div>
    </section>
    <section class="rail-section installed-section"><div class="section-heading"><div><span class="eyebrow">Permanent collection</span><h2>Installed</h2></div><span class="count-pill">${state.upgrades.length}/140</span></div>
      ${groups.size ? [...groups.entries()].map(([producerId, upgrades]) => `<details class="installed-group"><summary><span>${escapeHtml(PRODUCER_BY_ID[producerId].name)}</span><b>${upgrades.length}/7</b></summary><div>${upgrades.map((upgrade) => `<span title="${escapeHtml(upgrade.flavour)}">${upgrade.motif} ${escapeHtml(upgrade.name)}</span>`).join('')}</div></details>`).join('') : '<p class="muted">Purchased upgrades settle here permanently.</p>'}
    </section>`;
  }

  function renderMoons(state) {
    const panel = root.querySelector('[data-panel="moons"]');
    const visible = getVisibleMoons(state);
    const base = import.meta.env.BASE_URL;
    panel.innerHTML = `<section class="rail-section moon-section"><div class="section-heading"><div><span class="eyebrow">One-time super upgrades</span><h2>Power Moon Album</h2></div><span class="count-pill moon-count">${state.moons.length}/16</span></div>
      <div class="moon-offers">${visible.length ? visible.map((moon, index) => `<article class="moon-card moon-card--${(POWER_MOONS.indexOf(moon) % 5) + 1}" data-moon-number="${POWER_MOONS.indexOf(moon) + 1}">
        <img src="${base}assets/moons/power-moon.svg" alt="" loading="lazy"><div><span class="eyebrow">${index === 0 ? 'Next on the itinerary' : 'Coming into view'}</span><h3>${escapeHtml(moon.name)}</h3><p>${escapeHtml(moon.flavour)}</p><strong>${escapeHtml(moon.effectLabel)}</strong></div>
        <button type="button" data-buy-moon="${moon.id}" ${state.coins.gte(moon.cost) ? '' : 'disabled'}><span>Collect once</span><small>${format(moon.cost)} coins</small></button>
      </article>`).join('') : '<div class="empty-ticket"><span>🌙</span><p>Every Power Moon in the voyage is safely collected.</p></div>'}</div>
      <div class="moon-album">${POWER_MOONS.map((moon, index) => `<div class="moon-stamp ${state.moons.includes(moon.id) ? 'is-collected' : ''}" title="${state.moons.includes(moon.id) ? escapeHtml(moon.name) : 'Uncollected Power Moon'}"><span>${index + 1}</span></div>`).join('')}</div>
    </section>`;
  }

  function renderAchievements(state) {
    const panel = root.querySelector('[data-panel="achievements"]');
    const unlocked = Object.keys(state.achievements).length;
    panel.innerHTML = `<section class="rail-section"><div class="section-heading"><div><span class="eyebrow">Badge passport</span><h2>Achievements</h2></div><span class="count-pill">${unlocked}/250</span></div>
      <div class="passport-progress"><div><span>Passport completion</span><b>${(unlocked / 2.5).toFixed(1)}%</b></div><div class="meter"><span style="width:${unlocked / 2.5}%"></span></div><small>Each badge adds a tiny +0.04% global bonus, capped at +10%.</small></div>
      <div class="achievement-categories">${Object.entries(ACHIEVEMENT_CATEGORY_COUNTS).map(([category, count], categoryIndex) => {
        const entries = ACHIEVEMENTS.filter((achievement) => achievement.category === category);
        const owned = entries.filter((achievement) => state.achievements[achievement.id]).length;
        return `<details class="achievement-category" ${categoryIndex === 0 ? 'open' : ''}><summary><span>${CATEGORY_LABELS[category]}</span><b>${owned}/${count}</b></summary><div class="badge-grid">${entries.map((achievement) => {
          const isUnlocked = Boolean(state.achievements[achievement.id]);
          const fraction = getAchievementFraction(state, achievement);
          const progress = getAchievementProgress(state, achievement);
          return `<article class="badge ${isUnlocked ? 'is-unlocked' : ''}" title="${escapeHtml(achievement.flavour)}"><span class="badge__icon">${isUnlocked ? badgeIcon(category) : '?'}</span><div><h3>${escapeHtml(isUnlocked ? achievement.name : 'Unstamped')}</h3><p>${escapeHtml(isUnlocked ? achievement.flavour : achievement.name)}</p>${isUnlocked ? '<small>Stamped!</small>' : `<div class="mini-meter"><span style="width:${fraction * 100}%"></span></div><small>${formatProgress(progress)} / ${formatProgress(achievement.condition.target)}</small>`}</div></article>`;
        }).join('')}</div></details>`;
      }).join('')}</div>
    </section>`;
  }

  function renderVoyage(state) {
    const panel = root.querySelector('[data-panel="voyage"]');
    const snapshot = getEconomySnapshot(state);
    panel.innerHTML = `<section class="rail-section"><div class="section-heading"><div><span class="eyebrow">Voyage log</span><h2>Stats & Effects</h2></div></div>
      <div class="stat-grid">
        <div><span>Lifetime coins</span><b data-stat-lifetime>${format(state.lifetimeCoins)}</b></div><div><span>Total CPS</span><b data-stat-cps>${format(snapshot.totalCps)}</b></div>
        <div><span>Cappy tosses</span><b>${formatInteger(state.stats.totalClicks)}</b></div><div><span>Critical tosses</span><b>${formatInteger(state.stats.criticalClicks)}</b></div>
        <div><span>Producers bought</span><b>${formatInteger(state.stats.producersPurchased)}</b></div><div><span>Offline earned</span><b>${format(state.stats.offlineEarned)}</b></div>
      </div>
      <h3 class="subheading">Active effects</h3><div data-active-effects class="effect-list"></div>
      <h3 class="subheading">King Boo receipts</h3><div class="boo-history">${state.boo.history.length ? state.boo.history.slice(0, 12).map((record) => `<article class="boo-receipt boo-receipt--${record.tier}"><span>${new Date(record.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><div><b>${escapeHtml(record.title)}</b><small>${record.payout !== '0' ? `+${format(record.payout)}` : record.loss !== '0' ? `−${format(record.loss)}` : 'No coin change'}</small></div></article>`).join('') : '<p class="muted">No suspicious casino receipts yet.</p>'}</div>
      <div class="voyage-actions"><button type="button" data-open-settings>Settings</button><button type="button" data-open-save>Save desk</button></div>
    </section>`;
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
  if (effect.type === 'click-multiplier') return `Cappy ×${effect.multiplier}`;
  if (effect.type === 'price-multiplier') return `Prices ×${effect.multiplier}`;
  if (effect.type === 'producer-multiplier') return `${PRODUCER_BY_ID[effect.producerId]?.name ?? 'Producer'} ×${effect.multiplier}`;
  if (effect.type === 'producer-disabled') return `${PRODUCER_BY_ID[effect.producerId]?.name ?? 'Producer'} disabled`;
  if (effect.type === 'purple-curse') return 'Purple casino curse';
  if (effect.type === 'cosmetic-banana') return 'Decorative banana';
  return effect.type;
}

function badgeIcon(category) {
  return ({ producer_ownership: '★', economy: '¢', clicking: '↗', upgrades: '⚙', moons: '☾', king_boo: '♛', discovery: '⌖', misc: '✦' })[category] ?? '★';
}

function formatProgress(value) {
  return typeof value === 'string' || typeof value === 'object' ? format(value) : formatInteger(value);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

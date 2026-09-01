import { format } from '../core/numbers.js';
import { FUEL_MODULES } from '../data/fuel-modules.js';
import { getFuelModuleStatus, getFuelProfile } from '../systems/fuel.js';

export function fuelPanelHtml(state) {
  const profile = getFuelProfile(state);
  const percent = profile.percent.toFixed(1);
  const output = describeFuelOutput(profile.bonuses);
  return `<section class="rail-section fuel-section">
    <div class="section-heading"><div><span class="eyebrow">Achievement-powered voyage system</span><h2>Odyssey Fuel</h2></div><span class="count-pill fuel-count">${percent}%</span></div>
    <div class="fuel-hero">
      <div class="fuel-tank" role="progressbar" aria-label="Odyssey Fuel tank" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(profile.percent)}">
        <div class="fuel-tank__glass"><span class="fuel-tank__liquid" style="height:${profile.percent}%"><i></i><i></i><i></i></span></div>
        <strong>${percent}%</strong><small>${formatFuelUnits(profile.units)} / ${formatFuelUnits(profile.capacity)} galactic units</small>
      </div>
      <div class="fuel-grade"><span class="eyebrow">Current blend</span><h3>${escapeHtml(profile.tier.name)}</h3><p>${escapeHtml(profile.tier.note)}</p>
        ${profile.nextTier ? `<small>Next grade: <b>${escapeHtml(profile.nextTier.name)}</b> at ${profile.nextTier.at}%</small>` : '<small><b>The tank has reached its final grade.</b></small>'}
      </div>
    </div>
    <p class="fuel-explainer">The tank fills permanently from the whole voyage. Fuel is never spent: installed engine modules turn its current fill into scaling bonuses.</p>
    <div class="fuel-components">${profile.components.map((component) => `<div title="${formatFuelUnits(component.units)} of ${formatFuelUnits(component.maxUnits)} fuel units">
      <span>${component.icon}</span><p><b>${escapeHtml(component.label)}</b><small>${formatFuelUnits(component.amount)} collected</small></p><div class="mini-meter"><i style="width:${component.maxUnits ? component.units / component.maxUnits * 100 : 0}%"></i></div><strong>+${formatFuelUnits(component.units)}</strong>
    </div>`).join('')}</div>
    <h3 class="subheading">Engine output now</h3>
    <div class="fuel-output">${output.length ? output.map(({ icon, label }) => `<span><i>${icon}</i>${escapeHtml(label)}</span>`).join('') : '<p class="muted">The tank is filling, but it needs its first engine module before it can help production.</p>'}</div>
  </section>
  <section class="rail-section fuel-workshop">
    <div class="section-heading"><div><span class="eyebrow">Permanent coin-bought hardware</span><h2>Engine Room</h2></div><span class="count-pill">${profile.installed.length}/${FUEL_MODULES.length}</span></div>
    <div class="fuel-module-list">${FUEL_MODULES.map((module) => fuelModuleCard(state, profile, module)).join('')}</div>
  </section>`;
}

function fuelModuleCard(state, profile, module) {
  const status = getFuelModuleStatus(state, module, profile);
  const affordable = state.coins.gte(module.cost);
  const locked = status === 'locked';
  return `<article class="fuel-module fuel-module--${status}">
    <span class="fuel-module__motif">${module.motif}</span>
    <div><span class="eyebrow">${status === 'installed' ? 'Installed and humming' : locked ? `Tank requirement · ${module.unlockPercent}%` : 'Ready for installation'}</span><h3>${escapeHtml(module.name)}</h3><p>${escapeHtml(module.flavour)}</p><strong>${escapeHtml(module.effectLabel)}</strong></div>
    ${status === 'installed'
      ? '<span class="fuel-module__status">FITTED</span>'
      : `<button type="button" data-buy-fuel="${module.id}" ${locked || !affordable ? 'disabled' : ''}><span>${locked ? `${Math.max(0, module.unlockPercent - profile.percent).toFixed(1)}% fuel needed` : 'Install module'}</span><small>${format(module.cost)} coins</small></button>`}
  </article>`;
}

function describeFuelOutput(bonuses) {
  const items = [];
  if (bonuses.globalAdditive > 0) items.push({ icon: '↟', label: `+${percent(bonuses.globalAdditive)} global production` });
  if (bonuses.globalMultiplier > 1) items.push({ icon: '×', label: `×${bonuses.globalMultiplier.toFixed(2)} global production` });
  if (bonuses.priceDiscount > 0) items.push({ icon: '−', label: `${percent(bonuses.priceDiscount)} lower producer prices` });
  if (bonuses.flatClickMultiplier > 1) items.push({ icon: '↻', label: `×${bonuses.flatClickMultiplier.toFixed(2)} flat toss value` });
  if (bonuses.offlineHours > 0) items.push({ icon: '☾', label: `+${bonuses.offlineHours.toFixed(1)} offline hours` });
  if (bonuses.fusionMultiplier > 1) items.push({ icon: '⧉', label: `×${bonuses.fusionMultiplier.toFixed(2)} fusion strength` });
  if (bonuses.shinePayout > 1) items.push({ icon: '☀', label: `×${bonuses.shinePayout.toFixed(2)} Shine payouts` });
  return items;
}

function percent(value) {
  return `${(value * 100).toFixed(value * 100 < 10 ? 1 : 0)}%`;
}

function formatFuelUnits(value) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

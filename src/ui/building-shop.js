import { format, formatInteger } from '../core/numbers.js';
import { getAffordableAmount, getBulkCost, getEconomySnapshot, getPriceMultiplier } from '../core/economy.js';
import { MILESTONES } from '../data/building-upgrades.js';
import { purchaseProducer, getProducerVisibility } from '../systems/buildings.js';

const QUANTITIES = [1, 10, 25, 100, 'max'];

export function createBuildingShop(container, store, options = {}) {
  let visibleKey = '';
  const base = import.meta.env.BASE_URL;

  function renderStructure(force = false) {
    const visible = getProducerVisibility(store.state);
    const nextKey = visible.map(({ producer, teaser }) => `${producer.id}:${teaser}`).join('|');
    if (!force && nextKey === visibleKey) return;
    visibleKey = nextKey;
    container.innerHTML = visible.map(({ producer, teaser }) => teaser
      ? `<article class="producer-card producer-card--teaser" data-producer-card="${producer.id}">
          <div class="producer-card__art producer-card__art--${producer.artMode ?? 'cutout'}"><img src="${base}assets/producers/${producer.icon}" alt="" loading="lazy"></div>
          <div><span class="eyebrow">Next destination</span><h3>???</h3><p>A silhouette appears when lifetime earnings reach 25% of the fare.</p>
          <div class="teaser-meter"><span style="width:0" data-teaser-progress></span></div></div>
        </article>`
      : `<article class="producer-card" data-producer-card="${producer.id}">
          <div class="producer-card__art producer-card__art--${producer.artMode ?? 'cutout'}">
            <img src="${base}assets/producers/${producer.icon}" alt="${escapeHtml(producer.name)}" loading="lazy" decoding="async">
            <span class="producer-card__owned" data-owned>0</span>
          </div>
          <div class="producer-card__body">
            <header><div><span class="eyebrow">${escapeHtml(producer.kingdom)} · ${escapeHtml(producer.series)}</span><h3>${escapeHtml(producer.name)}</h3></div><span class="contribution" data-contribution>0%</span></header>
            <p class="producer-card__flavour">${escapeHtml(producer.description)}</p>
            <div class="rate-strip"><span><b data-each-rate>0</b>/sec each</span><span><b data-total-rate>0</b>/sec total</span></div>
            <div class="ownership-visual ownership-visual--${producer.artMode ?? 'cutout'}" data-ownership-visual role="img" aria-label="No ${escapeHtml(producer.name)} owned yet">
              <div class="ownership-visual__scene" aria-hidden="true">${Array.from({ length: 8 }, () => '<span class="ownership-visual__building" data-ownership-building><b data-ownership-group></b></span>').join('')}</div>
              <small data-ownership-scale>Empty plot · ready for the first arrival</small>
            </div>
            <div class="milestone"><div><span data-milestone-label>Next: 5</span><span data-milestone-count>0 / 5</span></div><div class="meter"><span data-milestone-progress></span></div></div>
            <div class="buy-row">${QUANTITIES.map((quantity) => `<button type="button" class="buy-button" data-buy="${quantity}" aria-label="Buy ${quantity === 'max' ? 'maximum' : quantity} ${escapeHtml(producer.name)}"><span>${quantity === 'max' ? 'MAX' : `×${quantity}`}</span><small data-buy-cost="${quantity}">—</small></button>`).join('')}</div>
            <details class="rate-breakdown"><summary>Why this rate?</summary><div data-breakdown></div></details>
          </div>
        </article>`).join('');
    for (const image of container.querySelectorAll('img')) {
      const card = image.closest('.producer-card');
      const revealDioramaArt = () => {
        if (!card || card.classList.contains('producer-card--teaser')) return;
        // The diorama reuses the card image only after its lazy image has loaded.
        // That keeps off-screen destination art lazy and lets the browser share one decode.
        card.style.setProperty('--ownership-art', `url("${image.currentSrc || image.src}")`);
        card.classList.add('has-ownership-art');
      };
      image.addEventListener('load', revealDioramaArt, { once: true });
      image.addEventListener('error', () => {
        image.closest('.producer-card__art')?.classList.add('is-fallback');
        card?.classList.add('has-art-fallback');
      }, { once: true });
      if (image.complete && image.naturalWidth > 0) revealDioramaArt();
    }
  }

  container.addEventListener('click', (event) => {
    const button = event.target.closest('[data-buy]');
    if (!button || button.disabled) return;
    const card = button.closest('[data-producer-card]');
    const requested = button.dataset.buy === 'max' ? 'max' : Number(button.dataset.buy);
    let result;
    store.mutate('producer-purchase', (state) => { result = purchaseProducer(state, card.dataset.producerCard, requested); });
    if (result.ok) {
      options.audio?.purchase();
      options.onPurchase?.(result, requested);
    } else options.onError?.(result.reason);
  });

  function update(state) {
    renderStructure();
    const now = Date.now();
    const snapshot = getEconomySnapshot(state, { now });
    const economyContext = {
      now,
      moonBonuses: snapshot.moonBonuses,
      fuelProfile: snapshot.fuelProfile,
      fuelBonuses: snapshot.fuelBonuses,
      upgradeBonuses: snapshot.upgradeBonuses,
    };
    for (const card of container.querySelectorAll('[data-producer-card]')) {
      const producerId = card.dataset.producerCard;
      const breakdown = snapshot.byId[producerId];
      if (!breakdown) continue;
      if (card.classList.contains('producer-card--teaser')) {
        const progress = Math.min(1, state.lifetimeCoins.div(breakdown.producer.baseCost).div(0.25).toNumber());
        card.querySelector('[data-teaser-progress]').style.width = `${progress * 100}%`;
        continue;
      }
      setText(card, '[data-owned]', formatInteger(breakdown.owned));
      updateOwnershipVisual(card, breakdown.owned, breakdown.producer.name);
      setText(card, '[data-contribution]', `${breakdown.contribution < 0.1 && breakdown.contribution > 0 ? '<0.1' : breakdown.contribution.toFixed(1)}%`);
      const rateDisplay = getProducerRateDisplay(snapshot, producerId);
      setText(card, '[data-each-rate]', rateDisplay.each);
      setText(card, '[data-total-rate]', rateDisplay.total);
      card.classList.toggle('is-disabled', breakdown.disabled);

      const nextMilestone = MILESTONES.find((milestone) => milestone > breakdown.owned);
      if (nextMilestone) {
        const previous = [...MILESTONES].reverse().find((milestone) => milestone <= breakdown.owned) ?? 0;
        const progress = (breakdown.owned - previous) / (nextMilestone - previous);
        setText(card, '[data-milestone-label]', `Next upgrade: ${nextMilestone}`);
        setText(card, '[data-milestone-count]', `${formatInteger(breakdown.owned)} / ${nextMilestone}`);
        card.querySelector('[data-milestone-progress]').style.width = `${Math.max(0, Math.min(1, progress)) * 100}%`;
      } else {
        setText(card, '[data-milestone-label]', 'Milestone chain complete');
        setText(card, '[data-milestone-count]', '1,000 mastered');
        card.querySelector('[data-milestone-progress]').style.width = '100%';
      }

      const priceMultiplier = getPriceMultiplier(state, producerId, economyContext);
      for (const button of card.querySelectorAll('[data-buy]')) {
        const requested = button.dataset.buy;
        const quantity = requested === 'max'
          ? getAffordableAmount(state, producerId, state.coins, 1_000_000, economyContext)
          : Number(requested);
        const cost = quantity > 0 ? getBulkCost(producerId, breakdown.owned, quantity, { priceMultiplier }) : getBulkCost(producerId, breakdown.owned, 1, { priceMultiplier });
        button.disabled = requested === 'max' ? quantity < 1 : state.coins.lt(cost);
        button.classList.toggle('is-affordable', !button.disabled);
        button.querySelector('span').textContent = requested === 'max' ? `MAX${quantity ? ` (${formatInteger(quantity)})` : ''}` : `×${requested}`;
        button.querySelector('small').textContent = format(cost);
      }
      card.classList.toggle('is-affordable', !card.querySelector('[data-buy="1"]').disabled);
      const detail = card.querySelector('[data-breakdown]');
      detail.innerHTML = `<span>${format(breakdown.basePerUnit)} base</span><span>×${format(breakdown.localMultiplier)} local</span><span>×${breakdown.additiveMultiplier.toFixed(3)} badges</span><span>×${Number(breakdown.globalMultiplier).toFixed(2)} Moons</span><span>×${Number(breakdown.producerMultiplier).toFixed(2)} fusion</span><span>×${Number(breakdown.temporaryMultiplier).toFixed(2)} event</span><strong>= ${format(breakdown.effectivePerUnit)}/sec each</strong>`;
    }
  }

  renderStructure(true);
  return { update, renderStructure };
}

export function getProducerRateDisplay(snapshot, producerId) {
  const breakdown = snapshot.byId[producerId];
  return breakdown
    ? { each: format(breakdown.effectivePerUnit), total: format(breakdown.effectiveTotal) }
    : { each: '0', total: '0' };
}

function setText(root, selector, value) {
  const node = root.querySelector(selector);
  if (node) node.textContent = value;
}

function updateOwnershipVisual(card, owned, producerName) {
  const visual = card.querySelector('[data-ownership-visual]');
  if (!visual) return;
  const diorama = getOwnershipDiorama(owned);
  const nextKey = diorama.groups.join(',');
  if (visual.dataset.ownershipKey !== nextKey) {
    visual.dataset.ownershipKey = nextKey;
    const buildings = [...visual.querySelectorAll('[data-ownership-building]')];
    buildings.forEach((building, index) => {
      const represented = diorama.groups[index] ?? 0;
      const visible = represented > 0;
      building.classList.toggle('is-visible', visible);
      building.classList.toggle('is-grouped', represented > 1);
      building.dataset.stack = represented >= 100 ? 'tower' : represented >= 10 ? 'block' : represented > 1 ? 'pair' : 'single';
      const group = building.querySelector('[data-ownership-group]');
      if (group) group.textContent = represented > 1 ? `×${formatGroupCount(represented)}` : '';
    });
    visual.classList.toggle('has-buildings', diorama.groups.length > 0);
  }
  const scale = visual.querySelector('[data-ownership-scale]');
  if (scale) scale.textContent = diorama.caption;
  visual.setAttribute('aria-label', diorama.total > 0
    ? `${formatInteger(diorama.total)} ${producerName} owned. ${diorama.accessibleScale}`
    : `No ${producerName} owned yet. Empty plot.`);
}

export function getOwnershipDiorama(owned, slotCount = 8) {
  const total = Math.max(0, Math.floor(Number(owned) || 0));
  const availableSlots = Math.max(1, Math.floor(Number(slotCount) || 1));
  if (total === 0) return {
    total,
    groups: [],
    caption: 'Empty plot · ready for the first arrival',
    accessibleScale: 'Empty plot.',
  };

  const visible = Math.min(total, availableSlots);
  const perPlot = Math.floor(total / visible);
  const remainder = total % visible;
  const groups = Array.from({ length: visible }, (_, index) => perPlot + (index < remainder ? 1 : 0));
  if (total <= availableSlots) return {
    total,
    groups,
    caption: `${formatInteger(total)} individual ${total === 1 ? 'site' : 'sites'}`,
    accessibleScale: `The diorama shows all ${formatInteger(total)} individually.`,
  };

  const smallest = groups[groups.length - 1];
  const largest = groups[0];
  const range = smallest === largest
    ? `${formatInteger(smallest)} each`
    : `${formatInteger(smallest)}–${formatInteger(largest)} each`;
  return {
    total,
    groups,
    caption: `${visible} little districts · ${range}`,
    accessibleScale: `The diorama has ${visible} districts representing ${range}.`,
  };
}

function formatGroupCount(value) {
  if (value < 1_000) return formatInteger(value);
  const groups = [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ];
  const [divisor, suffix] = groups.find(([threshold]) => value >= threshold) ?? [1, ''];
  const scaled = value / divisor;
  return `${Number(scaled.toFixed(scaled < 10 ? 1 : 0))}${suffix}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

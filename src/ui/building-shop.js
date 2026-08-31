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
          <div class="producer-card__art"><img src="${base}assets/producers/${producer.icon}" alt="" loading="lazy"></div>
          <div><span class="eyebrow">Next destination</span><h3>???</h3><p>A silhouette appears when lifetime earnings reach 25% of the fare.</p>
          <div class="teaser-meter"><span style="width:0" data-teaser-progress></span></div></div>
        </article>`
      : `<article class="producer-card" data-producer-card="${producer.id}">
          <div class="producer-card__art">
            <img src="${base}assets/producers/${producer.icon}" alt="${escapeHtml(producer.name)}" loading="lazy" decoding="async">
            <span class="producer-card__owned" data-owned>0</span>
          </div>
          <div class="producer-card__body">
            <header><div><span class="eyebrow">${escapeHtml(producer.kingdom)} Kingdom</span><h3>${escapeHtml(producer.name)}</h3></div><span class="contribution" data-contribution>0%</span></header>
            <p class="producer-card__flavour">${escapeHtml(producer.description)}</p>
            <div class="rate-strip"><span><b data-each-rate>0</b>/sec each</span><span><b data-total-rate>0</b>/sec total</span></div>
            <div class="milestone"><div><span data-milestone-label>Next: 5</span><span data-milestone-count>0 / 5</span></div><div class="meter"><span data-milestone-progress></span></div></div>
            <div class="buy-row">${QUANTITIES.map((quantity) => `<button type="button" class="buy-button" data-buy="${quantity}" aria-label="Buy ${quantity === 'max' ? 'maximum' : quantity} ${escapeHtml(producer.name)}"><span>${quantity === 'max' ? 'MAX' : `×${quantity}`}</span><small data-buy-cost="${quantity}">—</small></button>`).join('')}</div>
            <details class="rate-breakdown"><summary>Why this rate?</summary><div data-breakdown></div></details>
          </div>
        </article>`).join('');
    for (const image of container.querySelectorAll('img')) image.addEventListener('error', () => image.closest('.producer-card__art')?.classList.add('is-fallback'), { once: true });
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
        setText(card, '[data-milestone-count]', '200+');
        card.querySelector('[data-milestone-progress]').style.width = '100%';
      }

      const priceMultiplier = getPriceMultiplier(state, producerId, { now });
      for (const button of card.querySelectorAll('[data-buy]')) {
        const requested = button.dataset.buy;
        const quantity = requested === 'max'
          ? getAffordableAmount(state, producerId, state.coins, 1_000_000, { now })
          : Number(requested);
        const cost = quantity > 0 ? getBulkCost(producerId, breakdown.owned, quantity, { priceMultiplier }) : getBulkCost(producerId, breakdown.owned, 1, { priceMultiplier });
        button.disabled = requested === 'max' ? quantity < 1 : state.coins.lt(cost);
        button.classList.toggle('is-affordable', !button.disabled);
        button.querySelector('span').textContent = requested === 'max' ? `MAX${quantity ? ` (${formatInteger(quantity)})` : ''}` : `×${requested}`;
        button.querySelector('small').textContent = format(cost);
      }
      card.classList.toggle('is-affordable', !card.querySelector('[data-buy="1"]').disabled);
      const detail = card.querySelector('[data-breakdown]');
      detail.innerHTML = `<span>${format(breakdown.basePerUnit)} base</span><span>×${format(breakdown.localMultiplier)} upgrades</span><span>×${breakdown.additiveMultiplier.toFixed(3)} global</span><span>×${Number(breakdown.producerMultiplier).toFixed(2)} special</span><span>×${Number(breakdown.temporaryMultiplier).toFixed(2)} event</span><strong>= ${format(breakdown.effectivePerUnit)}/sec each</strong>`;
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

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

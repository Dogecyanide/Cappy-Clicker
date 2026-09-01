import { format } from '../core/numbers.js';
import { getFuelProfile } from '../systems/fuel.js';

export function createFlightDeck(element, store, options = {}) {
  const now = options.now ?? Date.now;
  let receiptExpiresAt = 0;
  const fuel = {
    liquid: element.querySelector('[data-fuel-depth-liquid]'),
    gauge: element.querySelector('[data-fuel-depth]'),
    percent: element.querySelector('[data-fuel-percent]'),
    units: element.querySelector('[data-fuel-units]'),
    grade: element.querySelector('[data-fuel-grade]'),
    next: element.querySelector('[data-fuel-next]'),
  };
  const receipt = {
    root: element.querySelector('[data-shine-receipt]'),
    icon: element.querySelector('[data-shine-receipt-icon]'),
    kicker: element.querySelector('[data-shine-receipt-kicker]'),
    title: element.querySelector('[data-shine-receipt-title]'),
    reward: element.querySelector('[data-shine-receipt-reward]'),
    description: element.querySelector('[data-shine-receipt-description]'),
  };

  element.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-fuel-tab]')) options.onOpenFuel?.();
  });

  function update(state, suppliedProfile = null) {
    const profile = suppliedProfile ?? getFuelProfile(state);
    const percent = Math.max(0, Math.min(100, profile.percent));
    fuel.liquid.style.height = `${percent}%`;
    fuel.gauge.setAttribute('aria-valuenow', String(Math.round(percent)));
    fuel.gauge.setAttribute('aria-valuetext', `${percent.toFixed(1)} percent, ${profile.tier.name}`);
    fuel.percent.textContent = `${percent.toFixed(1)}%`;
    fuel.units.textContent = `${formatFuelUnits(profile.units)} / ${formatFuelUnits(profile.capacity)} units`;
    fuel.grade.textContent = profile.tier.name;
    fuel.next.textContent = profile.nextTier
      ? `${Math.max(0, profile.nextTier.at - percent).toFixed(1)}% to ${profile.nextTier.name}`
      : 'Final fuel grade reached';
    if (receiptExpiresAt && now() >= receiptExpiresAt) {
      receiptExpiresAt = 0;
      receipt.root.hidden = true;
    }
  }

  function showShineReceipt(result) {
    const detail = describeShineReceipt(result);
    receiptExpiresAt = getShineReceiptDeadline(result, now());
    receipt.root.hidden = false;
    receipt.root.dataset.tone = detail.tone;
    receipt.root.classList.remove('is-new');
    void receipt.root.offsetWidth;
    receipt.root.classList.add('is-new');
    receipt.icon.textContent = detail.icon;
    receipt.kicker.textContent = detail.kicker;
    receipt.title.textContent = detail.title;
    receipt.reward.textContent = detail.reward;
    receipt.description.textContent = detail.description;
  }

  receipt.root.hidden = true;
  update(store.state);
  return { update, showShineReceipt };
}

export function describeShineReceipt(result) {
  const corrupted = result.kind === 'corrupted';
  const temptation = corrupted && result.beneficial;
  return {
    tone: temptation ? 'gloom-prize' : corrupted ? 'gloom' : 'shine',
    icon: temptation ? '✦' : corrupted ? '◉' : '☀',
    kicker: temptation ? 'Gloom Shine miracle' : corrupted ? 'Gloom Shine receipt' : 'Rare Shine receipt',
    title: result.outcome.title,
    reward: describeOutcomeValue(result),
    description: result.outcome.description,
  };
}

export function getShineReceiptDeadline(result, now = Date.now()) {
  const appliedAt = Number(result.claimedAt ?? now);
  const suppliedDeadline = Number(result.receiptExpiresAt ?? 0);
  if (Number.isFinite(suppliedDeadline) && suppliedDeadline > appliedAt) return suppliedDeadline;
  const duration = Number(result.outcome?.effect?.duration ?? 0);
  return duration > 0 ? appliedAt + duration * 1_000 : appliedAt + 5_000;
}

function describeOutcomeValue(result) {
  if (result.amount !== '0') return `+${format(result.amount)} Kingdom Coins`;
  if (result.loss !== '0') {
    const protectedLine = result.prevented && result.prevented !== '0' ? ` · ${format(result.prevented)} protected` : '';
    return `−${format(result.loss)} Kingdom Coins${protectedLine}`;
  }
  const effect = result.outcome.effect;
  if (effect.type === 'coin-loss') {
    const protectedLine = result.prevented && result.prevented !== '0' ? ` · ${format(result.prevented)} protected` : '';
    return `No coins stolen${protectedLine}`;
  }
  const duration = Number(effect.duration ?? 0);
  if (effect.type === 'production-multiplier') return `Production ×${effect.multiplier} for ${duration}s`;
  if (effect.type === 'price-multiplier') return `Producer prices −${Math.round((1 - effect.multiplier) * 100)}% for ${duration}s`;
  if (effect.type === 'click-multiplier') return `Cappy value ×${effect.multiplier} for ${duration}s`;
  if (effect.type === 'global-additive') return `Global production +${Math.round(effect.amount * 100)}% for ${duration}s`;
  if (effect.type === 'strongest-producer-disabled') return `Strongest route disabled for ${duration}s`;
  return duration ? `Temporary effect for ${duration}s` : 'Effect applied';
}

function formatFuelUnits(value) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });
}

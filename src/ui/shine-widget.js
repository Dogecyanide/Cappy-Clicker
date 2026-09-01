import { format } from '../core/numbers.js';
import { GLOOM_TEMPTATION_CHANCE } from '../data/shine-outcomes.js';
import { claimShine } from '../systems/shines.js';

export function createShineWidget(element, store, options = {}) {
  const base = import.meta.env.BASE_URL;
  const random = options.random ?? Math.random;
  let renderedKey = '';

  element.addEventListener('click', () => {
    let result;
    store.mutate('shine-claim', (state) => { result = claimShine(state); });
    if (!result?.ok) return;
    options.onClaim?.(result);
    if (result.kind === 'corrupted' && !result.beneficial) options.audio?.boo(true);
    else options.audio?.shine();
  });

  function update(state) {
    const now = Date.now();
    const visible = state.shine.visibleUntil > now;
    element.classList.toggle('is-visible', visible);
    element.setAttribute('aria-hidden', String(!visible));
    if (!visible) return;
    const key = `${state.shine.spawnedAt}:${state.shine.kind}`;
    if (key !== renderedKey) {
      renderedKey = key;
      const position = randomShinePosition(random);
      element.style.setProperty('--shine-left', `${position.leftVw}vw`);
      element.style.setProperty('--shine-top', `${position.topVh}vh`);
      const corrupted = state.shine.kind === 'corrupted';
      const temptationPercent = Math.round(GLOOM_TEMPTATION_CHANCE * 100);
      element.innerHTML = `<button type="button" class="shine-target ${corrupted ? 'is-corrupted' : ''}" aria-label="${corrupted ? `Catch the risky Gloom Shine; ${temptationPercent} percent jackpot chance` : 'Catch the rare Shine'}"><img src="${base}assets/shines/${corrupted ? 'gloom-shine.webp' : 'shine-sprite.webp'}" alt=""><span>${corrupted ? `GLOOM? · ${temptationPercent}% JACKPOT` : 'RARE SHINE!'}</span><small data-shine-time></small></button>`;
    }
    const remaining = Math.max(0, (state.shine.visibleUntil - now) / 1000);
    const timer = element.querySelector('[data-shine-time]');
    if (timer) timer.textContent = `${format(remaining, 2)}s`;
  }

  return { update };
}

export function randomShinePosition(random = Math.random) {
  const unit = () => Math.max(0, Math.min(1, Number(random()) || 0));
  return {
    leftVw: Number((3 + unit() * 90).toFixed(3)),
    topVh: Number((3 + unit() * 90).toFixed(3)),
  };
}

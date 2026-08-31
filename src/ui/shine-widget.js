import { format } from '../core/numbers.js';
import { claimShine } from '../systems/shines.js';

export function createShineWidget(element, store, options = {}) {
  const base = import.meta.env.BASE_URL;
  let renderedKey = '';

  element.addEventListener('click', () => {
    let result;
    store.mutate('shine-claim', (state) => { result = claimShine(state); });
    if (!result?.ok) return;
    options.onClaim?.(result);
    if (result.kind === 'corrupted') options.audio?.boo(true);
    else options.audio?.moon();
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
      const corrupted = state.shine.kind === 'corrupted';
      element.innerHTML = `<button type="button" class="shine-target ${corrupted ? 'is-corrupted' : ''}" aria-label="${corrupted ? 'Catch the suspicious Gloom Shine' : 'Catch the rare Shine'}"><img src="${base}assets/shines/${corrupted ? 'gloom-shine.webp' : 'shine-sprite.webp'}" alt=""><span>${corrupted ? 'GLOOM?' : 'RARE SHINE!'}</span><small data-shine-time></small></button>`;
    }
    const remaining = Math.max(0, (state.shine.visibleUntil - now) / 1000);
    const timer = element.querySelector('[data-shine-time]');
    if (timer) timer.textContent = `${format(remaining, 2)}s`;
  }

  return { update };
}

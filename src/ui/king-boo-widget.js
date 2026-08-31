import { format } from '../core/numbers.js';
import { BOO_OUTCOME_BY_ID } from '../data/boo-outcomes.js';
import { commitBooSpin } from '../systems/king-boo.js';

const SYMBOLS = { coin: '🪙', crown: '♛', cap: '🧢', banana: '🍌', boo: '👻', onion: '🧅', shell: '🐚', nothing: '·' };

export function createKingBooWidget(element, store, options = {}) {
  let renderedSpinId = '';
  const base = import.meta.env.BASE_URL;

  element.addEventListener('click', (event) => {
    if (event.target.closest('[data-spin-boo]')) {
      let spin;
      store.mutate('boo-commit', (state) => { spin = commitBooSpin(state); });
      if (spin) {
        renderedSpinId = '';
        options.onCommit?.(spin);
        options.audio?.boo(false);
      }
    }
    if (event.target.closest('[data-dismiss-boo-result]')) {
      store.mutate('boo-dismiss', (state) => {
        if (state.boo.committedSpin?.applied) {
          state.boo.visibleUntil = 0;
          state.boo.committedSpin = null;
          state.boo.nextSpawnAt = Date.now() + 4 * 60 * 1000;
        }
      });
    }
  });

  function update(state) {
    const now = Date.now();
    const spin = state.boo.committedSpin;
    const visible = state.boo.visibleUntil > now || Boolean(spin);
    element.classList.toggle('is-visible', visible);
    element.setAttribute('aria-hidden', String(!visible));
    if (!visible) return;

    if (!spin) {
      const remaining = Math.max(0, (state.boo.visibleUntil - now) / 1000);
      element.innerHTML = `<div class="boo-invite"><img src="${base}assets/boo/king-boo.webp" alt="King Boo"><div><span class="eyebrow">Unlicensed casino sighting</span><h2>King Boo's Bonus</h2><p>Risk it, or ignore him with no penalty.</p><button type="button" data-spin-boo>Spin the machine</button><div class="boo-countdown"><span style="width:${remaining * 10}%"></span></div><small>Leaves in ${remaining.toFixed(1)}s</small></div></div>`;
      return;
    }

    const outcome = BOO_OUTCOME_BY_ID[spin.outcomeId];
    const spinKey = `${spin.committedAt}:${spin.applied}`;
    if (spinKey !== renderedSpinId) {
      renderedSpinId = spinKey;
      const classes = spin.applied ? `boo-machine is-result boo-machine--${outcome.tier}` : 'boo-machine is-spinning';
      element.innerHTML = `<div class="${classes}"><div class="boo-machine__header"><img src="${base}assets/boo/king-boo.webp" alt=""><div><span class="eyebrow">Result committed</span><h2>${spin.applied ? escapeHtml(outcome.title) : 'Reels in motion…'}</h2></div></div>
        <div class="slot-reels" aria-label="${outcome.symbols.join(', ')}">${outcome.symbols.map((symbol, index) => `<div class="slot-reel slot-reel--${index + 1}"><span>${SYMBOLS[symbol] ?? '?'}</span></div>`).join('')}</div>
        <div class="boo-result">${spin.applied ? `<p>${escapeHtml(outcome.description)}</p>${receipt(spin)}<button type="button" data-dismiss-boo-result>Fold receipt</button>` : `<p>The outcome is locked. Reloading will not change it.</p><div class="slot-progress"><span></span></div>`}</div></div>`;
    } else if (!spin.applied) {
      const progress = Math.max(0, Math.min(1, 1 - (spin.revealAt - now) / 3_200));
      const bar = element.querySelector('.slot-progress span');
      if (bar) bar.style.width = `${progress * 100}%`;
    }
  }

  return { update };
}

function receipt(spin) {
  if (spin.payout !== '0') return `<div class="boo-result__receipt"><span>Casino payout</span><strong>+${format(spin.payout)} coins</strong></div>`;
  if (spin.loss !== '0') return `<div class="boo-result__receipt"><span>Casino charge</span><strong>−${format(spin.loss)} coins</strong></div>`;
  return '<div class="boo-result__receipt"><span>Coin movement</span><strong>Absolutely none</strong></div>';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}


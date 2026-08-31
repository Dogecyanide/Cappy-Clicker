import { format } from '../core/numbers.js';
import { getClickValue } from '../core/economy.js';
import { performCappyClick } from '../systems/clicking.js';
import { createParticleCanvas } from '../visuals/particles.js';

export function createCappyStage(element, store, options = {}) {
  const button = element.querySelector('[data-cappy-button]');
  const canvas = element.querySelector('[data-particle-canvas]');
  const feedbackLayer = element.querySelector('[data-click-feedback]');
  const combo = element.querySelector('[data-combo]');
  const clickValue = element.querySelector('[data-click-value]');
  const particles = createParticleCanvas(canvas, () => store.state.settings.reducedMotion ? 'potato' : store.state.settings.performance);
  const feedbackPool = [];
  let feedbackCursor = 0;

  for (let index = 0; index < 12; index += 1) {
    const node = document.createElement('span');
    node.className = 'click-pop';
    feedbackLayer.append(node);
    feedbackPool.push(node);
  }

  function click(event) {
    let result;
    store.mutate('cappy-click', (state) => {
      result = performCappyClick(state);
    });
    const bounds = canvas.getBoundingClientRect();
    const x = event?.clientX ? event.clientX - bounds.left : bounds.width / 2;
    const y = event?.clientY ? event.clientY - bounds.top : bounds.height / 2;
    particles.burst(x, y, result.critical);
    button.classList.remove('is-tossing', 'is-critical');
    void button.offsetWidth;
    button.classList.add(result.critical ? 'is-critical' : 'is-tossing');
    showFeedback(result, x, y);
    options.audio?.click(result.critical);
    options.onClick?.(result);
  }

  function showFeedback(result, x, y) {
    const node = feedbackPool[feedbackCursor % feedbackPool.length];
    feedbackCursor += 1;
    node.className = `click-pop ${result.critical ? 'click-pop--critical' : ''}`;
    node.textContent = `${result.critical ? 'CRITICAL! +' : '+'}${format(result.amount)}`;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    void node.offsetWidth;
    node.classList.add('is-active');
  }

  button.addEventListener('click', click);
  button.addEventListener('animationend', () => button.classList.remove('is-tossing', 'is-critical'));
  element.addEventListener('pointermove', (event) => {
    const bounds = element.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
    button.style.setProperty('--look-x', `${x * 5}px`);
    button.style.setProperty('--look-y', `${y * 3}px`);
  });

  window.addEventListener('keydown', (event) => {
    if (event.code !== 'Space' || event.repeat || isInteractive(event.target) || document.querySelector('dialog[open]')) return;
    event.preventDefault();
    click();
  });

  function update(state) {
    const comboActive = Date.now() - state.combo.lastClickAt <= 700;
    combo.textContent = comboActive && state.combo.count > 1 ? `${state.combo.count}× toss combo` : 'Build a toss combo';
    combo.classList.toggle('is-hot', comboActive && state.combo.count >= 10);
    clickValue.textContent = `${format(getClickValue(state))} coins / toss`;
  }

  return { update, click, destroy: particles.destroy };
}

function isInteractive(target) {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement || target?.isContentEditable
    || Boolean(target?.closest?.('button, a, summary, [role="button"], [role="tab"]'));
}

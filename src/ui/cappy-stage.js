import { format } from '../core/numbers.js';
import { getClickValue } from '../core/economy.js';
import { performCappyClick } from '../systems/clicking.js';
import { createParticleCanvas } from '../visuals/particles.js';

export const CLICK_RENDER_INTERVAL = 50;

export function createCappyStage(element, store, options = {}) {
  const button = element.querySelector('[data-cappy-button]');
  const canvas = element.querySelector('[data-particle-canvas]');
  const feedbackLayer = element.querySelector('[data-click-feedback]');
  const combo = element.querySelector('[data-combo]');
  const clickValue = element.querySelector('[data-click-value]');
  const particles = createParticleCanvas(canvas, () => store.state.settings.reducedMotion ? 'potato' : store.state.settings.performance);
  const feedbackPool = [];
  let feedbackCursor = 0;
  let canvasBounds = null;
  let stageBounds = null;
  let pendingLook = null;
  let lookFrame = 0;
  let commitTimer = 0;
  let pendingResult = null;
  let lastCommitAt = -Infinity;
  let destroyed = false;
  const now = options.now ?? globalThis.performance?.now?.bind(globalThis.performance) ?? Date.now;
  const schedule = options.setTimeout ?? globalThis.setTimeout?.bind(globalThis) ?? ((callback) => { callback(); return 0; });
  const cancelSchedule = options.clearTimeout ?? globalThis.clearTimeout?.bind(globalThis) ?? (() => {});
  const requestFrame = options.requestAnimationFrame ?? globalThis.requestAnimationFrame?.bind(globalThis)
    ?? ((callback) => schedule(() => callback(now()), 16));
  const cancelFrame = options.cancelAnimationFrame ?? globalThis.cancelAnimationFrame?.bind(globalThis) ?? cancelSchedule;

  for (let index = 0; index < 12; index += 1) {
    const node = document.createElement('span');
    node.className = 'click-pop';
    node.addEventListener('animationend', (event) => {
      if (event.animationName === node.dataset.animationName) node.className = 'click-pop';
    });
    feedbackLayer.append(node);
    feedbackPool.push(node);
  }

  function click(event) {
    const result = performCappyClick(store.state);
    queueCommit(result);
    const bounds = canvasBounds ??= canvas.getBoundingClientRect();
    const hasPointer = Number.isFinite(event?.clientX) && Number.isFinite(event?.clientY);
    const x = hasPointer ? event.clientX - bounds.left : bounds.width / 2;
    const y = hasPointer ? event.clientY - bounds.top : bounds.height / 2;
    particles.burst(x, y, result.critical);
    animateButton(result.critical);
    showFeedback(result, x, y);
    options.audio?.click(result.critical);
    return result;
  }

  function queueCommit(result) {
    pendingResult = result;
    const remaining = CLICK_RENDER_INTERVAL - (now() - lastCommitAt);
    if (remaining <= 0 && !commitTimer) {
      flushCommit();
      return;
    }
    if (!commitTimer) commitTimer = schedule(flushCommit, Math.max(0, remaining));
  }

  function flushCommit() {
    if (destroyed || !pendingResult) return;
    commitTimer = 0;
    const result = pendingResult;
    pendingResult = null;
    // Click math happens synchronously for every input. Only the expensive whole-game
    // DOM refresh and achievement scan are capped at 20 Hz.
    store.notify('cappy-click');
    options.onClick?.(result);
    // Measure the quiet period from the end of the expensive refresh. A slow refresh
    // must not make the very next synthetic click eligible to trigger another one.
    lastCommitAt = now();
    beginCooldown();
  }

  function beginCooldown() {
    if (destroyed || commitTimer) return;
    commitTimer = schedule(() => {
      commitTimer = 0;
      if (pendingResult) flushCommit();
    }, CLICK_RENDER_INTERVAL);
  }

  function animateButton(critical) {
    if (critical) {
      if (button.classList.contains('is-critical')) return;
      button.classList.remove('is-tossing');
      button.classList.add('is-critical');
      return;
    }
    if (!button.classList.contains('is-tossing') && !button.classList.contains('is-critical')) {
      button.classList.add('is-tossing');
    }
  }

  function showFeedback(result, x, y) {
    const node = feedbackPool[feedbackCursor % feedbackPool.length];
    feedbackCursor += 1;
    const cycle = node.dataset.cycle === 'a' ? 'b' : 'a';
    const animationName = `click-pop-${cycle}`;
    node.dataset.cycle = cycle;
    node.dataset.animationName = animationName;
    node.textContent = `+${format(result.amount)}`;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.className = `click-pop is-active click-pop--${cycle}${result.critical ? ' is-critical-value' : ''}`;
  }

  function invalidateBounds() {
    canvasBounds = null;
    stageBounds = null;
  }

  button.addEventListener('click', click);
  const animationEnded = (event) => {
    if (event.target === button) button.classList.remove('is-tossing', 'is-critical');
  };
  button.addEventListener('animationend', animationEnded);
  const pointerMoved = (event) => {
    pendingLook = { x: event.clientX, y: event.clientY };
    if (lookFrame) return;
    lookFrame = requestFrame(() => {
      lookFrame = 0;
      if (!pendingLook || destroyed) return;
      const bounds = stageBounds ??= element.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (pendingLook.x - bounds.left) / bounds.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (pendingLook.y - bounds.top) / bounds.height * 2 - 1));
      button.style.setProperty('--look-x', `${x * 5}px`);
      button.style.setProperty('--look-y', `${y * 3}px`);
      pendingLook = null;
    });
  };
  element.addEventListener('pointermove', pointerMoved, { passive: true });
  window.addEventListener('resize', invalidateBounds, { passive: true });
  window.addEventListener('scroll', invalidateBounds, { passive: true, capture: true });

  const keyPressed = (event) => {
    if (event.code !== 'Space' || event.repeat || isInteractive(event.target) || document.querySelector('dialog[open]')) return;
    event.preventDefault();
    click();
  };
  window.addEventListener('keydown', keyPressed);

  function update(state) {
    const comboActive = Date.now() - state.combo.lastClickAt <= 700;
    combo.textContent = comboActive && state.combo.count > 1 ? `${state.combo.count}× toss combo` : 'Build a toss combo';
    combo.classList.toggle('is-hot', comboActive && state.combo.count >= 10);
    clickValue.textContent = `${format(getClickValue(state))} coins / toss`;
  }

  function destroy() {
    destroyed = true;
    if (commitTimer) cancelSchedule(commitTimer);
    if (lookFrame) cancelFrame(lookFrame);
    particles.destroy();
    button.removeEventListener('click', click);
    button.removeEventListener('animationend', animationEnded);
    element.removeEventListener('pointermove', pointerMoved);
    window.removeEventListener('resize', invalidateBounds);
    window.removeEventListener('scroll', invalidateBounds, true);
    window.removeEventListener('keydown', keyPressed);
  }

  return { update, click, destroy };
}

function isInteractive(target) {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement || target?.isContentEditable
    || Boolean(target?.closest?.('button, a, summary, [role="button"], [role="tab"]'));
}

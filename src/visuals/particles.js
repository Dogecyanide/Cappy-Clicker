export function createParticleCanvas(canvas, getMode = () => 'full') {
  const context = canvas.getContext('2d');
  const particles = [];
  let running = true;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let frameId = 0;

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.max(1, Math.round(width * pixelRatio));
    canvas.height = Math.max(1, Math.round(height * pixelRatio));
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function burst(x, y, critical = false) {
    const mode = getMode();
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const count = mode === 'potato' ? 2 : mode === 'reduced' ? (critical ? 7 : 5) : critical ? 16 : 10;
    const cap = mode === 'potato' ? 6 : mode === 'reduced' ? 28 : 64;
    for (let index = 0; index < count && particles.length < cap; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (critical ? 140 : 90) + Math.random() * (critical ? 210 : 120);
      particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 60,
        life: 0.55 + Math.random() * 0.5, age: 0, size: critical ? 5 + Math.random() * 6 : 3 + Math.random() * 5,
        color: critical ? ['#fff4a8', '#ffd42a', '#ff6a55'][index % 3] : ['#ffd42a', '#fff1a3', '#f5a11a'][index % 3],
      });
    }
    schedule();
  }

  let previous = performance.now();
  function frame(now) {
    frameId = 0;
    const elapsed = Math.min(0.04, (now - previous) / 1000);
    previous = now;
    context.clearRect(0, 0, width, height);
    if (!document.hidden && running) {
      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.age += elapsed;
        if (particle.age >= particle.life) { particles.splice(index, 1); continue; }
        particle.vy += 260 * elapsed;
        particle.x += particle.vx * elapsed;
        particle.y += particle.vy * elapsed;
        const alpha = 1 - particle.age / particle.life;
        context.globalAlpha = alpha;
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size * alpha + 1, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    }
    if (particles.length) schedule();
  }

  function schedule() {
    if (running && particles.length && !document.hidden && !frameId) {
      previous = performance.now();
      frameId = requestAnimationFrame(frame);
    }
  }

  function visibilityChanged() {
    if (document.hidden && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
      return;
    }
    previous = performance.now();
    schedule();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  document.addEventListener('visibilitychange', visibilityChanged);
  resize();

  return {
    burst,
    get activeCount() { return particles.length; },
    get isAnimating() { return Boolean(frameId); },
    destroy() { running = false; particles.length = 0; observer.disconnect(); document.removeEventListener('visibilitychange', visibilityChanged); if (frameId) cancelAnimationFrame(frameId); },
  };
}

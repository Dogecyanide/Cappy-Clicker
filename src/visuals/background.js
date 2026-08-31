import { PRODUCERS } from '../data/buildings.js';

const SCENES = [
  { id: 'cascade', label: 'Cascade foothills', file: 'cascade.webp' },
  { id: 'wooded', label: 'Steam Gardens', file: 'wooded.webp' },
  { id: 'metro', label: 'New Donk skyline', file: 'metro.webp' },
  { id: 'luncheon', label: 'Volbono sunset', file: 'luncheon.webp' },
  { id: 'snow', label: 'Moonbound snowscape', file: 'snow.webp' },
];

export function createKingdomBackground(element, journey, store) {
  let sceneId = '';
  const base = import.meta.env.BASE_URL;
  journey.innerHTML = `<div class="journey-track"><img class="journey-odyssey" src="${base}assets/misc/odyssey-ship.webp" alt="The Odyssey"><div class="journey-stops">${PRODUCERS.map((producer, index) => `<div class="journey-stop" data-journey-stop="${producer.id}" title="${producer.name}"><span>${index + 1}</span><img src="${base}assets/producers/${producer.icon}" alt="" loading="lazy"></div>`).join('')}</div></div>`;

  function update(state) {
    const highest = Math.max(0, ...state.discoveredProducers.map((id) => PRODUCERS.findIndex((producer) => producer.id === id)));
    const scene = SCENES[Math.min(SCENES.length - 1, Math.floor(highest / 4))];
    if (scene.id !== sceneId) {
      sceneId = scene.id;
      element.classList.add('is-changing');
      window.setTimeout(() => {
        element.style.setProperty('--kingdom-image', `url("${base}assets/kingdoms/${scene.file}")`);
        element.dataset.scene = scene.id;
        element.setAttribute('aria-label', scene.label);
        element.classList.remove('is-changing');
      }, 180);
      if (!state.stats.backdropsSeen.includes(scene.id)) state.stats.backdropsSeen.push(scene.id);
    }
    for (const stop of journey.querySelectorAll('[data-journey-stop]')) {
      stop.classList.toggle('is-discovered', state.discoveredProducers.includes(stop.dataset.journeyStop));
      const index = PRODUCERS.findIndex(({ id }) => id === stop.dataset.journeyStop);
      stop.classList.toggle('is-current', index === highest);
    }
    journey.style.setProperty('--journey-progress', `${(highest / (PRODUCERS.length - 1)) * 100}%`);
  }

  update(store.state);
  return { update };
}


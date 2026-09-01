import { PRODUCERS } from '../data/buildings.js';
import { COSMETIC_BY_ID, DEFAULT_EQUIPPED_COSMETICS } from '../data/cosmetics.js';

export const JOURNEY_SCENES = [
  { id: 'cascade', label: 'Cascade foothills', file: 'cascade.webp' },
  { id: 'sand', label: 'Tostarena moonrise', file: 'sand.webp' },
  { id: 'lake', label: 'Lake Lamode depths', file: 'lake.webp' },
  { id: 'wooded', label: 'Steam Gardens', file: 'wooded.webp' },
  { id: 'metro', label: 'New Donk skyline', file: 'metro.webp' },
  { id: 'snow', label: 'Moonbound snowscape', file: 'snow.webp' },
  { id: 'luncheon', label: 'Volbono sunset', file: 'luncheon.webp' },
  { id: 'cap', label: 'Bonneton moonlight', file: 'cap.webp' },
];
const PRODUCER_INDEX = new Map(PRODUCERS.map((producer, index) => [producer.id, index]));

export function getJourneyScene(discoveredProducers = []) {
  const highest = Math.max(0, ...discoveredProducers.map((id) => PRODUCER_INDEX.get(id) ?? -1));
  const sceneIndex = Math.min(JOURNEY_SCENES.length - 1, Math.floor((highest * JOURNEY_SCENES.length) / PRODUCERS.length));
  return { ...JOURNEY_SCENES[sceneIndex], highest, source: 'journey' };
}

export function resolveKingdomScene(state) {
  const journeyScene = getJourneyScene(state.discoveredProducers);
  const equippedId = state.cosmetics?.equipped?.backdrop ?? DEFAULT_EQUIPPED_COSMETICS.backdrop;
  const cosmetic = COSMETIC_BY_ID[equippedId];
  const backdrop = cosmetic?.category === 'backdrop' ? cosmetic.backdrop : null;
  if (backdrop?.mode !== 'fixed' || !backdrop.file) return journeyScene;
  return {
    id: cosmetic.value,
    label: backdrop.label ?? cosmetic.name,
    file: backdrop.file,
    highest: journeyScene.highest,
    source: 'cosmetic',
  };
}

export function kingdomImageUrl(file, base = import.meta.env.BASE_URL, documentBase = '') {
  const baseWithSlash = base.endsWith('/') ? base : `${base}/`;
  const path = `${baseWithSlash}assets/kingdoms/${file}`;
  return documentBase ? new URL(path, documentBase).href : path;
}

export function createKingdomBackground(element, journey, store) {
  let sceneId = '';
  let discoverySignature = null;
  let sceneTimer = 0;
  const base = import.meta.env.BASE_URL;
  const documentBase = typeof document === 'undefined' ? '' : document.baseURI;
  journey.innerHTML = `<div class="journey-track"><img class="journey-odyssey" src="${base}assets/misc/odyssey-ship.webp" alt="The Odyssey" decoding="async"><div class="journey-stops">${PRODUCERS.map((producer, index) => `<div class="journey-stop" data-journey-stop="${producer.id}" title="${producer.name}"><span>${index + 1}</span><img src="${base}assets/producers/${producer.icon}" alt="" loading="lazy" decoding="async"></div>`).join('')}</div></div>`;
  const stops = [...journey.querySelectorAll('[data-journey-stop]')].map((node, index) => ({ node, index, id: node.dataset.journeyStop }));

  function update(state) {
    const nextSignature = state.discoveredProducers.join('|');
    const journeyScene = getJourneyScene(state.discoveredProducers);
    const scene = resolveKingdomScene(state);
    if (scene.id !== sceneId) {
      sceneId = scene.id;
      element.classList.add('is-changing');
      window.clearTimeout(sceneTimer);
      element.style.setProperty('--kingdom-image', `url("${kingdomImageUrl(scene.file, base, documentBase)}")`);
      element.dataset.scene = scene.id;
      element.dataset.sceneSource = scene.source;
      element.setAttribute('aria-label', scene.label);
      sceneTimer = window.setTimeout(() => element.classList.remove('is-changing'), 180);
    }
    if (nextSignature !== discoverySignature) {
      discoverySignature = nextSignature;
      const discovered = new Set(state.discoveredProducers);
      if (!state.stats.backdropsSeen.includes(journeyScene.id)) state.stats.backdropsSeen.push(journeyScene.id);
      for (const stop of stops) {
        stop.node.classList.toggle('is-discovered', discovered.has(stop.id));
        stop.node.classList.toggle('is-current', stop.index === journeyScene.highest);
      }
      journey.style.setProperty('--journey-progress', `${(journeyScene.highest / (PRODUCERS.length - 1)) * 100}%`);
    }
  }

  update(store.state);
  return { update };
}

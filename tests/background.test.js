import { afterEach, describe, expect, test, vi } from 'vitest';
import { createInitialState } from '../src/core/state.js';
import { PRODUCERS } from '../src/data/buildings.js';
import { ACHIEVEMENT_BY_ID } from '../src/data/achievements.js';
import { COSMETICS } from '../src/data/cosmetics.js';
import { createKingdomBackground, getJourneyScene, kingdomImageUrl, resolveKingdomScene } from '../src/visuals/background.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('kingdom backgrounds', () => {
  test('the postcard backdrop follows the full forty-stop Grand Tour', () => {
    const state = createInitialState();
    expect(resolveKingdomScene(state)).toMatchObject({ id: 'cascade', file: 'cascade.webp', source: 'journey' });
    state.discoveredProducers = PRODUCERS.map(({ id }) => id);
    expect(resolveKingdomScene(state)).toMatchObject({ id: 'cap', file: 'cap.webp', source: 'journey' });
    expect(getJourneyScene(PRODUCERS.slice(0, 21).map(({ id }) => id)).id).toBe('metro');
  });

  test('every paid backdrop selects its own correctly labelled local panorama', () => {
    const state = createInitialState();
    const backdrops = COSMETICS.filter(({ category, backdrop }) => category === 'backdrop' && backdrop.mode === 'fixed');
    const expectedFiles = {
      'backdrop-delfino': 'backdrop-delfino-plaza.webp',
      'backdrop-ricco': 'backdrop-ricco-harbor.webp',
      'backdrop-battlefield': 'backdrop-bobomb-battlefield.webp',
      'backdrop-gusty': 'backdrop-gusty-garden.webp',
      'backdrop-comet': 'backdrop-comet-observatory.webp',
      'backdrop-super-bell': 'backdrop-super-bell-hill.webp',
      'backdrop-neon': 'metro.webp',
      'backdrop-coconut': 'backdrop-coconut-mall.webp',
      'backdrop-rainbow': 'backdrop-rainbow-road.webp',
      'backdrop-mount-wario': 'backdrop-mount-wario.webp',
      'backdrop-rogueport': 'backdrop-rogueport.webp',
      'backdrop-toad-town': 'backdrop-toad-town.webp',
      'backdrop-gloom': 'backdrop-luigis-mansion.webp',
      'backdrop-yoshi': 'backdrop-yoshis-island.webp',
    };
    expect(backdrops).toHaveLength(14);
    expect(Object.fromEntries(backdrops.map(({ id, backdrop }) => [id, backdrop.file]))).toEqual(expectedFiles);
    const scenes = backdrops.map((cosmetic) => {
      state.cosmetics.equipped.backdrop = cosmetic.id;
      return resolveKingdomScene(state);
    });
    expect(new Set(scenes.map(({ file }) => file)).size).toBe(backdrops.length);
    expect(scenes.every(({ source, label }) => source === 'cosmetic' && label.length > 10)).toBe(true);
  });

  test('the expanded catalogue uses target-matching completion badges', () => {
    expect(COSMETICS).toHaveLength(29);
    expect(COSMETICS.filter(({ category }) => category === 'backdrop')).toHaveLength(15);
    expect(ACHIEVEMENT_BY_ID['cosmetics-owned-29'].condition.target).toBe(29);
    expect(ACHIEVEMENT_BY_ID['cosmetics-backdrop-15'].condition.target).toBe(15);
    expect(ACHIEVEMENT_BY_ID['cosmetics-owned-21']).toBeUndefined();
    expect(ACHIEVEMENT_BY_ID['cosmetics-backdrop-7']).toBeUndefined();
    expect(PRODUCERS.find(({ id }) => id === 'delfino-plaza').name).toBe('Delfino Fruit Market');
  });

  test('asset URLs retain Vite and GitHub Pages base paths', () => {
    expect(kingdomImageUrl('metro.webp', './')).toBe('./assets/kingdoms/metro.webp');
    expect(kingdomImageUrl('metro.webp', '/Cappy-Clicker/')).toBe('/Cappy-Clicker/assets/kingdoms/metro.webp');
    expect(kingdomImageUrl('metro.webp', './', 'https://dogecyanide.github.io/Cappy-Clicker/'))
      .toBe('https://dogecyanide.github.io/Cappy-Clicker/assets/kingdoms/metro.webp');
  });

  test('equipping a backdrop repaints immediately without new discoveries', () => {
    vi.stubGlobal('window', { clearTimeout: vi.fn(), setTimeout: vi.fn(() => 1) });
    const state = createInitialState();
    const style = { setProperty: vi.fn() };
    const element = {
      classList: { add: vi.fn(), remove: vi.fn() },
      dataset: {},
      style,
      setAttribute: vi.fn(),
    };
    const stops = PRODUCERS.map(({ id }) => ({
      dataset: { journeyStop: id },
      classList: { toggle: vi.fn() },
    }));
    const journey = {
      innerHTML: '',
      querySelectorAll: vi.fn(() => stops),
      style: { setProperty: vi.fn() },
    };
    const background = createKingdomBackground(element, journey, { state });
    style.setProperty.mockClear();
    state.cosmetics.equipped.backdrop = 'backdrop-neon';
    background.update(state);
    expect(style.setProperty).toHaveBeenCalledWith('--kingdom-image', expect.stringMatching(/assets\/kingdoms\/metro\.webp/));
    expect(element.dataset).toMatchObject({ scene: 'neon', sceneSource: 'cosmetic' });
  });
});

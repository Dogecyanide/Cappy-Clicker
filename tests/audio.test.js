import { describe, expect, test, vi } from 'vitest';
import { createAudio } from '../src/core/audio.js';

class FakeAudio {
  static instances = [];

  constructor(src) {
    this.src = src;
    this.play = vi.fn(() => Promise.resolve());
    this.pause = vi.fn();
    FakeAudio.instances.push(this);
  }
}

describe('audio samples', () => {
  test('loads the supplied regular and Multi Moon sounds only when collected', () => {
    FakeAudio.instances = [];
    const audio = createAudio({ Audio: FakeAudio, baseUrl: '/Cappy-Clicker/' });

    expect(FakeAudio.instances).toHaveLength(0);

    audio.moon();
    audio.moon(true);

    expect(FakeAudio.instances.map(({ src }) => src)).toEqual([
      '/Cappy-Clicker/assets/audio/moon-get.mp3',
      '/Cappy-Clicker/assets/audio/multi-moon-get.mp3',
    ]);
    expect(FakeAudio.instances.every(({ preload }) => preload === 'auto')).toBe(true);
    expect(FakeAudio.instances[0].play).toHaveBeenCalledOnce();
    expect(FakeAudio.instances[1].play).toHaveBeenCalledOnce();
  });

  test('resolves the app path from the real document base used on GitHub Pages', () => {
    FakeAudio.instances = [];
    const previousDocument = globalThis.document;
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: { baseURI: 'https://dogecyanide.github.io/Cappy-Clicker/' },
    });
    try {
      createAudio({ Audio: FakeAudio }).moon(true);
      expect(FakeAudio.instances[0].src).toBe('https://dogecyanide.github.io/Cappy-Clicker/assets/audio/multi-moon-get.mp3');
    } finally {
      if (previousDocument === undefined) delete globalThis.document;
      else Object.defineProperty(globalThis, 'document', { configurable: true, value: previousDocument });
    }
  });

  test('a critical toss does not create an audio context', () => {
    const AudioContext = vi.fn();
    const audio = createAudio({ Audio: false, AudioContext });

    audio.click(true);

    expect(AudioContext).not.toHaveBeenCalled();
  });

  test('sound profiles carry over to sample pitch and volume', () => {
    FakeAudio.instances = [];
    const audio = createAudio({ Audio: FakeAudio });
    audio.setProfile('soft');

    audio.moon();

    expect(FakeAudio.instances[0]).toMatchObject({ playbackRate: 0.82, volume: 0.58, currentTime: 0 });
  });

  test('all sounds are harmless when browser audio APIs are unavailable', () => {
    const audio = createAudio({ Audio: false, AudioContext: false, setTimeout: (callback) => callback() });

    expect(() => {
      audio.click();
      audio.purchase();
      audio.moon();
      audio.moon(true);
      audio.shine();
      audio.boo();
    }).not.toThrow();
  });
});

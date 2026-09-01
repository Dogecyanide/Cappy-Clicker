const MOON_SAMPLES = {
  regular: 'assets/audio/moon-get.mp3',
  multi: 'assets/audio/multi-moon-get.mp3',
};

function assetUrl(path, baseUrl) {
  if (baseUrl) return `${baseUrl.replace(/\/?$/, '/')}${path}`;
  if (typeof document !== 'undefined') return new URL(path, document.baseURI).href;
  return path;
}

export function createAudio(options = {}) {
  let context = null;
  let profile = 'classic';
  const AudioCtor = options.Audio ?? globalThis.Audio;
  const AudioContextCtor = options.AudioContext
    ?? globalThis.AudioContext
    ?? globalThis.webkitAudioContext;
  const schedule = options.setTimeout ?? globalThis.setTimeout?.bind(globalThis) ?? ((callback) => callback());
  const moonSamples = new Map();
  const profiles = {
    classic: { pitch: 1, volume: 1, type: null },
    soft: { pitch: 0.82, volume: 0.58, type: 'sine' },
    arcade: { pitch: 1.18, volume: 0.85, type: 'square' },
    bells: { pitch: 1.45, volume: 0.72, type: 'triangle' },
    cosmic: { pitch: 0.68, volume: 0.65, type: 'sine' },
    sunshine: { pitch: 1.28, volume: 0.78, type: 'triangle' },
    ghost: { pitch: 0.56, volume: 0.55, type: 'sawtooth' },
  };

  function prepareSample(kind) {
    if (moonSamples.has(kind)) return moonSamples.get(kind);
    if (typeof AudioCtor !== 'function') return null;
    try {
      const media = new AudioCtor(assetUrl(MOON_SAMPLES[kind], options.baseUrl));
      media.preload = 'auto';
      moonSamples.set(kind, media);
      return media;
    } catch {
      return null;
    }
  }

  function playSample(kind) {
    const media = prepareSample(kind);
    if (!media) return false;
    const selected = profiles[profile] ?? profiles.classic;
    try {
      media.pause?.();
      media.currentTime = 0;
      media.playbackRate = Math.min(2, Math.max(0.5, selected.pitch));
      media.volume = Math.min(1, Math.max(0, selected.volume));
      const playback = media.play?.();
      playback?.catch?.(() => {});
      return true;
    } catch {
      return false;
    }
  }

  function tone(frequency, duration = 0.06, type = 'sine', volume = 0.04) {
    const selected = profiles[profile] ?? profiles.classic;
    if (!AudioContextCtor) return false;
    if (!context) context = new AudioContextCtor();
    if (context.state === 'suspended') context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = selected.type ?? type;
    oscillator.frequency.setValueAtTime(frequency * selected.pitch, context.currentTime);
    gain.gain.setValueAtTime(volume * selected.volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
    return true;
  }

  return {
    setProfile(nextProfile) { profile = profiles[nextProfile] ? nextProfile : 'classic'; },
    click(critical = false) {
      if (critical) return;
      tone(440, 0.055, 'sine', 0.025);
    },
    purchase() { tone(520, 0.06, 'triangle', 0.03); schedule(() => tone(780, 0.09, 'triangle', 0.03), 55); },
    moon(isMulti = false) { playSample(isMulti ? 'multi' : 'regular'); },
    shine() { [659, 880, 1047].forEach((frequency, index) => schedule(() => tone(frequency, 0.16, 'sine', 0.025), index * 65)); },
    boo(bad = false) { tone(bad ? 110 : 260, 0.35, bad ? 'sawtooth' : 'square', 0.04); },
  };
}

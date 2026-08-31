export function createAudio() {
  let context = null;
  let profile = 'classic';
  const profiles = {
    classic: { pitch: 1, volume: 1, type: null },
    soft: { pitch: 0.82, volume: 0.58, type: 'sine' },
    arcade: { pitch: 1.18, volume: 0.85, type: 'square' },
    bells: { pitch: 1.45, volume: 0.72, type: 'triangle' },
    cosmic: { pitch: 0.68, volume: 0.65, type: 'sine' },
    sunshine: { pitch: 1.28, volume: 0.78, type: 'triangle' },
    ghost: { pitch: 0.56, volume: 0.55, type: 'sawtooth' },
  };

  function tone(frequency, duration = 0.06, type = 'sine', volume = 0.04) {
    const selected = profiles[profile] ?? profiles.classic;
    if (!context) context = new AudioContext();
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
  }

  return {
    setProfile(nextProfile) { profile = profiles[nextProfile] ? nextProfile : 'classic'; },
    click(critical = false) {
      if (critical) return;
      tone(440, 0.055, 'sine', 0.025);
    },
    purchase() { tone(520, 0.06, 'triangle', 0.03); window.setTimeout(() => tone(780, 0.09, 'triangle', 0.03), 55); },
    moon() { [523, 659, 784].forEach((frequency, index) => window.setTimeout(() => tone(frequency, 0.25, 'sine', 0.035), index * 90)); },
    boo(bad = false) { tone(bad ? 110 : 260, 0.35, bad ? 'sawtooth' : 'square', 0.04); },
  };
}

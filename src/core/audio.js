export function createAudio() {
  let context = null;

  function tone(frequency, duration = 0.06, type = 'sine', volume = 0.04) {
    if (!context) context = new AudioContext();
    if (context.state === 'suspended') context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  return {
    click(critical = false) {
      tone(critical ? 880 : 440, critical ? 0.16 : 0.055, critical ? 'square' : 'sine', critical ? 0.055 : 0.025);
      if (critical) window.setTimeout(() => tone(1320, 0.1, 'triangle', 0.035), 45);
    },
    purchase() { tone(520, 0.06, 'triangle', 0.03); window.setTimeout(() => tone(780, 0.09, 'triangle', 0.03), 55); },
    moon() { [523, 659, 784].forEach((frequency, index) => window.setTimeout(() => tone(frequency, 0.25, 'sine', 0.035), index * 90)); },
    boo(bad = false) { tone(bad ? 110 : 260, 0.35, bad ? 'sawtooth' : 'square', 0.04); },
  };
}


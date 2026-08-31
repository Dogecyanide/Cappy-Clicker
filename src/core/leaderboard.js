import { D } from './numbers.js';
import { getEconomySnapshot } from './economy.js';

export const LEADERBOARD_PLAYER_KEY = 'cappy-clicker-open-league-player';

export function createLeaderboardClient(storage = localStorage, endpoint = import.meta.env.VITE_LEADERBOARD_API_URL ?? '') {
  const apiUrl = String(endpoint).replace(/\/+$/, '');
  const playerToken = getOrCreatePlayerToken(storage);

  async function list(metric = 'lifetime') {
    if (!apiUrl) return { available: false, entries: [], message: 'The shared Open League service is not connected in this build.' };
    const response = await fetch(`${apiUrl}/leaderboard?metric=${metric === 'cps' ? 'cps' : 'lifetime'}`, {
      headers: { accept: 'application/json', 'x-player-token': playerToken },
    });
    if (!response.ok) throw new Error(`Open League could not refresh (${response.status}).`);
    const data = await response.json();
    return {
      available: true,
      entries: Array.isArray(data.entries) ? data.entries.slice(0, 100) : [],
      ownRank: Number(data.ownRank ?? 0) || null,
    };
  }

  async function submit(state, name, metric = 'lifetime') {
    if (!apiUrl) return { available: false, message: 'Connect the Open League service before submitting.' };
    const cleanName = String(name ?? '').trim().slice(0, 24);
    if (cleanName.length < 2) throw new Error('Choose a name with at least two characters.');
    const snapshot = getEconomySnapshot(state);
    const score = metric === 'cps' ? snapshot.totalCps : D(state.lifetimeCoins);
    const response = await fetch(`${apiUrl}/leaderboard`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        playerToken,
        name: cleanName,
        metric: metric === 'cps' ? 'cps' : 'lifetime',
        scoreLog10: decimalLog10(score),
        displayValue: score.toString(),
        metadata: {
          cps: snapshot.totalCps.toString(),
          lifetime: D(state.lifetimeCoins).toString(),
          producers: Object.values(state.producers).reduce((total, amount) => total + amount, 0),
          upgrades: state.upgrades.length,
          achievements: Object.keys(state.achievements).length,
          moons: state.moons.length,
          playSeconds: Math.floor(state.stats.playSeconds),
          build: 'v2-grand-tour',
        },
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Open League rejected the score (${response.status}).`);
    return { available: true, ...data };
  }

  return { available: Boolean(apiUrl), list, submit };
}

export function decimalLog10(value) {
  const decimal = D(value).abs();
  if (decimal.lte(0)) return 0;
  return decimal.exponent + Math.log10(decimal.mantissa);
}

function getOrCreatePlayerToken(storage) {
  const existing = storage.getItem(LEADERBOARD_PLAYER_KEY);
  if (existing && /^[a-zA-Z0-9-]{16,80}$/.test(existing)) return existing;
  const token = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  storage.setItem(LEADERBOARD_PLAYER_KEY, token);
  return token;
}

import { NEWS, REACTIVE_NEWS } from '../data/news.js';

export function pushNews(state, text, now = Date.now()) {
  if (!text) return;
  state.news.unshift({ text, at: now });
  state.news = state.news.slice(0, 30);
  if (!state.stats.uniqueNewsSeen.includes(text)) state.stats.uniqueNewsSeen.push(text);
}

export function randomNews(state, random = Math.random, now = Date.now()) {
  const unseen = new Set(state.stats.uniqueNewsSeen ?? []);
  const fresh = NEWS.filter((line) => !unseen.has(line));
  const recent = new Set(state.news.slice(0, 30).map(({ text }) => text));
  const choices = fresh.length ? fresh : NEWS.filter((line) => !recent.has(line));
  const text = choices[Math.floor(random() * choices.length)] ?? NEWS[0];
  pushNews(state, text, now);
  return text;
}

export function reactiveNews(state, type, replacements = {}, random = Math.random, now = Date.now()) {
  const templates = REACTIVE_NEWS[type] ?? [];
  if (!templates.length) return '';
  let text = templates[Math.floor(random() * templates.length)];
  for (const [key, value] of Object.entries(replacements)) text = text.replaceAll(`{${key}}`, String(value));
  pushNews(state, text, now);
  return text;
}

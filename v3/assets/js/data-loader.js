// FEI Art Learning Library (v3) -- shared data loader.
// Plain ES module, no build step. Paths are relative to this file's
// own location (v3/assets/js/) so it works the same from v3/index.html
// and v3/topic.html.

const BASE = new URL('../../', import.meta.url); // -> v3/

async function fetchJson(path) {
  const res = await fetch(new URL(path, BASE));
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

let _cache = null;

// Loads topics.json, categories.json, smartclass-map.json and
// synonyms.json together. Cached per page load -- callers can call this
// as many times as convenient without re-fetching.
export async function loadLibraryData() {
  if (_cache) return _cache;
  const [topics, categories, smartclass, synonyms] = await Promise.all([
    fetchJson('data/topics.json'),
    fetchJson('config/categories.json'),
    fetchJson('config/smartclass-map.json'),
    fetchJson('config/synonyms.json')
  ]);
  _cache = { topics, categories, smartclass, synonyms };
  return _cache;
}

export function visibleTopics(topics) {
  return topics.filter((t) => !t.hidden);
}

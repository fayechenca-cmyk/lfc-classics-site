// FEI Art Learning Library (v3) -- client-side search index.
// Plain ES module, no dependencies. Searches topic title, summary,
// keywords, category and resource titles/creators/publishers, with
// synonym expansion (including hidden Chinese keyword equivalents).
// Matching is case-insensitive; a multi-word query must match every
// word (each word can match in any field, in any order) to qualify.
// Results are ranked by field: title > keywords > summary > resources.

const WEIGHT = { title: 100, keywords: 60, summary: 30, category: 20, resources: 10 };

function norm(s) {
  return (s || '').toString().toLowerCase().trim();
}

// Builds a lookup: word -> Set of equivalent words (itself included),
// from synonyms.json's { groups, chinese } shape.
function buildSynonymMap(synonyms) {
  const map = new Map();
  const add = (word, variants) => {
    const key = norm(word);
    if (!key) return;
    const set = map.get(key) || new Set();
    variants.forEach((v) => set.add(norm(v)));
    set.add(key);
    map.set(key, set);
  };
  for (const group of synonyms.groups || []) {
    const normalized = group.map(norm);
    for (const word of normalized) add(word, normalized);
  }
  for (const [zh, en] of Object.entries(synonyms.chinese || {})) {
    const enWords = en.split(/\s+/).map(norm);
    add(zh, enWords);
    // also let an English concept word pull in the Chinese term, so a
    // topic carrying only the Chinese keyword is still reachable from
    // the English query ("color" -> also try "色彩").
    enWords.forEach((w) => add(w, [zh]));
  }
  return map;
}

function expandWord(word, synonymMap) {
  const key = norm(word);
  const variants = synonymMap.get(key);
  return variants ? [...variants] : [key];
}

export function buildIndex(topics) {
  return topics.map((t) => ({
    topic: t,
    _title: norm(t.title),
    _summary: norm(t.summary),
    _category: norm(t.category),
    _keywords: (t.keywords || []).map(norm),
    _resources: (t.resources || []).flatMap((r) => [norm(r.title), norm(r.creator), norm(r.publisher)]).filter(Boolean)
  }));
}

function bestFieldScore(entry, word) {
  if (entry._title.includes(word)) return WEIGHT.title;
  if (entry._keywords.some((k) => k.includes(word))) return WEIGHT.keywords;
  if (entry._summary.includes(word)) return WEIGHT.summary;
  if (entry._category.includes(word)) return WEIGHT.category;
  if (entry._resources.some((r) => r.includes(word))) return WEIGHT.resources;
  return 0;
}

function scoreEntry(entry, queryWords, synonymMap) {
  let total = 0;
  for (const word of queryWords) {
    const variants = expandWord(word, synonymMap);
    let best = 0;
    for (const v of variants) {
      const s = bestFieldScore(entry, v);
      if (s > best) best = s;
    }
    if (best === 0) return 0; // every query word must match something
    total += best;
  }
  // Batch-curated topics (merge-batch.mjs sets core:true on every
  // newTopics entry) get a boost worth one title-word match, so a
  // hand-curated topic with real verified resources outranks an
  // original courses.json-derived topic on ties/near-ties.
  if (entry.topic.core) total += WEIGHT.title;
  return total;
}

// filters: { subject: categoryTitle|'', types: Set<'smartclass'|'image'|'video'|'link'>, level: string }
function passesFilters(topic, filters) {
  if (filters.subject && topic.category !== filters.subject) return false;
  if (filters.level && topic.level !== filters.level) return false;
  if (filters.types && filters.types.size > 0) {
    const topicTypes = new Set((topic.resources || []).map((r) => r.type));
    if (topic.state === 'A') topicTypes.add('smartclass');
    let any = false;
    for (const t of filters.types) {
      if (topicTypes.has(t)) { any = true; break; }
    }
    if (!any) return false;
  }
  return true;
}

// Returns topics sorted by query match score desc (score includes the
// core-topic boost above); ties broken by state A first, then by
// resource count (more first). With no query, every passing topic ties
// at score 1, so the tie-breakers alone decide order -- state A first,
// same as before.
export function search(index, { query, subject, types, level }, synonyms) {
  const q = norm(query);
  const queryWords = q ? q.split(/\s+/).filter(Boolean) : [];
  const synonymMap = synonyms ? buildSynonymMap(synonyms) : new Map();
  const filters = { subject: subject || '', types: types || new Set(), level: level || '' };

  const scored = [];
  for (const entry of index) {
    if (!passesFilters(entry.topic, filters)) continue;
    let score = 1;
    if (queryWords.length) {
      score = scoreEntry(entry, queryWords, synonymMap);
      if (score === 0) continue;
    }
    scored.push({ topic: entry.topic, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aState = a.topic.state === 'A' ? 1 : 0;
    const bState = b.topic.state === 'A' ? 1 : 0;
    if (aState !== bState) return bState - aState;
    return (b.topic.resources || []).length - (a.topic.resources || []).length;
  });

  return scored.map((s) => s.topic);
}

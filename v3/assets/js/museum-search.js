// FEI Art Learning Library (v3) -- museum collection search.
// AIC: https://api.artic.edu (v1, confirmed live). Met: the v1 /search
// endpoint named in the original spec was retired 2026-10-01 -- this
// uses the documented replacement, v1.1/search (same q/hasImages
// params, now offset/limit paginated, plus departmentId -- confirmed
// live), confirmed CORS-enabled (Access-Control-Allow-Origin: *) same
// as v1. /objects/{id} is unaffected, still v1.
//
// Met results come from 3 parallel per-department searches (see
// MET_DEPARTMENTS below), not one global search -- a global search's
// top matches kept landing outside the allowed departments, so the Met
// contributed 0 shown results on every sample search before this.
//
// Strict child-safety filtering lives in config/museum-filter.json so
// Faye can tune allowDepartments/excludeClassifications/blockKeywords
// without a code change. Only items that pass every check are ever
// returned from here.

const AIC_SEARCH = 'https://api.artic.edu/api/v1/artworks/search';
const MET_SEARCH = 'https://collectionapi.metmuseum.org/public/collection/v1.1/search';
const MET_OBJECT = 'https://collectionapi.metmuseum.org/public/collection/v1/objects';

const BASE = new URL('../../', import.meta.url); // -> v3/

let _filterConfig = null;
const _aicCache = new Map();
const _metCache = new Map();

async function loadFilterConfig() {
  if (_filterConfig) return _filterConfig;
  const res = await fetch(new URL('config/museum-filter.json', BASE));
  _filterConfig = await res.json();
  return _filterConfig;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

function hasBlockedKeyword(text, blockKeywords) {
  const lower = (text || '').toLowerCase();
  return blockKeywords.some((kw) => lower.includes(kw));
}

function passesAic(item, filter) {
  // The API call also filters on query[term][is_public_domain]=true, but
  // checking the field on the returned item too (same as passesMet
  // below) means this is never just trusting that query param silently --
  // see v3/COMPLIANCE.md.
  if (!item.is_public_domain) return false;
  if (!item.image_id) return false;
  if (!filter.allowDepartments.aic.includes(item.department_title)) return false;
  const classification = (item.classification_title || '').toLowerCase();
  if (filter.excludeClassifications.some((c) => classification.includes(c))) return false;
  const blob = [item.title, classification, ...(item.subject_titles || []), ...(item.term_titles || [])].join(' ');
  if (hasBlockedKeyword(blob, filter.blockKeywords)) return false;
  return true;
}

function passesMet(item, filter) {
  if (!item.isPublicDomain || !item.primaryImageSmall) return false;
  if (!filter.allowDepartments.met.includes(item.department)) return false;
  const classification = (item.classification || '').toLowerCase();
  if (filter.excludeClassifications.some((c) => classification.includes(c))) return false;
  const tagTerms = (item.tags || []).map((t) => t.term);
  const blob = [item.title, classification, ...tagTerms].join(' ');
  if (hasBlockedKeyword(blob, filter.blockKeywords)) return false;
  return true;
}

async function searchAic(query, filter) {
  if (_aicCache.has(query)) return _aicCache.get(query);
  const url = new URL(AIC_SEARCH);
  url.searchParams.set('q', query);
  url.searchParams.set('query[term][is_public_domain]', 'true');
  url.searchParams.set('limit', '20');
  url.searchParams.set('fields', 'id,title,artist_display,date_display,image_id,department_title,classification_title,subject_titles,term_titles,is_public_domain');
  const res = await withTimeout(fetch(url), 5000);
  if (!res.ok) throw new Error('AIC search failed: ' + res.status);
  const json = await res.json();
  const items = (json.data || [])
    .filter((item) => passesAic(item, filter))
    .map((item) => ({
      museum: 'aic',
      museumLabel: 'The Art Institute of Chicago',
      title: item.title,
      artist: (item.artist_display || '').split('\n')[0],
      date: item.date_display,
      imageUrl: `https://www.artic.edu/iiif/2/${item.image_id}/full/600,/0/default.jpg`,
      pageUrl: `https://www.artic.edu/artworks/${item.id}`
    }));
  _aicCache.set(query, items);
  return items;
}

// A single global search's top-12-by-relevance Met IDs kept landing in
// departments outside the allowlist (American Wing, Photographs,
// Musical Instruments -- all huge in the Met's collection), so the Met
// contributed 0 of 12 shown results on every one of the 5 sample
// searches. Searching per-department instead, in parallel, guarantees
// each allowed department gets a fair shot rather than being crowded
// out by relevance ranking across the whole collection.
const MET_DEPARTMENTS = [
  { id: 11, name: 'European Paintings' },
  { id: 6, name: 'Asian Art' },
  { id: 9, name: 'Drawings and Prints' }
];
const MET_PER_DEPARTMENT = 4;

function objectToMetItem(item) {
  return {
    museum: 'met',
    museumLabel: 'The Metropolitan Museum of Art',
    title: item.title,
    artist: item.artistDisplayName,
    date: item.objectDate,
    imageUrl: item.primaryImageSmall,
    pageUrl: item.objectURL
  };
}

async function searchMetDepartment(query, departmentId, filter) {
  const searchUrl = new URL(MET_SEARCH);
  searchUrl.searchParams.set('hasImages', 'true');
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('departmentId', String(departmentId));
  const res = await withTimeout(fetch(searchUrl), 5000);
  if (!res.ok) throw new Error('Met search failed: ' + res.status);
  const json = await res.json();
  const ids = (json.objectIDs || []).slice(0, MET_PER_DEPARTMENT);
  const objects = await Promise.all(
    ids.map((id) =>
      withTimeout(fetch(`${MET_OBJECT}/${id}`), 5000)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  );
  return objects.filter(Boolean).filter((item) => passesMet(item, filter)).map(objectToMetItem);
}

async function searchMet(query, filter) {
  if (_metCache.has(query)) return _metCache.get(query);
  const results = await Promise.allSettled(
    MET_DEPARTMENTS.map((d) => searchMetDepartment(query, d.id, filter))
  );
  const items = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  _metCache.set(query, items);
  return items;
}

// Alternates AIC/Met so neither museum crowds the other out just by
// returning more matches; falls back to whichever museum still has
// items left once the other runs out. Still capped at 12 total.
function interleave(aicItems, metItems) {
  const out = [];
  let i = 0;
  while (out.length < 12 && (i < aicItems.length || i < metItems.length)) {
    if (i < aicItems.length) out.push(aicItems[i]);
    if (out.length < 12 && i < metItems.length) out.push(metItems[i]);
    i++;
  }
  return out.slice(0, 12);
}

// Returns at most 12 filtered, public-domain artworks for a query, or
// [] on any failure/timeout/empty result -- callers should treat []
// as "hide the section quietly," never as an error to surface.
export async function searchMuseumCollections(query) {
  const q = (query || '').trim();
  if (!q) return [];
  try {
    const filter = await loadFilterConfig();
    const [aic, met] = await Promise.allSettled([searchAic(q, filter), searchMet(q, filter)]);
    return interleave(
      aic.status === 'fulfilled' ? aic.value : [],
      met.status === 'fulfilled' ? met.value : []
    );
  } catch (e) {
    console.warn('[Library] museum search failed', e);
    return [];
  }
}

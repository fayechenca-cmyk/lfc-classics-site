// FEI Art Learning Library (v3) -- homepage controller.
import { loadLibraryData, visibleTopics } from './data-loader.js';
import { buildIndex, search } from './search.js';
import { parseHash, serializeHash, hasActiveState } from './hash-state.js';
import { topicCardHtml, escapeHtml } from './card.js';
import { renderMuseumSection, debounce } from './museum-ui.js';

const LEVEL_ORDER = ['Beginner', 'Beginner-Intermediate', 'Intermediate', 'All Levels'];

function sortLevels(levels) {
  const known = LEVEL_ORDER.filter((l) => levels.has(l));
  const extra = [...levels].filter((l) => !LEVEL_ORDER.includes(l)).sort();
  return [...known, ...extra];
}

async function main() {
  const { topics, categories, smartclass, synonyms } = await loadLibraryData();
  const topicsEl = visibleTopics(topics);
  const index = buildIndex(topicsEl);

  renderCategories(categories, topicsEl);
  renderFeatured(topicsEl);
  wireSmartClassCta(smartclass);

  const levels = sortLevels(new Set(topicsEl.map((t) => t.level).filter(Boolean)));
  renderLevelChips(levels);
  renderSubjectChips(categories);

  const input = document.getElementById('lib-search-input');
  const resultsEl = document.getElementById('lib-results');
  const metaEl = document.getElementById('lib-results-meta');
  const museumEl = document.getElementById('lib-museum-section');

  // Real network calls (AIC: 60 req/min) -- debounced so typing does
  // not fire a request per keystroke. Keyed on the typed query text
  // only; filter chips alone give no sensible free-text search term.
  const triggerMuseumSearch = debounce((q) => renderMuseumSection(museumEl, q), 600);

  function currentState() {
    return {
      q: input.value,
      subject: getActiveChipValue('lib-subject-chips'),
      types: getActiveChipValues('lib-type-chips'),
      level: getActiveChipValue('lib-level-chips')
    };
  }

  function render() {
    const state = currentState();
    triggerMuseumSearch(state.q);
    if (!hasActiveState(state)) {
      resultsEl.innerHTML = '';
      metaEl.textContent = '';
      return;
    }
    const subjectTitle = state.subject ? titleForCategoryId(categories, state.subject) : '';
    const results = search(index, { query: state.q, subject: subjectTitle, types: state.types, level: state.level }, synonyms);

    if (results.length === 0) {
      metaEl.textContent = '';
      resultsEl.innerHTML = `
        <p class="lib-empty">No exact match found. Try another keyword or explore related topics.</p>
      `;
      renderFallback(resultsEl, categories, topicsEl);
      return;
    }

    metaEl.textContent = `${results.length} topic${results.length === 1 ? '' : 's'} found`;
    const hash = serializeHash(state);
    resultsEl.innerHTML = `<div class="lib-grid lib-grid-3">${results.map((t) => topicCardHtml(t, hash)).join('')}</div>`;
  }

  function syncHashFromState() {
    const state = currentState();
    const hash = serializeHash(state);
    if (hash !== window.location.hash) {
      history.pushState(null, '', hash || window.location.pathname + window.location.search);
    }
  }

  input.addEventListener('input', () => { syncHashFromState(); render(); });

  document.getElementById('lib-subject-chips').addEventListener('click', (e) => {
    const btn = e.target.closest('.lib-chip');
    if (!btn) return;
    toggleSingleChip('lib-subject-chips', btn);
    syncHashFromState();
    render();
  });
  document.getElementById('lib-level-chips').addEventListener('click', (e) => {
    const btn = e.target.closest('.lib-chip');
    if (!btn) return;
    toggleSingleChip('lib-level-chips', btn);
    syncHashFromState();
    render();
  });
  document.getElementById('lib-type-chips').addEventListener('click', (e) => {
    const btn = e.target.closest('.lib-chip');
    if (!btn) return;
    btn.setAttribute('aria-pressed', btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    syncHashFromState();
    render();
  });

  function applyHash() {
    const state = parseHash(window.location.hash);
    input.value = state.q;
    setActiveChip('lib-subject-chips', state.subject);
    setActiveChip('lib-level-chips', state.level);
    setActiveChips('lib-type-chips', state.types);
    render();
  }

  window.addEventListener('hashchange', applyHash);
  applyHash();
}

function titleForCategoryId(categories, id) {
  const cat = categories.find((c) => c.id === id);
  return cat ? cat.title : '';
}

function getActiveChipValue(containerId) {
  const el = document.querySelector(`#${containerId} .lib-chip[aria-pressed="true"]`);
  return el ? el.dataset.value : '';
}
function getActiveChipValues(containerId) {
  const els = document.querySelectorAll(`#${containerId} .lib-chip[aria-pressed="true"]`);
  return new Set([...els].map((el) => el.dataset.value));
}
function setActiveChip(containerId, value) {
  document.querySelectorAll(`#${containerId} .lib-chip`).forEach((el) => {
    el.setAttribute('aria-pressed', el.dataset.value === value && value ? 'true' : 'false');
  });
}
function setActiveChips(containerId, values) {
  document.querySelectorAll(`#${containerId} .lib-chip`).forEach((el) => {
    el.setAttribute('aria-pressed', values.has(el.dataset.value) ? 'true' : 'false');
  });
}
function toggleSingleChip(containerId, btn) {
  const already = btn.getAttribute('aria-pressed') === 'true';
  document.querySelectorAll(`#${containerId} .lib-chip`).forEach((el) => el.setAttribute('aria-pressed', 'false'));
  if (!already) btn.setAttribute('aria-pressed', 'true');
}

function renderSubjectChips(categories) {
  const el = document.getElementById('lib-subject-chips');
  el.innerHTML = categories
    .map((c) => `<button type="button" class="lib-chip" data-value="${escapeHtml(c.id)}" aria-pressed="false">${escapeHtml(c.title)}</button>`)
    .join('');
}

function renderLevelChips(levels) {
  const el = document.getElementById('lib-level-chips');
  el.innerHTML = levels
    .map((l) => `<button type="button" class="lib-chip" data-value="${escapeHtml(l)}" aria-pressed="false">${escapeHtml(l)}</button>`)
    .join('');
}

// The Shelves: brand-family-only spine colors, cycled rather than tied
// to each category's own accentColor (categories.json's accentColor
// field predates the Visual Refresh and is no longer used here).
const SPINE_VARIANTS = ['spine-ink', 'spine-violet', 'spine-mint', 'spine-outline', 'spine-violet-tint', 'spine-mint-tint', 'spine-violet', 'spine-mint'];
// Slightly different heights per spine so the shelf looks hand-arranged,
// not machine-generated -- fixed, not random, so layout never shifts
// between renders.
const SPINE_HEIGHTS = [220, 248, 205, 260, 228, 210, 252, 232];

function renderCategories(categories, topicsEl) {
  const el = document.getElementById('lib-categories');
  el.innerHTML = categories
    .map((c, i) => {
      const count = topicsEl.filter((t) => t.category === c.title).length;
      const variant = SPINE_VARIANTS[i % SPINE_VARIANTS.length];
      const height = SPINE_HEIGHTS[i % SPINE_HEIGHTS.length];
      return `
        <a class="lib-spine ${variant}" style="height:${height}px;" href="index.html#subject=${encodeURIComponent(c.id)}" title="${escapeHtml(c.description)}">
          <span class="lib-spine-title">${escapeHtml(c.title)}</span>
          <span class="lib-spine-count">${count}</span>
        </a>
      `;
    })
    .join('');
}

function renderFeatured(topicsEl) {
  const el = document.getElementById('lib-featured');
  const featured = [...topicsEl]
    .sort((a, b) => (b.resources || []).length - (a.resources || []).length)
    .slice(0, 6);
  el.innerHTML = featured.map((t) => topicCardHtml(t)).join('');
}

function renderFallback(resultsEl, categories, topicsEl) {
  const chips = categories
    .map((c) => `<a class="lib-chip" href="index.html#subject=${encodeURIComponent(c.id)}">${escapeHtml(c.title)}</a>`)
    .join('');
  const featured = [...topicsEl]
    .sort((a, b) => (b.resources || []).length - (a.resources || []).length)
    .slice(0, 3)
    .map((t) => topicCardHtml(t))
    .join('');
  resultsEl.innerHTML += `
    <div class="lib-chip-row" style="margin-bottom:18px;">${chips}</div>
    <div class="lib-grid lib-grid-3">${featured}</div>
  `;
}

function wireSmartClassCta(smartclass) {
  const btn = document.getElementById('lib-smartclass-cta-btn');
  if (btn && smartclass && smartclass.entry) btn.href = smartclass.entry;
}

main().catch((err) => {
  console.error('[Library] failed to load', err);
  const resultsEl = document.getElementById('lib-results');
  if (resultsEl) resultsEl.innerHTML = '<p class="lib-empty">The Library could not be loaded right now. Please refresh to try again.</p>';
});

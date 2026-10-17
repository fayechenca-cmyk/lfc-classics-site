// FEI Art Learning Library (v3) -- topic page controller.
// Visual Refresh (A2): bookmark ribbon, eyebrow section headings,
// museum-mat image resources, a Video references grid when a topic
// has 2+ videos, and a quiet "CHECKED <MONTH YEAR>" date stamp.
import { loadLibraryData } from './data-loader.js';
import { escapeHtml, topicCardHtml } from './card.js';
import { renderMuseumSection } from './museum-ui.js';

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function renderNotFound() {
  document.getElementById('lib-topic-root').innerHTML = `
    <div class="lib-topic-header lib-container">
      <p class="lib-empty">
        We couldn't find that topic — it may have moved, or isn't published yet.
      </p>
      <a class="lib-back-link" href="index.html">← Back to the Library</a>
    </div>
  `;
}

function renderKeyConcepts(keyConcepts) {
  if (!keyConcepts || keyConcepts.length === 0) return '';
  return `
    <section class="lib-section lib-container" aria-label="Key concepts">
      <div class="lib-eyebrow" style="margin-bottom:12px;">Key Concepts</div>
      <ul class="lib-key-concepts">
        ${keyConcepts.map((k) => `<li>${escapeHtml(k)}</li>`).join('')}
      </ul>
    </section>
  `;
}

// Optional field (see v3/COMPLIANCE.md's data model note): one quiet
// line explaining why a topic has no images, shown right above the
// resource sub-sections inside Resources (see renderResourcesSection
// below). The "icon" is a plain bordered circle with a literal "i"
// character, not an SVG or icon-library glyph, consistent with "no
// icon library" -- no license to track, nothing to fetch.
function renderImageNote(topic) {
  if (!topic.imageNote) return '';
  return `
    <div class="lib-image-note" style="margin-bottom:18px;">
      <span class="lib-image-note-icon" aria-hidden="true">i</span>
      ${escapeHtml(topic.imageNote)}
    </div>
  `;
}

// COMPLIANCE.md section 1 ("Image captions"): the two allowed sources
// want slightly different wording, so this checks imageUrl's host --
// structural, not string-matching on the publisher name. AIC's own
// requested caption ends with a plain museum name plus a *separate*
// "Public Domain (CC0)" label; the Met's folds "Open Access (CC0)"
// directly into the sentence and does not want a separate label.
//
// Note: our resource data stores artist and date/medium together in
// one `creator` string as originally curated (e.g. "Albrecht Dürer,
// woodcut" -- not every entry is "name, year"), not as two separate
// fields. Attempting to split that on a comma would mis-attribute
// entries like that one. The caption below keeps `creator` intact
// exactly as curated rather than risk corrupting it -- every element
// the museums require (title, creator, publisher, CC0 status, link)
// is present, just not re-split into the literal "Artist. Title,
// Date." field order they describe.
function isMetImage(r) {
  try { return new URL(r.imageUrl).host === 'images.metmuseum.org'; } catch { return false; }
}

function pdTagHtml(r) {
  if (!r.license || isMetImage(r)) return '';
  return `<span class="lib-resource-pd-tag">Public Domain (CC0)</span>`;
}

function captionLine(r) {
  const bits = [r.title, r.creator].filter(Boolean);
  const museumPart = isMetImage(r) ? `${r.publisher}, Open Access (CC0).` : `${r.publisher}.`;
  return [...bits, museumPart].join('. ').replace(/\.\.$/, '.');
}

function renderImageResourcesBody(images) {
  if (images.length === 0) return '';
  return `
    <div class="lib-resource-image-grid">
      ${images
        .map(
          (r) => `
        <figure class="lib-resource-image-card">
          <img src="${escapeHtml(r.imageUrl)}" alt="${escapeHtml(r.title || '')}" loading="lazy">
          <div class="lib-resource-image-body">
            ${pdTagHtml(r)}
            <div class="lib-resource-title">${escapeHtml(captionLine(r))}</div>
            ${r.note ? `<div class="lib-resource-note">${escapeHtml(r.note)}</div>` : ''}
            ${r.url ? `<a class="lib-resource-view-link" href="${escapeHtml(r.url)}" target="_blank" rel="noopener">View at museum ↗</a>` : ''}
          </div>
        </figure>
      `
        )
        .join('')}
    </div>
  `;
}

let _videoFrameCounter = 0;

// compact: true for the 2+ video "Video references" grid (title +
// publisher only); false for the single-video full layout (creator,
// note and a separate "Watch on YouTube" line).
function renderVideoCard(r, compact) {
  const frameId = `lib-video-frame-${_videoFrameCounter++}`;
  const poster = `
    <div id="${frameId}">
      <button type="button" class="lib-video-poster" data-embed="${escapeHtml(r.embedUrl || '')}" data-target="${frameId}" aria-label="Play video: ${escapeHtml(r.title || '')}">
        <span class="lib-video-poster-play" aria-hidden="true">▶</span>
      </button>
    </div>
  `;
  if (compact) {
    return `
      <div class="lib-video-card">
        ${poster}
        <div class="lib-resource-title">${escapeHtml(r.title || '')}</div>
        <div class="lib-video-publisher">${escapeHtml(r.publisher || '')}</div>
      </div>
    `;
  }
  return `
    <div class="lib-video-card">
      <div class="lib-resource-row-head">
        <span class="lib-resource-publisher">${escapeHtml(r.publisher || 'Video')}</span>
      </div>
      <div class="lib-resource-title">${escapeHtml(r.title || '')}</div>
      ${poster}
      ${r.creator ? `<div class="lib-resource-attribution">${escapeHtml(r.creator)}</div>` : ''}
      ${r.note ? `<div class="lib-resource-note">${escapeHtml(r.note)}</div>` : ''}
      ${r.url ? `<a class="lib-resource-view-link" href="${escapeHtml(r.url)}" target="_blank" rel="noopener">Watch on YouTube ↗</a>` : ''}
    </div>
  `;
}

function renderLinkCard(r) {
  return `
    <div class="lib-resource-row">
      <div class="lib-resource-row-head">
        <span class="lib-resource-publisher">${escapeHtml(r.publisher || '')}</span>
        <a class="lib-resource-open" href="${escapeHtml(r.url)}" target="_blank" rel="noopener">Open resource ↗</a>
      </div>
      <div class="lib-resource-title">${escapeHtml(r.title || '')}</div>
      ${r.creator ? `<div class="lib-resource-attribution">${escapeHtml(r.creator)}</div>` : ''}
      ${r.note ? `<div class="lib-resource-note">${escapeHtml(r.note)}</div>` : ''}
    </div>
  `;
}

function renderWatchBody(videos) {
  if (videos.length === 0) return '';
  return videos.length >= 2
    ? `<div class="lib-video-grid">${videos.map((r) => renderVideoCard(r, true)).join('')}</div>`
    : videos.map((r) => renderVideoCard(r, false)).join('');
}

function renderReadBody(links) {
  if (links.length === 0) return '';
  return `<div class="lib-resource-list">${links.map(renderLinkCard).join('')}</div>`;
}

function renderTryItBody(tryIt) {
  if (!tryIt) return '';
  return `<div class="lib-try-it">${escapeHtml(tryIt)}</div>`;
}

// Generic wrapper for one Resources sub-section: an eyebrow label, an
// optional muted subtitle line, then the body. Returns '' (and is
// filtered out by renderResourcesSection below) when the body is
// empty, so a topic with e.g. no videos never shows a bare "Watch"
// heading with nothing under it.
function renderResourceSubsection(label, subtitle, bodyHtml) {
  if (!bodyHtml) return '';
  return `
    <div class="lib-resource-subsection">
      <div class="lib-eyebrow" style="margin-bottom:${subtitle ? '4px' : '14px'};">${label}</div>
      ${subtitle ? `<div class="lib-section-sub" style="margin-bottom:14px;">${subtitle}</div>` : ''}
      ${bodyHtml}
    </div>
  `;
}

// Section 3: one "Resources" heading, then (in order, skipping any
// that are empty) Learn from the Masters (images), Read (links),
// Watch (videos), Try It Yourself. Watch is deliberately
// second-to-last, not second -- videos stay low-key within Resources
// rather than competing for attention near the top of the page (the
// original "external videos near the top" complaint this whole
// restructure exists to fix). The optional "why no images" note
// (v3/COMPLIANCE.md) sits right above the first sub-section.
function renderResourcesSection(topic, images, videos, links) {
  const subsections = [
    renderResourceSubsection('Learn from the Masters', "Find the masters' artworks as resources.", renderImageResourcesBody(images)),
    renderResourceSubsection('Read', '', renderReadBody(links)),
    renderResourceSubsection('Watch', '', renderWatchBody(videos)),
    renderResourceSubsection('Try It Yourself', '', renderTryItBody(topic.tryIt)),
  ].filter(Boolean);
  if (subsections.length === 0) return '';
  return `
    <section class="lib-section lib-container" aria-label="Resources">
      <h2 class="lib-section-title" style="font-size:18px; margin-bottom:18px;">Resources</h2>
      ${renderImageNote(topic)}
      ${subsections.join('')}
    </section>
  `;
}

// Section 1: the page's main recommendation, shown only when the
// topic has an Art GPS course (topic.smartClass.key) -- a direct
// match gets a large card (heading, course name, one-line blurb, the
// CTA button, and the "After you sign in" line); a related match gets
// a smaller card, just the one CTA line, same position on the page.
function renderArtGpsSection(topic, smartclass) {
  if (!topic.smartClass || !topic.smartClass.key) return '';
  const dest = (smartclass.destinations || {})[topic.smartClass.key];
  if (!dest) return '';

  if (topic.smartClass.match === 'related') {
    return `
      <section class="lib-section lib-container" aria-label="Related Art GPS course">
        <div class="lib-smartclass-box lib-smartclass-box-related">
          <a class="lib-smartclass-btn" href="${escapeHtml(smartclass.entry)}">Related Art GPS course: ${escapeHtml(dest.title)} →</a>
        </div>
      </section>
    `;
  }

  return `
    <section class="lib-section lib-container" aria-label="Learn this in Art GPS">
      <h2 class="lib-section-title" style="font-size:18px; margin-bottom:14px;">Learn this in Art GPS</h2>
      <div class="lib-smartclass-box lib-smartclass-box-direct">
        <div class="lib-smartclass-course">${escapeHtml(dest.title)}</div>
        ${dest.blurb ? `<p class="lib-smartclass-blurb">${escapeHtml(dest.blurb)}</p>` : ''}
        <a class="lib-smartclass-btn" href="${escapeHtml(smartclass.entry)}">Learn this in Art GPS →</a>
        <div class="lib-smartclass-where">After you sign in: ${escapeHtml(dest.where)}</div>
      </div>
    </section>
  `;
}

// Resolves topic.relatedTopics (an array of ids) to the actual topic
// objects, in the curated order, dropping anything hidden or missing.
function resolveRelatedTopics(topic, allTopics) {
  const byId = new Map(allTopics.map((t) => [t.id, t]));
  return (topic.relatedTopics || [])
    .map((id) => byId.get(id))
    .filter((t) => t && !t.hidden);
}

// Section 2: the topic's curated relatedTopics that are FEI TeamArt
// originals (id starts with "LFC-") -- free, open to everyone, no
// Art GPS account needed. Topics NOT from this set (DRAW-*, COLOR-*,
// etc.) show later, in "More to Explore" near the bottom of the page.
function renderFeiTeamArtSection(topic, allTopics, fromHash) {
  const related = resolveRelatedTopics(topic, allTopics).filter((t) => t.id.startsWith('LFC-'));
  if (related.length === 0) return '';
  return `
    <section class="lib-section lib-container" aria-label="From FEI TeamArt">
      <h2 class="lib-section-title" style="font-size:18px; margin-bottom:4px;">From FEI TeamArt</h2>
      <div class="lib-section-sub" style="margin-bottom:16px;">Free lessons and topics created by our teachers, open to everyone.</div>
      <div class="lib-grid lib-grid-2">
        ${related.map((t) => topicCardHtml(t, fromHash)).join('')}
      </div>
    </section>
  `;
}

// Bottom of page: whatever's left of the topic's curated relatedTopics
// once the FEI TeamArt originals above have been split out (e.g.
// DRAW-*, COLOR-* topics).
function renderMoreToExploreSection(topic, allTopics, fromHash) {
  const related = resolveRelatedTopics(topic, allTopics).filter((t) => !t.id.startsWith('LFC-'));
  if (related.length === 0) return '';
  return `
    <section class="lib-section lib-container" aria-label="More to explore">
      <h2 class="lib-section-title" style="font-size:18px; margin-bottom:14px;">More to Explore</h2>
      <div class="lib-grid lib-grid-2">
        ${related.map((t) => topicCardHtml(t, fromHash)).join('')}
      </div>
    </section>
  `;
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function dateStampHtml(lastVerified) {
  if (!lastVerified) return '';
  const d = new Date(lastVerified + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return '';
  const text = `Checked ${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}`;
  return `<div class="lib-container" style="padding:4px 20px 0;"><span class="lib-date-stamp">${escapeHtml(text)}</span></div>`;
}

async function main() {
  const id = qs('id');
  const fromHash = qs('from') || '';
  const { topics, smartclass } = await loadLibraryData();
  const topic = id ? topics.find((t) => t.id === id) : null;

  if (!topic || topic.hidden) {
    renderNotFound();
    return;
  }

  document.title = `${topic.title} · FEI Art Learning Library`;

  const metaBits = [topic.level, topic.ageLabel].filter(Boolean).join(' · ');
  const resources = topic.resources || [];
  const images = resources.filter((r) => r.type === 'image' && r.imageUrl);
  const videos = resources.filter((r) => r.type === 'video' && r.embedUrl);
  const links = resources.filter((r) => !(r.type === 'image' && r.imageUrl) && !(r.type === 'video' && r.embedUrl));

  document.getElementById('lib-topic-root').innerHTML = `
    <div class="lib-topic-header lib-container">
      <span class="lib-bookmark-ribbon" aria-hidden="true"></span>
      <a class="lib-back-link" href="index.html${fromHash ? '#' + fromHash : ''}">← Back to results</a>
      <div class="lib-topic-kicker">${escapeHtml(topic.category)}</div>
      <h1 class="lib-topic-title">${escapeHtml(topic.title)}</h1>
      ${metaBits ? `<div class="lib-topic-meta">${escapeHtml(metaBits)}</div>` : ''}
      <p class="lib-topic-summary">${escapeHtml(topic.summary)}</p>
    </div>
    ${renderKeyConcepts(topic.keyConcepts)}
    ${renderArtGpsSection(topic, smartclass)}
    ${renderFeiTeamArtSection(topic, topics, fromHash)}
    ${renderResourcesSection(topic, images, videos, links)}
    <section class="lib-section lib-container" id="lib-museum-section" aria-label="From Museum Collections" style="display:none;"></section>
    ${renderMoreToExploreSection(topic, topics, fromHash)}
    ${dateStampHtml(topic.lastVerified)}
    <div class="lib-container" style="padding:14px 20px 30px;">
      <a class="lib-back-link" href="index.html${fromHash ? '#' + fromHash : ''}">← Back to results</a>
    </div>
  `;

  wireVideoClickToLoad(document.getElementById('lib-topic-root'));
  // "related to ... the topic" -- the topic's own title is the most
  // reliable art-searchable term available (no separate curated
  // search term exists in the data model). Failures/empty results hide
  // this section quietly, same as the homepage.
  renderMuseumSection(document.getElementById('lib-museum-section'), topic.title);
}

function wireVideoClickToLoad(root) {
  root.querySelectorAll('.lib-video-poster').forEach((btn) => {
    btn.addEventListener('click', () => {
      const embed = btn.dataset.embed;
      const target = document.getElementById(btn.dataset.target);
      if (!embed || !target) return;
      target.innerHTML = `
        <div class="lib-video-frame-wrap">
          <iframe src="${embed}" title="Video player" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
        </div>
      `;
    });
  });
}

main().catch((err) => {
  console.error('[Library] topic page failed to load', err);
  renderNotFound();
});

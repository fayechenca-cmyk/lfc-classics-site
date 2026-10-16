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

function renderImageResources(images) {
  if (images.length === 0) return '';
  return `
    <section class="lib-section lib-container" aria-label="From the collection">
      <div class="lib-eyebrow" style="margin-bottom:14px;">From the Collection</div>
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
    </section>
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

function renderWatchSection(videos) {
  if (videos.length === 0) return '';
  const body = videos.length >= 2
    ? `<div class="lib-video-grid">${videos.map((r) => renderVideoCard(r, true)).join('')}</div>`
    : videos.map((r) => renderVideoCard(r, false)).join('');
  return `
    <section class="lib-section lib-container" aria-label="Watch">
      <div class="lib-eyebrow" style="margin-bottom:14px;">Watch</div>
      ${body}
    </section>
  `;
}

function renderReadSection(links) {
  if (links.length === 0) return '';
  return `
    <section class="lib-section lib-container" aria-label="Read">
      <div class="lib-eyebrow" style="margin-bottom:14px;">Read</div>
      <div class="lib-resource-list">${links.map(renderLinkCard).join('')}</div>
    </section>
  `;
}

function renderTryIt(tryIt) {
  if (!tryIt) return '';
  return `
    <section class="lib-section lib-container" aria-label="Try it yourself">
      <div class="lib-eyebrow" style="margin-bottom:12px;">Try It Yourself</div>
      <div class="lib-try-it">${escapeHtml(tryIt)}</div>
    </section>
  `;
}

function renderSmartClassBox(topic, smartclass) {
  if (!topic.smartClass || !topic.smartClass.key) return '';
  const dest = (smartclass.destinations || {})[topic.smartClass.key];
  if (!dest) return '';
  const label = topic.smartClass.match === 'related'
    ? `Related Smart Class course: ${escapeHtml(dest.title)} →`
    : 'Learn this in Smart Class →';
  return `
    <section class="lib-section lib-container" aria-label="Continue in Smart Class">
      <div class="lib-smartclass-box">
        <a class="lib-smartclass-btn" href="${escapeHtml(smartclass.entry)}">${label}</a>
        <div class="lib-smartclass-where">After you sign in: ${escapeHtml(dest.where)}</div>
      </div>
    </section>
  `;
}

function renderRelatedTopics(topic, allTopics, fromHash) {
  const related = allTopics
    .filter((t) => !t.hidden && t.id !== topic.id && t.category === topic.category)
    .slice(0, 4);
  if (related.length === 0) return '';
  return `
    <section class="lib-section lib-container" aria-label="Related topics">
      <h2 class="lib-section-title" style="font-size:16px; margin-bottom:14px;">Related Topics</h2>
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
    ${renderImageResources(images)}
    ${renderWatchSection(videos)}
    ${renderReadSection(links)}
    ${renderTryIt(topic.tryIt)}
    ${renderSmartClassBox(topic, smartclass)}
    ${renderRelatedTopics(topic, topics, fromHash)}
    <section class="lib-section lib-container" id="lib-museum-section" aria-label="From Museum Collections" style="display:none;"></section>
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

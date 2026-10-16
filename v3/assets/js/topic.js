// FEI Art Learning Library (v3) -- topic page controller.
import { loadLibraryData } from './data-loader.js';
import { escapeHtml, topicCardHtml } from './card.js';

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
      <h2 class="lib-section-title" style="font-size:16px; margin-bottom:12px;">Key Concepts</h2>
      <ul class="lib-key-concepts">
        ${keyConcepts.map((k) => `<li>${escapeHtml(k)}</li>`).join('')}
      </ul>
    </section>
  `;
}

function attributionLine(r) {
  const bits = [r.title, r.creator, r.publisher].filter(Boolean);
  const text = bits.join(' · ') + (r.license ? ` · ${r.license}` : '');
  return `
    <div class="lib-resource-attribution">
      ${escapeHtml(text)}
      ${r.url ? ` · <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener">View original ↗</a>` : ''}
    </div>
  `;
}

function renderImageResources(images) {
  if (images.length === 0) return '';
  return `
    <div class="lib-resource-image-grid">
      ${images
        .map(
          (r) => `
        <figure class="lib-resource-image-card">
          <img src="${escapeHtml(r.imageUrl)}" alt="${escapeHtml(r.title || '')}" loading="lazy">
          <div class="lib-resource-image-body">
            <div class="lib-resource-title">${escapeHtml(r.title || '')}</div>
            ${attributionLine(r)}
            ${r.note ? `<div class="lib-resource-note">${escapeHtml(r.note)}</div>` : ''}
          </div>
        </figure>
      `
        )
        .join('')}
    </div>
  `;
}

let _videoFrameCounter = 0;

function renderVideoCard(r) {
  const frameId = `lib-video-frame-${_videoFrameCounter++}`;
  return `
    <div class="lib-video-card">
      <div class="lib-resource-row-head">
        <span class="lib-resource-publisher">${escapeHtml(r.publisher || 'Video')}</span>
      </div>
      <div class="lib-resource-title">${escapeHtml(r.title || '')}</div>
      <div id="${frameId}">
        <button type="button" class="lib-video-poster" data-embed="${escapeHtml(r.embedUrl || '')}" data-target="${frameId}" aria-label="Play video: ${escapeHtml(r.title || '')}">
          <span class="lib-video-poster-play" aria-hidden="true">▶</span>
        </button>
      </div>
      ${r.creator ? `<div class="lib-resource-attribution">${escapeHtml(r.creator)}</div>` : ''}
      ${r.note ? `<div class="lib-resource-note">${escapeHtml(r.note)}</div>` : ''}
      ${r.url ? `<div class="lib-resource-attribution"><a href="${escapeHtml(r.url)}" target="_blank" rel="noopener">Watch on YouTube ↗</a></div>` : ''}
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

function renderResources(resources) {
  const images = resources.filter((r) => r.type === 'image' && r.imageUrl);
  const rest = resources.filter((r) => !(r.type === 'image' && r.imageUrl));
  if (images.length === 0 && rest.length === 0) return '';
  return `
    <section class="lib-section lib-container" aria-label="Learning resources">
      <h2 class="lib-section-title" style="font-size:16px; margin-bottom:14px;">Learning Resources</h2>
      ${renderImageResources(images)}
      <div class="lib-resource-list" style="margin-top:${images.length ? '16px' : '0'};">
        ${rest.map((r) => (r.type === 'video' && r.embedUrl ? renderVideoCard(r) : renderLinkCard(r))).join('')}
      </div>
    </section>
  `;
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

function renderTryIt(tryIt) {
  if (!tryIt) return '';
  return `
    <section class="lib-section lib-container" aria-label="Try it yourself">
      <div class="lib-try-it"><strong>Try It Yourself —</strong> ${escapeHtml(tryIt)}</div>
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

  document.getElementById('lib-topic-root').innerHTML = `
    <div class="lib-topic-header lib-container">
      <a class="lib-back-link" href="index.html${fromHash ? '#' + fromHash : ''}">← Back to results</a>
      <div class="lib-topic-kicker">${escapeHtml(topic.category)}</div>
      <h1 class="lib-topic-title">${escapeHtml(topic.title)}</h1>
      ${metaBits ? `<div class="lib-topic-meta">${escapeHtml(metaBits)}</div>` : ''}
      <p class="lib-topic-summary">${escapeHtml(topic.summary)}</p>
    </div>
    ${renderKeyConcepts(topic.keyConcepts)}
    ${renderResources(topic.resources || [])}
    ${renderTryIt(topic.tryIt)}
    ${renderSmartClassBox(topic, smartclass)}
    ${renderRelatedTopics(topic, topics, fromHash)}
    <div class="lib-container" style="padding:10px 20px 30px;">
      <a class="lib-back-link" href="index.html${fromHash ? '#' + fromHash : ''}">← Back to results</a>
    </div>
  `;

  wireVideoClickToLoad(document.getElementById('lib-topic-root'));
}

main().catch((err) => {
  console.error('[Library] topic page failed to load', err);
  renderNotFound();
});

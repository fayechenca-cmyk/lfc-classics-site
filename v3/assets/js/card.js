// FEI Art Learning Library (v3) -- shared topic card markup.
// Used by the homepage (search results, featured) and the topic page
// (related topics), so the card looks identical everywhere. Visual
// Refresh (A2): a catalog index card -- call number, ruled title line,
// punched hole, library-stamp status marks.

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function statusMarkHtml(topic) {
  const count = (topic.resources || []).length;
  if (topic.state === 'A') {
    return `<span class="lib-stamp stamp-mint">Art GPS</span>`;
  }
  if (count > 0) {
    return `<span class="lib-stamp stamp-violet">Free Resources</span>`;
  }
  return `<span class="lib-card-soon">More coming soon</span>`;
}

// fromHash: the current homepage URL hash (with or without its leading
// '#'), carried through as a query param so the topic page's "Back to
// results" link can restore this exact search without sessionStorage.
// Omitted (or empty) when there is no search context to carry, e.g.
// Featured cards on a fresh page load, or related-topic cards on the
// topic page itself.
export function topicCardHtml(topic, fromHash) {
  const clean = (fromHash || '').replace(/^#/, '');
  const fromParam = clean ? `&from=${encodeURIComponent(clean)}` : '';
  return `
    <a class="lib-card" href="topic.html?id=${encodeURIComponent(topic.id)}${fromParam}">
      <span class="lib-card-callnumber" aria-hidden="true">${escapeHtml(topic.id)}</span>
      ${statusMarkHtml(topic)}
      <span class="lib-card-title">${escapeHtml(topic.title)}</span>
      <span class="lib-card-ruled-line" aria-hidden="true"></span>
      <span class="lib-card-summary">${escapeHtml(topic.summary)}</span>
      <span class="lib-card-action">Explore topic →</span>
      <span class="lib-card-hole" aria-hidden="true"></span>
    </a>
  `;
}

// FEI Art Learning Library (v3) -- shared topic card markup.
// Used by the homepage (search results, featured) and the topic page
// (related topics), so the card looks identical everywhere.

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

export function resourceBadge(topic) {
  const count = (topic.resources || []).length;
  if (topic.state === 'A') {
    return count > 0 ? `Smart Class + ${count} resource${count === 1 ? '' : 's'}` : 'Smart Class';
  }
  return count > 0 ? `${count} resource${count === 1 ? '' : 's'}` : 'More coming soon';
}

// fromHash: the current homepage URL hash (with or without its leading
// '#'), carried through as a query param so the topic page's "Back to
// results" link can restore this exact search without sessionStorage.
// Omitted (or empty) when there is no search context to carry, e.g.
// Featured cards on a fresh page load, or related-topic cards on the
// topic page itself.
export function topicCardHtml(topic, fromHash) {
  const badge = escapeHtml(resourceBadge(topic));
  const badgeClass = topic.state === 'A' ? 'lib-card-badge is-smartclass' : 'lib-card-badge';
  const clean = (fromHash || '').replace(/^#/, '');
  const fromParam = clean ? `&from=${encodeURIComponent(clean)}` : '';
  return `
    <a class="lib-card" href="topic.html?id=${encodeURIComponent(topic.id)}${fromParam}">
      <span class="${badgeClass}">${badge}</span>
      <span class="lib-card-title">${escapeHtml(topic.title)}</span>
      <span class="lib-card-summary">${escapeHtml(topic.summary)}</span>
      <span class="lib-card-action">Explore topic →</span>
    </a>
  `;
}

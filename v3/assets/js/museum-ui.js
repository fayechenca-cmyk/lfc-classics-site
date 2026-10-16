// FEI Art Learning Library (v3) -- shared "From Museum Collections"
// rendering, used by both the homepage (search results) and the topic
// page. Hides itself quietly on any failure, timeout, or empty result
// -- the rest of the page always keeps working either way.
import { searchMuseumCollections } from './museum-search.js';
import { escapeHtml } from './card.js';

export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// COMPLIANCE.md section 1: AIC wants a plain museum name plus a
// separate "Public Domain (CC0)" label; the Met wants "Open Access
// (CC0)" folded directly into the caption sentence instead, with no
// separate label. item.artist/item.date are genuinely separate fields
// here (unlike curated resources' combined `creator` string), so the
// museums' literal "Artist. Title, Date. Publisher." order is used
// as-is.
function captionLine(item) {
  const titleDate = [item.title, item.date].filter(Boolean).join(', ');
  const bits = [item.artist, titleDate].filter(Boolean);
  const museumPart = item.museum === 'met' ? `${item.museumLabel}, Open Access (CC0).` : `${item.museumLabel}.`;
  return [...bits, museumPart].join('. ');
}

function cardHtml(item) {
  const pdLabel = item.museum === 'met' ? '' : `<span class="lib-museum-pd-label">Public Domain (CC0)</span>`;
  return `
    <a class="lib-museum-card" href="${escapeHtml(item.pageUrl)}" target="_blank" rel="noopener">
      <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title || '')}" loading="lazy">
      <div class="lib-museum-card-body">
        ${pdLabel}
        <div class="lib-resource-title">${escapeHtml(captionLine(item))}</div>
        <span class="lib-museum-view-link">View at museum ↗</span>
      </div>
    </a>
  `;
}

export async function renderMuseumSection(container, query) {
  if (!container) return;
  if (!query) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }
  let items = [];
  try {
    items = await searchMuseumCollections(query);
  } catch (e) {
    items = [];
  }
  if (items.length === 0) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';
  container.innerHTML = `
    <h2 class="lib-section-title" style="font-size:16px; margin-bottom:14px;">From Museum Collections</h2>
    <div class="lib-grid lib-grid-3">${items.map(cardHtml).join('')}</div>
    <p style="font-size:11.5px; color:var(--lib-text-soft); margin-top:14px;">Images courtesy of The Art Institute of Chicago and The Metropolitan Museum of Art, public-domain collections.</p>
  `;
}

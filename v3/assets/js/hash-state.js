// FEI Art Learning Library (v3) -- URL hash state for search + filters.
// Shared between index.html (reads/writes it live) and topic.html
// ("Back to results" just needs to restore it unchanged).
// Shape in the hash: q=<query>&subject=<category id slug>&type=<comma list>&level=<level>

export function parseHash(hash) {
  const raw = (hash || '').replace(/^#/, '');
  const params = new URLSearchParams(raw);
  const typeParam = params.get('type') || '';
  return {
    q: params.get('q') || '',
    subject: params.get('subject') || '',
    types: new Set(typeParam.split(',').filter(Boolean)),
    level: params.get('level') || ''
  };
}

export function serializeHash({ q, subject, types, level }) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (subject) params.set('subject', subject);
  if (types && types.size) params.set('type', [...types].join(','));
  if (level) params.set('level', level);
  const s = params.toString();
  return s ? `#${s}` : '';
}

export function hasActiveState(state) {
  return !!(state.q || state.subject || (state.types && state.types.size) || state.level);
}

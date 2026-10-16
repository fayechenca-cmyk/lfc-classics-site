#!/usr/bin/env node
// FEI Art Learning Library -- v3 data build.
// Reads v2/data/courses.json + the mapping table below, writes
// v3/data/topics.json. Node, no dependencies. Re-run any time
// v2/data/courses.json changes; this file is generated, not hand-edited.
//
// Run from anywhere: node v3/scripts/build-topics.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const COURSES_PATH = join(ROOT, 'v2', 'data', 'courses.json');
const OUT_PATH = join(ROOT, 'v3', 'data', 'topics.json');

const TODAY = '2026-10-15';

// id -> [category, state, smartClassKey, match]
// State A = Smart Class teaches this subject. State B = has free
// resources. State C = hidden until curated.
const MAPPING = {
  'ARTHIST-ENTRY-001': ['Art History & Theory', 'A', 'art-theory', 'direct'],
  'LFC-001': ['Materials & Techniques', 'B', '', ''],
  'LFC-002': ['Drawing & Painting', 'A', 'foundation-of-sketch', 'direct'],
  'LFC-003': ['Drawing & Painting', 'A', 'foundation-of-sketch', 'direct'],
  'LFC-004': ['Drawing & Painting', 'A', 'foundation-of-sketch', 'direct'],
  'LFC-005': ['Drawing & Painting', 'A', 'foundation-of-sketch', 'direct'],
  'LFC-006': ['Drawing & Painting', 'A', 'foundation-of-sketch', 'direct'],
  'LFC-007': ['Drawing & Painting', 'A', 'scene-drawing', 'direct'],
  'LFC-008': ['Drawing & Painting', 'A', 'foundation-of-sketch', 'direct'],
  'LFC-009': ['Drawing & Painting', 'A', 'foundation-of-sketch', 'direct'],
  'LFC-010': ['Drawing & Painting', 'A', 'foundation-of-sketch', 'direct'],
  'LFC-011': ['Drawing & Painting', 'B', '', ''],
  'LFC-012': ['Drawing & Painting', 'C', '', ''],
  'LFC-013': ['Drawing & Painting', 'C', '', ''],
  'LFC-014': ['Drawing & Painting', 'C', '', ''],
  'LFC-015': ['Drawing & Painting', 'B', '', ''],
  'LFC-016': ['Color & Visual Language', 'C', 'color-practice', 'related'],
  'LFC-017': ['Art History & Theory', 'C', '', ''],
  'LFC-018': ['Art History & Theory', 'A', 'art-theory', 'direct'],
  'LFC-019': ['Art History & Theory', 'C', '', ''],
  'LFC-020': ['Art History & Theory', 'C', '', ''],
  'LFC-021': ['Art History & Theory', 'C', 'yokai', 'related'],
  'LFC-022': ['Art History & Theory', 'A', 'art-theory', 'direct'],
  'LFC-023': ['Color & Visual Language', 'C', 'kandinsky', 'related'],
  'LFC-024': ['Color & Visual Language', 'C', '', ''],
  'LFC-025': ['Art History & Theory', 'C', 'miro', 'related'],
  'LFC-026': ['Materials & Techniques', 'C', '', ''],
  'LFC-027': ['Materials & Techniques', 'C', '', ''],
  'LFC-028': ['Materials & Techniques', 'A', 'foundation-of-sketch', 'direct'],
  'LFC-029': ['Materials & Techniques', 'C', '', ''],
  'LFC-030': ['Materials & Techniques', 'C', '', ''],
  'LFC-031': ['Color & Visual Language', 'C', '', ''],
  'LFC-032': ['Materials & Techniques', 'C', '', ''],
  'LFC-033': ['Materials & Techniques', 'C', '', ''],
  'LFC-034': ['Materials & Techniques', 'C', '', ''],
  'LFC-035': ['Materials & Techniques', 'C', '', ''],
  'LFC-036': ['Design & Applied Art', 'B', '', ''],
  'LFC-037': ['Design & Applied Art', 'B', '', ''],
  'LFC-038': ['Design & Applied Art', 'B', '', ''],
  'LFC-039': ['Design & Applied Art', 'B', '', ''],
  'LFC-040': ['Design & Applied Art', 'B', '', ''],
  'LFC-041': ['Design & Applied Art', 'B', '', ''],
  'LFC-042': ['Design & Applied Art', 'A', 'fashion-design', 'direct'],
  'LFC-043': ['Design & Applied Art', 'A', 'fashion-design', 'direct'],
  'LFC-044': ['Design & Applied Art', 'A', 'fashion-design', 'direct'],
  'LFC-045': ['Design & Applied Art', 'A', 'fashion-design', 'direct'],
  'LFC-046': ['Design & Applied Art', 'A', 'fashion-design', 'direct'],
  'LFC-047': ['Design & Applied Art', 'A', 'fashion-design', 'direct'],
  'LFC-048': ['Drawing & Painting', 'B', '', ''],
  'LFC-049': ['Drawing & Painting', 'B', '', ''],
  'LFC-050': ['Drawing & Painting', 'B', '', ''],
  'LFC-051': ['Drawing & Painting', 'B', '', ''],
  'LFC-052': ['Drawing & Painting', 'B', '', ''],
  'LFC-053': ['Drawing & Painting', 'B', '', ''],
  'LFC-054': ['Creative Projects', 'A', 'lfc054', 'direct'],
  'LFC-055': ['Creative Projects', 'B', 'illustration-book', 'related'],
  'LFC-056': ['Creative Projects', 'B', 'illustration-book', 'related'],
  'LFC-057': ['Creative Projects', 'B', '', ''],
  'LFC-058': ['Digital Art & Animation', 'B', '', ''],
  'LFC-059': ['Creative Projects', 'B', '', ''],
  'LFC-060': ['Creative Projects', 'B', '', ''],
  'LFC-061': ['Creative Projects', 'B', '', ''],
  'LFC-062': ['Creative Projects', 'B', '', ''],
  'LFC-063': ['Creative Projects', 'B', '', ''],
  'LFC-064': ['Creative Projects', 'A', 'scene-drawing', 'direct'],
  'LFC-065': ['Creative Projects', 'B', '', ''],
  'LFC-066': ['Creative Projects', 'B', '', ''],
  'LFC-067': ['Creative Projects', 'B', '', ''],
  'LFC-068': ['Creative Projects', 'B', '', ''],
  'LFC-069': ['Digital Art & Animation', 'B', '', ''],
  'LFC-070': ['Digital Art & Animation', 'B', '', ''],
  'LFC-071': ['Digital Art & Animation', 'B', '', ''],
  'LFC-072': ['Digital Art & Animation', 'B', '', ''],
  'LFC-073': ['Digital Art & Animation', 'B', '', ''],
  'LFC-074': ['Digital Art & Animation', 'B', '', ''],
  'LFC-075': ['Digital Art & Animation', 'B', '', ''],
  'LFC-076': ['Digital Art & Animation', 'B', '', ''],
  'LFC-077': ['Digital Art & Animation', 'B', 'scene-drawing', 'related'],
  'LFC-078': ['Digital Art & Animation', 'B', '', ''],
  'LFC-079': ['Creative Projects', 'B', '', ''],
  'LFC-080': ['Creative Projects', 'B', '', ''],
  'LFC-081': ['Creative Projects', 'B', '', ''],
  'LFC-082': ['Digital Art & Animation', 'B', '', ''],
  'LFC-083': ['Digital Art & Animation', 'B', '', ''],
  'LFC-084': ['Digital Art & Animation', 'B', '', ''],
  'LFC-085': ['Design & Applied Art', 'A', 'scene-drawing', 'direct'],
  'LFC-086': ['Design & Applied Art', 'A', 'scene-drawing', 'direct'],
  'LFC-087': ['Design & Applied Art', 'A', 'scene-drawing', 'direct'],
  'LFC-088': ['Contemporary Art & Critical Thinking', 'A', 'art-theory', 'direct'],
  'LFC-089': ['Design & Applied Art', 'B', '', ''],
  'LFC-090': ['Design & Applied Art', 'B', '', ''],
  'LFC-091': ['Drawing & Painting', 'B', '', ''],
  'LFC-092': ['Color & Visual Language', 'B', '', ''],
  'LFC-093': ['Drawing & Painting', 'B', '', ''],
  'LFC-094': ['Drawing & Painting', 'B', '', ''],
  'LFC-095': ['Drawing & Painting', 'B', '', ''],
  'LFC-096': ['Drawing & Painting', 'B', '', ''],
  'LFC-097': ['Drawing & Painting', 'B', '', ''],
  'LFC-098': ['Drawing & Painting', 'B', '', ''],
  'LFC-099': ['Drawing & Painting', 'B', '', ''],
  'LFC-100': ['Drawing & Painting', 'B', '', ''],
  'LFC-101': ['Drawing & Painting', 'B', '', ''],
  'LFC-102': ['Drawing & Painting', 'B', '', ''],
  'LFC-103': ['Drawing & Painting', 'B', '', ''],
  'LFC-104': ['Drawing & Painting', 'B', '', ''],
  'LFC-105': ['Drawing & Painting', 'B', '', ''],
  'LFC-106': ['Creative Projects', 'B', '', ''],
  'LFC-107': ['Materials & Techniques', 'B', '', ''],
  'LFC-108': ['Creative Projects', 'B', '', ''],
  'LFC-109': ['Creative Projects', 'B', '', ''],
  'LFC-110': ['Creative Projects', 'A', 'cardboard', 'direct'],
  'LFC-111': ['Creative Projects', 'B', 'fashion-design', 'related'],
  'LFC-112': ['Materials & Techniques', 'B', '', ''],
  'LFC-113': ['Materials & Techniques', 'B', '', ''],
  'LFC-114': ['Digital Art & Animation', 'B', '', ''],
  'LFC-115': ['Creative Projects', 'B', '', ''],
  'LFC-116': ['Creative Projects', 'B', '', ''],
  'LFC-117': ['Creative Projects', 'B', '', ''],
  'LFC-118': ['Digital Art & Animation', 'B', '', ''],
  'LFC-119': ['Digital Art & Animation', 'B', '', ''],
  'LFC-120': ['Creative Projects', 'B', '', ''],
  'LFC-121': ['Art History & Theory', 'A', 'art-theory', 'direct'],
  'LFC-122': ['Art History & Theory', 'A', 'art-theory', 'direct'],
  'LFC-123': ['Art History & Theory', 'A', 'art-theory', 'direct'],
  'LFC-124': ['Art History & Theory', 'A', 'art-theory', 'direct'],
  'LFC-125': ['Art History & Theory', 'A', 'art-theory', 'direct'],
  'LFC-126': ['Art History & Theory', 'A', 'art-theory', 'direct'],
  'LFC-127': ['Art History & Theory', 'A', 'art-theory', 'direct'],
  'LFC-128': ['Art History & Theory', 'A', 'art-theory', 'direct'],
  'LFC-129': ['Art History & Theory', 'A', 'art-theory', 'direct'],
  'LFC-130': ['Art History & Theory', 'A', 'art-theory', 'direct'],
  'LFC-131': ['Art History & Theory', 'A', 'art-theory', 'direct'],
  'LFC-132': ['Contemporary Art & Critical Thinking', 'A', 'art-theory', 'direct'],
  'LFC-133': ['Art History & Theory', 'A', 'art-theory', 'direct'],
  'LFC-134': ['Art History & Theory', 'A', 'art-theory', 'direct'],
  'LFC-135': ['Art History & Theory', 'A', 'art-theory', 'direct'],
  'LFC-136': ['Drawing & Painting', 'A', 'foundation-of-sketch', 'direct'],
  'LFC-137': ['Contemporary Art & Critical Thinking', 'A', 'art-theory', 'direct'],
  'LFC-138': ['Drawing & Painting', 'A', 'foundation-of-sketch', 'direct'],
  'LFC-139': ['Creative Projects', 'C', 'creation-young', 'related'],
  'LFC-140': ['Materials & Techniques', 'A', 'leather-craft', 'direct'],
  'LFC-141': ['Design & Applied Art', 'C', '', ''],
  'LFC-142': ['Design & Applied Art', 'A', 'fashion-design', 'direct'],
  'LFC-143': ['Creative Projects', 'C', 'illustration-book', 'related'],
  'LFC-144': ['Digital Art & Animation', 'C', '', ''],
  'LFC-145': ['Contemporary Art & Critical Thinking', 'A', 'art-theory', 'direct']
};

// Fan-art topics using commercial characters -- never allow image
// resources for these, at any curation stage.
const NO_IMAGES_IDS = new Set([
  'LFC-059', 'LFC-060', 'LFC-061', 'LFC-062', 'LFC-063',
  'LFC-064', 'LFC-065', 'LFC-066', 'LFC-067', 'LFC-068'
]);

function isRealUrl(u) {
  if (typeof u !== 'string') return false;
  const t = u.trim();
  if (t === '' || t === '#') return false;
  return /^https?:\/\//i.test(t);
}

// Handles youtube.com/watch?v=, youtu.be/<id>, youtube.com/embed/<id>,
// and the youtube-nocookie.com equivalents, ignoring tracking params
// (&t=, ?si=, etc). Returns null if the URL is not a recognizable
// YouTube link -- callers must treat that as "not a real video" rather
// than guessing.
function extractYouTubeId(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0];
      return id || null;
    }
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const embedMatch = u.pathname.match(/^\/embed\/([^/]+)/);
      if (embedMatch) return embedMatch[1];
    }
    return null;
  } catch {
    return null;
  }
}

function buildKeywords(course) {
  const set = new Set();
  const add = (v) => {
    if (typeof v !== 'string') return;
    const t = v.trim().toLowerCase();
    if (t) set.add(t);
  };
  (course.tags || []).forEach(add);
  (course.movements || []).forEach(add);
  (course.artists || []).forEach((a) => add(a && a.name));
  (course.title || '')
    .split(/[^A-Za-z0-9']+/)
    .filter((w) => w.length > 1)
    .forEach(add);
  return [...set];
}

function buildResources(course) {
  const resources = [];

  for (const ref of course.refs || []) {
    if (!isRealUrl(ref.url)) continue;
    const title = [ref.artist, ref.work].filter(Boolean).join(' — ') || 'Reference';
    resources.push({
      type: 'link',
      title,
      creator: ref.artist || '',
      publisher: ref.museum || '',
      url: ref.url.trim(),
      imageUrl: '',
      embedUrl: '',
      license: ref.license || '',
      language: 'en',
      lastChecked: TODAY
    });
  }

  if (isRealUrl(course.videoUrl)) {
    const id = extractYouTubeId(course.videoUrl.trim());
    if (id) {
      resources.push({
        type: 'video',
        title: course.title,
        creator: '',
        publisher: 'YouTube',
        url: `https://www.youtube.com/watch?v=${id}`,
        imageUrl: '',
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        license: '',
        language: 'en',
        lastChecked: TODAY
      });
    }
  }

  if (isRealUrl(course.pdfUrl)) {
    resources.push({
      type: 'link',
      title: 'Study PDF',
      creator: '',
      publisher: '',
      url: course.pdfUrl.trim(),
      imageUrl: '',
      embedUrl: '',
      license: '',
      language: 'en',
      lastChecked: TODAY
    });
  }

  return resources;
}

function buildTopic(course) {
  const mapping = MAPPING[course.id];
  if (!mapping) {
    throw new Error(`No mapping entry for course id "${course.id}" -- add it to MAPPING before re-running.`);
  }
  const [category, state, smartClassKey, match] = mapping;

  const topic = {
    id: course.id,
    title: course.title,
    category,
    summary: course.shortDescription || '',
    keyConcepts: [],
    tryIt: '',
    keywords: buildKeywords(course),
    ageLabel: course.ageLabel || '',
    level: course.level || '',
    state,
    smartClass: { key: smartClassKey, match: smartClassKey ? match : '' },
    resources: buildResources(course),
    relatedTopics: [],
    hidden: state === 'C',
    lastVerified: TODAY
  };

  if (NO_IMAGES_IDS.has(course.id)) {
    topic.noImages = true;
  }

  return topic;
}

function main() {
  const courses = JSON.parse(readFileSync(COURSES_PATH, 'utf8'));
  const mappedIds = new Set(Object.keys(MAPPING));
  const courseIds = new Set(courses.map((c) => c.id));

  const missing = [...mappedIds].filter((id) => !courseIds.has(id));
  if (missing.length) {
    console.warn('[build-topics] mapping ids not found in courses.json:', missing.join(', '));
  }
  const unmapped = courses.filter((c) => !mappedIds.has(c.id)).map((c) => c.id);
  if (unmapped.length) {
    throw new Error(`[build-topics] courses.json has ids with no mapping entry: ${unmapped.join(', ')}`);
  }

  const topics = courses.map(buildTopic);
  writeFileSync(OUT_PATH, JSON.stringify(topics, null, 2) + '\n');

  // Summary report
  const byCategory = {};
  const byState = { A: 0, B: 0, C: 0 };
  const byResourceType = { link: 0, video: 0, image: 0 };
  for (const t of topics) {
    byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    byState[t.state] = (byState[t.state] || 0) + 1;
    for (const r of t.resources) {
      byResourceType[r.type] = (byResourceType[r.type] || 0) + 1;
    }
  }

  console.log(`Wrote ${topics.length} topics to ${OUT_PATH}\n`);
  console.log('By category:');
  for (const [k, v] of Object.entries(byCategory)) console.log(`  ${k}: ${v}`);
  console.log('\nBy state:');
  for (const [k, v] of Object.entries(byState)) console.log(`  ${k}: ${v}`);
  console.log('\nResources by type:');
  for (const [k, v] of Object.entries(byResourceType)) console.log(`  ${k}: ${v}`);
}

main();

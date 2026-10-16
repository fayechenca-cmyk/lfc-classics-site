#!/usr/bin/env node
// FEI Art Learning Library -- compliance guardrail (see v3/COMPLIANCE.md).
// Node, no dependencies. Exits 1 and prints every violation it finds;
// exits 0 silently (beyond a summary line) when clean.
//
// Scans v3/data/topics.json, every v3/data/batches/*.json, all
// v3/**/*.html|css|js, and -- now that the legacy pages are retired
// redirects -- root index.html and v2/**/*.html too (stricter there:
// no <img> at all, no CSS url() at all, no Stripe links).
//
// Run by hand before every commit that touches v3/, root index.html or
// v2/, and automatically from merge-batch.mjs after every batch merge.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const V3_ROOT = join(__dirname, '..');

const ALLOWED_IMAGE_HOSTS = ['www.artic.edu', 'images.metmuseum.org'];
const ALLOWED_LICENSES = ['Public Domain', 'CC0'];
const YOUTUBE_EMBED_RE = /^https:\/\/www\.youtube-nocookie\.com\/embed\/[^/?#]+$/;

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function walk(dir, exts, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, exts, out);
    } else if (exts.includes(extname(entry))) {
      out.push(full);
    }
  }
  return out;
}

function relPath(p) {
  return p.replace(V3_ROOT + '/', 'v3/');
}

// ── Load config ──
const complianceConfig = loadJson(join(V3_ROOT, 'config', 'compliance.json'));
const blockedBrandNames = (complianceConfig.blockedBrandNames || []).map((b) => b.toLowerCase());

const ownAssetsConfig = loadJson(join(V3_ROOT, 'config', 'own-assets.json'));
const ownAssetPaths = new Set((ownAssetsConfig.assets || []).map((a) => (typeof a === 'string' ? a : a.path)));

const violations = [];
function fail(message, where) {
  violations.push(where ? `${where}: ${message}` : message);
}

// ── Resource-level checks, shared by topics.json and every batch file ──
// context: a label for error messages (e.g. "v3/data/topics.json > LFC-002")
function checkResource(r, context) {
  if (!r.publisher || !String(r.publisher).trim()) {
    fail(`resource "${r.title || r.url || '(untitled)'}" has no publisher`, context);
  }
  if (r.type === 'image') {
    if (!ALLOWED_LICENSES.includes(r.license)) {
      fail(`image "${r.title || r.imageUrl}" has disallowed license "${r.license}"`, context);
    }
    if (r.imageUrl) {
      let host = null;
      try { host = new URL(r.imageUrl).host; } catch { /* fall through */ }
      if (!host || !ALLOWED_IMAGE_HOSTS.includes(host)) {
        fail(`image "${r.title || r.imageUrl}" has disallowed imageUrl host "${host}"`, context);
      }
    }
  }
  if (r.type === 'video' && r.embedUrl) {
    if (!YOUTUBE_EMBED_RE.test(r.embedUrl)) {
      fail(`video "${r.title || r.url}" has a non-youtube-nocookie embedUrl "${r.embedUrl}"`, context);
    }
  }
}

function visibleTextOf(topic) {
  return [
    topic.title, topic.summary, topic.tryIt, topic.imageNote,
    ...(topic.keyConcepts || []),
    ...(topic.resources || []).flatMap((r) => [r.title, r.note, r.creator, r.publisher])
  ].filter(Boolean).join(' ').toLowerCase();
}

function checkTopic(topic, context) {
  for (const r of topic.resources || []) {
    checkResource(r, `${context} > ${topic.id}`);
  }
  const isHiddenOrNoImages = topic.hidden === true || topic.noImages === true;
  if (isHiddenOrNoImages) {
    const hasImage = (topic.resources || []).some((r) => r.type === 'image');
    if (hasImage) {
      fail(`topic is hidden/noImages but still has an image resource`, `${context} > ${topic.id}`);
    }
  }
  // Brand-name check only applies to topics that are actually visible --
  // a hidden topic's text is never rendered, so it is exempt (that is
  // the whole point of hiding it).
  if (topic.hidden !== true) {
    const text = visibleTextOf(topic);
    for (const brand of blockedBrandNames) {
      if (text.includes(brand)) {
        fail(`visible text contains blocked brand name "${brand}"`, `${context} > ${topic.id}`);
      }
    }
  }
}

// ── 1. v3/data/topics.json ──
const topicsPath = join(V3_ROOT, 'data', 'topics.json');
const topics = loadJson(topicsPath);
for (const topic of topics) {
  checkTopic(topic, relPath(topicsPath));
}

// ── 2. Every batch file in v3/data/batches/ ──
const batchesDir = join(V3_ROOT, 'data', 'batches');
let batchFiles = [];
try {
  batchFiles = readdirSync(batchesDir).filter((f) => f.endsWith('.json'));
} catch { /* no batches dir yet */ }
for (const file of batchFiles) {
  const path = join(batchesDir, file);
  const batch = loadJson(path);
  for (const topic of batch.newTopics || []) {
    checkTopic(topic, relPath(path));
  }
  for (const update of batch.updateTopics || []) {
    for (const r of update.addResources || []) {
      checkResource(r, `${relPath(path)} > ${update.id}`);
    }
  }
}

// ── 3. Every v3/**/*.html|css|js for hardcoded image hosts ──
const codeFiles = walk(V3_ROOT, ['.html', '.css', '.js']);
const IMG_SRC_RE = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi;
const CSS_URL_RE = /url\(\s*["']?([^"')]+)["']?\s*\)/gi;
const BG_IMAGE_RE = /background(?:-image)?\s*:\s*[^;]*url\(\s*["']?([^"')]+)["']?\s*\)/gi;

function checkUrlReference(url, context) {
  if (url.startsWith('data:')) return; // inline, no external host -- always allowed
  let host, isAbsolute;
  try {
    const parsed = new URL(url);
    host = parsed.host;
    isAbsolute = true;
  } catch {
    isAbsolute = false; // relative path -- a local file under v3/
  }
  if (isAbsolute) {
    if (!ALLOWED_IMAGE_HOSTS.includes(host)) {
      fail(`references disallowed external image host "${host}" (${url})`, context);
    }
  } else {
    if (!ownAssetPaths.has(url)) {
      fail(`references local image "${url}" not listed in v3/config/own-assets.json`, context);
    }
  }
}

for (const file of codeFiles) {
  const src = readFileSync(file, 'utf8');
  const context = relPath(file);
  const ext = extname(file);
  // .js files only ever build <img src="..."> through template-literal
  // interpolation (e.g. `<img src="${escapeHtml(r.imageUrl)}">`), never
  // a hardcoded URL -- the underlying value is already checked at the
  // data level by checkResource() above, so skip anything containing
  // "${" here rather than false-matching the literal template syntax.
  // CSS_URL_RE/BG_IMAGE_RE are skipped entirely for .js files: "url(" is
  // valid, unrelated JS syntax there (e.g. `new URL(path, BASE)`), not a
  // CSS url() reference.
  const regexes = ext === '.js' ? [IMG_SRC_RE] : [IMG_SRC_RE, CSS_URL_RE, BG_IMAGE_RE];
  for (const re of regexes) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src))) {
      if (m[1].includes('${')) continue;
      checkUrlReference(m[1], context);
    }
  }
}

// ── 4. Legacy pages: root index.html and v2/**/*.html ──
// These are retired redirect pages now (see v3/COMPLIANCE.md) --
// stricter than the v3 check above (which allows AIC/Met images):
// legacy pages must have no <img> at all, no CSS url() at all, and no
// Stripe links, since nothing should still be selling or showing
// unverified images from a page search engines and old bookmarks can
// still reach.
const REPO_ROOT = join(V3_ROOT, '..');
const STRIPE_RE = /buy\.stripe\.com/i;
const legacyFiles = [join(REPO_ROOT, 'index.html'), ...walk(join(REPO_ROOT, 'v2'), ['.html'])];

for (const file of legacyFiles) {
  const src = readFileSync(file, 'utf8');
  const context = file.replace(REPO_ROOT + '/', '');
  if (/<img\b/i.test(src)) {
    fail('contains an <img> tag -- legacy pages must have none', context);
  }
  CSS_URL_RE.lastIndex = 0;
  let legacyMatch;
  while ((legacyMatch = CSS_URL_RE.exec(src))) {
    fail(`contains a CSS url() reference (${legacyMatch[1]}) -- legacy pages must have none`, context);
  }
  if (STRIPE_RE.test(src)) {
    fail('contains a buy.stripe.com link -- legacy pages must have none', context);
  }
}

// ── Report ──
if (violations.length > 0) {
  console.error(`[check-compliance] ${violations.length} violation(s) found:\n`);
  for (const v of violations) console.error('  - ' + v);
  process.exit(1);
}

console.log('[check-compliance] clean -- no violations found.');

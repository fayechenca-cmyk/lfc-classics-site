#!/usr/bin/env node
// FEI Art Learning Library -- merges a curated batch file into
// v3/data/topics.json. Node, no dependencies, reusable across batches.
//
// Usage: node v3/scripts/merge-batch.mjs <path-to-batch.json>
//
// Batch shape: { batch, category, checked, newTopics: [...], updateTopics: [...], stillHidden: [...] }
// - newTopics: appended as-is, with missing fields defaulted (hidden:
//   false, lastVerified = batch.checked). Refuses to run if any
//   newTopics id already exists in topics.json.
// - updateTopics: { id, unhide, addResources } -- addResources are
//   appended to that topic's resources, skipping any whose url already
//   exists on it. unhide:true also sets hidden:false. Refuses to run if
//   any updateTopics id does NOT exist in topics.json.
// - stillHidden: informational only (documents why a topic is still
//   hidden) -- this script does not need to touch those topics at all,
//   since "still hidden" means "leave it exactly as it is."

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const TOPICS_PATH = join(ROOT, 'v3', 'data', 'topics.json');

const DEFAULT_TOPIC_FIELDS = {
  keyConcepts: [],
  tryIt: '',
  keywords: [],
  relatedTopics: [],
  resources: []
};

function fail(message) {
  console.error(`[merge-batch] ${message}`);
  process.exit(1);
}

function main() {
  const batchPath = process.argv[2];
  if (!batchPath) fail('usage: node v3/scripts/merge-batch.mjs <path-to-batch.json>');

  const batch = JSON.parse(readFileSync(resolve(batchPath), 'utf8'));
  const topics = JSON.parse(readFileSync(TOPICS_PATH, 'utf8'));
  const byId = new Map(topics.map((t) => [t.id, t]));

  const newTopics = batch.newTopics || [];
  const updateTopics = batch.updateTopics || [];

  // Refuse up front, before mutating anything, so a bad batch never
  // leaves topics.json half-merged.
  for (const nt of newTopics) {
    if (byId.has(nt.id)) fail(`newTopics id "${nt.id}" already exists in topics.json -- refusing to run.`);
  }
  for (const ut of updateTopics) {
    if (!byId.has(ut.id)) fail(`updateTopics id "${ut.id}" does not exist in topics.json -- refusing to run.`);
  }

  const addedIds = [];
  for (const nt of newTopics) {
    const topic = {
      ...DEFAULT_TOPIC_FIELDS,
      ...nt,
      hidden: nt.hidden != null ? nt.hidden : nt.state === 'C',
      lastVerified: nt.lastVerified || batch.checked,
      // Every batch-curated topic is "core" -- search.js gives these a
      // small ranking boost over the original courses.json-derived
      // topics on ties/near-ties, since a hand-curated topic with real
      // verified resources is usually what a searcher actually wants.
      core: true
    };
    topics.push(topic);
    addedIds.push(topic.id);
  }

  const updatedIds = [];
  for (const ut of updateTopics) {
    const topic = byId.get(ut.id);
    const existingUrls = new Set((topic.resources || []).map((r) => r.url));
    const toAdd = (ut.addResources || []).filter((r) => !existingUrls.has(r.url));
    topic.resources = [...(topic.resources || []), ...toAdd];
    if (ut.unhide === true) topic.hidden = false;
    updatedIds.push({ id: ut.id, added: toAdd.length, skipped: (ut.addResources || []).length - toAdd.length });
  }

  writeFileSync(TOPICS_PATH, JSON.stringify(topics, null, 2) + '\n');

  console.log(`[merge-batch] Batch "${batch.batch}" merged into ${TOPICS_PATH}`);
  console.log(`  Added ${addedIds.length} new topic(s): ${addedIds.join(', ') || '(none)'}`);
  for (const u of updatedIds) {
    console.log(`  Updated ${u.id}: +${u.added} resource(s)${u.skipped ? `, skipped ${u.skipped} duplicate(s)` : ''}`);
  }
  if ((batch.stillHidden || []).length) {
    console.log(`  Still hidden (no change made): ${batch.stillHidden.map((s) => s.id).join(', ')}`);
  }
}

main();

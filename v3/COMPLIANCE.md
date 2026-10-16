# FEI Art Learning Library — Compliance Policy

Legal compliance comes first. It outranks design, completeness and
convenience. If something is uncertain, leave it out or show a text
link card instead. Never "probably fine" — if this document does not
clearly allow something, it is not allowed.

This file is enforced by `v3/scripts/check-compliance.mjs`, which runs
automatically from `v3/scripts/merge-batch.mjs` and must also be run
by hand before every commit that touches `v3/`.

## 1. Images

An image is shown **only** if one of these is true:

- **The Art Institute of Chicago** — the artwork has `is_public_domain:
  true` (AIC releases these under CC0). Image URL host must be
  `www.artic.edu` (path `/iiif/2/...`).
- **The Metropolitan Museum of Art** — the object has `isPublicDomain:
  true` (Met Open Access, CC0). Image URL host must be
  `images.metmuseum.org`.
- **FEI TeamArt original artwork that FEI TeamArt owns**, listed by the
  owner in `v3/config/own-assets.json` (empty for now — nothing is
  approved yet).
- Never a student's artwork without written parent/guardian permission
  on file.

Everything else gets **no image** — other museums, Wikimedia, Google
Arts & Culture, Pinterest, blogs, screenshots, AI-generated copies of
artworks, and images from Webflow's CDN of unknown origin (including
`coverImage`/`thumbnailImage` inherited from `v2/data/courses.json`,
which must never be carried into `v3/`). Use a text link card instead.

### Image captions (always shown)

- **AIC**: `<Artist>. <Title>, <Date>. The Art Institute of Chicago.`
  plus a `Public Domain (CC0)` label and a link to the artwork page.
- **Met**: `<Artist>. <Title>, <Date>. The Metropolitan Museum of Art,
  Open Access (CC0).` plus a link to the object page.

## 2. Videos

- Only official embeds: `https://www.youtube-nocookie.com/embed/<id>`.
  Never download, re-upload or screen-record a video.
- Publisher is whatever oEmbed's `author_name` returns, and the
  correct creator is credited — both checked by hand before a video
  resource is added (see each batch's own verification report).
- If embedding is disabled or an oEmbed check fails, show a link card
  instead. Never mirror the video file itself.

## 3. Links and text

- Linking to a public page is fine. Always name the publisher — a
  resource with no publisher is not allowed (not even "unknown").
- All summaries, notes and "Try It Yourself" text are written in our
  own words. No copied sentences from museum essays, Wikipedia or
  articles. A quote is allowed only if it is under 15 words, in
  quotation marks, credited, and there is at most one per source.
- No PDFs or files from unofficial "free download" sites. Concretely:
  a link to a file-hosting service (e.g. a Google Drive share link)
  with no identifiable publisher is treated as unverified and removed,
  not kept with a blank publisher field — this is exactly the
  pirated-book risk this rule exists to catch.

## 4. Characters, brands and trademarks

- No commercial characters (games, anime, films, cartoons) and no
  brand logos, in any image.
- Topics built around copying commercial characters are hidden
  (`hidden: true`, with `hiddenReason` explaining why) rather than
  deleted, so the underlying lesson content is preserved but never
  shown in search, categories, related topics or featured items.
- The blocked-brand-name list lives in `v3/config/compliance.json` so
  it can be extended without a code change.

## 5. Fonts and code

- Fonts: Google Fonts only. Montserrat and Open Sans are both SIL Open
  Font License, which is fine for this use.
- Icons: **no icon set is in use yet.** The one icon in `v3/` today
  (the search field's magnifier) is a hand-drawn inline SVG written
  for this project, not sourced from any icon library — there is
  nothing to license here. If an icon set is ever added, record its
  name and license in this section before using it.

## 6. Enforcement

`v3/scripts/check-compliance.mjs` scans `v3/data/topics.json`, every
file in `v3/data/batches/`, and all `v3/**/*.html|css|js`. It fails
(exit code 1) if any of the following is true:

1. An image resource has a `license` outside `{Public Domain, CC0}`,
   or an `imageUrl` host outside `{www.artic.edu, images.metmuseum.org}`.
2. Any `<img>`, CSS `url(...)` or `background-image` points to a host
   outside the allowlist (local files under `v3/` are allowed only if
   listed in `v3/config/own-assets.json`; inline `data:` URIs — the
   hand-drawn search icon — are always allowed, since they reference
   no external host at all).
3. A resource has no `publisher`.
4. A video `embedUrl` is not `https://www.youtube-nocookie.com/embed/<id>`.
5. A `hidden` or `noImages` topic has an image resource.
6. Any **visible** topic's text (title, summary, tryIt, imageNote,
   keyConcepts, or any resource's title/note/creator/publisher)
   contains a blocked brand name from `v3/config/compliance.json`.
   Hidden topics are exempt from this specific check, since their text
   is never shown — that is what `hidden: true` is for.

## 7. Data model note

`imageNote` (optional, string) — one short line explaining why a topic
has no image resources (e.g. the artworks are still under copyright).
Rendered on the topic page as a quiet `--muted` line with a small
inline "i" icon (a plain bordered circle, not an SVG or icon-library
glyph — nothing to license), right above the resource sections. Omit
the field entirely on topics that do have images.

`merge-batch.mjs` runs this check after writing `topics.json` and
refuses the merge (restoring the previous file) if it fails.

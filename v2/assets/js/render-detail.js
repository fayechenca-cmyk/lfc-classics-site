function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function badgeMapFromList(badges = []) {
  return new Map((badges || []).map(badge => [badge.id, badge]));
}

function getLearning(course) {
  return course.learning || {
    state: 'reference_only',
    entryMode: 'detail_then_launch',
    lessonType: 'lfc',
    smartClassEnabled: false,
    launchMode: 'none',
    courseEntryUrl: '',
    prototypeEntryUrl: '',
    smartClassEntryUrl: '',
    previewUrl: '',
    independentSystemUrl: '',
    accessMode: 'none',
    purchaseRequired: false,
    statusLabel: 'Reference Lesson',
    ctaLabel: 'Explore This Course'
  };
}

function renderBadgeVisual(badge) {
  if (!badge) {
    return `<div class="detail-badge-fallback">🏆</div>`;
  }

  if (badge.imgUrl) {
    return `<img src="${escapeHtml(badge.imgUrl)}" alt="${escapeHtml(badge.title)}">`;
  }

  return `<div class="detail-badge-fallback">${escapeHtml(badge.emoji || '🏆')}</div>`;
}

function renderQuickFacts(course) {
  const facts = [
    course.id,
    course.seriesTitle,
    course.level,
    course.section,
    course.ageLabel,
    course.pd ? 'PD/CC0' : ''
  ].filter(Boolean);

  return facts
    .map(item => `<span class="meta-pill meta-pill-accent">${escapeHtml(item)}</span>`)
    .join('');
}

function renderLearningStatus(course) {
  const learning = getLearning(course);
  const pills = [learning.statusLabel || 'Course Entry'];

  if (learning.accessMode && learning.accessMode !== 'none') {
    pills.push(learning.accessMode);
  }

  return pills
    .map(item => `<span class="meta-pill">${escapeHtml(item)}</span>`)
    .join('');
}

function getPrimaryAction(learning) {
  if (learning.launchMode === 'prototype_link' && learning.prototypeEntryUrl) {
    return {
      label: learning.ctaLabel || 'Enter Smart Class',
      href: learning.prototypeEntryUrl,
      kind: 'link'
    };
  }

  if (learning.launchMode === 'shared_shell' && learning.smartClassEntryUrl) {
    return {
      label: learning.ctaLabel || 'Enter Smart Class',
      href: learning.smartClassEntryUrl,
      kind: 'link'
    };
  }

  if (learning.launchMode === 'independent_system' && learning.independentSystemUrl) {
    return {
      label: learning.ctaLabel || 'Enter Path',
      href: learning.independentSystemUrl,
      kind: 'link'
    };
  }

  if (learning.state === 'smart_preview' && learning.previewUrl) {
    return {
      label: learning.ctaLabel || 'Open Preview',
      href: learning.previewUrl,
      kind: 'link'
    };
  }

  return {
    label: learning.ctaLabel || 'Explore This Course',
    href: '',
    kind: 'button'
  };
}

function getSecondaryActions(learning) {
  const actions = [];

  if (learning.courseEntryUrl) {
    actions.push({
      label: 'View Course Overview',
      href: learning.courseEntryUrl
    });
  }

  if (learning.launchMode === 'none') {
    actions.push({
      label: 'Start the Survey',
      href: 'https://www.feiteamart.com/art-path-survey'
    });
  }

  if (learning.launchMode === 'independent_system') {
    actions.push({
      label: 'Take the Survey',
      href: 'https://www.feiteamart.com/art-path-survey'
    });
  }

  return actions;
}

function renderActionArea(course) {
  const learning = getLearning(course);
  const primary = getPrimaryAction(learning);
  const secondary = getSecondaryActions(learning);

  const primaryHtml = primary.kind === 'link'
    ? `
      <a class="btn btn-primary btn-block" href="${escapeHtml(primary.href)}" target="_blank" rel="noopener">
        ${escapeHtml(primary.label)}
      </a>
    `
    : `
      <button class="btn btn-primary btn-block" type="button">
        ${escapeHtml(primary.label)}
      </button>
    `;

  const secondaryHtml = secondary.map(action => `
    <a class="btn btn-secondary btn-block" href="${escapeHtml(action.href)}" target="_blank" rel="noopener">
      ${escapeHtml(action.label)}
    </a>
  `).join('');

  return `
    <section class="detail-note-card">
      <div class="eyebrow">Next Step</div>
      <p>${escapeHtml(learning.statusLabel || 'Course Entry')}</p>
      <div class="detail-actions-stack">
        ${primaryHtml}
        ${secondaryHtml}
      </div>
    </section>
  `;
}

function renderResources(course) {
  const learning = getLearning(course);
  const labels = [];

  if (learning.launchMode === 'prototype_link') {
    labels.push('<span class="resource-label resource-label-available">Prototype Ready</span>');
  }

  if (learning.launchMode === 'shared_shell') {
    labels.push('<span class="resource-label resource-label-available">Smart Class</span>');
  }

  if (learning.launchMode === 'independent_system') {
    labels.push('<span class="resource-label resource-label-available">Independent Path</span>');
  }

  if (course.pd) {
    labels.push('<span class="resource-label resource-label-available">PD/CC0</span>');
  }

  if (!labels.length) {
    return `<p class="detail-muted">This course is currently available as a reference-first lesson entry.</p>`;
  }

  return `<div class="resource-list">${labels.join('')}</div>`;
}

function renderRefs(course) {
  const refs = course.refs || [];
  if (!refs.length) {
    return `<p class="detail-muted">Reference pack will be added here.</p>`;
  }

  return `
    <div class="detail-ref-list">
      ${refs.slice(0, 4).map(ref => `
        <article class="detail-ref-card">
          <h4>${escapeHtml(ref.artist || 'Reference')}</h4>
          <p><em>${escapeHtml(ref.work || '')}</em></p>
          <p>${escapeHtml(ref.year || '')}${ref.museum ? ` • ${escapeHtml(ref.museum)}` : ''}</p>
          ${ref.license ? `<p class="detail-ref-license">${escapeHtml(ref.license)}</p>` : ''}
          ${ref.url && ref.url !== '#'
            ? `<a class="inline-link" href="${escapeHtml(ref.url)}" target="_blank" rel="noopener">Source</a>`
            : ''
          }
        </article>
      `).join('')}
    </div>
  `;
}

function renderLearningModes(course) {
  const learning = getLearning(course);
  const items = [];

  if (learning.launchMode === 'prototype_link' && learning.prototypeEntryUrl) {
    items.push(`
      <article class="detail-mode-card">
        <div class="card-kicker">Test Build</div>
        <h4>Smart Class Prototype</h4>
        <p>This course currently opens through a working Smart Class prototype.</p>
        <a class="btn btn-primary btn-block" href="${escapeHtml(learning.prototypeEntryUrl)}" target="_blank" rel="noopener">
          Enter Smart Class
        </a>
      </article>
    `);
  } else if (learning.launchMode === 'shared_shell' && learning.smartClassEntryUrl) {
    items.push(`
      <article class="detail-mode-card">
        <div class="card-kicker">Live Lesson</div>
        <h4>Smart Class</h4>
        <p>This course is connected to the shared Smart Class lesson shell.</p>
        <a class="btn btn-primary btn-block" href="${escapeHtml(learning.smartClassEntryUrl)}" target="_blank" rel="noopener">
          Enter Smart Class
        </a>
      </article>
    `);
  } else if (learning.state === 'smart_preview' && learning.previewUrl) {
    items.push(`
      <article class="detail-mode-card">
        <div class="card-kicker">Preview</div>
        <h4>Smart Class Preview</h4>
        <p>Explore a partial or preview lesson before full access opens.</p>
        <a class="btn btn-primary btn-block" href="${escapeHtml(learning.previewUrl)}" target="_blank" rel="noopener">
          Open Preview
        </a>
      </article>
    `);
  } else if (learning.launchMode === 'independent_system' && learning.independentSystemUrl) {
    items.push(`
      <article class="detail-mode-card">
        <div class="card-kicker">Independent System</div>
        <h4>External Learning Path</h4>
        <p>This course continues in a separate learning system while remaining part of the FEI ecosystem.</p>
        <a class="btn btn-primary btn-block" href="${escapeHtml(learning.independentSystemUrl)}" target="_blank" rel="noopener">
          ${escapeHtml(learning.ctaLabel || 'Enter Path')}
        </a>
      </article>
    `);
  } else {
    items.push(`
      <article class="detail-mode-card">
        <div class="card-kicker">Reference-First</div>
        <h4>Course Entry Layer</h4>
        <p>Use this course to explore its references, path, and badge connection while deeper Smart Class content is still growing.</p>
        <button class="btn btn-secondary btn-block" type="button">
          Smart Class Coming Soon
        </button>
      </article>
    `);
  }

  if (course.feedbackMode) {
    items.push(`
      <article class="detail-mode-card">
        <div class="card-kicker">Instructor Support</div>
        <h4>Smart Class + Feedback</h4>
        <p>Use the course pathway, then receive personalized feedback from a human instructor.</p>
        <button class="btn btn-secondary btn-block" type="button">Request Access</button>
      </article>
    `);
  }

  if (course.mentorshipMode) {
    items.push(`
      <article class="detail-mode-card">
        <div class="card-kicker">Deep Guidance</div>
        <h4>1-on-1 Mentorship</h4>
        <p>Study this direction with tailored support, portfolio guidance, and long-term artistic direction.</p>
        ${
          course.mentorshipUrl
            ? `<a class="btn btn-primary btn-block" href="${escapeHtml(course.mentorshipUrl)}" target="_blank" rel="noopener">Apply</a>`
            : `<button class="btn btn-secondary btn-block" type="button">Ask About Mentorship</button>`
        }
      </article>
    `);
  }

  return `<div class="detail-mode-grid">${items.join('')}</div>`;
}

function renderRelatedCourses(course, allCourses = []) {
  const related = allCourses
    .filter(item =>
      item.id !== course.id &&
      item.active !== false &&
      (
        item.seriesId === course.seriesId ||
        item.badgeId === course.badgeId
      )
    )
    .slice(0, 3);

  if (!related.length) {
    return `<p class="detail-muted">Related courses will appear here.</p>`;
  }

  return `
    <div class="detail-related-list">
      ${related.map(item => `
        <button
          class="detail-related-item js-view-course"
          type="button"
          data-course-id="${escapeHtml(item.id)}"
        >
          <div class="detail-related-series">${escapeHtml(item.seriesTitle || '')}</div>
          <div class="detail-related-title">${escapeHtml(item.title)}</div>
          <div class="detail-related-meta">
            ${escapeHtml(item.ageLabel || '')}
            ${item.level ? ` • ${escapeHtml(item.level)}` : ''}
          </div>
        </button>
      `).join('')}
    </div>
  `;
}

export function renderCourseDetail(course, badges = [], allCourses = []) {
  const badgeLookup = badgeMapFromList(badges);
  const badge = badgeLookup.get(course.badgeId);

  return `
    <div class="detail-overlay" data-detail-overlay>
      <div class="detail-panel" role="dialog" aria-modal="true" aria-label="${escapeHtml(course.title)}">
        <button class="detail-close" type="button" data-detail-close aria-label="Close">×</button>

        <div class="detail-hero">
          <div class="detail-hero-media">
            ${
              course.coverImage
                ? `<img src="${escapeHtml(course.coverImage)}" alt="${escapeHtml(course.title)}">`
                : `<div class="visual-fallback">${escapeHtml(course.title)}</div>`
            }
          </div>

          <div class="detail-hero-copy">
            <div class="course-card-series">${escapeHtml(course.seriesTitle || '')}</div>
            <h2>${escapeHtml(course.title)}</h2>
            <p class="detail-summary">${escapeHtml(course.shortDescription || '')}</p>

            <div class="meta-pills">
              ${renderQuickFacts(course)}
              ${renderLearningStatus(course)}
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-grid">
            <div class="detail-main">
              <section class="detail-block">
                <div class="eyebrow">What You’ll Learn</div>
                <p>${escapeHtml(course.fullDescription || course.shortDescription || '')}</p>
              </section>

              <section class="detail-block">
                <div class="eyebrow">Course Status</div>
                ${renderResources(course)}
              </section>

              <section class="detail-block">
                <div class="eyebrow">Learning Modes</div>
                ${renderLearningModes(course)}
              </section>

              <section class="detail-block">
                <div class="eyebrow">Related Courses</div>
                ${renderRelatedCourses(course, allCourses)}
              </section>

              <section class="detail-block">
                <div class="eyebrow">Learn From Collection</div>
                ${renderRefs(course)}
              </section>
            </div>

            <aside class="detail-side">
              <section class="detail-badge-card">
                <div class="eyebrow">Badge Connection</div>
                <div class="detail-badge-visual">
                  ${renderBadgeVisual(badge)}
                </div>
                <h3>${escapeHtml(badge?.title || 'Badge Path')}</h3>
                <p>
                  ${
                    badge?.description
                      ? escapeHtml(badge.description)
                      : 'This course supports a creative badge journey in the FEI learning system.'
                  }
                </p>
              </section>

              ${renderActionArea(course)}

              <section class="detail-note-card">
                <div class="eyebrow">Need Guidance?</div>
                <p>Not sure if this is the right starting point for you?</p>
                <a href="https://www.feiteamart.com/art-path-survey" class="btn btn-gradient btn-block">
                  Start the Survey
                </a>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  `;
}

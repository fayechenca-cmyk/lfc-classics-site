function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function badgeLookupMap(badges) {
  return new Map((badges || []).map(badge => [badge.id, badge]));
}

function getBadgeVisual(badge) {
  if (!badge) {
    return `<div class="badge-fallback">🏆</div>`;
  }

  if (badge.imgUrl) {
    return `<img src="${escapeHtml(badge.imgUrl)}" alt="${escapeHtml(badge.title)}">`;
  }

  return `<div class="badge-fallback">${escapeHtml(badge.emoji || '🏆')}</div>`;
}

export function renderPathCards(paths = []) {
  return paths.map(path => {
    const meta = [
      path.ageLabel || '',
      path.badgeHint || '',
      path.lessonCount ? `${path.lessonCount} lessons` : ''
    ].filter(Boolean);

    return `
      <article class="path-card card-hover">
        <div class="path-card-media">
          ${
            path.coverImage
              ? `<img src="${escapeHtml(path.coverImage)}" alt="${escapeHtml(path.title)}">`
              : `<div class="visual-fallback">${escapeHtml(path.title)}</div>`
          }
        </div>
        <div class="path-card-body">
          <div class="card-kicker">${escapeHtml(path.kicker || 'Learning Path')}</div>
          <h3>${escapeHtml(path.title)}</h3>
          <p>${escapeHtml(path.description || '')}</p>
          <div class="path-meta">
            ${meta.map(item => `<span class="path-meta-pill">${escapeHtml(item)}</span>`).join('')}
          </div>
          <div class="course-card-actions">
            <a href="${escapeHtml(path.href || '#')}" class="btn btn-primary">Explore Path</a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

export function renderCourseCards(courses = [], badges = [], opts = {}) {
  const { variant = 'featured' } = opts;
  const badgeMap = badgeLookupMap(badges);

  return courses.map(course => {
    const badge = badgeMap.get(course.badgeId);
    const cardClass = variant === 'library'
      ? 'course-card library-card card-hover'
      : 'course-card card-hover';

    return `
      <article class="${cardClass}" data-course-id="${escapeHtml(course.id)}">
        <div class="course-card-media">
          ${
            course.coverImage
              ? `<img src="${escapeHtml(course.coverImage)}" alt="${escapeHtml(course.title)}">`
              : `<div class="visual-fallback">${escapeHtml(course.title)}</div>`
          }
          <div class="badge-bubble">
            ${getBadgeVisual(badge)}
          </div>
        </div>

        <div class="course-card-body">
          <div class="course-card-series">${escapeHtml(course.seriesTitle || '')}</div>
          <h3>${escapeHtml(course.title)}</h3>
          <div class="course-card-meta">
            ${escapeHtml(course.ageLabel || '')}
            ${course.level ? ` • ${escapeHtml(course.level)}` : ''}
          </div>
          <div class="course-card-desc">
            ${escapeHtml(course.shortDescription || '')}
          </div>

          ${
            badge
              ? `<div class="reward-strip">🏆 Earn Badge: ${escapeHtml(badge.title)}</div>`
              : ''
          }

          <div class="course-card-actions">
            <button class="btn btn-primary btn-block js-view-course" type="button" data-course-id="${escapeHtml(course.id)}">
              View Course
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

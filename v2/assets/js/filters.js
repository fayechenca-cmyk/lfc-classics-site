function normalizeText(value = '') {
  return String(value).trim().toLowerCase();
}

function matchesSearch(course, query) {
  if (!query) return true;

  const haystack = [
    course.id,
    course.title,
    course.shortTitle,
    course.seriesTitle,
    ...(course.seriesAliases || []),
    course.level,
    course.section,
    course.shortDescription,
    course.fullDescription,
    ...(course.tags || []),
    ...(course.movements || []),
    ...((course.artists || []).map(artist => artist.name))
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

function matchesAge(course, ageFilter) {
  if (!ageFilter || ageFilter === 'all') return true;

  const label = course.ageLabel || '';
  const bands = course.ageBands || [];

  if (ageFilter === '4-7') {
    return label === '4-7' || bands.includes('4-7');
  }

  if (ageFilter === '8+') {
    return label === '8+' || bands.includes('8+');
  }

  if (ageFilter === '11+') {
    return label === '11+' || bands.includes('11+');
  }

  if (ageFilter === '14+') {
    return label === '14+' || bands.includes('14+');
  }

  if (ageFilter === 'Adults') {
    return label === 'Adults' || bands.includes('Adults');
  }

  return true;
}

function matchesSeries(course, seriesId) {
  if (!seriesId || seriesId === 'all') return true;
  return course.seriesId === seriesId;
}

function matchesLevel(course, level) {
  if (!level || level === 'all') return true;
  return course.level === level;
}

function matchesSection(course, section) {
  if (!section || section === 'all') return true;
  return course.section === section;
}

export function filterCourses(courses = [], filters = {}) {
  const query = normalizeText(filters.search);

  return courses.filter(course => {
    if (course.active === false) return false;
    if (course.showInCatalog === false) return false;
    if (!matchesSearch(course, query)) return false;
    if (!matchesAge(course, filters.age)) return false;
    if (!matchesSeries(course, filters.seriesId)) return false;
    if (!matchesLevel(course, filters.level)) return false;
    if (!matchesSection(course, filters.section)) return false;
    return true;
  });
}

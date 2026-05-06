const DATA_PATHS = {
  courses: 'data/courses.json',
  badges: 'data/badges.json',
  series: 'data/series.json',
  featuredCourses: 'data/featured-courses.json',
  featuredPaths: 'data/featured-paths.json',
  portalCompat: 'data/portal-compat.json'
};

async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to load: ${path}`);
  }
  return res.json();
}

export async function loadAllData() {
  const [
    courses,
    badges,
    series,
    featuredCourses,
    featuredPaths,
    portalCompat
  ] = await Promise.all([
    fetchJson(DATA_PATHS.courses),
    fetchJson(DATA_PATHS.badges),
    fetchJson(DATA_PATHS.series),
    fetchJson(DATA_PATHS.featuredCourses),
    fetchJson(DATA_PATHS.featuredPaths),
    fetchJson(DATA_PATHS.portalCompat)
  ]);

  return {
    courses,
    badges,
    series,
    featuredCourses,
    featuredPaths,
    portalCompat
  };
}

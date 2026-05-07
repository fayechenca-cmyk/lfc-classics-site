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

async function fetchJsonOptional(path, fallback) {
  try {
    return await fetchJson(path);
  } catch (error) {
    console.warn(`Optional data failed to load: ${path}`, error);
    return fallback;
  }
}

export async function loadAllData() {
  const [courses, badges, series] = await Promise.all([
    fetchJson(DATA_PATHS.courses),
    fetchJson(DATA_PATHS.badges),
    fetchJson(DATA_PATHS.series)
  ]);

  const [featuredCourses, featuredPaths, portalCompat] = await Promise.all([
    fetchJsonOptional(DATA_PATHS.featuredCourses, []),
    fetchJsonOptional(DATA_PATHS.featuredPaths, []),
    fetchJsonOptional(DATA_PATHS.portalCompat, {})
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

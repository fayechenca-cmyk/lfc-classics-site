import { loadAllData } from './data-loader.js';
import { filterCourses } from './filters.js';
import { renderPathCards, renderCourseCards } from './render-cards.js';
import { renderCourseDetail } from './render-detail.js';
import { renderLibrarySection } from './render-home.js';

const state = {
  data: null,
  visibleCount: 12,
  filters: {
    search: '',
    age: 'all',
    part: 'all',
    seriesId: 'all',
    level: 'all',
    section: 'all',
    sort: 'num',
    pdOnly: false
  }
};

function byIds(source = [], ids = []) {
  const map = new Map(source.map(item => [item.id, item]));
  return ids.map(id => map.get(id)).filter(Boolean);
}

function populateSeriesFilter(series = []) {
  const select = document.getElementById('seriesFilter');
  if (!select) return;

  const options = series
    .filter(item => item.active !== false)
    .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999))
    .map(item => `<option value="${item.id}">${item.title}</option>`)
    .join('');

  select.insertAdjacentHTML('beforeend', options);
}

function populatePartFilter(courses = []) {
  const select = document.getElementById('partFilter');
  if (!select) return;

  const parts = [...new Set(courses.map(course => course.part).filter(Boolean))].sort();
  const options = parts.map(part => `<option value="${part}">${part}</option>`).join('');
  select.insertAdjacentHTML('beforeend', options);
}

function populateLevelFilter(courses = []) {
  const select = document.getElementById('levelFilter');
  if (!select) return;

  const levels = [...new Set(courses.map(course => course.level).filter(Boolean))].sort();
  const options = levels.map(level => `<option value="${level}">${level}</option>`).join('');
  select.insertAdjacentHTML('beforeend', options);
}

function sortCourses(courses = [], sort = 'num') {
  const items = [...courses];

  items.sort((a, b) => {
    if (sort === 'az') return a.title.localeCompare(b.title);
    if (sort === 'za') return b.title.localeCompare(a.title);
    return a.id.localeCompare(b.id);
  });

  return items;
}

function populateSectionFilter(courses = []) {
  const select = document.getElementById('sectionFilter');
  if (!select) return;

  const sections = [...new Set(courses.map(course => course.section).filter(Boolean))].sort();
  const options = sections.map(section => `<option value="${section}">${section}</option>`).join('');
  select.insertAdjacentHTML('beforeend', options);
}

function renderFeaturedPaths() {
  const grid = document.getElementById('featuredPathsGrid');
  if (!grid) return;

  const { series = [], featuredPaths = [] } = state.data;
  const pathObjects = featuredPaths.length
    ? featuredPaths
    : series.filter(item => item.featured);

  grid.innerHTML = renderPathCards(pathObjects);
}

function renderFeaturedCourses() {
  const grid = document.getElementById('featuredCoursesGrid');
  if (!grid) return;

  const { courses = [], badges = [], featuredCourses = [] } = state.data;
  const selectedCourses = featuredCourses.length
    ? byIds(courses, featuredCourses.map(item => item.courseId))
    : courses.filter(item => item.featured).slice(0, 6);

  grid.innerHTML = renderCourseCards(selectedCourses, badges, state.data.series, { variant: 'featured' });
}

function getFilteredCourses() {
  const { courses = [] } = state.data;
  return sortCourses(filterCourses(courses, state.filters), state.filters.sort);
}

function renderFullLibrary() {
  const grid = document.getElementById('fullCourseGrid');
  const meta = document.getElementById('resultsMeta');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const filteredCourses = getFilteredCourses();

  renderLibrarySection({
    mount: grid,
    meta,
    loadMoreBtn,
    courses: filteredCourses,
    badges: state.data.badges,
    series: state.data.series,
    visibleCount: state.visibleCount
  });
}

function scrollToResults() {
  const section = document.getElementById('resultsSection');
  if (!section) return;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function bindLoadMore() {
  const btn = document.getElementById('loadMoreBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    state.visibleCount += 12;
    renderFullLibrary();
  });
}

function openCourseDetail(courseId) {
  const mount = document.getElementById('courseDetailMount');
  if (!mount) return;

  const course = state.data.courses.find(item => item.id === courseId);
  if (!course) return;

  mount.hidden = false;
  mount.innerHTML = renderCourseDetail(course, state.data.badges, state.data.series, state.data.courses);
  document.body.style.overflow = 'hidden';
}

function closeCourseDetail() {
  const mount = document.getElementById('courseDetailMount');
  if (!mount) return;

  mount.innerHTML = '';
  mount.hidden = true;
  document.body.style.overflow = '';
}

function bindCourseButtons() {
  document.addEventListener('click', event => {
    const openBtn = event.target.closest('.js-view-course');
    if (openBtn) {
      const courseId = openBtn.getAttribute('data-course-id');
      openCourseDetail(courseId);
      return;
    }

    const closeBtn = event.target.closest('[data-detail-close]');
    if (closeBtn) {
      closeCourseDetail();
      return;
    }

    const overlay = event.target.closest('[data-detail-overlay]');
    const panel = event.target.closest('.detail-panel');
    if (overlay && !panel) {
      closeCourseDetail();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeCourseDetail();
    }
  });
}

function bindSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  input.addEventListener('input', event => {
    state.filters.search = event.target.value || '';
    state.visibleCount = 12;
    renderFullLibrary();
    scrollToResults();
  });
}

function bindAgeFilter() {
  const group = document.getElementById('ageFilterGroup');
  if (!group) return;

  group.addEventListener('click', event => {
    const btn = event.target.closest('[data-age]');
    if (!btn) return;

    state.filters.age = btn.getAttribute('data-age') || 'all';
    state.visibleCount = 12;

    group.querySelectorAll('.chip').forEach(chip => chip.classList.remove('chip-active'));
    btn.classList.add('chip-active');

    renderFullLibrary();
    scrollToResults();
  });
}

function bindSelectFilters() {
  const partFilter = document.getElementById('partFilter');
  const seriesFilter = document.getElementById('seriesFilter');
  const levelFilter = document.getElementById('levelFilter');
  const sectionFilter = document.getElementById('sectionFilter');
  const sortFilter = document.getElementById('sortFilter');
  const pdOnlyFilter = document.getElementById('pdOnlyFilter');

  if (partFilter) {
    partFilter.addEventListener('change', event => {
      state.filters.part = event.target.value || 'all';
      state.visibleCount = 12;
      renderFullLibrary();
      scrollToResults();
    });
  }

  if (seriesFilter) {
    seriesFilter.addEventListener('change', event => {
      state.filters.seriesId = event.target.value || 'all';
      state.visibleCount = 12;
      renderFullLibrary();
      scrollToResults();
    });
  }

  if (levelFilter) {
    levelFilter.addEventListener('change', event => {
      state.filters.level = event.target.value || 'all';
      state.visibleCount = 12;
      renderFullLibrary();
      scrollToResults();
    });
  }

  if (sectionFilter) {
    sectionFilter.addEventListener('change', event => {
      state.filters.section = event.target.value || 'all';
      state.visibleCount = 12;
      renderFullLibrary();
      scrollToResults();
    });
  }

  if (sortFilter) {
    sortFilter.addEventListener('change', event => {
      state.filters.sort = event.target.value || 'num';
      state.visibleCount = 12;
      renderFullLibrary();
      scrollToResults();
    });
  }

  if (pdOnlyFilter) {
    pdOnlyFilter.addEventListener('change', event => {
      state.filters.pdOnly = Boolean(event.target.checked);
      state.visibleCount = 12;
      renderFullLibrary();
      scrollToResults();
    });
  }
}

function applySeriesPath(seriesId) {
  if (!seriesId || !state.data?.series?.some(item => item.id === seriesId)) return;

  state.filters.seriesId = seriesId;
  state.visibleCount = 12;

  const seriesFilter = document.getElementById('seriesFilter');
  if (seriesFilter) {
    seriesFilter.value = seriesId;
  }

  renderFullLibrary();
  scrollToResults();

  const librarySection = document.getElementById('fullCourseGrid');
  if (librarySection) {
    librarySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function bindPathLinks() {
  document.addEventListener('click', event => {
    const pathLink = event.target.closest('#featuredPathsGrid a[href^="#series/"]');
    if (!pathLink) return;

    event.preventDefault();

    const href = pathLink.getAttribute('href') || '';
    const seriesId = href.replace(/^#series\//, '').trim();
    applySeriesPath(seriesId);
  });
}

function handleInitialHash() {
  const hash = window.location.hash || '';
  if (!hash.startsWith('#series/')) return;

  const seriesId = hash.replace(/^#series\//, '').trim();
  if (!seriesId) return;

  applySeriesPath(seriesId);
}

async function init() {
  try {
    state.data = await loadAllData();

    populatePartFilter(state.data.courses);
    populateSeriesFilter(state.data.series);
    populateLevelFilter(state.data.courses);
    populateSectionFilter(state.data.courses);

    renderFeaturedPaths();
    renderFeaturedCourses();
    renderFullLibrary();

    bindLoadMore();
    bindCourseButtons();
    bindSearch();
    bindAgeFilter();
    bindSelectFilters();
    bindPathLinks();
    handleInitialHash();
  } catch (error) {
    console.error(error);
  }
}

init();

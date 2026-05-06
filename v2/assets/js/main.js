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
    seriesId: 'all',
    level: 'all',
    section: 'all'
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

function populateLevelFilter(courses = []) {
  const select = document.getElementById('levelFilter');
  if (!select) return;

  const levels = [...new Set(courses.map(course => course.level).filter(Boolean))].sort();
  const options = levels.map(level => `<option value="${level}">${level}</option>`).join('');
  select.insertAdjacentHTML('beforeend', options);
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

  grid.innerHTML = renderCourseCards(selectedCourses, badges, { variant: 'featured' });
}

function getFilteredCourses() {
  const { courses = [] } = state.data;
  return filterCourses(courses, state.filters);
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
    visibleCount: state.visibleCount
  });
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
  mount.innerHTML = renderCourseDetail(course, state.data.badges, state.data.courses);
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
  });
}

function bindSelectFilters() {
  const seriesFilter = document.getElementById('seriesFilter');
  const levelFilter = document.getElementById('levelFilter');
  const sectionFilter = document.getElementById('sectionFilter');

  if (seriesFilter) {
    seriesFilter.addEventListener('change', event => {
      state.filters.seriesId = event.target.value || 'all';
      state.visibleCount = 12;
      renderFullLibrary();
    });
  }

  if (levelFilter) {
    levelFilter.addEventListener('change', event => {
      state.filters.level = event.target.value || 'all';
      state.visibleCount = 12;
      renderFullLibrary();
    });
  }

  if (sectionFilter) {
    sectionFilter.addEventListener('change', event => {
      state.filters.section = event.target.value || 'all';
      state.visibleCount = 12;
      renderFullLibrary();
    });
  }
}

async function init() {
  try {
    state.data = await loadAllData();

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
  } catch (error) {
    console.error(error);
  }
}

init();

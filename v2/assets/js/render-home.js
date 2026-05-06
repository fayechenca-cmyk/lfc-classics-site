import { renderCourseCards } from './render-cards.js';

export function renderLibrarySection({
  mount,
  meta,
  loadMoreBtn,
  courses,
  badges,
  visibleCount
}) {
  if (!mount) return;

  const visibleCourses = courses.slice(0, visibleCount);

  mount.innerHTML = renderCourseCards(visibleCourses, badges, {
    variant: 'library'
  });

  if (meta) {
    meta.textContent = `${visibleCourses.length} of ${courses.length} courses`;
  }

  if (loadMoreBtn) {
    loadMoreBtn.hidden = visibleCourses.length >= courses.length;
  }
}

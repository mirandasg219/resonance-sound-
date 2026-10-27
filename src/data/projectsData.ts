import { Project } from '../types/project';

// Initial projects cleared as requested by user so they can add their own
export const INITIAL_PROJECTS: Project[] = [];

const LOCAL_STORAGE_KEY = 'resonance_sound_projects_v2';

export function getStoredProjects(): Project[] {
  try {
    // Clear legacy v1 sample projects key if present
    if (typeof window !== 'undefined' && window.localStorage) {
      if (localStorage.getItem('resonance_sound_projects_v1')) {
        localStorage.removeItem('resonance_sound_projects_v1');
      }
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('Could not read stored projects:', err);
  }
  return INITIAL_PROJECTS;
}

export function saveStoredProjects(projects: Project[]) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
    }
  } catch (err) {
    console.warn('Could not save projects to localStorage:', err);
  }
}

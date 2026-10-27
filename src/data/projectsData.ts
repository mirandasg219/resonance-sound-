import { Project } from '../types/project';

// Permanent projects committed to codebase for GitHub / public deployment
export const INITIAL_PROJECTS: Project[] = [
  {
    "id": "proj-1793078624586",
    "title": "Borderlands - Sound Redesign",
    "type": "Game",
    "description": "Sound redesign for game Borderlands.",
    "role": "Sound Designer",
    "year": "2026",
    "tools": [
      "Pro Tools"
    ],
    "mapX": 1130,
    "mapY": 780,
    "pitchHz": 440,
    "videoLink": "https://vimeo.com/1239726094?share=copy&fl=sv&fe=ci",
    "isElectronicComposition": false
  },
  {
    "id": "proj-1793078056724",
    "title": "Sound on Location - Broadcast Interview",
    "type": "TV",
    "description": "This project involved sound recording an interview of local students and then afterwards, mixing the project ready for release.",
    "role": "Sound Recordist + Mixing Engineer",
    "year": "2026",
    "tools": [
      "Pro Tools",
      "Zoom F8 Field Recorder",
      "Microphone Recording"
    ],
    "mapX": 1470,
    "mapY": 840,
    "pitchHz": 400,
    "videoLink": "https://vimeo.com/1239720446?share=copy&fl=sv&fe=ci",
    "isElectronicComposition": false
  },
  {
    "id": "proj-1793076402955",
    "title": "Electronic Production - Baby I Don't Mind",
    "type": "Electronic Music",
    "description": "A fun, upbeat jungle and breakbeat track released in 2025",
    "role": "Producer",
    "year": "2025",
    "tools": [
      "Pro Tools",
      "Wwise"
    ],
    "mapX": 1130,
    "mapY": 985,
    "pitchHz": 440,
    "videoLink": "https://soundcloud.com/miranda-skyee/babyidontmind",
    "soundCloudUrl": "https://soundcloud.com/miranda-skyee/babyidontmind",
    "isElectronicComposition": true
  },
  {
    "id": "proj-1793075764285",
    "title": "Minority Report - Sound Redesign",
    "type": "Film",
    "description": "Redesign Project for a scene in the film Minority Report. Sound resign focused on music composition and foley composition, with an emphaisis on incorporating electronic music into the scene.",
    "role": "Sound Re-designer - Composition and Foley",
    "year": "2026",
    "tools": [
      "Pro tools"
    ],
    "mapX": 1470,
    "mapY": 1049,
    "pitchHz": 440,
    "videoLink": "https://vimeo.com/reviews/c277a258-816e-413a-8296-09d01f99f62a/videos/1239717584",
    "isElectronicComposition": false
  }
];

const LOCAL_STORAGE_KEY = 'resonance_sound_projects_v2';

export function getStoredProjects(): Project[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (localStorage.getItem('resonance_sound_projects_v1')) {
        localStorage.removeItem('resonance_sound_projects_v1');
      }
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
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

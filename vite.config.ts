import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

function commitProjectsPlugin(): Plugin {
  return {
    name: 'commit-projects-plugin',
    configureServer(server) {
      server.middlewares.use('/api/commit-projects', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              const projects = data.projects;
              if (Array.isArray(projects) && projects.length > 0) {
                const targetPath = path.resolve(__dirname, 'src/data/projectsData.ts');
                const fileCode = `import { Project } from '../types/project';

// Permanent projects committed to codebase for GitHub / public deployment
export const INITIAL_PROJECTS: Project[] = ${JSON.stringify(projects, null, 2)};

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
`;
                fs.writeFileSync(targetPath, fileCode, 'utf-8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, count: projects.length }));
                return;
              }
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'projects must be a non-empty array' }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          return;
        }

        if (req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ready' }));
          return;
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), commitProjectsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

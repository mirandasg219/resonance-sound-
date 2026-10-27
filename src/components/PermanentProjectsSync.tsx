import React, { useState, useEffect } from 'react';
import { CheckCircle2, Copy, Check, UploadCloud, X, Code2 } from 'lucide-react';
import { getStoredProjects, INITIAL_PROJECTS } from '../data/projectsData';

export const PermanentProjectsSync: React.FC = () => {
  const [synced, setSynced] = useState(false);
  const [projectCount, setProjectCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [jsonText, setJsonText] = useState('');

  useEffect(() => {
    const localProjects = getStoredProjects();
    setProjectCount(localProjects.length);
    setJsonText(JSON.stringify(localProjects, null, 2));

    // If local projects exist and permanent INITIAL_PROJECTS is still empty, auto-commit them
    if (localProjects.length > 0) {
      if (INITIAL_PROJECTS.length === 0 || INITIAL_PROJECTS.length !== localProjects.length) {
        setIsSyncing(true);
        fetch('/api/commit-projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projects: localProjects }),
        })
          .then((res) => {
            if (res.ok) {
              setSynced(true);
            }
          })
          .catch((err) => {
            console.warn('Auto-sync notice:', err);
          })
          .finally(() => {
            setIsSyncing(false);
          });
      } else {
        setSynced(true);
      }
    }
  }, []);

  const handleManualCommit = async () => {
    const localProjects = getStoredProjects();
    if (localProjects.length === 0) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/commit-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: localProjects }),
      });
      if (res.ok) {
        setSynced(true);
      }
    } catch (err) {
      console.error('Failed to commit projects:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyJson = () => {
    if (!jsonText) return;
    navigator.clipboard.writeText(jsonText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (!isOpen || projectCount === 0) return null;

  return (
    <aside aria-label="Project sync status" className="fixed bottom-4 left-4 z-50 max-w-sm w-[calc(100vw-2rem)] bg-[#13141b]/95 backdrop-blur-md border border-[#a855f7]/40 rounded-xl p-4 shadow-2xl text-xs space-y-2.5 animate-fadeIn">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {synced ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <UploadCloud className="w-4 h-4 text-[#c084fc] shrink-0 animate-bounce" />
          )}
          <span className="font-semibold text-[#f3f4f6]">
            {synced
              ? `${projectCount} Projects Baked into Permanent Code!`
              : `Baking ${projectCount} Projects to Permanent Code...`}
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-[#9ca3af] hover:text-[#f3f4f6] p-1 transition-colors"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-[#9ca3af] leading-relaxed text-[11px]">
        {synced
          ? `Your ${projectCount} custom sound projects are now written into src/data/projectsData.ts so any public visitor on GitHub will see them immediately.`
          : `Syncing your projects from browser storage directly into the source code files...`}
      </p>

      <div className="flex items-center gap-2 pt-1">
        {!synced && (
          <button
            onClick={handleManualCommit}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-lg bg-[#a855f7] text-[#0b0c10] font-semibold text-[11px] hover:bg-[#9333ea] transition-all flex items-center gap-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{isSyncing ? 'Writing...' : 'Commit to Code'}</span>
          </button>
        )}

        <button
          onClick={handleCopyJson}
          className="px-2.5 py-1.5 rounded-lg bg-[#1a1b24] hover:bg-[#262732] text-[#c084fc] border border-[#262732] font-medium text-[11px] transition-colors flex items-center gap-1.5"
          title="Copy the raw JSON of your 4 projects"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied JSON!' : 'Copy Projects JSON'}</span>
        </button>
      </div>
    </aside>
  );
};

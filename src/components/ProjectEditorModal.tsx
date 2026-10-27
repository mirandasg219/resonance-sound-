import React, { useState } from 'react';
import { X, Save, Trash2, Music2, Radio } from 'lucide-react';
import { Project, ProjectType } from '../types/project';

interface ProjectEditorModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  onDelete?: (id: string) => void;
  defaultType?: ProjectType;
  existingCount?: number;
}

export const ProjectEditorModal: React.FC<ProjectEditorModalProps> = ({
  project,
  isOpen,
  onClose,
  onSave,
  onDelete,
  defaultType = 'Game',
  existingCount = 0,
}) => {
  if (!isOpen) return null;

  const isNew = !project;

  // Import balanced coordinate helper dynamically or calculate default
  const defaultAngle = (2 * Math.PI * existingCount) / Math.max(existingCount + 1, 4) - Math.PI / 2;
  const defaultX = project?.mapX ?? Math.round(1300 + Math.cos(defaultAngle) * 320);
  const defaultY = project?.mapY ?? Math.round(900 + Math.sin(defaultAngle) * 210);

  const [title, setTitle] = useState(project?.title || '');
  const [type, setType] = useState<ProjectType>(project?.type || defaultType);
  const [description, setDescription] = useState(project?.description || '');
  const [role, setRole] = useState(project?.role || '');
  const [year, setYear] = useState(project?.year || new Date().getFullYear().toString());
  const [toolsString, setToolsString] = useState(project?.tools.join(', ') || '');
  const [mapX, setMapX] = useState<number>(defaultX);
  const [mapY, setMapY] = useState<number>(defaultY);
  const [pitchHz, setPitchHz] = useState<number>(project?.pitchHz ?? 440);
  const [videoLink, setVideoLink] = useState(project?.videoLink || '');
  const [soundCloudUrl, setSoundCloudUrl] = useState(project?.soundCloudUrl || '');
  const [clientOrContext, setClientOrContext] = useState(project?.clientOrContext || '');

  // Electronic Composition field state
  const [isElectronicComposition, setIsElectronicComposition] = useState<boolean>(
    Boolean(project?.isElectronicComposition || project?.type === 'Electronic Music')
  );
  const [electronicCompositionNotes, setElectronicCompositionNotes] = useState<string>(
    project?.electronicCompositionNotes || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const toolsArray = toolsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updated: Project = {
      id: project?.id || `proj-${Date.now()}`,
      title: title.trim(),
      type,
      description: description.trim(),
      role: role.trim() || 'Sound Designer',
      year: year.trim(),
      tools: toolsArray.length > 0 ? toolsArray : ['Pro Tools', 'Wwise'],
      mapX: Number(mapX),
      mapY: Number(mapY),
      pitchHz: Number(pitchHz) || 440,
      videoLink: videoLink.trim() || undefined,
      soundCloudUrl: soundCloudUrl.trim() || undefined,
      clientOrContext: clientOrContext.trim() || undefined,
      imageUrl: project?.imageUrl,
      isElectronicComposition,
      electronicCompositionNotes: isElectronicComposition
        ? electronicCompositionNotes.trim() || undefined
        : undefined,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl bg-[#13141b] border border-[#262732] rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] text-[#f3f4f6]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#13141b]/95 backdrop-blur-md px-6 py-4 border-b border-[#262732] flex items-center justify-between z-10">
          <h2 className="font-halftone text-lg font-bold text-[#f3f4f6] tracking-wide">
            {isNew ? 'Add New Project' : 'Edit Project Entity'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#1a1b24]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-[#c084fc] uppercase mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[#0b0c10] border border-[#262732] focus:border-[#c084fc] focus:outline-none text-[#f3f4f6]"
              placeholder="e.g. Cybernetic Abyss"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#c084fc] uppercase mb-1">
                Project Type
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const val = e.target.value as ProjectType;
                  setType(val);
                  if (val === 'Electronic Music') {
                    setIsElectronicComposition(true);
                  }
                }}
                className="w-full px-3.5 py-2 rounded-lg bg-[#0b0c10] border border-[#262732] focus:border-[#c084fc] focus:outline-none text-[#f3f4f6]"
              >
                <option value="Game">Game</option>
                <option value="Film">Film</option>
                <option value="TV">TV</option>
                <option value="Electronic Music">Electronic Music</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#c084fc] uppercase mb-1">
                Year
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-[#0b0c10] border border-[#262732] focus:border-[#c084fc] focus:outline-none text-[#f3f4f6]"
                placeholder="2025"
              />
            </div>
          </div>

          {/* Electronic Composition Section with Notes & SoundCloud */}
          <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#262732] space-y-3.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="isElectronicComposition"
                className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#f3f4f6]"
              >
                <input
                  type="checkbox"
                  id="isElectronicComposition"
                  checked={isElectronicComposition}
                  onChange={(e) => setIsElectronicComposition(e.target.checked)}
                  className="w-4 h-4 rounded text-[#a855f7] bg-[#13141b] border-[#262732] focus:ring-[#c084fc] focus:ring-offset-0 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 text-[#c084fc]">
                  <Music2 className="w-3.5 h-3.5" />
                  <span>This project is an Electronic Music Composition</span>
                </div>
              </label>

              {isElectronicComposition && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#a855f7]/20 text-[#c084fc] border border-[#a855f7]/30">
                  Electronic
                </span>
              )}
            </div>

            {isElectronicComposition && (
              <div className="space-y-3 pt-1 border-t border-[#262732]/70">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[#9ca3af] uppercase">
                    Electronic Composition Notes
                  </label>
                  <textarea
                    rows={2}
                    value={electronicCompositionNotes}
                    onChange={(e) => setElectronicCompositionNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#13141b] border border-[#262732] focus:border-[#c084fc] focus:outline-none text-[#f3f4f6] text-xs"
                    placeholder="e.g. Original electronic score featuring modular synthesizer soundscapes, analog bass drones, and hybrid cues."
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[#9ca3af] uppercase flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-[#c084fc]" />
                    <span>SoundCloud Track or Playlist URL</span>
                  </label>
                  <input
                    type="text"
                    value={soundCloudUrl}
                    onChange={(e) => setSoundCloudUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#13141b] border border-[#262732] focus:border-[#c084fc] focus:outline-none text-[#f3f4f6] text-xs"
                    placeholder="https://soundcloud.com/artist/track-name"
                  />
                  <p className="text-[11px] text-[#9ca3af]">
                    Embeds a streaming SoundCloud waveform player inside this project modal.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#c084fc] uppercase mb-1">
              Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[#0b0c10] border border-[#262732] focus:border-[#c084fc] focus:outline-none text-[#f3f4f6]"
              placeholder="Composer & Sound Designer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#c084fc] uppercase mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[#0b0c10] border border-[#262732] focus:border-[#c084fc] focus:outline-none text-[#f3f4f6]"
              placeholder="Project overview, acoustic direction, and creative sound details..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#c084fc] uppercase mb-1">
              Tools (comma separated)
            </label>
            <input
              type="text"
              value={toolsString}
              onChange={(e) => setToolsString(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[#0b0c10] border border-[#262732] focus:border-[#c084fc] focus:outline-none text-[#f3f4f6]"
              placeholder="Modular Synth, Ableton Live, Pro Tools, Serum"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#c084fc] uppercase mb-1">
                Map X (0-2400)
              </label>
              <input
                type="number"
                value={mapX}
                onChange={(e) => setMapX(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0c10] border border-[#262732] focus:border-[#c084fc] focus:outline-none text-[#f3f4f6]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#c084fc] uppercase mb-1">
                Map Y (0-1600)
              </label>
              <input
                type="number"
                value={mapY}
                onChange={(e) => setMapY(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0c10] border border-[#262732] focus:border-[#c084fc] focus:outline-none text-[#f3f4f6]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#c084fc] uppercase mb-1">
                Tone Pitch (Hz)
              </label>
              <input
                type="number"
                step="0.1"
                value={pitchHz}
                onChange={(e) => setPitchHz(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0c10] border border-[#262732] focus:border-[#c084fc] focus:outline-none text-[#f3f4f6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#c084fc] uppercase mb-1">
              Client or Studio Context
            </label>
            <input
              type="text"
              value={clientOrContext}
              onChange={(e) => setClientOrContext(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[#0b0c10] border border-[#262732] focus:border-[#c084fc] focus:outline-none text-[#f3f4f6]"
              placeholder="e.g. Independent Release / Short Film / Game Studio"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#c084fc] uppercase mb-1">
              Video Reel Link (Vimeo, YouTube, or MP4)
            </label>
            <input
              type="text"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[#0b0c10] border border-[#262732] focus:border-[#c084fc] focus:outline-none text-[#f3f4f6]"
              placeholder="https://vimeo.com/123456789 or https://www.youtube.com/watch?v=..."
            />
            <p className="text-[11px] text-[#9ca3af] mt-1">
              Accepts Vimeo links (public or unlisted), YouTube, or direct video URLs. Renders as a playable video player at the bottom of the project section.
            </p>
          </div>

          <div className="pt-4 border-t border-[#262732] flex items-center justify-between gap-3">
            {!isNew && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this project marker?')) {
                    onDelete(project.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-medium text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#1a1b24] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-[#a855f7] text-[#0b0c10] hover:bg-[#9333ea] transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Project</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

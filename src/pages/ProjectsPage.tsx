import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Compass,
  ChevronRight,
  Layers,
  Music2,
} from 'lucide-react';
import { Project } from '../types/project';
import { audioService } from '../utils/audio';
import { ProjectDetailModal } from '../components/ProjectDetailModal';
import { ProjectEditorModal } from '../components/ProjectEditorModal';

interface ProjectsPageProps {
  projects: Project[];
  onUpdateProjects: (updated: Project[]) => void;
  initialSelectedProjectId?: string | null;
  onClearInitialProject?: () => void;
  studioEmail?: string;
  onNavigateContact?: () => void;
}

const MAP_WIDTH = 2600;
const MAP_HEIGHT = 1800;

// Calculate compact, harmonic, aesthetically balanced coordinates so all projects stay visible
export function calculateBalancedCoordinates(count: number, index: number): { x: number; y: number } {
  if (count <= 1) {
    return { x: 1300, y: 900 };
  }

  if (count === 2) {
    const coords = [
      { x: 1140, y: 900 },
      { x: 1460, y: 900 },
    ];
    return coords[index] || { x: 1300, y: 900 };
  }

  if (count === 3) {
    const coords = [
      { x: 1300, y: 770 },
      { x: 1130, y: 1010 },
      { x: 1470, y: 1010 },
    ];
    return coords[index] || { x: 1300, y: 900 };
  }

  if (count === 4) {
    const coords = [
      { x: 1130, y: 780 },
      { x: 1470, y: 780 },
      { x: 1130, y: 1020 },
      { x: 1470, y: 1020 },
    ];
    return coords[index] || { x: 1300, y: 900 };
  }

  if (count <= 7) {
    // Compact, cohesive harmonic orbit around center (1300, 900)
    const radiusX = 320;
    const radiusY = 210;
    const angle = (2 * Math.PI * index) / count - Math.PI / 2;
    return {
      x: Math.round(1300 + Math.cos(angle) * radiusX),
      y: Math.round(900 + Math.sin(angle) * radiusY),
    };
  }

  // 8 or more projects: two compact concentric harmonic rings (inner & outer)
  const isOuter = index % 2 === 1;
  const ringCount = isOuter ? Math.floor(count / 2) : Math.ceil(count / 2);
  const ringIndex = Math.floor(index / 2);
  const radiusX = isOuter ? 440 : 260;
  const radiusY = isOuter ? 280 : 170;
  const offset = isOuter ? Math.PI / ringCount : 0;
  const angle = (2 * Math.PI * ringIndex) / ringCount - Math.PI / 2 + offset;

  return {
    x: Math.round(1300 + Math.cos(angle) * radiusX),
    y: Math.round(900 + Math.sin(angle) * radiusY),
  };
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  onUpdateProjects,
  initialSelectedProjectId,
  onClearInitialProject,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform state: pan offset and zoom scale for map
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: -600, y: -400 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // Selected project for modal
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeCategory, setActiveCategory] = useState<'All' | 'Electronic Compositions' | 'Game' | 'TV' | 'Film'>('All');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isListDrawerOpen, setIsListDrawerOpen] = useState(false);

  // Smoothly center the map view on a coordinate
  const centerOnCoordinate = useCallback((targetX: number, targetY: number, targetScale = 1.0) => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const newX = clientWidth / 2 - targetX * targetScale;
    const newY = clientHeight / 2 - targetY * targetScale;

    setScale(targetScale);
    setPan({ x: newX, y: newY });
  }, []);

  // Frame all projects so they are 100% visible inside the viewport
  const fitAllProjectsInView = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;

    if (projects.length === 0) {
      centerOnCoordinate(1300, 900, 0.95);
      return;
    }

    const xs = projects.map((p) => p.mapX);
    const ys = projects.map((p) => p.mapY);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Buffer for marker badges and labels
    const spanX = Math.max(maxX - minX + 380, 520);
    const spanY = Math.max(maxY - minY + 260, 380);

    const fitScaleX = clientWidth / spanX;
    const fitScaleY = clientHeight / spanY;
    const targetScale = Math.min(Math.max(Math.min(fitScaleX, fitScaleY), 0.65), 1.05);

    centerOnCoordinate(centerX, centerY, targetScale);
  }, [projects, centerOnCoordinate]);

  // Initial centering on mount: if specific project was requested, center on it; otherwise frame all projects
  useEffect(() => {
    if (initialSelectedProjectId) {
      const match = projects.find((p) => p.id === initialSelectedProjectId);
      if (match) {
        centerOnCoordinate(match.mapX, match.mapY, 1.15);
        setSelectedProject(match);
        if (onClearInitialProject) onClearInitialProject();
        return;
      }
    }

    // Automatically frame all projects in view when opening the page
    fitAllProjectsInView();
  }, [centerOnCoordinate, fitAllProjectsInView, initialSelectedProjectId, onClearInitialProject, projects]);

  // Balance layout function: brings all projects into a tight, harmonic cluster
  const handleBalanceLayout = useCallback(() => {
    if (projects.length === 0) return;
    const balanced = projects.map((p, idx) => {
      const { x, y } = calculateBalancedCoordinates(projects.length, idx);
      return {
        ...p,
        mapX: x,
        mapY: y,
      };
    });
    onUpdateProjects(balanced);
    audioService.playUiBlip();
    fitAllProjectsInView();
  }, [projects, onUpdateProjects, fitAllProjectsInView]);

  // Automatic balance check: if any projects are too far spread out (> 500px from center) or overlapping, auto-tighten them
  useEffect(() => {
    if (projects.length <= 1) return;

    let needsBalance = false;
    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      const distFromCenter = Math.hypot(p.mapX - 1300, p.mapY - 900);
      if (distFromCenter > 480 || (p.mapX === 1000 && p.mapY === 700)) {
        needsBalance = true;
        break;
      }
      for (let j = i + 1; j < projects.length; j++) {
        const dx = projects[i].mapX - projects[j].mapX;
        const dy = projects[i].mapY - projects[j].mapY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          needsBalance = true;
          break;
        }
      }
      if (needsBalance) break;
    }

    if (needsBalance) {
      const balanced = projects.map((p, idx) => {
        const { x, y } = calculateBalancedCoordinates(projects.length, idx);
        return {
          ...p,
          mapX: x,
          mapY: y,
        };
      });
      onUpdateProjects(balanced);
    }
  }, [projects, onUpdateProjects]);

  // Handle marker selection
  const handleSelectMarker = (project: Project) => {
    centerOnCoordinate(project.mapX, project.mapY, 1.15);
    setSelectedProject(project);
  };

  // Drag interaction handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    // Don't initiate map dragging if clicking on an interactive marker or button
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, [data-interactive="true"]')) {
      return;
    }
    setIsDragging(true);
    hasMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved.current = true;
    }
    setPan({
      x: panStart.current.x + dx,
      y: panStart.current.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    setScale((prev) => {
      const next = Math.min(Math.max(prev + delta, 0.45), 2.2);
      return Number(next.toFixed(2));
    });
    audioService.playUiBlip();
  };

  // Wheel zoom / pan
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY < 0 ? 0.08 : -0.08;
      handleZoom(zoomFactor);
    } else {
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  // Project data mutations
  const handleSaveProject = (updated: Project) => {
    const existingIndex = projects.findIndex((p) => p.id === updated.id);
    let newList: Project[];
    if (existingIndex >= 0) {
      newList = [...projects];
      newList[existingIndex] = updated;
    } else {
      newList = [updated, ...projects];
    }
    onUpdateProjects(newList);
    if (selectedProject?.id === updated.id) {
      setSelectedProject(updated);
    }
  };

  const handleDeleteProject = (id: string) => {
    const newList = projects.filter((p) => p.id !== id);
    onUpdateProjects(newList);
    if (selectedProject?.id === id) {
      setSelectedProject(null);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Electronic Compositions') {
      return Boolean(p.isElectronicComposition || p.type === 'Electronic Music');
    }
    return p.type === activeCategory;
  });

  return (
    <div className="relative w-full h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] overflow-hidden select-none bg-[#0b0c10] text-[#f3f4f6]">
      
      {/* Top Floating Controls Strip */}
      <div className="absolute top-4 left-4 z-30 flex flex-wrap items-center gap-2 max-w-[calc(100%-6rem)] sm:max-w-[calc(100%-8rem)]">
        {/* Category Filters */}
        <div className="flex items-center p-1 bg-[#13141b]/95 backdrop-blur-md rounded-full border border-[#262732] shadow-xl overflow-x-auto max-w-full">
          {(['All', 'Electronic Compositions', 'Game', 'TV', 'Film'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                audioService.playUiBlip();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-[#a855f7] text-[#0b0c10] font-semibold shadow-sm'
                  : 'text-[#9ca3af] hover:text-[#f3f4f6]'
              }`}
            >
              {cat === 'Electronic Compositions' && <Music2 className="w-3 h-3" />}
              <span>{cat === 'All' ? 'All Projects' : cat}</span>
            </button>
          ))}
        </div>

        {/* Project List drawer trigger */}
        <button
          onClick={() => setIsListDrawerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#13141b]/90 hover:bg-[#1a1b24] border border-[#262732] text-[#f3f4f6] backdrop-blur-md shadow-lg transition-colors"
          title="Browse project catalog list"
        >
          <Layers className="w-3.5 h-3.5 text-[#c084fc]" />
          <span>Catalog ({projects.length})</span>
        </button>
      </div>

      {/* Floating Map Zoom / Recenter Navigation Tools */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={() => handleZoom(0.2)}
          aria-label="Zoom in"
          className="p-2.5 rounded-full bg-[#13141b]/90 hover:bg-[#1a1b24] text-[#f3f4f6] border border-[#262732] shadow-lg backdrop-blur-md transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-0.2)}
          aria-label="Zoom out"
          className="p-2.5 rounded-full bg-[#13141b]/90 hover:bg-[#1a1b24] text-[#f3f4f6] border border-[#262732] shadow-lg backdrop-blur-md transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={fitAllProjectsInView}
          aria-label="Fit all projects in view"
          className="p-2.5 rounded-full bg-[#13141b]/90 hover:bg-[#1a1b24] text-[#f3f4f6] border border-[#262732] shadow-lg backdrop-blur-md transition-colors"
          title="Fit All Projects in View"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* INTERACTIVE SPATIAL SOUND MAP CANVAS */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className={`w-full h-full cursor-grab active:cursor-grabbing touch-none relative ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
      >
        <div
          style={{
            width: `${MAP_WIDTH}px`,
            height: `${MAP_HEIGHT}px`,
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="relative pointer-events-auto"
        >
          {/* Subtle Grid with Faint Waveform Lines Background */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Coordinate Grid Pattern */}
              <pattern id="sound-grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path
                  d="M 80 0 L 0 0 0 80"
                  fill="none"
                  stroke="#262732"
                  strokeWidth="0.75"
                  strokeOpacity="0.45"
                />
                <circle cx="80" cy="80" r="1" fill="#c084fc" fillOpacity="0.25" />
              </pattern>

              {/* Major Subdivisions */}
              <pattern id="sound-grid-major" width="400" height="400" patternUnits="userSpaceOnUse">
                <rect width="400" height="400" fill="url(#sound-grid)" />
                <path
                  d="M 400 0 L 0 0 0 400"
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="1"
                  strokeOpacity="0.12"
                />
              </pattern>
            </defs>

            {/* Base Grid Layer */}
            <rect width="100%" height="100%" fill="url(#sound-grid-major)" />

            {/* Acoustic Waveform Lines flowing gracefully across map */}
            <g opacity="0.3" fill="none" stroke="#c084fc" strokeWidth="1.2">
              <path
                d="M 0 320 Q 300 180, 600 320 T 1200 320 T 1800 320 T 2400 320 T 2600 320"
                strokeDasharray="4 6"
              />
              <path
                d="M 0 680 Q 200 590, 400 680 T 800 680 T 1200 680 T 1600 680 T 2000 680 T 2400 680 T 2600 680"
                strokeOpacity="0.6"
              />
              <path
                d="M 0 1150 Q 350 980, 700 1150 T 1400 1150 T 2100 1150 T 2600 1150"
                strokeWidth="1.5"
                strokeOpacity="0.5"
              />
              <path
                d="M 0 1520 Q 650 1380, 1300 1520 T 2600 1520"
                strokeWidth="2"
                strokeOpacity="0.4"
                strokeDasharray="8 8"
              />
            </g>

            {/* Spatial Harmonic Concentric Circles in Purple Accents */}
            <circle cx="620" cy="480" r="180" stroke="#a855f7" strokeWidth="0.8" strokeOpacity="0.16" fill="none" strokeDasharray="3 3" />
            <circle cx="1180" cy="340" r="220" stroke="#c084fc" strokeWidth="0.8" strokeOpacity="0.12" fill="none" />
            <circle cx="1680" cy="520" r="190" stroke="#7c3aed" strokeWidth="0.8" strokeOpacity="0.15" fill="none" strokeDasharray="4 4" />
            <circle cx="1260" cy="1380" r="260" stroke="#a855f7" strokeWidth="0.8" strokeOpacity="0.1" fill="none" />
          </svg>

          {/* Project Markers Layer with smooth gliding transition */}
          {filteredProjects.map((project) => {
            const isSelected = selectedProject?.id === project.id;
            const isElectronic = Boolean(project.isElectronicComposition || project.type === 'Electronic Music');

            return (
              <div
                key={project.id}
                style={{
                  left: `${project.mapX}px`,
                  top: `${project.mapY}px`,
                  transform: 'translate(-50%, -50%)',
                  transition: isDragging ? 'none' : 'left 0.75s cubic-bezier(0.16, 1, 0.3, 1), top 0.75s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="absolute z-10 group"
              >
                {/* Marker Button */}
                <button
                  data-interactive="true"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectMarker(project);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectMarker(project);
                    }
                  }}
                  className="flex items-center gap-3 group focus:outline-none focus-visible:ring-4 focus-visible:ring-[#c084fc] rounded-full p-1 cursor-pointer pointer-events-auto"
                  aria-label={`Project ${project.title}, ${project.type}, ${project.year}`}
                >
                  <div className="relative flex items-center justify-center">
                    <span
                      className={`absolute w-8 h-8 rounded-full ${
                        isElectronic ? 'bg-[#c084fc]/40' : 'bg-[#7c3aed]/35'
                      } animate-coral-pulse ${
                        isSelected ? 'scale-150 bg-[#7c3aed]/55' : ''
                      }`}
                    />
                    <span className="absolute w-5 h-5 rounded-full border border-[#a855f7]/60 group-hover:scale-125 transition-transform duration-300" />
                    <span
                      className={`relative w-3.5 h-3.5 rounded-full ${
                        isElectronic ? 'bg-[#c084fc] shadow-[0_0_14px_#c084fc]' : 'bg-[#a855f7] shadow-[0_0_12px_#a855f7]'
                      } transition-transform duration-200 group-hover:scale-125 ${
                        isSelected ? 'scale-125 bg-white ring-2 ring-[#a855f7]' : ''
                      }`}
                    />
                  </div>

                  <div className="text-left bg-[#13141b]/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-[#262732] shadow-xl group-hover:border-[#a855f7]/60 group-hover:bg-[#1a1b24] transition-all">
                    <div className="flex items-center gap-2">
                      <span className="font-futuristic font-bold text-sm text-[#f3f4f6] group-hover:text-[#c084fc] transition-colors whitespace-nowrap">
                        {project.title}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-[#c084fc] px-1.5 py-0.2 rounded bg-[#1a1b24] border border-[#262732]">
                        {project.type}
                      </span>
                      {isElectronic && (
                        <span className="text-[10px] uppercase font-bold text-[#f3f4f6] px-1.5 py-0.2 rounded bg-[#a855f7]/30 border border-[#a855f7]/40 flex items-center gap-1">
                          <Music2 className="w-2.5 h-2.5 text-[#c084fc]" />
                          <span>Electronic</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#9ca3af]">
                      <span>{project.role.split('&')[0].trim()}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{project.pitchHz} Hz</span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State Banner on Map when no projects added yet */}
      {projects.length === 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto max-w-md w-full bg-[#13141b]/95 backdrop-blur-md border border-[#262732] p-8 rounded-2xl shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#a855f7]/15 border border-[#a855f7]/30 text-[#c084fc] flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-futuristic text-xl font-bold text-[#f3f4f6]">Sound Map Archive</h2>
              <p className="text-xs text-[#9ca3af] mt-2 leading-relaxed">
                Project recordings and interactive acoustic spatial placements are currently updating.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Info Badge */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3 pointer-events-none">
        <div className="bg-[#13141b]/90 backdrop-blur-md border border-[#262732] text-[#9ca3af] text-xs px-3.5 py-2 rounded-full shadow-xl flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7]" />
          <span>{projects.length > 0 ? 'Drag or scroll to explore. Select a marker to open details.' : 'Drag to explore the sound grid canvas.'}</span>
        </div>
      </div>

      {/* Catalog List Drawer */}
      {isListDrawerOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-[#13141b] border-l border-[#262732] p-6 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#262732]">
              <div>
                <h3 className="font-halftone text-lg font-bold text-[#f3f4f6] tracking-wide">Projects Catalog</h3>
                <p className="text-xs text-[#9ca3af]">Click any title to pan and inspect</p>
              </div>
              <button
                onClick={() => setIsListDrawerOpen(false)}
                className="text-xs text-[#9ca3af] hover:text-[#f3f4f6] px-3 py-1.5 rounded-full bg-[#1a1b24] border border-[#262732]"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              {projects.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3">
                  <p className="text-xs text-[#9ca3af]">No projects currently listed in the catalog.</p>
                </div>
              ) : (
                projects.map((proj) => {
                  const isElectronic = Boolean(proj.isElectronicComposition || proj.type === 'Electronic Music');
                  return (
                    <div
                      key={proj.id}
                      onClick={() => {
                        setIsListDrawerOpen(false);
                        handleSelectMarker(proj);
                      }}
                      className="p-3 rounded-xl bg-[#0b0c10] hover:bg-[#1a1b24] border border-[#262732] cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isElectronic ? 'bg-[#c084fc]' : 'bg-[#a855f7]'}`} />
                          <span className="font-futuristic font-semibold text-sm text-[#f3f4f6] group-hover:text-[#c084fc]">
                            {proj.title}
                          </span>
                          {isElectronic && (
                            <span className="text-[9px] uppercase font-bold text-[#c084fc] px-1.5 py-0.2 rounded bg-[#a855f7]/20 border border-[#a855f7]/30">
                              Electronic
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#9ca3af] line-clamp-1">
                          {proj.type} · {proj.role} · {proj.year}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#9ca3af] group-hover:text-[#c084fc] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected Project Inspector Panel */}
      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />

      {/* Project Entity Editor Modal */}
      <ProjectEditorModal
        project={editingProject}
        isOpen={isEditorOpen}
        existingCount={projects.length}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
      />
    </div>
  );
};

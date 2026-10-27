import React, { useEffect } from 'react';
import { X, ExternalLink, Calendar, User, Wrench, Video, Music2, Radio } from 'lucide-react';
import { Project } from '../types/project';

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
  onEdit?: (project: Project) => void;
}

// Clean and extract URL from raw text or pasted iframe snippets
function extractCleanUrl(input?: string): string {
  if (!input) return '';
  let str = input.trim();
  // If user pasted an iframe embed snippet: extract src attribute
  const iframeSrcMatch = str.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    str = iframeSrcMatch[1];
  }
  // Unescape html entities
  str = str.replace(/&amp;/g, '&');
  return str.trim();
}

// Robust Vimeo URL parser supporting public, unlisted, and review links
function parseVimeoEmbed(rawInput?: string): { embedUrl: string; directUrl: string } | null {
  if (!rawInput || !rawInput.trim()) return null;
  const str = extractCleanUrl(rawInput);

  // If already player.vimeo.com/video/
  if (str.includes('player.vimeo.com/video/')) {
    return {
      embedUrl: str,
      directUrl: str.replace('player.vimeo.com/video/', 'vimeo.com/'),
    };
  }

  // Must contain vimeo
  if (!str.toLowerCase().includes('vimeo')) return null;

  try {
    const urlString = str.startsWith('http') ? str : `https://${str}`;
    const urlObj = new URL(urlString);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    // Find the numeric video ID
    const numIndex = pathParts.findIndex((part) => /^\d+$/.test(part));
    if (numIndex !== -1) {
      const videoId = pathParts[numIndex];
      // Check if the next segment is the unlisted security hash (e.g. vimeo.com/123456/abcdef)
      const nextPart = pathParts[numIndex + 1];
      const hParam = urlObj.searchParams.get('h');
      const hash = nextPart && !/^(videos|channels|groups|review)$/i.test(nextPart)
        ? nextPart
        : hParam;

      let embedUrl = `https://player.vimeo.com/video/${videoId}`;
      if (hash) {
        embedUrl += `?h=${hash}`;
      }

      return {
        embedUrl,
        directUrl: urlString,
      };
    }
  } catch {
    // Regex fallback
    const m = str.match(/vimeo\.com\/(?:[^\/]+\/)*(\d+)(?:\/([a-zA-Z0-9]+))?/);
    if (m && m[1]) {
      const videoId = m[1];
      const hash = m[2];
      return {
        embedUrl: `https://player.vimeo.com/video/${videoId}${hash ? `?h=${hash}` : ''}`,
        directUrl: str.startsWith('http') ? str : `https://${str}`,
      };
    }
  }

  return null;
}

// Parse Video embed (Vimeo, YouTube, or direct HTML5 video)
function parseVideoEmbed(url?: string): {
  type: 'youtube' | 'vimeo' | 'html5' | 'none';
  embedUrl?: string;
  rawUrl?: string;
} {
  if (!url || !url.trim()) return { type: 'none' };
  const cleanUrl = extractCleanUrl(url);

  // Skip SoundCloud URLs in video parser
  if (cleanUrl.includes('soundcloud.com') || cleanUrl.includes('w.soundcloud.com')) {
    return { type: 'none' };
  }

  // 1. Try Vimeo first with robust parser
  const vimeoParsed = parseVimeoEmbed(cleanUrl);
  if (vimeoParsed) {
    return {
      type: 'vimeo',
      embedUrl: vimeoParsed.embedUrl,
      rawUrl: vimeoParsed.directUrl,
    };
  }

  // 2. YouTube match
  const ytMatch = cleanUrl.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=0&rel=0&modestbranding=1`,
      rawUrl: cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`,
    };
  }

  // 3. Direct HTML5 video file (.mp4, .webm, .ogg)
  if (/\.(mp4|webm|ogg)($|\?)/i.test(cleanUrl)) {
    return {
      type: 'html5',
      embedUrl: cleanUrl,
      rawUrl: cleanUrl,
    };
  }

  // 4. Fallback: treat as direct web media
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return {
      type: 'html5',
      embedUrl: cleanUrl,
      rawUrl: cleanUrl,
    };
  }

  return { type: 'none' };
}

// Parse SoundCloud embed
function parseSoundCloudEmbed(url?: string): { embedUrl: string; rawUrl: string } | null {
  if (!url || !url.trim()) return null;
  const cleanUrl = extractCleanUrl(url);

  if (!cleanUrl.includes('soundcloud.com') && !cleanUrl.includes('w.soundcloud.com')) {
    return null;
  }

  if (cleanUrl.includes('w.soundcloud.com/player/')) {
    return { embedUrl: cleanUrl, rawUrl: cleanUrl };
  }

  const directUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
  const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
    directUrl
  )}&color=%23c084fc&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`;

  return { embedUrl, rawUrl: directUrl };
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  onEdit,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!project) return null;

  const isElectronic = Boolean(
    project.isElectronicComposition || project.type === 'Electronic Music'
  );

  // Video embed info
  const videoEmbed = parseVideoEmbed(project.videoLink);

  // SoundCloud embed info: check soundCloudUrl or fallback to videoLink / audioFile if soundcloud link
  const soundCloudEmbed =
    parseSoundCloudEmbed(project.soundCloudUrl) ||
    parseSoundCloudEmbed(project.videoLink) ||
    parseSoundCloudEmbed(project.audioFile);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full sm:max-w-3xl max-h-[90vh] bg-[#13141b] border border-[#262732] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-y-auto flex flex-col text-[#f3f4f6] transform transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar with project type and actions */}
        <div className="sticky top-0 bg-[#13141b]/95 backdrop-blur-md px-6 py-4 border-b border-[#262732] flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-xs uppercase font-semibold tracking-wider text-[#c084fc]">
              {project.type}
            </span>
            {isElectronic && (
              <span className="text-[10px] uppercase font-bold text-[#f3f4f6] px-2 py-0.5 rounded bg-[#a855f7]/25 border border-[#a855f7]/40 flex items-center gap-1">
                <Music2 className="w-2.5 h-2.5 text-[#c084fc]" />
                <span>Electronic Composition</span>
              </span>
            )}
            <span className="text-[#9ca3af] hidden sm:inline" aria-hidden="true">·</span>
            <span className="text-xs text-[#9ca3af] font-mono hidden sm:inline">
              {project.year}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Close project details"
              className="p-1.5 rounded-full text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#1a1b24] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c084fc]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">

          {/* Title & Studio/Client Context */}
          <div>
            <h2 id="project-modal-title" className="font-halftone text-2xl sm:text-3xl font-bold text-[#f3f4f6] tracking-wide">
              {project.title}
            </h2>
            {project.clientOrContext && (
              <p className="text-sm text-[#9ca3af] mt-1 font-medium">
                {project.clientOrContext}
              </p>
            )}
          </div>

          {/* Electronic Composition Section with Dedicated SoundCloud Player */}
          {isElectronic && (
            <div className="p-5 rounded-2xl bg-[#1a1528]/85 border border-[#a855f7]/40 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#c084fc] animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#c084fc] flex items-center gap-1.5">
                    <Music2 className="w-3.5 h-3.5" />
                    <span>Electronic Music Composition</span>
                  </span>
                </div>

                {soundCloudEmbed?.rawUrl && (
                  <a
                    href={soundCloudEmbed.rawUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#c084fc] hover:underline"
                  >
                    <span>SoundCloud</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {project.electronicCompositionNotes ? (
                <p className="text-sm text-[#f3f4f6] leading-relaxed">
                  {project.electronicCompositionNotes}
                </p>
              ) : (
                <p className="text-xs text-[#9ca3af] italic">
                  Original electronic music score & synthesized production.
                </p>
              )}

              {/* SoundCloud Audio Player */}
              {soundCloudEmbed ? (
                <div className="pt-1">
                  <div className="rounded-xl overflow-hidden border border-[#262732] bg-[#0b0c10] shadow-md">
                    <iframe
                      width="100%"
                      height="166"
                      scrolling="no"
                      frameBorder="no"
                      allow="autoplay"
                      title={`${project.title} SoundCloud Player`}
                      src={soundCloudEmbed.embedUrl}
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#0b0c10]/70 border border-[#262732] flex items-center gap-2.5 text-xs text-[#9ca3af]">
                  <Radio className="w-4 h-4 text-[#c084fc] shrink-0" />
                  <span>Audio composition player track currently unreleased.</span>
                </div>
              )}
            </div>
          )}

          {/* Project Overview / Description */}
          <div>
            <h3 className="text-xs uppercase font-semibold text-[#c084fc] tracking-wider mb-2">
              Overview
            </h3>
            <p className="text-base text-[#f3f4f6] leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#262732]/80 text-sm">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-[#9ca3af] mt-1 shrink-0" />
              <div>
                <span className="block text-xs text-[#9ca3af] font-medium">My Role</span>
                <span className="text-[#f3f4f6] font-semibold">{project.role}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-[#9ca3af] mt-1 shrink-0" />
              <div>
                <span className="block text-xs text-[#9ca3af] font-medium">Year</span>
                <span className="text-[#f3f4f6] font-semibold">{project.year}</span>
              </div>
            </div>
          </div>

          {/* Tools Used */}
          <div>
            <div className="flex items-center gap-2 text-xs uppercase font-semibold text-[#c084fc] tracking-wider mb-2.5">
              <Wrench className="w-3.5 h-3.5" />
              <span>Tools & Technologies</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.tools.map((tool, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-[#0b0c10] text-[#f3f4f6] border border-[#262732]"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* ======================================================== */}
          {/* VIDEO PLAYER AT THE BOTTOM OF THE SECTION */}
          {/* ======================================================== */}
          <div className="pt-4 border-t border-[#262732] space-y-3">
            <div className="flex items-center justify-between text-xs text-[#9ca3af]">
              <div className="flex items-center gap-2 text-[#c084fc] font-semibold uppercase tracking-wider text-xs">
                <Video className="w-4 h-4" />
                <span>
                  {videoEmbed.type === 'vimeo'
                    ? 'Vimeo Video Reel'
                    : videoEmbed.type === 'youtube'
                    ? 'YouTube Video Reel'
                    : 'Video Reel / Showcase'}
                </span>
              </div>

              {videoEmbed.rawUrl && (
                <a
                  href={videoEmbed.rawUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#c084fc] hover:text-[#f3f4f6] transition-colors"
                >
                  <span>Open in {videoEmbed.type === 'vimeo' ? 'Vimeo' : 'New Tab'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {videoEmbed.type !== 'none' ? (
              <div className="space-y-2">
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-[#262732] shadow-2xl">
                  {videoEmbed.type === 'vimeo' && (
                    <iframe
                      src={videoEmbed.embedUrl}
                      title={`${project.title} Vimeo video`}
                      className="w-full h-full border-0"
                      allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                      allowFullScreen
                    />
                  )}

                  {videoEmbed.type === 'youtube' && (
                    <iframe
                      src={videoEmbed.embedUrl}
                      title={`${project.title} YouTube video`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  )}

                  {videoEmbed.type === 'html5' && (
                    <video
                      controls
                      playsInline
                      className="w-full h-full object-contain bg-black"
                    >
                      <source src={videoEmbed.embedUrl} />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>

                {videoEmbed.type === 'vimeo' && (
                  <p className="text-[11px] text-[#9ca3af] flex items-center justify-between">
                    <span>Vimeo Player embedded.</span>
                    <a
                      href={videoEmbed.rawUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#c084fc] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Watch directly on Vimeo if privacy restrictions apply</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                )}
              </div>
            ) : project.imageUrl ? (
              <div className="relative w-full h-56 rounded-xl overflow-hidden border border-[#262732] bg-[#0b0c10]">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-[#0b0c10] border border-dashed border-[#262732] text-center space-y-2">
                <div className="w-9 h-9 rounded-full bg-[#1a1b24] text-[#c084fc] flex items-center justify-center mx-auto">
                  <Video className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-[#f3f4f6]">No Video Reel Attached</p>
                <p className="text-[11px] text-[#9ca3af] max-w-sm mx-auto">
                  Showreel footage is being curated for this production.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ArrowRight, Disc3, Gamepad2, Film, Music2, Sparkles } from 'lucide-react';
import { Project, PageId } from '../types/project';
import { audioService } from '../utils/audio';
import { WaveformBackground } from '../components/WaveformBackground';
import { SiteContent, DEFAULT_SITE_CONTENT } from '../data/siteContent';

interface HomePageProps {
  projects: Project[];
  onNavigate: (page: PageId, projectId?: string) => void;
  content?: SiteContent['home'];
}

export const HomePage: React.FC<HomePageProps> = ({
  projects,
  onNavigate,
  content = DEFAULT_SITE_CONTENT.home,
}) => {
  // Select top 3 projects for "Recent work"
  const recentProjects = projects.slice(0, 3);

  const getDisciplineIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('electronic') || t.includes('music')) return Music2;
    if (t.includes('game')) return Gamepad2;
    if (t.includes('film') || t.includes('tv')) return Film;
    return Disc3;
  };

  return (
    <div className="relative w-full bg-[#0b0c10] text-[#f3f4f6] overflow-hidden">
      {/* 4-Track Ambient Waveform Visualizer flowing as the living background throughout the page */}
      <WaveformBackground opacity={0.48} interactive={true} />

      {/* Hero Section */}
      <section className="relative pt-24 pb-28 md:pt-36 md:pb-40 border-b border-[#262732]/80 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            {/* Official Resonance Sound Logo */}
            <div className="mb-6">
              <img
                src="/assets/aistudio/resonance-sound-logo-transparent_586e993a.png"
                alt="Resonance Sound"
                className="h-18 sm:h-22 md:h-26 lg:h-28 w-auto object-contain drop-shadow-[0_0_24px_rgba(168,85,247,0.4)]"
              />
            </div>

            {/* Minimal multi-track acoustic indicator */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#13141b]/90 border border-[#262732] backdrop-blur-md mb-8 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-[#a855f7] animate-pulse" />
              <span className="text-xs font-mono font-semibold tracking-wider text-[#c084fc] uppercase">
                {content.heroAcousticBadge}
              </span>
              <span className="text-[#9ca3af]" aria-hidden="true">·</span>
              <span className="text-xs text-[#9ca3af]">{content.heroAcousticTags}</span>
            </div>

            <h1 className="font-halftone text-4xl sm:text-6xl lg:text-7xl font-bold tracking-wide text-[#f3f4f6] leading-[1.08] text-balance drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]">
              {content.heroTitle}
            </h1>

            <p className="mt-8 text-lg sm:text-2xl text-[#9ca3af] leading-relaxed max-w-2xl font-normal drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              {content.heroSubtitle}
            </p>

            {/* Action Buttons */}
            <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center gap-4 justify-start">
              <button
                onClick={() => {
                  onNavigate('projects');
                  audioService.playUiBlip();
                }}
                className="w-full sm:w-auto px-9 py-4 rounded-full font-semibold text-sm bg-[#a855f7] text-[#0b0c10] hover:bg-[#9333ea] transition-all duration-200 shadow-[0_0_28px_rgba(168,85,247,0.45)] flex items-center justify-center gap-2 group hover:scale-[1.02]"
              >
                <span>{content.ctaExplore}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  onNavigate('contact');
                  audioService.playUiBlip();
                }}
                className="w-full sm:w-auto px-9 py-4 rounded-full font-semibold text-sm bg-[#13141b] hover:bg-[#1a1b24] text-[#f3f4f6] border border-[#262732] hover:border-[#c084fc] transition-all duration-200 flex items-center justify-center shadow-lg"
              >
                {content.ctaContact}
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* "What we do" Section */}
      <section className="relative z-10 py-24 md:py-32 border-b border-[#262732]/80 bg-[#0b0c10]/45 backdrop-blur-[2px]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#c084fc]">
                {content.disciplinesBadge}
              </span>
              <h2 className="font-halftone text-3xl sm:text-5xl font-bold text-[#f3f4f6] mt-2 tracking-wide">
                {content.disciplinesTitle}
              </h2>
            </div>
            <p className="text-sm text-[#9ca3af] max-w-md">
              {content.disciplinesSubtitle}
            </p>
          </div>

          {/* Disciplines Rows */}
          <div className="divide-y divide-[#262732] border-y border-[#262732]">
            {content.disciplines.map((item, idx) => {
              const Icon = getDisciplineIcon(item.title);
              const isElectronic = item.title.toLowerCase().includes('electronic') || item.title.toLowerCase().includes('music');

              return (
                <div
                  key={idx}
                  className={`py-10 md:py-12 grid grid-cols-1 md:grid-cols-12 gap-6 items-start md:items-center group transition-all px-4 -mx-4 rounded-xl ${
                    isElectronic
                      ? 'hover:bg-[#181528]/60 bg-[#13141b]/20 border border-transparent hover:border-[#a855f7]/30'
                      : 'hover:bg-[#13141b]/50'
                  }`}
                >
                  <div className="md:col-span-5 flex items-start sm:items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                        isElectronic
                          ? 'bg-[#211a36] border-[#7c3aed]/50 text-[#c084fc] group-hover:bg-[#a855f7]/20 group-hover:text-[#c084fc] group-hover:border-[#a855f7]'
                          : 'bg-[#1a1b24] border-[#262732] text-[#c084fc] group-hover:bg-[#a855f7]/15 group-hover:text-[#a855f7]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-futuristic text-xl sm:text-2xl font-bold text-[#f3f4f6] group-hover:text-[#c084fc] transition-colors">
                          {item.title}
                        </h3>
                        {isElectronic && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-tech font-bold uppercase tracking-wider bg-[#a855f7]/20 text-[#c084fc] border border-[#a855f7]/40">
                            <Sparkles className="w-2.5 h-2.5 text-[#c084fc]" />
                            <span>Film & Games</span>
                          </span>
                        )}
                      </div>
                      <span className="block text-xs text-[#9ca3af] font-tech">{item.spec}</span>
                    </div>
                  </div>

                  <div className="md:col-span-7">
                    <p className="text-base sm:text-lg text-[#9ca3af] leading-relaxed group-hover:text-[#f3f4f6] transition-colors">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* "Recent work" Section */}
      <section className="relative z-10 py-24 md:py-32 border-b border-[#262732]/80 bg-[#0b0c10]/50 backdrop-blur-[2px]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-14 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#c084fc]">
                {content.recentWorkBadge}
              </span>
              <h2 className="font-halftone text-3xl sm:text-5xl font-bold text-[#f3f4f6] mt-2 tracking-wide">
                {content.recentWorkTitle}
              </h2>
            </div>

            <button
              onClick={() => {
                onNavigate('projects');
                audioService.playUiBlip();
              }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#c084fc] hover:text-[#f3f4f6] transition-colors self-start sm:self-auto"
            >
              <span>{content.recentWorkCta}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Projects List or Portfolio Ready Empty State */}
          {recentProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => {
                    onNavigate('projects', project.id);
                    audioService.playProjectTone(project.pitchHz);
                  }}
                  className="group cursor-pointer rounded-2xl bg-[#13141b]/80 backdrop-blur-sm border border-[#262732] hover:border-[#a855f7]/60 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#9ca3af] mb-4">
                      <span className="text-[#c084fc] font-semibold uppercase">{project.type}</span>
                      <span className="font-mono">{project.year}</span>
                    </div>

                    <h3 className="font-futuristic text-xl font-bold text-[#f3f4f6] group-hover:text-[#a855f7] transition-colors">
                      {project.title}
                    </h3>

                    <p className="mt-3 text-sm text-[#9ca3af] line-clamp-3 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-[#262732]/80 flex items-center justify-between">
                    <span className="text-xs text-[#9ca3af] font-medium">{project.role}</span>
                    <span className="inline-flex items-center text-xs font-semibold text-[#c084fc] group-hover:translate-x-1 transition-transform">
                      View on Map →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 rounded-2xl bg-[#13141b]/70 border border-[#262732] text-center max-w-xl mx-auto backdrop-blur-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#a855f7]/15 border border-[#a855f7]/30 text-[#c084fc] flex items-center justify-center mx-auto">
                <Music2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-futuristic text-xl font-bold text-[#f3f4f6]">Sound Works Archive</h3>
                <p className="text-sm text-[#9ca3af] mt-2 leading-relaxed">
                  Interactive acoustic spatial catalog and audio design pieces are accessible on the map.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => {
                    onNavigate('projects');
                    audioService.playUiBlip();
                  }}
                  className="px-6 py-3 rounded-full font-semibold text-xs bg-[#a855f7] text-[#0b0c10] hover:bg-[#9333ea] transition-all shadow-[0_0_20px_rgba(168,85,247,0.35)] inline-flex items-center gap-2"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Explore Projects Map</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Closing Call to Action: "Have a project in mind?" */}
      <section className="relative z-10 py-24 md:py-32 bg-[#0b0c10]/40 backdrop-blur-[2px]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-halftone text-3xl sm:text-5xl font-bold text-[#f3f4f6] tracking-wide">
            {content.closingCtaTitle}
          </h2>

          <p className="mt-5 text-base sm:text-lg text-[#9ca3af] max-w-xl mx-auto leading-relaxed">
            {content.closingCtaSubtitle}
          </p>

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                onNavigate('contact');
                audioService.playUiBlip();
              }}
              className="px-9 py-4 rounded-full font-semibold text-sm bg-[#a855f7] text-[#0b0c10] hover:bg-[#9333ea] transition-all duration-200 shadow-[0_0_24px_rgba(168,85,247,0.4)] flex items-center gap-2 group"
            >
              <span>{content.closingCtaButton}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

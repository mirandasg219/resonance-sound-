import React from 'react';
import { Gamepad2, Film, Disc3, Wrench, CheckCircle2 } from 'lucide-react';
import { PageId } from '../types/project';
import { audioService } from '../utils/audio';
import { WaveformBackground } from '../components/WaveformBackground';
import { StudioAudioVisualizer } from '../components/StudioAudioVisualizer';
import { SiteContent, DEFAULT_SITE_CONTENT } from '../data/siteContent';

interface StudioPageProps {
  onNavigate: (page: PageId) => void;
  content?: SiteContent['studio'];
}

export const StudioPage: React.FC<StudioPageProps> = ({
  onNavigate,
  content = DEFAULT_SITE_CONTENT.studio,
}) => {
  return (
    <div className="relative w-full bg-[#0b0c10] text-[#f3f4f6] py-16 md:py-24 overflow-hidden">
      {/* 4-Track Ambient Waveform Visualizer flowing as the living background */}
      <WaveformBackground opacity={0.45} interactive={true} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        
        {/* Header Block */}
        <div className="max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#c084fc]">
            {content.badge}
          </span>
          <h1 className="font-halftone text-3xl sm:text-5xl lg:text-6xl font-bold tracking-wide text-[#f3f4f6] mt-3">
            {content.title}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-[#9ca3af] leading-relaxed">
            {content.description}
          </p>
        </div>

        {/* Real-Time Studio Web Audio API Spectrum Analyzer & Sample Track Player */}
        <StudioAudioVisualizer />

        {/* Studio Rows as requested: Games, TV and film, Delivery, Tools */}
        <div className="space-y-12 divide-y divide-[#262732]">
          
          {/* Row 1: Games */}
          <div className="pt-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#a855f7]/15 border border-[#a855f7]/30 text-[#c084fc] flex items-center justify-center shrink-0">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-halftone text-2xl font-bold text-[#f3f4f6] tracking-wide">{content.gamesTitle}</h2>
                <span className="text-xs text-[#9ca3af]">{content.gamesSubtitle}</span>
              </div>
            </div>

            <div className="md:col-span-8 space-y-4">
              <p className="text-base text-[#9ca3af] leading-relaxed">
                {content.gamesDescription}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#f3f4f6]">
                {content.gamesHighlights.map((hl, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#c084fc] shrink-0" />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: TV and Film */}
          <div className="pt-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/40 text-[#c084fc] flex items-center justify-center shrink-0">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-halftone text-2xl font-bold text-[#f3f4f6] tracking-wide">{content.filmTitle}</h2>
                <span className="text-xs text-[#9ca3af]">{content.filmSubtitle}</span>
              </div>
            </div>

            <div className="md:col-span-8 space-y-4">
              <p className="text-base text-[#9ca3af] leading-relaxed">
                {content.filmDescription}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#f3f4f6]">
                {content.filmHighlights.map((hl, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#c084fc] shrink-0" />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Delivery */}
          <div className="pt-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#a855f7]/15 border border-[#a855f7]/30 text-[#c084fc] flex items-center justify-center shrink-0">
                <Disc3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-halftone text-2xl font-bold text-[#f3f4f6] tracking-wide">{content.deliveryTitle}</h2>
                <span className="text-xs text-[#9ca3af]">{content.deliverySubtitle}</span>
              </div>
            </div>

            <div className="md:col-span-8 space-y-4">
              <p className="text-base text-[#9ca3af] leading-relaxed">
                {content.deliveryDescription}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#13141b] border border-[#262732]">
                  <h3 className="font-futuristic text-base font-bold text-[#f3f4f6]">{content.deliveryMasteringTitle}</h3>
                  <p className="text-xs text-[#9ca3af] mt-1">
                    {content.deliveryMasteringDesc}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#13141b] border border-[#262732]">
                  <h3 className="font-futuristic text-base font-bold text-[#f3f4f6]">{content.deliverySurroundTitle}</h3>
                  <p className="text-xs text-[#9ca3af] mt-1">
                    {content.deliverySurroundDesc}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#13141b] border border-[#262732]">
                  <h3 className="font-futuristic text-base font-bold text-[#f3f4f6]">{content.deliveryAtmosTitle}</h3>
                  <p className="text-xs text-[#9ca3af] mt-1">
                    {content.deliveryAtmosDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Tools */}
          <div className="pt-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/40 text-[#c084fc] flex items-center justify-center shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-halftone text-2xl font-bold text-[#f3f4f6] tracking-wide">{content.toolsTitle}</h2>
                <span className="text-xs text-[#9ca3af]">{content.toolsSubtitle}</span>
              </div>
            </div>

            <div className="md:col-span-8 space-y-6">
              <p className="text-base text-[#9ca3af] leading-relaxed">
                {content.toolsDescription}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#13141b] border border-[#262732]">
                  <span className="block font-semibold text-[#c084fc] mb-1 font-tech">DAWs</span>
                  <span className="text-[#f3f4f6]">{content.toolsDaws}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#13141b] border border-[#262732]">
                  <span className="block font-semibold text-[#c084fc] mb-1 font-tech">Engines</span>
                  <span className="text-[#f3f4f6]">{content.toolsEngines}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#13141b] border border-[#262732]">
                  <span className="block font-semibold text-[#c084fc] mb-1 font-tech">Synthesis</span>
                  <span className="text-[#f3f4f6]">{content.toolsSynthesis}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#13141b] border border-[#262732]">
                  <span className="block font-semibold text-[#c084fc] mb-1 font-tech">Monitoring</span>
                  <span className="text-[#f3f4f6]">{content.toolsMonitoring}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA to start a discussion */}
        <div className="pt-12 border-t border-[#262732] flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#13141b]/60 p-8 rounded-2xl border border-[#262732]">
          <div>
            <h3 className="font-futuristic text-xl font-bold text-[#f3f4f6]">{content.collabCtaTitle}</h3>
            <p className="text-sm text-[#9ca3af] mt-1">{content.collabCtaSubtitle}</p>
          </div>
          <button
            onClick={() => {
              onNavigate('contact');
              audioService.playUiBlip();
            }}
            className="px-6 py-3 rounded-full text-xs font-semibold bg-[#a855f7] text-[#0b0c10] hover:bg-[#9333ea] transition-all whitespace-nowrap shadow-[0_0_18px_rgba(168,85,247,0.4)]"
          >
            {content.collabCtaButton}
          </button>
        </div>

      </div>
    </div>
  );
};

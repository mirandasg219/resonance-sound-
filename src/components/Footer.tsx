import React from 'react';
import { PageId } from '../types/project';

interface FooterProps {
  onNavigate: (page: PageId) => void;
  businessName?: string;
  studioEmail?: string;
  footerNote?: string;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  businessName = 'Resonance Sound Design',
  studioEmail = 'mirandaskye.g@gmail.com',
  footerNote = 'Sound for Games, TV & Film',
}) => {
  return (
    <footer className="border-t border-[#262732] bg-[#07080b] pt-14 pb-12 text-[#9ca3af] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Top Footer Section: Large Brand Logo & Primary Navigation */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-[#262732]/70">
          <div className="space-y-4">
            <button
              onClick={() => onNavigate('home')}
              className="inline-block group focus:outline-none"
              title="Return to Home"
            >
              <img
                src="/assets/aistudio/resonance-sound-logo-transparent_586e993a.png"
                alt={businessName}
                className="h-20 sm:h-24 md:h-28 lg:h-32 w-auto object-contain opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all drop-shadow-[0_0_24px_rgba(168,85,247,0.4)]"
              />
              <span className="sr-only">{businessName}</span>
            </button>
            <p className="text-sm text-[#9ca3af] font-medium leading-relaxed max-w-md">
              {footerNote}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-8">
            <nav aria-label="Footer Navigation" className="flex flex-wrap items-center gap-6 text-sm font-medium">
              <button
                onClick={() => onNavigate('home')}
                className="hover:text-[#c084fc] transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => onNavigate('projects')}
                className="hover:text-[#c084fc] transition-colors"
              >
                Projects
              </button>
              <button
                onClick={() => onNavigate('studio')}
                className="hover:text-[#c084fc] transition-colors"
              >
                Studio
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="hover:text-[#c084fc] transition-colors"
              >
                Contact
              </button>
            </nav>

            <a
              href={`mailto:${studioEmail}`}
              className="text-sm font-semibold text-[#c084fc] hover:text-[#f3f4f6] transition-colors underline-offset-4 hover:underline"
            >
              {studioEmail}
            </a>
          </div>
        </div>

        {/* Bottom Footer Section: Rights info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9ca3af]">
          <span>© {new Date().getFullYear()} {businessName}. All rights reserved.</span>
          <span className="text-[#9ca3af]/80">Sound Design · Mixing · Audio Implementation</span>
        </div>

      </div>
    </footer>
  );
};

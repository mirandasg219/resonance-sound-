import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { PageId } from '../types/project';
import { audioService } from '../utils/audio';

interface HeaderProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  businessName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  businessName = 'Resonance Sound',
}) => {
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    // Initial sound state
    setSoundOn(audioService.getSoundEnabled());
    const unsub = audioService.subscribe((enabled) => {
      setSoundOn(enabled);
    });

    // Enforce dark mode permanently
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');

    return () => unsub();
  }, []);

  const handleToggleSound = () => {
    const nextState = audioService.toggleSound();
    setSoundOn(nextState);
  };

  const navItems: { id: PageId; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'projects', label: 'Projects' },
    { id: 'studio', label: 'Studio' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#0b0c10]/90 border-b border-[#262732] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between gap-6">
        
        {/* Zone 1: Brand Wordmark / Official Logo */}
        <button
          onClick={() => {
            onNavigate('home');
            if (soundOn) audioService.playUiBlip();
          }}
          className="group flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c084fc] rounded-lg py-1 px-1 -ml-1 transition-transform"
        >
          <img
            src="/assets/aistudio/resonance-sound-logo-transparent_586e993a.png"
            alt={businessName}
            className="h-12 sm:h-16 md:h-18 max-h-[72px] w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_0_20px_rgba(168,85,247,0.45)]"
          />
          <span className="sr-only">{businessName} - Sound Design Studio</span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  if (soundOn) audioService.playUiBlip();
                }}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-[#c084fc] font-semibold'
                    : 'text-[#9ca3af] hover:text-[#f3f4f6]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#c084fc] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Sound on / Sound off Toggle Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={handleToggleSound}
            aria-pressed={soundOn}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c084fc] cursor-pointer ${
              soundOn
                ? 'bg-[#a855f7] text-[#0b0c10] shadow-[0_0_18px_rgba(168,85,247,0.45)] hover:bg-[#9333ea]'
                : 'bg-[#13141b] text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#1f2128] border border-[#262732]'
            }`}
          >
            {soundOn ? (
              <>
                <Volume2 className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap font-bold">Sound on</span>
                <span className="flex items-center gap-0.5 ml-0.5" aria-hidden="true">
                  <span className="w-1 h-2 bg-[#0b0c10] animate-pulse rounded-full" />
                  <span className="w-1 h-3.5 bg-[#0b0c10] animate-pulse rounded-full [animation-delay:150ms]" />
                  <span className="w-1 h-1.5 bg-[#0b0c10] animate-pulse rounded-full [animation-delay:300ms]" />
                </span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Sound off</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Row */}
      <div className="md:hidden flex items-center justify-around border-t border-[#262732] px-4 py-2.5 bg-[#0b0c10]">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                if (soundOn) audioService.playUiBlip();
              }}
              className={`text-xs py-1.5 px-3 rounded-full transition-colors ${
                isActive
                  ? 'text-[#c084fc] font-semibold bg-[#1a1b24]'
                  : 'text-[#9ca3af] hover:text-[#f3f4f6]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};

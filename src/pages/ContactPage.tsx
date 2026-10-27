import React, { useState } from 'react';
import { Check, Copy, Send, Clock } from 'lucide-react';
import { audioService } from '../utils/audio';
import { WaveformBackground } from '../components/WaveformBackground';
import { SiteContent, DEFAULT_SITE_CONTENT } from '../data/siteContent';

interface ContactPageProps {
  studioEmail?: string;
  content?: SiteContent['contact'];
}

export const ContactPage: React.FC<ContactPageProps> = ({
  studioEmail = 'mirandaskye.g@gmail.com',
  content = DEFAULT_SITE_CONTENT.contact,
}) => {
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    projectType: 'Game',
    timeline: '',
    details: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(studioEmail);
    setCopied(true);
    audioService.playUiBlip();
    setTimeout(() => setCopied(false), 2200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    audioService.playUiBlip();

    // Prepare mailto link with encoded parameters
    const subject = encodeURIComponent(`Sound Design Enquiry: ${formData.projectType} — ${formData.name}`);
    const body = encodeURIComponent(
      `Hello,\n\nI would like to discuss a sound design project.\n\n` +
      `Name: ${formData.name}\n` +
      `Email: ${formData.email}\n` +
      `Project Type: ${formData.projectType}\n` +
      `Target Timeline: ${formData.timeline}\n\n` +
      `Project Details:\n${formData.details}\n`
    );

    // Open mail client
    window.location.href = `mailto:${studioEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="relative w-full bg-[#0b0c10] text-[#f3f4f6] py-16 md:py-28 overflow-hidden">
      {/* 4-Track Ambient Waveform Visualizer flowing as the living background */}
      <WaveformBackground opacity={0.45} interactive={true} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Main Headline & Context Line */}
        <div className="space-y-4 text-center sm:text-left">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#c084fc]">
            {content.badge}
          </span>
          <h1 className="font-halftone text-3xl sm:text-5xl lg:text-6xl font-bold tracking-wide text-[#f3f4f6]">
            {content.title}
          </h1>
          <p className="text-lg sm:text-xl text-[#9ca3af] leading-relaxed max-w-2xl">
            {content.description}
          </p>
        </div>

        {/* Large Prominent Email Link */}
        <div className="p-8 sm:p-10 rounded-2xl bg-[#13141b] border border-[#262732] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1">
            <span className="text-xs uppercase font-semibold text-[#c084fc] tracking-wider block">
              {content.directInquiriesLabel}
            </span>
            <a
              href={`mailto:${studioEmail}`}
              className="font-futuristic text-2xl sm:text-3xl md:text-4xl font-bold text-[#f3f4f6] hover:text-[#c084fc] transition-colors break-all underline decoration-[#262732] hover:decoration-[#c084fc]"
            >
              {studioEmail}
            </a>
          </div>

          <button
            onClick={handleCopyEmail}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#1a1b24] hover:bg-[#262732] text-[#f3f4f6] border border-[#262732] transition-colors shrink-0"
            title="Copy email to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-purple-300" />
                <span className="text-purple-300">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#c084fc]" />
                <span>Copy Address</span>
              </>
            )}
          </button>
        </div>

        {/* Simple Enquiry Form */}
        <div className="p-8 sm:p-10 rounded-2xl bg-[#13141b]/70 border border-[#262732]">
          <div className="mb-8">
            <h2 className="font-halftone text-2xl font-bold text-[#f3f4f6] tracking-wide">
              {content.formTitle}
            </h2>
            <p className="text-sm text-[#9ca3af] mt-1">
              {content.formDescription}
            </p>
          </div>

          {submitted ? (
            <div className="p-6 rounded-xl bg-[#a855f7]/10 border border-[#a855f7]/30 text-purple-200 space-y-3">
              <div className="flex items-center gap-2 font-futuristic text-lg font-bold">
                <Check className="w-5 h-5 text-purple-300" />
                <span>Thank you, {formData.name}!</span>
              </div>
              <p className="text-sm text-[#f3f4f6]">
                Your enquiry draft has been prepared for <strong className="text-white">{studioEmail}</strong>. {content.thankYouMessage}
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs font-semibold underline text-[#c084fc] pt-2"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase font-semibold text-[#c084fc] tracking-wider mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Mercer"
                    className="w-full px-4 py-3 rounded-xl bg-[#0b0c10] border border-[#262732] focus:border-[#c084fc] focus:outline-none text-[#f3f4f6] placeholder-[#9ca3af]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-semibold text-[#c084fc] tracking-wider mb-2">
                    Your Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@studio.com"
                    className="w-full px-4 py-3 rounded-xl bg-[#0b0c10] border border-[#262732] focus:border-[#c084fc] focus:outline-none text-[#f3f4f6] placeholder-[#9ca3af]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase font-semibold text-[#c084fc] tracking-wider mb-2">
                    Project Type
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#0b0c10] border border-[#262732] focus:border-[#c084fc] focus:outline-none text-[#f3f4f6]"
                  >
                    <option value="Electronic Music">Electronic Music (Films, Games & Commissions)</option>
                    <option value="Game">Video Game (Wwise / FMOD)</option>
                    <option value="Film">Feature Film or Short</option>
                    <option value="TV">TV / Streaming Series</option>
                    <option value="Mixing & Atmos">Mixing & Dolby Atmos Delivery</option>
                    <option value="Commercial">Commercial / Trailer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase font-semibold text-[#c084fc] tracking-wider mb-2">
                    Target Timeline
                  </label>
                  <input
                    type="text"
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    placeholder="e.g. Q3 2026 / 4 weeks sprint"
                    className="w-full px-4 py-3 rounded-xl bg-[#0b0c10] border border-[#262732] focus:border-[#c084fc] focus:outline-none text-[#f3f4f6] placeholder-[#9ca3af]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-semibold text-[#c084fc] tracking-wider mb-2">
                  Project Details & Scope *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="Share details about the genre, world, asset counts, middleware needs, or references..."
                  className="w-full px-4 py-3 rounded-xl bg-[#0b0c10] border border-[#262732] focus:border-[#c084fc] focus:outline-none text-[#f3f4f6] placeholder-[#9ca3af]/50"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                  <Clock className="w-4 h-4 text-[#c084fc]" />
                  <span>Direct reply within 24 hours guaranteed</span>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full font-semibold text-sm bg-[#a855f7] text-[#0b0c10] hover:bg-[#9333ea] transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 group"
                >
                  <span>{content.submitButtonLabel || 'Send Enquiry'}</span>
                  <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

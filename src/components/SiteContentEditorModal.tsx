import React, { useState } from 'react';
import { X, Check, RotateCcw, Copy, Sparkles, FileText, Layout, Headphones, Mail } from 'lucide-react';
import { SiteContent, DEFAULT_SITE_CONTENT } from '../data/siteContent';
import { audioService } from '../utils/audio';

interface SiteContentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: SiteContent;
  onSave: (updated: SiteContent) => void;
  onReset: () => void;
}

type TabKey = 'home' | 'studio' | 'contact' | 'brand';

export const SiteContentEditorModal: React.FC<SiteContentEditorModalProps> = ({
  isOpen,
  onClose,
  content,
  onSave,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [draft, setDraft] = useState<SiteContent>(content);
  const [copiedCode, setCopiedCode] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Sync draft whenever content updates
  React.useEffect(() => {
    setDraft(content);
  }, [content]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(draft);
    audioService.playUiBlip();
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    if (window.confirm('Reset all website text back to default? Any custom writing will be restored to defaults.')) {
      onReset();
      setDraft(DEFAULT_SITE_CONTENT);
      audioService.playUiBlip();
    }
  };

  const handleCopyCode = () => {
    const codeString = `export const DEFAULT_SITE_CONTENT: SiteContent = ${JSON.stringify(draft, null, 2)};`;
    navigator.clipboard.writeText(codeString);
    setCopiedCode(true);
    audioService.playUiBlip();
    setTimeout(() => setCopiedCode(false), 2200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#13141b] border border-[#262732] rounded-2xl shadow-2xl flex flex-col text-[#f3f4f6] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0b0c10] border-b border-[#262732] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#a855f7]/20 border border-[#a855f7]/40 text-[#c084fc] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-futuristic font-bold text-lg text-[#f3f4f6] flex items-center gap-2">
                <span>Website Content & Writing Editor</span>
                <span className="text-[10px] uppercase font-tech px-2 py-0.5 rounded-full bg-[#1a1b24] text-[#c084fc] border border-[#262732]">
                  Live
                </span>
              </h2>
              <p className="text-xs text-[#9ca3af]">
                Easily change headlines, subtitles, and descriptions. Press Shift+E anytime to toggle this editor.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close text editor"
            className="p-1.5 rounded-full text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#1a1b24] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-[#0e0f15] border-b border-[#262732] text-xs shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'home'
                ? 'bg-[#a855f7] text-[#0b0c10] font-semibold'
                : 'text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#1a1b24]'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Home Page</span>
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'studio'
                ? 'bg-[#a855f7] text-[#0b0c10] font-semibold'
                : 'text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#1a1b24]'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Studio Page</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'contact'
                ? 'bg-[#a855f7] text-[#0b0c10] font-semibold'
                : 'text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#1a1b24]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact Page</span>
          </button>

          <button
            onClick={() => setActiveTab('brand')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'brand'
                ? 'bg-[#a855f7] text-[#0b0c10] font-semibold'
                : 'text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#1a1b24]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Brand & Global</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* TAB 1: HOME PAGE */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#262732] space-y-4">
                <span className="text-xs uppercase font-semibold text-[#c084fc] tracking-wider block">
                  Hero Section
                </span>

                <div>
                  <label className="block text-xs font-semibold text-[#9ca3af] mb-1">
                    Main Headline (Rendered in HalftoneJo)
                  </label>
                  <input
                    type="text"
                    value={draft.home.heroTitle}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        home: { ...draft.home, heroTitle: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6] focus:border-[#c084fc] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9ca3af] mb-1">
                    Hero Subtitle / Description
                  </label>
                  <textarea
                    rows={2}
                    value={draft.home.heroSubtitle}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        home: { ...draft.home, heroSubtitle: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6] focus:border-[#c084fc] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#9ca3af] mb-1">
                      Acoustic Pill Title
                    </label>
                    <input
                      type="text"
                      value={draft.home.heroAcousticBadge}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          home: { ...draft.home, heroAcousticBadge: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9ca3af] mb-1">
                      Acoustic Pill Tags
                    </label>
                    <input
                      type="text"
                      value={draft.home.heroAcousticTags}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          home: { ...draft.home, heroAcousticTags: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Primary Button</label>
                    <input
                      type="text"
                      value={draft.home.ctaExplore}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          home: { ...draft.home, ctaExplore: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Secondary Button</label>
                    <input
                      type="text"
                      value={draft.home.ctaContact}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          home: { ...draft.home, ctaContact: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                    />
                  </div>
                </div>
              </div>

              {/* What We Do Section */}
              <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#262732] space-y-4">
                <span className="text-xs uppercase font-semibold text-[#c084fc] tracking-wider block">
                  "What We Do" Section
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Section Title</label>
                    <input
                      type="text"
                      value={draft.home.disciplinesTitle}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          home: { ...draft.home, disciplinesTitle: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Section Overview</label>
                    <input
                      type="text"
                      value={draft.home.disciplinesSubtitle}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          home: { ...draft.home, disciplinesSubtitle: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                    />
                  </div>
                </div>

                {/* 3 Discipline rows */}
                <div className="space-y-3 pt-2">
                  {draft.home.disciplines.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#13141b] border border-[#262732] space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const next = [...draft.home.disciplines];
                            next[idx] = { ...next[idx], title: e.target.value };
                            setDraft({ ...draft, home: { ...draft.home, disciplines: next } });
                          }}
                          className="px-2.5 py-1.5 rounded bg-[#0b0c10] border border-[#262732] text-[#f3f4f6] font-semibold text-xs"
                          placeholder="Title"
                        />
                        <input
                          type="text"
                          value={item.spec}
                          onChange={(e) => {
                            const next = [...draft.home.disciplines];
                            next[idx] = { ...next[idx], spec: e.target.value };
                            setDraft({ ...draft, home: { ...draft.home, disciplines: next } });
                          }}
                          className="px-2.5 py-1.5 rounded bg-[#0b0c10] border border-[#262732] text-[#c084fc] text-xs font-tech"
                          placeholder="Tech Specs"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={item.description}
                        onChange={(e) => {
                          const next = [...draft.home.disciplines];
                          next[idx] = { ...next[idx], description: e.target.value };
                          setDraft({ ...draft, home: { ...draft.home, disciplines: next } });
                        }}
                        className="w-full px-2.5 py-1.5 rounded bg-[#0b0c10] border border-[#262732] text-[#9ca3af] text-xs"
                        placeholder="Description"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Closing CTA */}
              <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#262732] space-y-3">
                <span className="text-xs uppercase font-semibold text-[#c084fc] tracking-wider block">
                  Bottom Call to Action
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Headline</label>
                    <input
                      type="text"
                      value={draft.home.closingCtaTitle}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          home: { ...draft.home, closingCtaTitle: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Button Text</label>
                    <input
                      type="text"
                      value={draft.home.closingCtaButton}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          home: { ...draft.home, closingCtaButton: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Description</label>
                  <input
                    type="text"
                    value={draft.home.closingCtaSubtitle}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        home: { ...draft.home, closingCtaSubtitle: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDIO PAGE */}
          {activeTab === 'studio' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#262732] space-y-4">
                <span className="text-xs uppercase font-semibold text-[#c084fc] tracking-wider block">
                  Studio Header & Showcase
                </span>

                <div>
                  <label className="block text-xs font-semibold text-[#9ca3af] mb-1">
                    Studio Page Headline (HalftoneJo)
                  </label>
                  <input
                    type="text"
                    value={draft.studio.title}
                    onChange={(e) =>
                      setDraft({ ...draft, studio: { ...draft.studio, title: e.target.value } })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9ca3af] mb-1">
                    Facility Overview Description
                  </label>
                  <textarea
                    rows={2}
                    value={draft.studio.description}
                    onChange={(e) =>
                      setDraft({ ...draft, studio: { ...draft.studio, description: e.target.value } })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                  />
                </div>
              </div>

              {/* Games & TV/Film details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#262732] space-y-3">
                  <span className="text-xs uppercase font-semibold text-[#c084fc] tracking-wider block">
                    Games Section
                  </span>
                  <div>
                    <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={draft.studio.gamesSubtitle}
                      onChange={(e) =>
                        setDraft({ ...draft, studio: { ...draft.studio, gamesSubtitle: e.target.value } })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={draft.studio.gamesDescription}
                      onChange={(e) =>
                        setDraft({ ...draft, studio: { ...draft.studio, gamesDescription: e.target.value } })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-[#13141b] border border-[#262732] text-[#9ca3af] text-xs"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#262732] space-y-3">
                  <span className="text-xs uppercase font-semibold text-[#c084fc] tracking-wider block">
                    TV and Film Section
                  </span>
                  <div>
                    <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={draft.studio.filmSubtitle}
                      onChange={(e) =>
                        setDraft({ ...draft, studio: { ...draft.studio, filmSubtitle: e.target.value } })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={draft.studio.filmDescription}
                      onChange={(e) =>
                        setDraft({ ...draft, studio: { ...draft.studio, filmDescription: e.target.value } })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-[#13141b] border border-[#262732] text-[#9ca3af] text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Tools row */}
              <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#262732] space-y-3">
                <span className="text-xs uppercase font-semibold text-[#c084fc] tracking-wider block">
                  Studio Tools & Hardware Gear
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-[#c084fc] mb-1">DAWs</label>
                    <input
                      type="text"
                      value={draft.studio.toolsDaws}
                      onChange={(e) =>
                        setDraft({ ...draft, studio: { ...draft.studio, toolsDaws: e.target.value } })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#c084fc] mb-1">Game Engines</label>
                    <input
                      type="text"
                      value={draft.studio.toolsEngines}
                      onChange={(e) =>
                        setDraft({ ...draft, studio: { ...draft.studio, toolsEngines: e.target.value } })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#c084fc] mb-1">Synthesis Gear</label>
                    <input
                      type="text"
                      value={draft.studio.toolsSynthesis}
                      onChange={(e) =>
                        setDraft({ ...draft, studio: { ...draft.studio, toolsSynthesis: e.target.value } })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#c084fc] mb-1">Acoustic Monitoring</label>
                    <input
                      type="text"
                      value={draft.studio.toolsMonitoring}
                      onChange={(e) =>
                        setDraft({ ...draft, studio: { ...draft.studio, toolsMonitoring: e.target.value } })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT PAGE */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#262732] space-y-4">
                <span className="text-xs uppercase font-semibold text-[#c084fc] tracking-wider block">
                  Contact Page Copy
                </span>

                <div>
                  <label className="block text-xs font-semibold text-[#9ca3af] mb-1">
                    Contact Headline (HalftoneJo)
                  </label>
                  <input
                    type="text"
                    value={draft.contact.title}
                    onChange={(e) =>
                      setDraft({ ...draft, contact: { ...draft.contact, title: e.target.value } })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Subtitle</label>
                  <textarea
                    rows={2}
                    value={draft.contact.description}
                    onChange={(e) =>
                      setDraft({ ...draft, contact: { ...draft.contact, description: e.target.value } })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Form Heading</label>
                    <input
                      type="text"
                      value={draft.contact.formTitle}
                      onChange={(e) =>
                        setDraft({ ...draft, contact: { ...draft.contact, formTitle: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Submit Button Text</label>
                    <input
                      type="text"
                      value={draft.contact.submitButtonLabel}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          contact: { ...draft.contact, submitButtonLabel: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Form Instructions</label>
                  <input
                    type="text"
                    value={draft.contact.formDescription}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        contact: { ...draft.contact, formDescription: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BRANDING & GLOBAL */}
          {activeTab === 'brand' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#262732] space-y-4">
                <span className="text-xs uppercase font-semibold text-[#c084fc] tracking-wider block">
                  Studio Name, Email & Footer
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#9ca3af] mb-1">
                      Studio / Brand Name
                    </label>
                    <input
                      type="text"
                      value={draft.brand.name}
                      onChange={(e) =>
                        setDraft({ ...draft, brand: { ...draft.brand, name: e.target.value } })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#9ca3af] mb-1">
                      Studio Contact Email
                    </label>
                    <input
                      type="email"
                      value={draft.brand.studioEmail}
                      onChange={(e) =>
                        setDraft({ ...draft, brand: { ...draft.brand, studioEmail: e.target.value } })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9ca3af] mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={draft.brand.tagline}
                    onChange={(e) =>
                      setDraft({ ...draft, brand: { ...draft.brand, tagline: e.target.value } })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9ca3af] mb-1">
                    Footer Note
                  </label>
                  <input
                    type="text"
                    value={draft.brand.footerNote}
                    onChange={(e) =>
                      setDraft({ ...draft, brand: { ...draft.brand, footerNote: e.target.value } })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-[#13141b] border border-[#262732] text-[#f3f4f6]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Bar */}
        <div className="px-6 py-4 bg-[#0b0c10] border-t border-[#262732] flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#1a1b24] border border-[#262732] transition-colors"
              title="Reset all fields to default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#9ca3af] hover:text-[#c084fc] hover:bg-[#1a1b24] border border-[#262732] transition-colors"
              title="Copy JSON config to clipboard to paste in src/data/siteContent.ts"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-purple-300" />
                  <span className="text-purple-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Config Code</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs text-[#9ca3af] hover:text-[#f3f4f6] transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-semibold bg-[#a855f7] text-[#0b0c10] hover:bg-[#9333ea] transition-all shadow-[0_0_18px_rgba(168,85,247,0.4)]"
            >
              {savedFeedback ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

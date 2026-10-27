export interface DisciplineRow {
  title: string;
  spec: string;
  description: string;
}

export interface StudioSection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
}

export interface SiteContent {
  brand: {
    name: string;
    tagline: string;
    studioEmail: string;
    footerNote: string;
  };
  home: {
    heroAcousticBadge: string;
    heroAcousticTags: string;
    heroTitle: string;
    heroSubtitle: string;
    ctaExplore: string;
    ctaContact: string;
    ctaAudition: string;

    disciplinesBadge: string;
    disciplinesTitle: string;
    disciplinesSubtitle: string;
    disciplines: DisciplineRow[];

    recentWorkBadge: string;
    recentWorkTitle: string;
    recentWorkCta: string;

    closingCtaTitle: string;
    closingCtaSubtitle: string;
    closingCtaButton: string;
  };
  studio: {
    badge: string;
    title: string;
    description: string;

    controlRoomTitle: string;
    controlRoomSubtitle: string;
    modularLabTitle: string;
    modularLabSubtitle: string;

    gamesTitle: string;
    gamesSubtitle: string;
    gamesDescription: string;
    gamesHighlights: string[];

    filmTitle: string;
    filmSubtitle: string;
    filmDescription: string;
    filmHighlights: string[];

    deliveryTitle: string;
    deliverySubtitle: string;
    deliveryDescription: string;
    deliveryMasteringTitle: string;
    deliveryMasteringDesc: string;
    deliverySurroundTitle: string;
    deliverySurroundDesc: string;
    deliveryAtmosTitle: string;
    deliveryAtmosDesc: string;

    toolsTitle: string;
    toolsSubtitle: string;
    toolsDescription: string;
    toolsDaws: string;
    toolsEngines: string;
    toolsSynthesis: string;
    toolsMonitoring: string;

    collabCtaTitle: string;
    collabCtaSubtitle: string;
    collabCtaButton: string;
  };
  contact: {
    badge: string;
    title: string;
    description: string;
    directInquiriesLabel: string;
    formTitle: string;
    formDescription: string;
    submitButtonLabel: string;
    thankYouMessage: string;
  };
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  brand: {
    name: 'Resonance Sound',
    tagline: 'Sound that makes the world feel real',
    studioEmail: 'mirandaskye.g@gmail.com',
    footerNote: 'Sound for Games, TV & Film · Full-Lifecycle Sonic Architecture',
  },
  home: {
    heroAcousticBadge: '4-Track Acoustic Environment',
    heroAcousticTags: 'Granular · Digital · Sine · Foley',
    heroTitle: 'Sound that makes the world feel real',
    heroSubtitle: 'Sound design and mixing for games, TV and film. From first prototype to final delivery.',
    ctaExplore: 'Explore our work',
    ctaContact: 'Get in touch',
    ctaAudition: 'Audition Audio',

    disciplinesBadge: 'Disciplines & Services',
    disciplinesTitle: 'What we do',
    disciplinesSubtitle: 'Complete sonic architecture from early game mechanics prototyping to final theatrical film dubs.',
    disciplines: [
      {
        title: 'Games',
        spec: 'Wwise · FMOD · Unreal Engine 5 · Unity',
        description: 'Interactive audio systems, dynamic acoustic occlusion, procedural Foley, weapon mechanics, and adaptive musical state architectures.',
      },
      {
        title: 'TV and film',
        spec: 'Pro Tools Ultimate · Dolby Atmos 7.1.4 · Foley',
        description: 'Full theatrical narrative sound supervision, visceral creature voices, ADR recording, dialogue surgical cleanup, and immersive surround mixes.',
      },
      {
        title: 'Electronic music production',
        spec: 'Analog Modular · Hybrid Scores · Adaptive Stems · Moog Sub-Bass',
        description: 'Bespoke electronic music production and hybrid scoring for films, trailers, and games. From analog modular synthesizer soundscapes and driving cybernetic arpeggios to interactive multi-layered stems that adapt seamlessly to gameplay tension and cinematic cuts.',
      },
      {
        title: 'Commercial',
        spec: 'Sonic Branding · TVC · Trailers · Mixed Reality',
        description: 'Impactful mnemonic branding, high-octane trailer sound design, spatial audio for VR/AR, and calibrated broadcast loudness mastering.',
      },
    ],

    recentWorkBadge: 'Selected Work',
    recentWorkTitle: 'Recent work',
    recentWorkCta: 'Explore all on interactive map',

    closingCtaTitle: 'Have a project in mind?',
    closingCtaSubtitle: 'From initial acoustic concept design to delivery in any multi-channel format, let’s build your soundtrack.',
    closingCtaButton: 'Contact us',
  },
  studio: {
    badge: 'Acoustic Facility & Capabilities',
    title: 'One studio, every stage',
    description: 'We provide full-lifecycle sonic craftsmanship from initial acoustic moodboarding and custom synthesis to dialogue cleanup, interactive middleware integration, and calibrated Dolby Atmos theatrical delivery.',

    controlRoomTitle: 'Control Room A',
    controlRoomSubtitle: '7.1.4 Immersive Listening Environment',
    modularLabTitle: 'Modular Laboratory',
    modularLabSubtitle: 'Eurorack, Tape Saturation & Foley Rigs',

    gamesTitle: 'Games',
    gamesSubtitle: 'Dynamic & Procedural Audio',
    gamesDescription: 'Modern gaming demands living acoustic ecosystems that respond dynamically to player volition. We build procedural impact systems, weapon mechanical feedback, reactive creature acoustics, and seamless interactive music state machines.',
    gamesHighlights: [
      'Wwise & FMOD middleware architecture',
      'Unreal Engine 5 & Unity direct implementation',
      'Spatial audio & HRTF acoustic positioning',
      'Dynamic memory budget & CPU profiling',
    ],

    filmTitle: 'TV and film',
    filmSubtitle: 'Narrative Soundscapes & Editorial',
    filmDescription: 'Sound is 50% of the emotional cinema experience. We collaborate directly with directors and showrunners to define character-driven auditory motifs, meticulous Foley, forensic dialogue restoration, and gut-punch sound design.',
    filmHighlights: [
      'Complete sound supervision & editorial',
      'Proprietary organic Foley & prop recording',
      'Spectral dialogue cleaning & ADR matching',
      'Worldbuilding drone & sub-harmonic synthesis',
    ],

    deliveryTitle: 'Delivery',
    deliverySubtitle: 'Stereo, 5.1 & Dolby Atmos',
    deliveryDescription: 'Every release is masterfully balanced for translation across all consumer playback systems — from high-end theatrical stages to soundbars, headphones, and mobile devices. We rigorously calibrate to EBU R128 and ITU-R BS.1770 broadcast standards.',
    deliveryMasteringTitle: 'Stereo Mastering',
    deliveryMasteringDesc: 'Punchy, phase-coherent stereo mixes optimized for broadcast, streaming, and binaural translation.',
    deliverySurroundTitle: '5.1 Surround',
    deliverySurroundDesc: 'Dedicated LCR center clarity, discrete LFE low-end management, and enveloping surround staging.',
    deliveryAtmosTitle: 'Dolby Atmos',
    deliveryAtmosDesc: 'Full 7.1.4 ADM BWF print masters with dynamic 3D spatial object metadata and theatrical translation.',

    toolsTitle: 'Tools',
    toolsSubtitle: 'Hardware, DAWs & Middleware',
    toolsDescription: 'We combine industry-standard workhorses with boutique analog synthesizers and esoteric DSP systems to create sounds you will not find in commercial sample libraries.',
    toolsDaws: 'Pro Tools Ultimate, Nuendo 13, Reaper',
    toolsEngines: 'Audiokinetic Wwise, FMOD Studio, UE5 Chaos',
    toolsSynthesis: 'Kyma Pacarana, Eurorack Modular, Moog Sub 37',
    toolsMonitoring: 'Genelec The Ones 8351B & 7380A Sub',

    collabCtaTitle: 'Ready to collaborate with our studio?',
    collabCtaSubtitle: 'Book a session or request an exploratory demo reel tailored to your genre.',
    collabCtaButton: 'Start a Conversation',
  },
  contact: {
    badge: 'Get in touch',
    title: "Let's talk about your project",
    description: 'Tell us about your world, timeline, and sound requirements — we respond within 24 hours.',
    directInquiriesLabel: 'Direct Inquiries',
    formTitle: 'Project Enquiry Form',
    formDescription: 'Fill in your details below and we will automatically open your email client pre-loaded with your brief.',
    submitButtonLabel: 'Draft Project Enquiry via Email',
    thankYouMessage: 'Your enquiry draft has been prepared. If your email application did not launch automatically, feel free to send your brief directly to our inbox.',
  },
};

const STORAGE_KEY = 'resonance_sound_site_content_v1';

export function getStoredSiteContent(): SiteContent {
  if (typeof window === 'undefined') return DEFAULT_SITE_CONTENT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_CONTENT;
    const parsed = JSON.parse(raw);
    const storedBrand = parsed.brand || {};
    if (storedBrand.studioEmail === 'mirandagurtler@gmail.com' || !storedBrand.studioEmail) {
      storedBrand.studioEmail = 'mirandaskye.g@gmail.com';
    }
    return {
      brand: { ...DEFAULT_SITE_CONTENT.brand, ...storedBrand },
      home: {
        ...DEFAULT_SITE_CONTENT.home,
        ...(parsed.home || {}),
        disciplines:
          Array.isArray(parsed.home?.disciplines) &&
          parsed.home.disciplines.some((d: any) =>
            d?.title?.toLowerCase().includes('electronic')
          )
            ? parsed.home.disciplines
            : DEFAULT_SITE_CONTENT.home.disciplines,
      },
      studio: {
        ...DEFAULT_SITE_CONTENT.studio,
        ...(parsed.studio || {}),
        gamesHighlights: parsed.studio?.gamesHighlights || DEFAULT_SITE_CONTENT.studio.gamesHighlights,
        filmHighlights: parsed.studio?.filmHighlights || DEFAULT_SITE_CONTENT.studio.filmHighlights,
      },
      contact: { ...DEFAULT_SITE_CONTENT.contact, ...(parsed.contact || {}) },
    };
  } catch (err) {
    console.error('Failed to parse stored site content:', err);
    return DEFAULT_SITE_CONTENT;
  }
}

export function saveStoredSiteContent(content: SiteContent): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  } catch (err) {
    console.error('Failed to save site content to localStorage:', err);
  }
}

export function resetStoredSiteContent(): SiteContent {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return DEFAULT_SITE_CONTENT;
}

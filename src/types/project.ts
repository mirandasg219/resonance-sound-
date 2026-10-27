export type ProjectType = 'Game' | 'TV' | 'Film' | 'Electronic Music';

export interface Project {
  id: string;
  title: string;
  type: ProjectType;
  description: string;
  role: string;
  year: string;
  tools: string[];
  mapX: number;
  mapY: number;
  pitchHz: number;
  audioFile?: string;
  videoLink?: string;
  soundCloudUrl?: string;
  imageUrl?: string;
  soundPreviewStyle?: 'atmospheric' | 'cinematic' | 'scifi' | 'foley' | 'tonal';
  clientOrContext?: string;
  isElectronicComposition?: boolean;
  electronicCompositionNotes?: string;
}

export type PageId = 'home' | 'projects' | 'studio' | 'contact';

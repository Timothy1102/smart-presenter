export interface Slide {
  id: string;
  order: number;
  text: string;
  background: string;
  section: string | null;
  sectionGroup: number | null;
  presentationId: string;
}

export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type PresentationSummary = {
  id: string;
  title: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count: { slides: number };
};

export interface SlideInput {
  id?: string; // undefined = new slide (will be inserted)
  text: string;
  background: string;
  order: number;
  section?: string | null;
  sectionGroup?: number | null;
}

// ─── Setlist Types ──────────────────────────────────────────────────────────

export interface SetlistItem {
  id: string;
  order: number;
  presentationId: string;
  presentation: PresentationSummary;
}

export interface SetlistItemWithSlides {
  id: string;
  order: number;
  presentationId: string;
  presentation: Presentation;
}

export interface Setlist {
  id: string;
  title: string;
  items: SetlistItem[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type SetlistSummary = {
  id: string;
  title: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count: { items: number };
  items: { presentation: { title: string } }[];
};

// ─── Song Import Types ──────────────────────────────────────────────────────

export interface SongData {
  title: string;
  order: string[];
  sections: Record<string, string>;
}

export interface SongsImportFile {
  songs: SongData[];
}

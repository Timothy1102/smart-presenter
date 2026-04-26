import { Slide, SetlistItemWithSlides } from "@/types";

// Distinct colors for differentiating songs in the presenter view
const SONG_COLORS = [
  { text: "text-sky-300",    bg: "bg-sky-900/60",    activeBg: "bg-sky-600",    border: "border-sky-500" },
  { text: "text-amber-300",  bg: "bg-amber-900/60",  activeBg: "bg-amber-600",  border: "border-amber-500" },
  { text: "text-emerald-300",bg: "bg-emerald-900/60",activeBg: "bg-emerald-600",border: "border-emerald-500" },
  { text: "text-rose-300",   bg: "bg-rose-900/60",   activeBg: "bg-rose-600",   border: "border-rose-500" },
  { text: "text-violet-300", bg: "bg-violet-900/60", activeBg: "bg-violet-600", border: "border-violet-500" },
  { text: "text-orange-300", bg: "bg-orange-900/60", activeBg: "bg-orange-600", border: "border-orange-500" },
  { text: "text-teal-300",   bg: "bg-teal-900/60",   activeBg: "bg-teal-600",   border: "border-teal-500" },
  { text: "text-pink-300",   bg: "bg-pink-900/60",   activeBg: "bg-pink-600",   border: "border-pink-500" },
  { text: "text-lime-300",   bg: "bg-lime-900/60",   activeBg: "bg-lime-600",   border: "border-lime-500" },
  { text: "text-cyan-300",   bg: "bg-cyan-900/60",   activeBg: "bg-cyan-600",   border: "border-cyan-500" },
];

export type SongColor = typeof SONG_COLORS[number];

export interface SetlistSongInfo {
  title: string;
  color: SongColor;
  firstSlideIndex: number;
}

export interface FlattenResult {
  slides: Slide[];
  /** Maps each slide index to its song index */
  songIndexBySlide: number[];
  /** Ordered list of songs with assigned colors */
  songs: SetlistSongInfo[];
}

/**
 * Flatten all slides from a setlist's items into a single ordered array.
 * Remaps sectionGroup to be globally unique and keeps section labels
 * short (just the section name, no song prefix — color differentiates).
 * Returns song metadata for coloring the presenter UI.
 */
export function flattenSetlistSlides(items: SetlistItemWithSlides[]): FlattenResult {
  const flattened: Slide[] = [];
  const songIndexBySlide: number[] = [];
  const songs: SetlistSongInfo[] = [];
  let groupOffset = 0;

  for (let songIdx = 0; songIdx < items.length; songIdx++) {
    const item = items[songIdx];
    const songTitle = item.presentation.title;
    const slides = item.presentation.slides;
    const color = SONG_COLORS[songIdx % SONG_COLORS.length];

    songs.push({
      title: songTitle,
      color,
      firstSlideIndex: flattened.length,
    });

    // Find the max sectionGroup in this song to calculate offset for next song
    let maxGroup = 0;
    for (const slide of slides) {
      if (slide.sectionGroup != null && slide.sectionGroup > maxGroup) {
        maxGroup = slide.sectionGroup;
      }
    }

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const isFirstSlideOfSong = i === 0;
      const hasSection = slide.section != null;

      flattened.push({
        ...slide,
        // Keep section labels short — just the section name
        section: hasSection
          ? slide.section
          : isFirstSlideOfSong
            ? songTitle
            : slide.section,
        // Remap sectionGroups to be globally unique
        sectionGroup: slide.sectionGroup != null
          ? slide.sectionGroup + groupOffset
          : isFirstSlideOfSong && slide.sectionGroup == null
            ? groupOffset
            : null,
      });
      songIndexBySlide.push(songIdx);
    }

    groupOffset += maxGroup + 100;
  }

  return { slides: flattened, songIndexBySlide, songs };
}


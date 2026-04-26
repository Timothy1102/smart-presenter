import { Slide, SetlistItemWithSlides } from "@/types";

/**
 * Flatten all slides from a setlist's items into a single ordered array.
 * Remaps sectionGroup to be globally unique and prefixes section labels
 * with the song title so the presenter's section bar shows song boundaries.
 */
export function flattenSetlistSlides(items: SetlistItemWithSlides[]): Slide[] {
  const flattened: Slide[] = [];
  let groupOffset = 0;

  for (const item of items) {
    const songTitle = item.presentation.title;
    const slides = item.presentation.slides;

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
        // Prefix section labels with song title
        section: hasSection
          ? `${songTitle} - ${slide.section}`
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
    }

    groupOffset += maxGroup + 100; // gap to avoid collisions between songs
  }

  return flattened;
}

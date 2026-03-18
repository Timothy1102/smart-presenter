import { SLIDE_CONFIG } from "./slide-config";

/**
 * Splits raw lyrics text into an array of slide text strings.
 *
 * Algorithm:
 * 1. Normalize line endings to \n
 * 2. Split on blank lines (\n\n+) to get stanzas
 * 3. Trim and discard empty stanzas
 * 4. If a stanza has <= maxLinesPerSlide lines → one slide
 *    If longer → chunk into groups of maxLinesPerSlide lines
 */
export function splitLyrics(raw: string): string[] {
  const max = SLIDE_CONFIG.maxLinesPerSlide;

  // Normalize line endings
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Split into stanzas by one or more blank lines
  const stanzas = normalized.split(/\n{2,}/);

  const slides: string[] = [];

  for (const stanza of stanzas) {
    const trimmed = stanza.trim();
    if (!trimmed) continue;

    const lines = trimmed.split("\n");

    if (lines.length <= max) {
      slides.push(trimmed);
    } else {
      // Chunk into groups of `max` lines
      for (let i = 0; i < lines.length; i += max) {
        const chunk = lines.slice(i, i + max).join("\n").trim();
        if (chunk) slides.push(chunk);
      }
    }
  }

  return slides;
}

import { SLIDE_CONFIG, DEFAULT_SLIDE_BACKGROUND } from "./slide-config";
import { SongData, SongsImportFile } from "@/types";

export interface GeneratedSlide {
  text: string;
  background: string;
  order: number;
  section: string;
  sectionGroup: number;
}

/**
 * Estimate how many visual lines a text line occupies on a 16:9 slide,
 * based on character count and the configured maxCharsPerLine.
 */
function visualLineCount(line: string): number {
  return Math.ceil(line.length / SLIDE_CONFIG.maxCharsPerLine) || 1;
}

/**
 * Split an array of text lines into slide-sized chunks based on
 * visual line weight (long lines count as 2+ visual lines).
 */
function splitByVisualLines(lines: string[]): string[][] {
  const maxVisual = SLIDE_CONFIG.maxLinesPerSlide;
  const chunks: string[][] = [];
  let currentChunk: string[] = [];
  let currentWeight = 0;

  for (const line of lines) {
    const weight = visualLineCount(line);

    // If adding this line would exceed the limit and we already have content,
    // start a new chunk
    if (currentChunk.length > 0 && currentWeight + weight > maxVisual) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentWeight = 0;
    }

    currentChunk.push(line);
    currentWeight += weight;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Converts a SongData object into an array of slides ready for DB insertion.
 *
 * For each entry in `song.order`:
 * - If the key exists in `song.sections`: split lyrics into slides using visual line counting
 * - If not: create a single blank slide (empty text)
 * Each slide is tagged with `section` (the order entry label) and `sectionGroup`
 * (the index in the order array, to distinguish repeated sections).
 */
export function songToSlides(song: SongData): GeneratedSlide[] {
  const slides: GeneratedSlide[] = [];
  let order = 0;

  for (let groupIdx = 0; groupIdx < song.order.length; groupIdx++) {
    const sectionKey = song.order[groupIdx];
    const lyrics = song.sections[sectionKey];

    if (lyrics === undefined || lyrics.trim() === "") {
      // Non-lyric section (Intro, Dạo, Câu cuối, etc.) → slide with song title
      slides.push({
        text: `✞ ${song.title} ✞`,
        background: DEFAULT_SLIDE_BACKGROUND,
        order: order++,
        section: sectionKey,
        sectionGroup: groupIdx,
      });
    } else {
      const lines = lyrics.split("\n").filter((l) => l.trim() !== "");

      if (lines.length === 0) {
        slides.push({
          text: "",
          background: DEFAULT_SLIDE_BACKGROUND,
          order: order++,
          section: sectionKey,
          sectionGroup: groupIdx,
        });
      } else {
        const chunks = splitByVisualLines(lines);
        for (const chunk of chunks) {
          slides.push({
            text: chunk.join("\n"),
            background: DEFAULT_SLIDE_BACKGROUND,
            order: order++,
            section: sectionKey,
            sectionGroup: groupIdx,
          });
        }
      }
    }
  }

  return slides;
}

/**
 * Validates that a parsed JSON object matches the SongsImportFile format.
 */
export function validateSongsImport(
  data: unknown
): { valid: true; data: SongsImportFile } | { valid: false; error: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Invalid JSON: expected an object" };
  }

  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.songs)) {
    return { valid: false, error: 'Missing or invalid "songs" array' };
  }

  for (let i = 0; i < obj.songs.length; i++) {
    const song = obj.songs[i] as Record<string, unknown>;
    if (!song || typeof song !== "object") {
      return { valid: false, error: `Song at index ${i} is not an object` };
    }
    if (typeof song.title !== "string" || song.title.trim() === "") {
      return { valid: false, error: `Song at index ${i} is missing a title` };
    }
    if (!Array.isArray(song.order) || song.order.length === 0) {
      return {
        valid: false,
        error: `Song "${song.title}" has missing or empty "order" array`,
      };
    }
    for (const key of song.order) {
      if (typeof key !== "string") {
        return {
          valid: false,
          error: `Song "${song.title}" has a non-string entry in "order"`,
        };
      }
    }
    if (!song.sections || typeof song.sections !== "object" || Array.isArray(song.sections)) {
      return {
        valid: false,
        error: `Song "${song.title}" has missing or invalid "sections" object`,
      };
    }
    for (const [key, val] of Object.entries(song.sections as Record<string, unknown>)) {
      if (typeof val !== "string") {
        return {
          valid: false,
          error: `Song "${song.title}", section "${key}" value must be a string`,
        };
      }
    }
  }

  return { valid: true, data: obj as unknown as SongsImportFile };
}

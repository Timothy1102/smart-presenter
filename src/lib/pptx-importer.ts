import JSZip from "jszip";
import { splitLyrics } from "./lyrics-splitter";

/**
 * Imports a .pptx file and converts each slide into the app's slide-text format.
 *
 * A .pptx is a ZIP archive. Slide content lives at `ppt/slides/slideN.xml`.
 * We extract the visible text (`<a:t>` runs) from each slide, preserve
 * paragraph (`<a:p>`) breaks as newlines, and treat soft line breaks
 * (`<a:br/>`) as newlines too. Animations, layouts, fonts, and images
 * are intentionally ignored — only the text is brought across.
 *
 * Each PPTX slide becomes one of our slides. If a slide contains more
 * lines than `SLIDE_CONFIG.maxLinesPerSlide`, it is auto-chunked using
 * the same logic as the lyrics importer so it stays readable.
 */
export async function importPptx(file: File | Blob): Promise<string[]> {
  const buf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);

  // Collect slide XML files and sort numerically (slide1, slide2, …, slide10).
  const slidePaths = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => slideNumber(a) - slideNumber(b));

  if (slidePaths.length === 0) {
    throw new Error("No slides found in this file. Is it a valid .pptx?");
  }

  const parser = new DOMParser();
  const out: string[] = [];

  for (const path of slidePaths) {
    const xml = await zip.files[path].async("string");
    const doc = parser.parseFromString(xml, "application/xml");

    const text = extractSlideText(doc);
    if (!text) continue;

    // Re-use the lyrics splitter so an over-long slide is chunked
    // consistently with the rest of the app.
    const chunks = splitLyrics(text);
    if (chunks.length === 0) {
      out.push(text);
    } else {
      out.push(...chunks);
    }
  }

  return out;
}

function slideNumber(path: string): number {
  const m = path.match(/slide(\d+)\.xml$/);
  return m ? parseInt(m[1], 10) : 0;
}

function extractSlideText(doc: Document): string {
  // Each <a:p> is one paragraph (one line in our world).
  // Use namespace-agnostic lookup to avoid coupling to the "a:" prefix.
  const paragraphs = doc.getElementsByTagNameNS("*", "p");

  const lines: string[] = [];
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    // Skip <p> elements outside the DrawingML namespace, just in case.
    if (para.namespaceURI && !para.namespaceURI.includes("drawingml")) continue;

    const line = extractParagraphText(para).trim();
    if (line) lines.push(line);
  }

  return lines.join("\n").trim();
}

function extractParagraphText(p: Element): string {
  let out = "";
  const walk = (node: Node) => {
    if (node.nodeType !== 1) return;
    const el = node as Element;
    const local = el.localName;
    if (local === "t") {
      out += el.textContent ?? "";
    } else if (local === "br") {
      out += "\n";
    } else {
      for (let i = 0; i < el.childNodes.length; i++) {
        walk(el.childNodes[i]);
      }
    }
  };
  walk(p);
  return out;
}

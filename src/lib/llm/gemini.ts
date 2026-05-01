import { GoogleGenAI } from "@google/genai";
import { validateSongsImport } from "@/lib/song-import";
import { SongsImportFile } from "@/types";
import { PDF_TO_SONGS_PROMPT } from "./prompts";
import { LLMProvider, LLMProviderError, PdfInput } from "./types";

interface GeminiOptions {
  apiKey: string;
  model: string;
}

export class GeminiProvider implements LLMProvider {
  name = "gemini";
  private opts: GeminiOptions;

  constructor(opts: GeminiOptions) {
    this.opts = opts;
  }

  async convertPdfToSongs(pdf: PdfInput): Promise<SongsImportFile> {
    const ai = new GoogleGenAI({ apiKey: this.opts.apiKey });

    let response;
    try {
      response = await ai.models.generateContent({
        model: this.opts.model,
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: pdf.mimeType,
                  data: pdf.data.toString("base64"),
                },
              },
              { text: PDF_TO_SONGS_PROMPT },
            ],
          },
        ],
        config: { responseMimeType: "application/json" },
      });
    } catch (e) {
      throw new LLMProviderError(
        `Gemini API call failed: ${e instanceof Error ? e.message : String(e)}`,
        e
      );
    }

    const text = response.text ?? "";
    if (!text.trim()) {
      throw new LLMProviderError("Gemini returned an empty response");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripFences(text));
    } catch (e) {
      throw new LLMProviderError("Gemini returned non-JSON output", e);
    }

    const v = validateSongsImport(parsed);
    if (!v.valid) {
      throw new LLMProviderError(`Gemini output failed validation: ${v.error}`);
    }
    return v.data;
  }
}

// Defensive: strip ```json ... ``` wrappers if the model ignores responseMimeType
function stripFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "");
}

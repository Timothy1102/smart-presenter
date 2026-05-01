import { GeminiProvider } from "./gemini";
import { LLMProvider } from "./types";

export function getLLMProvider(): LLMProvider {
  const which = process.env.LLM_PROVIDER ?? "gemini";
  switch (which) {
    case "gemini": {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set");
      }
      const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
      return new GeminiProvider({ apiKey, model });
    }
    default:
      throw new Error(`Unknown LLM_PROVIDER: ${which}`);
  }
}

export type { LLMProvider, PdfInput } from "./types";
export { LLMProviderError } from "./types";

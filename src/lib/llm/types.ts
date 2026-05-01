import { SongsImportFile } from "@/types";

export interface PdfInput {
  data: Buffer;
  mimeType: string;
}

export interface LLMProvider {
  name: string;
  convertPdfToSongs(pdf: PdfInput): Promise<SongsImportFile>;
}

export class LLMProviderError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "LLMProviderError";
    this.cause = cause;
  }
}

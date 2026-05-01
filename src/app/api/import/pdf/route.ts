import { NextResponse } from "next/server";
import { getLLMProvider, LLMProviderError } from "@/lib/llm";

// Gemini PDF parsing can take longer than the default 10s.
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// POST /api/import/pdf
// Accepts a multipart/form-data upload with a "file" field containing a PDF.
// Returns the parsed SongsImportFile JSON.
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing file field" },
        { status: 400 }
      );
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "PDF is too large (max 10 MB)" },
        { status: 413 }
      );
    }

    const provider = getLLMProvider();
    const buffer = Buffer.from(await file.arrayBuffer());
    const songs = await provider.convertPdfToSongs({
      data: buffer,
      mimeType: "application/pdf",
    });

    return NextResponse.json(songs);
  } catch (err) {
    if (err instanceof LLMProviderError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    const message =
      err instanceof Error ? err.message : "PDF conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

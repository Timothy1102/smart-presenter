import { NextResponse } from "next/server";
import { saveUploadedAudio, UploadError } from "@/lib/storage";

// POST /api/upload/audio — accepts a multipart form with a "file" audio field,
// stores it, and returns its public URL.
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 400 }
      );
    }

    const url = await saveUploadedAudio(file);
    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}

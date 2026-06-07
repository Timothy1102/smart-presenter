import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { songToSlides, validateSongsImport } from "@/lib/song-import";
import { SongData } from "@/types";

// POST /api/presentations/import — create a presentation from a SongData object
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const song = body as SongData;

    if (!song.title || typeof song.title !== "string" || song.title.trim() === "") {
      return NextResponse.json({ error: "Missing song title" }, { status: 400 });
    }
    if (!Array.isArray(song.order) || song.order.length === 0) {
      return NextResponse.json({ error: "Missing or empty order array" }, { status: 400 });
    }
    if (!song.sections || typeof song.sections !== "object") {
      return NextResponse.json({ error: "Missing sections object" }, { status: 400 });
    }

    const slides = songToSlides(song);

    const presentation = await prisma.presentation.create({
      data: {
        title: song.title.trim(),
        slides: {
          create: slides.map((slide) => ({
            text: slide.text,
            background: slide.background,
            order: slide.order,
            section: slide.section,
            sectionGroup: slide.sectionGroup,
          })),
        },
      },
      include: { slides: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(presentation, { status: 201 });
  } catch (error) {
    console.error("Failed to import song:", error);
    return NextResponse.json(
      { error: "Failed to import song" },
      { status: 500 }
    );
  }
}

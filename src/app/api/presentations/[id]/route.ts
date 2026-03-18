import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SlideInput } from "@/types";

type Params = { params: Promise<{ id: string }> };

// GET /api/presentations/[id] — get one with all slides
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const presentation = await prisma.presentation.findUnique({
      where: { id },
      include: { slides: { orderBy: { order: "asc" } } },
    });
    if (!presentation) {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(presentation);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch presentation" },
      { status: 500 }
    );
  }
}

// PUT /api/presentations/[id] — full save (title + slides)
export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { title, slides }: { title?: string; slides?: SlideInput[] } = body;

    const result = await prisma.$transaction(async (tx) => {
      // Update title if provided
      if (title !== undefined) {
        await tx.presentation.update({
          where: { id },
          data: { title: title.trim() },
        });
      }

      if (slides !== undefined) {
        // Get existing slide ids
        const existing = await tx.slide.findMany({
          where: { presentationId: id },
          select: { id: true },
        });
        const existingIds = new Set(existing.map((s) => s.id));

        // Determine which slides to delete (in DB but not in new array)
        const incomingIds = new Set(slides.filter((s) => s.id).map((s) => s.id!));
        const toDelete = [...existingIds].filter((sid) => !incomingIds.has(sid));

        if (toDelete.length > 0) {
          await tx.slide.deleteMany({ where: { id: { in: toDelete } } });
        }

        // Upsert slides in order
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          const data = {
            text: slide.text,
            background: slide.background,
            order: i,
            presentationId: id,
          };

          if (slide.id && existingIds.has(slide.id)) {
            // Update existing slide
            await tx.slide.update({ where: { id: slide.id }, data });
          } else {
            // Insert new slide
            await tx.slide.create({ data });
          }
        }
      }

      return tx.presentation.findUnique({
        where: { id },
        include: { slides: { orderBy: { order: "asc" } } },
      });
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to save presentation" },
      { status: 500 }
    );
  }
}

// DELETE /api/presentations/[id]
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.presentation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete presentation" },
      { status: 500 }
    );
  }
}

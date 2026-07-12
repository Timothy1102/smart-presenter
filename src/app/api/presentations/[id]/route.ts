import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SlideInput } from "@/types";
import { deleteManagedUpload, isManagedUpload } from "@/lib/storage";

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
    const { title, slides, isPinned }: { title?: string; slides?: SlideInput[]; isPinned?: boolean } = body;

    // Capture uploaded files (backgrounds + slide images + slide audio) in use
    // before the save, so we can clean up any that are no longer referenced afterward.
    let oldUploaded = new Set<string>();
    if (slides !== undefined) {
      const before = await prisma.slide.findMany({
        where: { presentationId: id },
        select: { background: true, image: true, audio: true },
      });
      oldUploaded = new Set(
        before
          .flatMap((s) => [s.background, s.image, s.audio])
          .filter((v): v is string => !!v && isManagedUpload(v))
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update title and/or isPinned if provided
      if (title !== undefined || isPinned !== undefined) {
        await tx.presentation.update({
          where: { id },
          data: {
            ...(title !== undefined && { title: title.trim() }),
            ...(isPinned !== undefined && { isPinned }),
          },
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
            image: slide.image ?? null,
            audio: slide.audio ?? null,
            order: i,
            presentationId: id,
            section: slide.section ?? null,
            sectionGroup: slide.sectionGroup ?? null,
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

    // Delete uploaded files that were dropped by this save and are no longer
    // referenced by any slide (in this or any other presentation).
    if (slides !== undefined) {
      const newUploaded = new Set(
        slides
          .flatMap((s) => [s.background, s.image, s.audio])
          .filter((v): v is string => !!v && isManagedUpload(v))
      );
      const removed = [...oldUploaded].filter((url) => !newUploaded.has(url));
      for (const url of removed) {
        const stillUsed = await prisma.slide.count({
          where: { OR: [{ background: url }, { image: url }, { audio: url }] },
        });
        if (stillUsed === 0) await deleteManagedUpload(url);
      }
    }

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
    // Collect uploaded files (backgrounds + slide images + slide audio) used by
    // this presentation's slides before the rows are cascade-deleted.
    const slides = await prisma.slide.findMany({
      where: { presentationId: id },
      select: { background: true, image: true, audio: true },
    });
    const uploadedFiles = new Set(
      slides
        .flatMap((s) => [s.background, s.image, s.audio])
        .filter((v): v is string => !!v && isManagedUpload(v))
    );

    await prisma.presentation.delete({ where: { id } });

    // Delete each file only if no slide in any OTHER presentation still uses it.
    for (const url of uploadedFiles) {
      const stillUsed = await prisma.slide.count({
        where: { OR: [{ background: url }, { image: url }, { audio: url }] },
      });
      if (stillUsed === 0) {
        await deleteManagedUpload(url);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete presentation" },
      { status: 500 }
    );
  }
}

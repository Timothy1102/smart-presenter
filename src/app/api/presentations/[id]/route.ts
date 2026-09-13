import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SlideInput } from "@/types";
import { deleteManagedUpload, isManagedUpload } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

type UploadFields = {
  background?: string | null;
  image?: string | null;
  audio?: string | null;
};

/** The uploaded-file URLs referenced by a set of slides. */
function uploadedUrls(slides: UploadFields[]): Set<string> {
  return new Set(
    slides
      .flatMap((s) => [s.background, s.image, s.audio])
      .filter((v): v is string => !!v && isManagedUpload(v))
  );
}

/** Delete each URL that no slide in any presentation references any more. */
async function deleteUnreferencedUploads(urls: string[]) {
  if (urls.length === 0) return;
  const referencing = await prisma.slide.findMany({
    where: {
      OR: [
        { background: { in: urls } },
        { image: { in: urls } },
        { audio: { in: urls } },
      ],
    },
    select: { background: true, image: true, audio: true },
  });
  const stillUsed = uploadedUrls(referencing);
  await Promise.all(
    urls.filter((url) => !stillUsed.has(url)).map(deleteManagedUpload)
  );
}

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
  } catch (err) {
    console.error(`GET /api/presentations/${id} failed:`, err);
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
      oldUploaded = uploadedUrls(before);
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
        // A save rewrites the whole slide set, so it runs as one deleteMany
        // plus one createMany. The round trips a transaction needs must not
        // scale with slide count: a per-slide update/create loop takes a full
        // round trip per slide, which runs past the transaction timeout on a
        // deck of any size once the database is far from the server.
        const existing = await tx.slide.findMany({
          where: { presentationId: id },
          select: { id: true },
        });
        const reusableIds = new Set(existing.map((s) => s.id));

        await tx.slide.deleteMany({ where: { presentationId: id } });

        if (slides.length > 0) {
          await tx.slide.createMany({
            data: slides.map((slide, i) => {
              // Re-insert a slide that already existed under its own id so ids
              // stay stable across a save. `delete` reports whether the id was
              // one of this presentation's and claims it, so an unknown or
              // repeated id falls through to a database-generated one.
              const keepId = !!slide.id && reusableIds.delete(slide.id);
              return {
                ...(keepId && { id: slide.id }),
                text: slide.text,
                background: slide.background,
                image: slide.image ?? null,
                audio: slide.audio ?? null,
                order: i,
                presentationId: id,
                section: slide.section ?? null,
                sectionGroup: slide.sectionGroup ?? null,
              };
            }),
          });
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
      const newUploaded = uploadedUrls(slides);
      await deleteUnreferencedUploads(
        [...oldUploaded].filter((url) => !newUploaded.has(url))
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error(`PUT /api/presentations/${id} failed:`, err);
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
    const uploadedFiles = uploadedUrls(slides);

    await prisma.presentation.delete({ where: { id } });

    // Delete each file only if no slide in any OTHER presentation still uses it.
    await deleteUnreferencedUploads([...uploadedFiles]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`DELETE /api/presentations/${id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to delete presentation" },
      { status: 500 }
    );
  }
}

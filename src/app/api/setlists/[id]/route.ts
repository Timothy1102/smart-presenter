import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// GET /api/setlists/[id] — get one with items, presentations, and slides
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const setlist = await prisma.setlist.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: "asc" },
          include: {
            presentation: {
              include: {
                slides: { orderBy: { order: "asc" } },
                _count: { select: { slides: true } },
              },
            },
          },
        },
      },
    });
    if (!setlist) {
      return NextResponse.json({ error: "Setlist not found" }, { status: 404 });
    }
    return NextResponse.json(setlist);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch setlist" },
      { status: 500 }
    );
  }
}

// PUT /api/setlists/[id] — update title and/or reorder items
export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { title, items }: { title?: string; items?: { id?: string; presentationId: string }[] } = body;

    const result = await prisma.$transaction(async (tx) => {
      if (title !== undefined) {
        await tx.setlist.update({
          where: { id },
          data: { title: title.trim() },
        });
      }

      if (items !== undefined) {
        // Get existing item ids
        const existing = await tx.setlistItem.findMany({
          where: { setlistId: id },
          select: { id: true },
        });
        const existingIds = new Set(existing.map((i) => i.id));

        // Determine which items to delete
        const incomingIds = new Set(items.filter((i) => i.id).map((i) => i.id!));
        const toDelete = [...existingIds].filter((iid) => !incomingIds.has(iid));

        if (toDelete.length > 0) {
          await tx.setlistItem.deleteMany({ where: { id: { in: toDelete } } });
        }

        // Upsert items in order
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const data = {
            order: i,
            setlistId: id,
            presentationId: item.presentationId,
          };

          if (item.id && existingIds.has(item.id)) {
            await tx.setlistItem.update({ where: { id: item.id }, data });
          } else {
            await tx.setlistItem.create({ data });
          }
        }
      }

      return tx.setlist.findUnique({
        where: { id },
        include: {
          items: {
            orderBy: { order: "asc" },
            include: {
              presentation: {
                include: { _count: { select: { slides: true } } },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to save setlist" },
      { status: 500 }
    );
  }
}

// DELETE /api/setlists/[id]
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.setlist.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete setlist" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/setlists — list all with item count
export async function GET() {
  try {
    const setlists = await prisma.setlist.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { items: true } } },
    });
    return NextResponse.json(setlists);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch setlists" },
      { status: 500 }
    );
  }
}

// POST /api/setlists — create new setlist
export async function POST(request: Request) {
  try {
    const { title } = await request.json();
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const setlist = await prisma.setlist.create({
      data: { title: title.trim() },
    });
    return NextResponse.json(setlist, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create setlist" },
      { status: 500 }
    );
  }
}

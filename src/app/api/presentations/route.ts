import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/presentations — list all with slide count
export async function GET() {
  try {
    const presentations = await prisma.presentation.findMany({
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      include: { _count: { select: { slides: true } } },
    });
    return NextResponse.json(presentations);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch presentations" },
      { status: 500 }
    );
  }
}

// POST /api/presentations — create new presentation
export async function POST(request: Request) {
  try {
    const { title } = await request.json();
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const presentation = await prisma.presentation.create({
      data: { title: title.trim() },
    });
    return NextResponse.json(presentation, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create presentation" },
      { status: 500 }
    );
  }
}

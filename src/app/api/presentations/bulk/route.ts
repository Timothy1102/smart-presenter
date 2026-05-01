import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/presentations/bulk — bulk pin/unpin/delete
export async function POST(request: Request) {
  try {
    const { action, ids }: { action: "pin" | "unpin" | "delete"; ids: string[] } =
      await request.json();

    if (!ids?.length) {
      return NextResponse.json({ error: "No ids provided" }, { status: 400 });
    }

    if (action === "pin" || action === "unpin") {
      await prisma.presentation.updateMany({
        where: { id: { in: ids } },
        data: { isPinned: action === "pin" },
      });
    } else if (action === "delete") {
      await prisma.presentation.deleteMany({
        where: { id: { in: ids } },
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 }
    );
  }
}

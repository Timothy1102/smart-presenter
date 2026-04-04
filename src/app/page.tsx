import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PresentationList } from "@/components/library/PresentationList";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const presentations = await prisma.presentation.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { slides: true } } },
  });

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Smart Presenter</h1>
            <p className="text-gray-400 text-sm mt-1">Your lyrics presentation library</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/import"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Import Songs
            </Link>
            <Link
              href="/presentations/new"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              + New Presentation
            </Link>
          </div>
        </div>
        <PresentationList presentations={presentations} />
      </div>
    </div>
  );
}

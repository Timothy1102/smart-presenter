import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LibraryTabs } from "@/components/library/LibraryTabs";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const [presentations, setlists] = await Promise.all([
    prisma.presentation.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { slides: true } } },
    }),
    prisma.setlist.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { items: true } },
        items: {
          orderBy: { order: "asc" },
          include: { presentation: { select: { title: true } } },
        },
      },
    }),
  ]);

  return (
    <div
      className="min-h-screen bg-gray-950 bg-cover bg-center bg-fixed relative"
      style={{ backgroundImage: "url('/bg2.jpg')" }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Hero header */}
        <header className="px-6 pt-14 pb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs font-medium mb-5 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Presentation Tool
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight mb-3">
            Smart Presenter
          </h1>
          <p className="text-white/60 text-lg max-w-md mx-auto mb-8">
            Beautiful lyrics &amp; text presentations for churches and live events
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/presentations/new"
              className="px-6 py-2.5 bg-white text-gray-900 rounded-xl font-semibold text-sm hover:bg-white/90 transition-all shadow-lg shadow-black/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.99]"
            >
              + New Presentation
            </Link>
            <Link
              href="/setlists/new"
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-black/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.99]"
            >
              + New Setlist
            </Link>
            <Link
              href="/import"
              className="px-6 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              Import Songs
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 pb-12 max-w-5xl mx-auto w-full">
          <LibraryTabs presentations={presentations} setlists={setlists} />
        </main>
      </div>
    </div>
  );
}

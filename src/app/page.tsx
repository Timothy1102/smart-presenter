import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PresentationList } from "@/components/library/PresentationList";
import { SetlistCard } from "@/components/setlist/SetlistCard";
import { SetlistSummary } from "@/types";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const [presentations, setlists] = await Promise.all([
    prisma.presentation.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { slides: true } } },
    }),
    prisma.setlist.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { items: true } } },
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
        <main className="flex-1 px-4 pb-12 max-w-5xl mx-auto w-full space-y-8">
          {/* Setlists section */}
          {setlists.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white/80 text-sm font-semibold uppercase tracking-widest">
                  Setlists
                </h2>
                <span className="text-white/40 text-xs">
                  {setlists.length} setlist{setlists.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-col divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden">
                {(setlists as SetlistSummary[]).map((s) => (
                  <SetlistCard key={s.id} setlist={s} />
                ))}
              </div>
            </div>
          )}

          {/* Library section */}
          <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white/80 text-sm font-semibold uppercase tracking-widest">
                Library
              </h2>
              <span className="text-white/40 text-xs">
                {presentations.length} presentation{presentations.length !== 1 ? "s" : ""}
              </span>
            </div>
            <PresentationList presentations={presentations} />
          </div>
        </main>
      </div>
    </div>
  );
}

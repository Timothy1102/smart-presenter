"use client";

import { useState } from "react";
import { PresentationSummary } from "@/types";
import { PresentationCard } from "./PresentationCard";
import Link from "next/link";
import { DeleteButton } from "./DeleteButton";

type ViewMode = "card" | "list";

function normalize(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function PresentationList({ presentations }: { presentations: PresentationSummary[] }) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");

  const filtered = presentations.filter((p) =>
    normalize(p.title).includes(normalize(query))
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search presentations…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
          />
        </div>

        {/* View toggle */}
        <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <button
            onClick={() => setView("card")}
            title="Card view"
            className={`px-3 py-2 transition-colors ${view === "card" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/10"}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <rect x="1" y="1" width="7" height="7" rx="1" />
              <rect x="11" y="1" width="7" height="7" rx="1" />
              <rect x="1" y="11" width="7" height="7" rx="1" />
              <rect x="11" y="11" width="7" height="7" rx="1" />
            </svg>
          </button>
          <button
            onClick={() => setView("list")}
            title="List view"
            className={`px-3 py-2 transition-colors ${view === "list" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/10"}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <rect x="1" y="3" width="18" height="2" rx="1" />
              <rect x="1" y="9" width="18" height="2" rx="1" />
              <rect x="1" y="15" width="18" height="2" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Empty states */}
      {presentations.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🎤</div>
          <p className="text-white/50 text-lg font-medium mb-1">No presentations yet</p>
          <p className="text-white/30 text-sm">Create your first presentation to get started.</p>
        </div>
      )}

      {presentations.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-white/50 text-lg">No results for &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {/* Card view */}
      {view === "card" && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <PresentationCard key={p.id} presentation={p} />
          ))}
        </div>
      )}

      {/* List view */}
      {view === "list" && filtered.length > 0 && (
        <div className="flex flex-col divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden">
          {filtered.map((p) => (
            <ListRow key={p.id} presentation={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListRow({ presentation: p }: { presentation: PresentationSummary }) {
  const dt = new Date(p.updatedAt);
  const date = dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 bg-white/5 hover:bg-white/10 transition-colors group">
      <Link
        href={`/presentations/${p.id}/edit`}
        className="flex-1 min-w-0"
      >
        <span className="text-white font-medium group-hover:text-blue-300 transition-colors truncate block">
          {p.title}
        </span>
        <span className="text-xs text-white/35">
          {p._count.slides} slide{p._count.slides !== 1 ? "s" : ""} · {date} {time}
        </span>
      </Link>

      <div className="flex items-center gap-1.5 shrink-0">
        <Link
          href={`/presentations/${p.id}/edit`}
          className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all"
        >
          Edit
        </Link>
        <Link
          href={`/presentations/${p.id}/present`}
          target="_blank"
          className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all"
        >
          Audience
        </Link>
        <Link
          href={`/presentations/${p.id}/present/control`}
          target="_blank"
          className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all"
        >
          Presenter
        </Link>
        <DeleteButton id={p.id} variant="inline" />
      </div>
    </div>
  );
}

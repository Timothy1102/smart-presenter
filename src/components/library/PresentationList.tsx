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
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none"
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
            className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* View toggle */}
        <div className="flex bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setView("card")}
            title="Card view"
            className={`px-3 py-2 transition-colors ${view === "card" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
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
            className={`px-3 py-2 transition-colors ${view === "list" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
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
        <div className="text-center py-20 text-gray-500">
          <p className="text-xl mb-2">No presentations yet</p>
          <p className="text-sm">Create one to get started.</p>
        </div>
      )}

      {presentations.length > 0 && filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg">No results for &ldquo;{query}&rdquo;</p>
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
        <div className="flex flex-col divide-y divide-gray-800 border border-gray-800 rounded-xl overflow-hidden">
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
  const time = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });

  return (
    <div className="flex items-center gap-4 px-5 py-3 bg-gray-900 hover:bg-gray-800 transition-colors group">
      <Link
        href={`/presentations/${p.id}/edit`}
        className="flex-1 min-w-0"
      >
        <span className="text-white font-medium group-hover:text-blue-400 transition-colors truncate block">
          {p.title}
        </span>
        <span className="text-xs text-gray-500">
          {p._count.slides} slide{p._count.slides !== 1 ? "s" : ""} · {date} {time}
        </span>
      </Link>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/presentations/${p.id}/edit`}
          className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
        >
          Edit
        </Link>
        <Link
          href={`/presentations/${p.id}/present`}
          target="_blank"
          className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
        >
          Audience
        </Link>
        <Link
          href={`/presentations/${p.id}/present/control`}
          target="_blank"
          className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
        >
          Presenter
        </Link>
        <DeleteButton id={p.id} variant="inline" />
      </div>
    </div>
  );
}

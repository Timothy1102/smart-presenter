"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PresentationSummary } from "@/types";
import { PresentationCard } from "./PresentationCard";
import Link from "next/link";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  const filtered = presentations.filter((p) =>
    normalize(p.title).includes(normalize(query))
  );

  const isSelecting = selectedIds.size > 0;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filtered.map((p) => p.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function bulkAction(action: "pin" | "unpin" | "delete") {
    const ids = [...selectedIds];
    await fetch("/api/presentations/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids }),
    });
    setSelectedIds(new Set());
    router.refresh();
  }

  async function togglePin(id: string, currentlyPinned: boolean) {
    await fetch(`/api/presentations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !currentlyPinned }),
    });
    router.refresh();
  }

  async function deleteOne(id: string) {
    await fetch(`/api/presentations/${id}`, { method: "DELETE" });
    router.refresh();
  }

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

      {/* Bulk action bar */}
      {isSelecting && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <span className="text-sm text-blue-300 font-medium mr-auto">
            {selectedIds.size} selected
          </span>
          <button
            onClick={selectAll}
            className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all"
          >
            Select all
          </button>
          <button
            onClick={() => bulkAction("pin")}
            className="px-3 py-1 text-xs bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/20 rounded-lg text-amber-300 transition-all"
          >
            Pin
          </button>
          <button
            onClick={() => bulkAction("unpin")}
            className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all"
          >
            Unpin
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete ${selectedIds.size} presentation(s)?`)) {
                bulkAction("delete");
              }
            }}
            className="px-3 py-1 text-xs bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 rounded-lg text-red-300 transition-all"
          >
            Delete
          </button>
          <button
            onClick={clearSelection}
            className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white/50 hover:text-white transition-all"
          >
            Cancel
          </button>
        </div>
      )}

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
            <PresentationCard
              key={p.id}
              presentation={p}
              selected={selectedIds.has(p.id)}
              onToggleSelect={() => toggleSelect(p.id)}
              onTogglePin={() => togglePin(p.id, p.isPinned)}
              onDelete={() => deleteOne(p.id)}
              isSelecting={isSelecting}
            />
          ))}
        </div>
      )}

      {/* List view */}
      {view === "list" && filtered.length > 0 && (
        <div className="flex flex-col divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden">
          {filtered.map((p) => (
            <ListRow
              key={p.id}
              presentation={p}
              selected={selectedIds.has(p.id)}
              onToggleSelect={() => toggleSelect(p.id)}
              onTogglePin={() => togglePin(p.id, p.isPinned)}
              onDelete={() => deleteOne(p.id)}
              isSelecting={isSelecting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ListRow({
  presentation: p,
  selected,
  onToggleSelect,
  onTogglePin,
  onDelete,
  isSelecting,
}: {
  presentation: PresentationSummary;
  selected: boolean;
  onToggleSelect: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
  isSelecting: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const dt = new Date(p.updatedAt);
  const date = dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmingDelete(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleDelete() {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
    setConfirmingDelete(false);
    setMenuOpen(false);
  }

  return (
    <div
      className={`flex items-center gap-4 px-5 py-3.5 bg-white/5 hover:bg-white/10 transition-colors group ${
        selected ? "!bg-blue-500/10 border-l-2 border-l-blue-400" : ""
      }`}
    >
      {/* Checkbox (always visible when selecting, hover-visible otherwise) */}
      <button
        onClick={onToggleSelect}
        className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all ${
          selected
            ? "bg-blue-500 border-blue-400 text-white"
            : isSelecting
              ? "border-white/20 hover:border-white/40"
              : "border-white/10 opacity-0 group-hover:opacity-100 hover:border-white/40"
        }`}
      >
        {selected && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Pin indicator */}
      {p.isPinned && (
        <span className="shrink-0 text-amber-400 text-xs" title="Pinned">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 2l-4 4-6-2-2 2 5 5-4 8 2 1 4-6 5 5 2-2-2-6 4-4-4-5z" />
          </svg>
        </span>
      )}

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

      {/* Action menu */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={() => {
            setMenuOpen((o) => !o);
            setConfirmingDelete(false);
          }}
          className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition-all"
          title="Actions"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="4" r="1.5" />
            <circle cx="10" cy="10" r="1.5" />
            <circle cx="10" cy="16" r="1.5" />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-1.5 w-44 bg-gray-900/95 border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-10 overflow-hidden backdrop-blur-md">
            <Link
              href={`/presentations/${p.id}/edit`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit
            </Link>
            <Link
              href={`/presentations/${p.id}/present`}
              target="_blank"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Audience
            </Link>
            <Link
              href={`/presentations/${p.id}/present/control`}
              target="_blank"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Presenter
            </Link>
            <div className="border-t border-white/10">
              <button
                onClick={() => {
                  onTogglePin();
                  setMenuOpen(false);
                }}
                className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-300/80 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
              >
                <svg className="w-4 h-4" fill={p.isPinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 2l-4 4-6-2-2 2 5 5-4 8 2 1 4-6 5 5 2-2-2-6 4-4-4-5z" />
                </svg>
                {p.isPinned ? "Unpin" : "Pin to top"}
              </button>
            </div>
            <div className="border-t border-white/10">
              {confirmingDelete ? (
                <div>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {deleting ? "Deleting…" : "Confirm delete"}
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    className="w-full text-left px-4 py-2.5 text-sm text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

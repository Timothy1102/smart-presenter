"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { PresentationSummary } from "@/types";

export function PresentationCard({
  presentation,
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

  const date = new Date(presentation.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const time = new Date(presentation.updatedAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

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
      className={`group relative bg-white/5 border rounded-xl p-5 hover:bg-white/10 transition-all ${
        selected
          ? "border-blue-400/50 bg-blue-500/10"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggleSelect}
        className={`absolute top-3 left-3 w-5 h-5 rounded border flex items-center justify-center transition-all z-10 ${
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
      {presentation.isPinned && (
        <span className="absolute top-3 right-14 text-amber-400 text-xs" title="Pinned">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 2l-4 4-6-2-2 2 5 5-4 8 2 1 4-6 5 5 2-2-2-6 4-4-4-5z" />
          </svg>
        </span>
      )}

      <Link href={`/presentations/${presentation.id}/edit`} className="block">
        <h2 className="text-base font-semibold text-white group-hover:text-blue-300 transition-colors truncate mb-1">
          {presentation.title}
        </h2>
        <p className="text-xs text-white/35">
          {presentation._count.slides} slide{presentation._count.slides !== 1 ? "s" : ""} · {date} {time}
        </p>
      </Link>
      <div className="flex items-center justify-end mt-4">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => {
              setMenuOpen((o) => !o);
              setConfirmingDelete(false);
            }}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition-all"
            title="Actions"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="4" cy="10" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="16" cy="10" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1.5 w-44 bg-gray-900/95 border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-10 overflow-hidden backdrop-blur-md">
              <Link
                href={`/presentations/${presentation.id}/edit`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit
              </Link>
              <Link
                href={`/presentations/${presentation.id}/present`}
                target="_blank"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Audience
              </Link>
              <Link
                href={`/presentations/${presentation.id}/present/control`}
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
                  <svg className="w-4 h-4" fill={presentation.isPinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 2l-4 4-6-2-2 2 5 5-4 8 2 1 4-6 5 5 2-2-2-6 4-4-4-5z" />
                  </svg>
                  {presentation.isPinned ? "Unpin" : "Pin to top"}
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
    </div>
  );
}

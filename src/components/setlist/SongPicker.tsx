"use client";

import { useState, useEffect, useRef } from "react";
import { PresentationSummary } from "@/types";

function normalize(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

interface SongPickerProps {
  onAdd: (presentation: PresentationSummary) => void;
  excludeIds: Set<string>;
}

export function SongPicker({ onAdd, excludeIds }: SongPickerProps) {
  const [open, setOpen] = useState(false);
  const [songs, setSongs] = useState<PresentationSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/presentations")
      .then((r) => r.json())
      .then((data) => setSongs(data))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const filtered = songs.filter(
    (s) => !excludeIds.has(s.id) && normalize(s.title).includes(normalize(query))
  );

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
      >
        + Add Song
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-20 overflow-hidden">
          <div className="p-3 border-b border-gray-800">
            <input
              type="text"
              placeholder="Search songs…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {loading && (
              <p className="text-gray-500 text-sm p-4 text-center">Loading…</p>
            )}
            {!loading && filtered.length === 0 && (
              <p className="text-gray-500 text-sm p-4 text-center">
                {songs.length === 0 ? "No presentations found" : "No matches"}
              </p>
            )}
            {filtered.map((song) => (
              <button
                key={song.id}
                onClick={() => {
                  onAdd(song);
                  setQuery("");
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-800 transition-colors border-b border-gray-800/50 last:border-0"
              >
                <span className="text-white text-sm font-medium block truncate">
                  {song.title}
                </span>
                <span className="text-gray-500 text-xs">
                  {song._count.slides} slide{song._count.slides !== 1 ? "s" : ""}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

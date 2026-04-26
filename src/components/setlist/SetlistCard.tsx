"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SetlistSummary } from "@/types";

export function SetlistCard({ setlist }: { setlist: SetlistSummary }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const date = new Date(setlist.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setConfirmDelete(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/setlists/${setlist.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div
      ref={ref}
      className="flex items-center gap-4 px-5 py-3.5 bg-white/5 hover:bg-white/10 transition-colors group"
    >
      <Link href={`/setlists/${setlist.id}/edit`} className="flex-1 min-w-0">
        <span className="text-white font-medium group-hover:text-blue-300 transition-colors truncate block">
          {setlist.title}
        </span>
        <span className="text-xs text-white/35">
          {setlist._count.items} song{setlist._count.items !== 1 ? "s" : ""} · {date}
        </span>
      </Link>

      <div className="flex items-center gap-1.5 shrink-0">
        <Link
          href={`/setlists/${setlist.id}/edit`}
          className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all"
        >
          Edit
        </Link>
        <Link
          href={`/setlists/${setlist.id}/present`}
          target="_blank"
          className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all"
        >
          Audience
        </Link>
        <Link
          href={`/setlists/${setlist.id}/present/control`}
          target="_blank"
          className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all"
        >
          Presenter
        </Link>
        {confirmDelete ? (
          <span className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 transition-all disabled:opacity-50"
            >
              {deleting ? "…" : "Confirm"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white/60 transition-all"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-3 py-1 text-xs bg-white/10 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-lg text-white/50 hover:text-red-300 transition-all"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

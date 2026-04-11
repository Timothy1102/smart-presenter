"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { PresentationSummary } from "@/types";
import { DeleteButton } from "./DeleteButton";

export function PresentationCard({ presentation }: { presentation: PresentationSummary }) {
  const [menuOpen, setMenuOpen] = useState(false);
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
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="group bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-white/20 transition-all">
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
            onClick={() => setMenuOpen((o) => !o)}
            className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white/70 hover:text-white font-medium transition-all"
          >
            Actions ▾
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1.5 w-44 bg-gray-900/90 border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-10 overflow-hidden backdrop-blur-md">
              <Link
                href={`/presentations/${presentation.id}/edit`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                ✏️ Edit
              </Link>
              <Link
                href={`/presentations/${presentation.id}/present`}
                target="_blank"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                ▶ Audience
              </Link>
              <Link
                href={`/presentations/${presentation.id}/present/control`}
                target="_blank"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                🖥 Presenter
              </Link>
              <div className="border-t border-white/10">
                <DeleteButton id={presentation.id} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

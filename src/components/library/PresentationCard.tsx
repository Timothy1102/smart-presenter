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
    second: "2-digit",
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
    <div className="group bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
      <Link href={`/presentations/${presentation.id}/edit`} className="block">
        <h2 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors truncate mb-1">
          {presentation.title}
        </h2>
        <p className="text-sm text-gray-500">
          {presentation._count.slides} slide{presentation._count.slides !== 1 ? "s" : ""} · Updated {date} {time}
        </p>
      </Link>
      <div className="flex items-center justify-end mt-4">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded font-medium transition-colors"
          >
            Actions ▾
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 overflow-hidden">
              <Link
                href={`/presentations/${presentation.id}/edit`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
              >
                ✏️ Edit
              </Link>
              <Link
                href={`/presentations/${presentation.id}/present`}
                target="_blank"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
              >
                ▶ Audience
              </Link>
              <Link
                href={`/presentations/${presentation.id}/present/control`}
                target="_blank"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
              >
                🖥 Presenter
              </Link>
              <div className="border-t border-gray-700">
                <DeleteButton id={presentation.id} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

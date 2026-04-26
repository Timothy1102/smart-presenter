"use client";

import { useState } from "react";
import { PresentationSummary, SetlistSummary } from "@/types";
import { PresentationList } from "./PresentationList";
import { SetlistCard } from "../setlist/SetlistCard";

type Tab = "songs" | "setlists";

export function LibraryTabs({
  presentations,
  setlists,
}: {
  presentations: PresentationSummary[];
  setlists: SetlistSummary[];
}) {
  const [tab, setTab] = useState<Tab>("songs");

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md p-6 shadow-2xl">
      {/* Tab buttons */}
      <div className="flex items-center gap-1 mb-5 bg-white/5 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("songs")}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
            tab === "songs"
              ? "bg-white/15 text-white"
              : "text-white/40 hover:text-white/70 hover:bg-white/5"
          }`}
        >
          Songs
          <span className="ml-1.5 text-xs opacity-60">{presentations.length}</span>
        </button>
        <button
          onClick={() => setTab("setlists")}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
            tab === "setlists"
              ? "bg-white/15 text-white"
              : "text-white/40 hover:text-white/70 hover:bg-white/5"
          }`}
        >
          Setlists
          <span className="ml-1.5 text-xs opacity-60">{setlists.length}</span>
        </button>
      </div>

      {/* Songs tab */}
      {tab === "songs" && (
        <PresentationList presentations={presentations} />
      )}

      {/* Setlists tab */}
      {tab === "setlists" && (
        <>
          {setlists.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🎵</div>
              <p className="text-white/50 text-lg font-medium mb-1">No setlists yet</p>
              <p className="text-white/30 text-sm">Create a setlist to group songs for a seamless show.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden">
              {setlists.map((s) => (
                <SetlistCard key={s.id} setlist={s} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

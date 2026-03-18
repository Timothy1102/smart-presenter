"use client";

import { useState } from "react";
import { splitLyrics } from "@/lib/lyrics-splitter";

interface LyricsImporterProps {
  onImport: (slides: string[]) => void;
}

export function LyricsImporter({ onImport }: LyricsImporterProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  function handleImport() {
    const slides = splitLyrics(text);
    if (slides.length > 0) {
      onImport(slides);
      setText("");
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2 text-sm border border-dashed border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200 rounded-lg transition-colors"
      >
        + Import from lyrics
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"Paste lyrics here…\n\nSeparate verses with blank lines."}
        rows={10}
        autoFocus
        className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none font-mono"
      />
      <div className="flex gap-2">
        <button
          onClick={handleImport}
          disabled={!text.trim()}
          className="flex-1 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-40 transition-colors"
        >
          Split into slides
        </button>
        <button
          onClick={() => { setOpen(false); setText(""); }}
          className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

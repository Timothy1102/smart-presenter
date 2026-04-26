"use client";

import { useRef, useState } from "react";
import { importPptx } from "@/lib/pptx-importer";

interface PptxImporterProps {
  onImport: (slides: string[]) => void;
}

export function PptxImporter({ onImport }: PptxImporterProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const slides = await importPptx(file);
      if (slides.length === 0) {
        setError("No text found in this file.");
      } else {
        onImport(slides);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="w-full py-2 text-sm border border-dashed border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? "Importing…" : "+ Import from PPTX"}
      </button>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

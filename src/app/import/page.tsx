"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateSongsImport } from "@/lib/song-import";
import { songToSlides } from "@/lib/song-import";
import { SongData, SongsImportFile } from "@/types";

interface SongPreview {
  song: SongData;
  slideCount: number;
  sectionSummary: { label: string; slideCount: number }[];
}

function buildPreviews(data: SongsImportFile): SongPreview[] {
  return data.songs.map((song) => {
    const slides = songToSlides(song);

    // Build section summary from order
    const sectionSummary: { label: string; slideCount: number }[] = [];
    for (let i = 0; i < song.order.length; i++) {
      const label = song.order[i];
      const count = slides.filter((s) => s.sectionGroup === i).length;
      sectionSummary.push({ label, slideCount: count });
    }

    return { song, slideCount: slides.length, sectionSummary };
  });
}

export default function ImportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<SongPreview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [results, setResults] = useState<{ title: string; id: string }[]>([]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPreviews(null);
    setResults([]);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const validation = validateSongsImport(parsed);
        if (!validation.valid) {
          setError(validation.error);
          return;
        }
        setPreviews(buildPreviews(validation.data));
      } catch {
        setError("Failed to parse JSON file");
      }
    };
    reader.readAsText(file);
  }

  async function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPreviews(null);
    setResults([]);
    setConverting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import/pdf", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to convert PDF");
        return;
      }
      const validation = validateSongsImport(data);
      if (!validation.valid) {
        setError(`Converted JSON is invalid: ${validation.error}`);
        return;
      }
      setPreviews(buildPreviews(validation.data));
    } catch (err) {
      setError(
        `Failed to convert PDF: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setConverting(false);
      if (pdfRef.current) pdfRef.current.value = "";
    }
  }

  async function handleImport() {
    if (!previews) return;
    setImporting(true);
    setError(null);
    const created: { title: string; id: string }[] = [];

    for (const preview of previews) {
      try {
        const res = await fetch("/api/presentations/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preview.song),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Import failed");
        }
        const data = await res.json();
        created.push({ title: data.title, id: data.id });
      } catch (err) {
        setError(`Failed to import "${preview.song.title}": ${err instanceof Error ? err.message : "Unknown error"}`);
        break;
      }
    }

    setResults(created);
    setImporting(false);
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm">
            ← Library
          </Link>
          <h1 className="text-2xl font-bold text-white">Import Songs</h1>
        </div>

        {/* PDF upload (auto-converted via Gemini) */}
        <div className="mb-4">
          <label
            onClick={() => !converting && pdfRef.current?.click()}
            className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl transition-colors ${
              converting
                ? "border-blue-700 bg-blue-950/20 cursor-wait"
                : "border-gray-700 hover:border-blue-600 cursor-pointer"
            }`}
          >
            {converting ? (
              <>
                <span className="text-blue-300 text-sm mb-1">
                  Converting PDF via Gemini…
                </span>
                <span className="text-gray-600 text-xs">
                  This can take 10–30 seconds
                </span>
              </>
            ) : (
              <>
                <span className="text-gray-300 text-sm mb-1">
                  Click to select a PDF — converted via AI
                </span>
                <span className="text-gray-600 text-xs">
                  Worship song sheet (chords + lyrics)
                </span>
              </>
            )}
          </label>
          <input
            ref={pdfRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handlePdfChange}
            disabled={converting}
            className="hidden"
          />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-600 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* JSON upload */}
        <div className="mb-6">
          <label
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-gray-500 transition-colors"
          >
            <span className="text-gray-400 text-sm mb-1">
              Click to select a JSON file
            </span>
            <span className="text-gray-600 text-xs">
              Must follow the SongsImportFile format
            </span>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Song previews */}
        {previews && previews.length > 0 && results.length === 0 && (
          <div className="space-y-4 mb-6">
            <h2 className="text-lg font-semibold text-white">
              {previews.length} song{previews.length > 1 ? "s" : ""} found
            </h2>

            {previews.map((p, i) => (
              <div
                key={i}
                className="bg-gray-900 border border-gray-800 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-medium">{p.song.title}</h3>
                  <span className="text-gray-500 text-xs">
                    {p.slideCount} slide{p.slideCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.sectionSummary.map((sec, j) => (
                    <span
                      key={j}
                      className="px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-400"
                    >
                      {sec.label}
                      {sec.slideCount > 1 && (
                        <span className="text-gray-600 ml-1">
                          ({sec.slideCount})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {importing
                ? "Importing..."
                : `Import ${previews.length} Song${previews.length > 1 ? "s" : ""}`}
            </button>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-green-400">
              {results.length} presentation{results.length > 1 ? "s" : ""} created
            </h2>
            <div className="space-y-2">
              {results.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg p-3"
                >
                  <span className="text-white text-sm">{r.title}</span>
                  <div className="flex gap-2">
                    <Link
                      href={`/presentations/${r.id}/edit`}
                      className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/presentations/${r.id}/present/control`}
                      target="_blank"
                      className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                    >
                      Present
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Link
                href="/"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                ← Back to Library
              </Link>
              <button
                onClick={() => {
                  setPreviews(null);
                  setResults([]);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                Import Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

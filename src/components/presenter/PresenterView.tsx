"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Slide } from "@/types";
import { SlideDisplay } from "./SlideDisplay";
import { getPresentationChannel, BroadcastMessage } from "@/lib/broadcast";
import { resolveBackground } from "@/lib/slide-config";

interface SectionEntry {
  label: string;
  displayLabel: string;
  sectionGroup: number;
  firstSlideIndex: number;
}

interface PresenterViewProps {
  slides: Slide[];
  title: string;
  presentationId: string;
}

// Format elapsed seconds as MM:SS
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function PresenterView({ slides, title, presentationId }: PresenterViewProps) {
  const [current, setCurrent] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [audienceWindowOpen, setAudienceWindowOpen] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const audienceWindowRef = useRef<Window | null>(null);

  // Timer
  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Track audience window closed
  useEffect(() => {
    if (!audienceWindowOpen) return;
    const id = setInterval(() => {
      if (audienceWindowRef.current?.closed) {
        setAudienceWindowOpen(false);
        audienceWindowRef.current = null;
      }
    }, 1000);
    return () => clearInterval(id);
  }, [audienceWindowOpen]);

  // Launch audience display on external screen
  const launchAudienceDisplay = useCallback(async () => {
    // If already open, focus it
    if (audienceWindowRef.current && !audienceWindowRef.current.closed) {
      audienceWindowRef.current.focus();
      return;
    }

    const url = `/presentations/${presentationId}/present`;

    // Try Window Management API to detect external screens
    try {
      if ("getScreenDetails" in window) {
        const screenDetails = await (window as unknown as { getScreenDetails: () => Promise<{ screens: Array<{ left: number; top: number; availWidth: number; availHeight: number; isPrimary: boolean }> }> }).getScreenDetails();
        const externalScreen = screenDetails.screens.find((s) => !s.isPrimary);
        if (externalScreen) {
          const w = window.open(
            url,
            "audience-display",
            `left=${externalScreen.left},top=${externalScreen.top},width=${externalScreen.availWidth},height=${externalScreen.availHeight}`
          );
          if (w) {
            audienceWindowRef.current = w;
            setAudienceWindowOpen(true);
            return;
          }
        }
      }
    } catch {
      // Permission denied or API unavailable — fall through
    }

    // Fallback: open a regular popup
    const w = window.open(url, "audience-display", "popup");
    if (w) {
      audienceWindowRef.current = w;
      setAudienceWindowOpen(true);
    }
  }, [presentationId]);

  // Open BroadcastChannel — sync with audience display
  useEffect(() => {
    const ch = getPresentationChannel(presentationId);
    channelRef.current = ch;

    ch.onmessage = (e: MessageEvent<BroadcastMessage>) => {
      const msg = e.data;
      if (msg.type === "STATE" || msg.type === "PONG") {
        setCurrent(msg.index);
      }
    };

    // Ask audience display what slide it's on
    ch.postMessage({ type: "PING" } satisfies BroadcastMessage);

    return () => ch.close();
  }, [presentationId]);

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    setCurrent(clamped);
    channelRef.current?.postMessage({ type: "GOTO", index: clamped } satisfies BroadcastMessage);
  }, [slides.length]);

  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't capture if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case " ":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          goPrev();
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  // Auto-scroll the strip to keep current thumbnail visible
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const thumb = strip.children[current] as HTMLElement | undefined;
    if (thumb) {
      thumb.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }
  }, [current]);

  // Derive section navigation entries from slides
  const sectionEntries = useMemo(() => {
    const entries: SectionEntry[] = [];
    let i = 0;
    while (i < slides.length) {
      const slide = slides[i];
      if (slide.sectionGroup == null) {
        i++;
        continue;
      }
      const group = slide.sectionGroup;
      const label = slide.section || "?";
      const firstIndex = i;
      while (i < slides.length && slides[i].sectionGroup === group) i++;
      entries.push({ label, displayLabel: label, sectionGroup: group, firstSlideIndex: firstIndex });
    }

    // Add occurrence numbers for repeated labels
    const labelCounts = new Map<string, number>();
    entries.forEach((e) => labelCounts.set(e.label, (labelCounts.get(e.label) || 0) + 1));
    const labelOccurrence = new Map<string, number>();
    for (const entry of entries) {
      const total = labelCounts.get(entry.label) || 1;
      if (total > 1) {
        const occ = (labelOccurrence.get(entry.label) || 0) + 1;
        labelOccurrence.set(entry.label, occ);
        entry.displayLabel = `${entry.label} (${occ})`;
      }
    }

    return entries;
  }, [slides]);

  const activeGroup = slides[current]?.sectionGroup ?? null;

  const currentSlide = slides[current];
  const nextSlide = slides[current + 1] ?? null;

  if (slides.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500 text-xl">
        No slides in &quot;{title}&quot;
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col select-none">

      {/* Top bar */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-gray-950 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold">{title}</span>
          <span className="text-gray-500 text-sm">Presenter View</span>
          <button
            onClick={launchAudienceDisplay}
            className={`ml-2 px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              audienceWindowOpen
                ? "bg-green-600/20 text-green-400 border border-green-600/40 hover:bg-green-600/30"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {audienceWindowOpen ? "Audience Display Live" : "Launch Audience Display"}
          </button>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-gray-400 text-sm font-mono">⏱ {formatTime(elapsed)}</span>
          <span className="text-gray-400 text-sm">
            Slide <span className="text-white font-semibold">{current + 1}</span> / {slides.length}
          </span>
        </div>
      </header>

      {/* Section navigation bar */}
      {sectionEntries.length > 0 && (
        <div
          className="flex-shrink-0 flex gap-1.5 px-4 py-2 overflow-x-auto border-b border-gray-800 bg-gray-950"
          style={{ scrollbarWidth: "thin" }}
        >
          {sectionEntries.map((entry, idx) => (
            <button
              key={`${entry.sectionGroup}-${idx}`}
              onClick={() => goTo(entry.firstSlideIndex)}
              className={`flex-shrink-0 px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                entry.sectionGroup === activeGroup
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
              }`}
            >
              {entry.displayLabel}
            </button>
          ))}
        </div>
      )}

      {/* Main area: current + next */}
      <div className="flex flex-1 min-h-0 gap-4 p-4">

        {/* Current slide — large */}
        <div className="flex flex-col flex-1 min-w-0 gap-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Current</p>
          <div className="flex-1 rounded-xl overflow-hidden border-2 border-blue-500 shadow-lg shadow-blue-900/30">
            <div className="w-full h-full" style={{ aspectRatio: "16/9", minHeight: 0 }}>
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                <div className="absolute inset-0">
                  <SlideDisplay
                    slide={currentSlide}
                    slideNumber={current + 1}
                    totalSlides={slides.length}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next slide — smaller */}
        <div className="flex flex-col w-80 flex-shrink-0 gap-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Next</p>
          <div className="rounded-xl overflow-hidden border border-gray-700">
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <div className="absolute inset-0">
                {nextSlide ? (
                  <SlideDisplay
                    slide={nextSlide}
                    slideNumber={current + 2}
                    totalSlides={slides.length}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-600 text-sm">
                    End of presentation
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Slide text preview */}
          <div className="flex-1 rounded-lg bg-gray-800 border border-gray-700 p-3 overflow-y-auto">
            <p className="text-xs text-gray-500 mb-1">Slide {current + 1} text</p>
            <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
              {currentSlide.text || <span className="text-gray-600 italic">Empty slide</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation controls */}
      <div className="flex-shrink-0 flex items-center justify-center gap-4 py-3 border-t border-gray-800 bg-gray-950">
        <button
          onClick={goPrev}
          disabled={current === 0}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white rounded-lg font-medium transition-colors text-sm"
        >
          ← Previous
        </button>
        <span className="text-gray-500 text-sm w-28 text-center">
          {current + 1} / {slides.length}
        </span>
        <button
          onClick={goNext}
          disabled={current === slides.length - 1}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white rounded-lg font-medium transition-colors text-sm"
        >
          Next →
        </button>
      </div>

      {/* Slide thumbnail strip */}
      <div
        ref={stripRef}
        className="flex-shrink-0 flex gap-2 px-4 py-3 overflow-x-auto border-t border-gray-800 bg-gray-950"
        style={{ scrollbarWidth: "thin" }}
      >
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => goTo(i)}
            className={`flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
              i === current
                ? "border-blue-500 scale-105 shadow-md shadow-blue-900/40"
                : "border-transparent opacity-60 hover:opacity-100 hover:border-gray-600"
            }`}
            style={{ width: 96, height: 54, background: resolveBackground(slide.background) }}
          >
            <div className="w-full h-full flex items-center justify-center p-1">
              <span className="text-white text-[7px] leading-tight text-center line-clamp-3 font-medium drop-shadow">
                {slide.text || "…"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

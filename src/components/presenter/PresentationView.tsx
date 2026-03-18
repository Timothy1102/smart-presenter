"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Slide } from "@/types";
import { SlideDisplay } from "./SlideDisplay";

interface PresentationViewProps {
  slides: Slide[];
  title: string;
}

export function PresentationView({ slides, title }: PresentationViewProps) {
  const [current, setCurrent] = useState(0);
  const router = useRouter();

  const goNext = useCallback(() => {
    setCurrent((c) => Math.min(c + 1, slides.length - 1));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setCurrent((c) => Math.max(c - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
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
        case "Escape":
          if (!document.fullscreenElement) router.back();
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, router]);

  // Request fullscreen on mount
  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {
        // Fullscreen not available (e.g. iOS Safari) — continue without it
      });
    }
    return () => {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  if (slides.length === 0) {
    return (
      <div className="w-full h-dvh bg-black flex items-center justify-center text-white/50 text-xl">
        No slides in &quot;{title}&quot;
      </div>
    );
  }

  const slide = slides[current];

  return (
    <div className="w-full h-dvh select-none" onClick={goNext}>
      <SlideDisplay
        slide={slide}
        slideNumber={current + 1}
        totalSlides={slides.length}
      />

      {/* Navigation hint (fades after first interaction) */}
      <div className="absolute inset-x-0 bottom-10 flex items-center justify-center gap-6 pointer-events-none">
        <button
          className="pointer-events-auto px-4 py-2 text-white/30 hover:text-white/60 text-sm transition-colors"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          disabled={current === 0}
        >
          ← Prev
        </button>
        <button
          className="pointer-events-auto px-4 py-2 text-white/30 hover:text-white/60 text-sm transition-colors"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          disabled={current === slides.length - 1}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

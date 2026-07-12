"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Slide } from "@/types";
import { SlideDisplay } from "./SlideDisplay";
import { getPresentationChannel, BroadcastMessage } from "@/lib/broadcast";

interface PresentationViewProps {
  slides: Slide[];
  title: string;
  presentationId: string;
}

export function PresentationView({ slides, title, presentationId }: PresentationViewProps) {
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Open BroadcastChannel
  useEffect(() => {
    const ch = getPresentationChannel(presentationId);
    channelRef.current = ch;

    ch.onmessage = (e: MessageEvent<BroadcastMessage>) => {
      const msg = e.data;
      if (msg.type === "GOTO") {
        setCurrent(msg.index);
      } else if (msg.type === "PING") {
        // Presenter is asking for our state
        setCurrent((c) => {
          ch.postMessage({ type: "PONG", index: c } satisfies BroadcastMessage);
          return c;
        });
      }
    };

    return () => ch.close();
  }, [presentationId]);

  // Broadcast STATE whenever current index changes (after started)
  useEffect(() => {
    if (started && channelRef.current) {
      channelRef.current.postMessage({ type: "STATE", index: current } satisfies BroadcastMessage);
    }
  }, [current, started]);

  const goNext = useCallback(() => {
    setCurrent((c) => Math.min(c + 1, slides.length - 1));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setCurrent((c) => Math.max(c - 1, 0));
  }, []);

  // Keyboard navigation (only when started)
  useEffect(() => {
    if (!started) return;
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
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, goNext, goPrev]);

  // Play the current slide's background audio (if any), stop it otherwise.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const url = slides[current]?.audio;
    if (started && url) {
      audio.src = url;
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Autoplay blocked (e.g. browser didn't recognize the earlier "Click to
        // start" as a qualifying gesture) — silently skip rather than throwing.
      });
    } else {
      audio.pause();
      audio.removeAttribute("src");
    }
  }, [current, started, slides]);

  function handleStart() {
    // Fullscreen must be triggered by a direct user gesture — this click qualifies
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {
        // Fullscreen unavailable (e.g. iOS) — continue without it
      });
    }
    // Prime audio playback within this same gesture — some browsers (Safari)
    // only allow later programmatic play() calls if audio played once during
    // a direct user interaction.
    const audio = audioRef.current;
    if (audio) {
      audio.muted = true;
      audio.play().then(() => {
        audio.pause();
        audio.muted = false;
      }).catch(() => {
        audio.muted = false;
      });
    }
    setStarted(true);
  }

  // No slides
  if (slides.length === 0) {
    return (
      <div className="w-full h-dvh bg-black flex items-center justify-center text-white/50 text-xl">
        No slides in &quot;{title}&quot;
      </div>
    );
  }

  // The <audio> element is rendered once here (rather than inside each branch
  // below) so it's the same DOM node across the splash → presenting
  // transition — some browsers (Safari) only honor the "unlocked by user
  // gesture" state for the specific element that played during the gesture.
  const audioEl = <audio ref={audioRef} className="hidden" />;

  // Splash screen — forces a user gesture before requesting fullscreen
  if (!started) {
    return (
      <div
        className="w-full h-dvh bg-black flex flex-col items-center justify-center gap-6 cursor-pointer select-none"
        onClick={handleStart}
      >
        {audioEl}
        <div className="text-center">
          <p className="text-white/40 text-sm uppercase tracking-widest mb-3">Now presenting</p>
          <h1 className="text-white text-4xl font-bold mb-2">{title}</h1>
          <p className="text-white/30 text-sm">{slides.length} slides</p>
        </div>
        <button
          className="mt-4 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full text-sm font-medium transition-colors"
          onClick={handleStart}
        >
          Click to start (fullscreen)
        </button>
        <p className="text-white/20 text-xs">
          Use arrow keys or click to advance · Esc to exit fullscreen
        </p>
      </div>
    );
  }

  const slide = slides[current];

  return (
    <div
      className="w-full h-dvh select-none cursor-pointer"
      onClick={goNext}
    >
      {audioEl}
      <SlideDisplay
        slide={slide}
        slideNumber={current + 1}
        totalSlides={slides.length}
      />

      {/* Subtle prev/next hit areas on the sides */}
      <button
        className="absolute left-0 top-0 h-full w-16 opacity-0 hover:opacity-100 flex items-center justify-start pl-3 transition-opacity"
        onClick={(e) => { e.stopPropagation(); goPrev(); }}
        disabled={current === 0}
        aria-label="Previous slide"
      >
        <span className="text-white/60 text-2xl">‹</span>
      </button>
      <button
        className="absolute right-0 top-0 h-full w-16 opacity-0 hover:opacity-100 flex items-center justify-end pr-3 transition-opacity"
        onClick={(e) => { e.stopPropagation(); goNext(); }}
        disabled={current === slides.length - 1}
        aria-label="Next slide"
      >
        <span className="text-white/60 text-2xl">›</span>
      </button>
    </div>
  );
}

"use client";

import { SlideInput } from "@/types";
import { BackgroundPicker } from "./BackgroundPicker";
import { resolveBackground } from "@/lib/slide-config";
import { SLIDE_CONFIG } from "@/lib/slide-config";

interface SlideEditorProps {
  slide: SlideInput;
  onUpdate: (slide: SlideInput) => void;
}

export function SlideEditor({ slide, onUpdate }: SlideEditorProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Preview */}
      <div
        className="relative rounded-xl overflow-hidden flex-shrink-0"
        style={{ aspectRatio: "16/9", background: resolveBackground(slide.background) }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ padding: "2rem" }}
        >
          <p
            style={{
              fontFamily: SLIDE_CONFIG.fontFamily,
              fontSize: "clamp(1rem, 3vw, 2rem)",
              fontWeight: SLIDE_CONFIG.fontWeight,
              lineHeight: SLIDE_CONFIG.lineHeight,
              color: SLIDE_CONFIG.textColor,
              textShadow: SLIDE_CONFIG.textShadow,
              textAlign: SLIDE_CONFIG.textAlign,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {slide.text || <span className="opacity-40">Empty slide</span>}
          </p>
        </div>
      </div>

      {/* Text editor */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400 uppercase tracking-wider font-medium">
          Slide text
        </label>
        <textarea
          value={slide.text}
          onChange={(e) => onUpdate({ ...slide, text: e.target.value })}
          rows={5}
          className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          placeholder="Enter slide text…"
        />
      </div>

      {/* Background picker */}
      <BackgroundPicker
        value={slide.background}
        onChange={(bg) => onUpdate({ ...slide, background: bg })}
      />
    </div>
  );
}

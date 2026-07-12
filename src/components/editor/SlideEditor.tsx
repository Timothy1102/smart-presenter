"use client";

import { useCallback, useRef, useState } from "react";
import { SlideInput } from "@/types";
import { BackgroundPicker } from "./BackgroundPicker";
import { resolveBackground } from "@/lib/slide-config";
import { SLIDE_CONFIG } from "@/lib/slide-config";

interface SlideEditorProps {
  slide: SlideInput;
  onUpdate: (slide: SlideInput) => void;
  onSectionChange: (section: string | null) => void;
  sectionOptions: string[];
}

export function SlideEditor({ slide, onUpdate, onSectionChange, sectionOptions }: SlideEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const handleImageFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = ""; // allow re-selecting the same file later
      if (!file) return;

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        // A slide with an image has no text.
        onUpdate({ ...slide, image: data.url, text: "" });
      } catch (err) {
        alert(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [slide, onUpdate]
  );

  const handleAudioFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = ""; // allow re-selecting the same file later
      if (!file) return;

      setIsUploadingAudio(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload/audio", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        onUpdate({ ...slide, audio: data.url });
      } catch (err) {
        alert(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploadingAudio(false);
      }
    },
    [slide, onUpdate]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Preview */}
      <div
        className="relative rounded-xl overflow-hidden flex-shrink-0"
        style={{ aspectRatio: "16/9", background: resolveBackground(slide.background) }}
      >
        {slide.image ? (
          <>
            <div className="absolute inset-0 flex items-center justify-center p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.image}
                alt="Slide"
                className="max-w-full max-h-full object-contain select-none"
              />
            </div>
            <button
              onClick={() => onUpdate({ ...slide, image: null })}
              className="absolute top-2 right-2 px-2 py-1 text-xs bg-black/60 hover:bg-black/80 text-white rounded transition-colors"
            >
              Remove image
            </button>
          </>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ padding: "2rem" }}
          >
            <textarea
              value={slide.text}
              onChange={(e) => onUpdate({ ...slide, text: e.target.value })}
              placeholder="Enter slide text…"
              className="w-full bg-transparent border-none outline-none resize-none placeholder-white/40"
              style={{
                fontFamily: SLIDE_CONFIG.fontFamily,
                fontSize: "clamp(1rem, 3vw, 2rem)",
                fontWeight: SLIDE_CONFIG.fontWeight,
                lineHeight: SLIDE_CONFIG.lineHeight,
                color: SLIDE_CONFIG.textColor,
                textShadow: SLIDE_CONFIG.textShadow,
                textAlign: SLIDE_CONFIG.textAlign as React.CSSProperties["textAlign"],
                wordBreak: "break-word",
              }}
              rows={4}
            />
          </div>
        )}
      </div>

      {/* Image upload */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400 uppercase tracking-wider font-medium">
          Slide image
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageFile}
          className="hidden"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium disabled:opacity-40 transition-colors"
          >
            {isUploading ? "Uploading…" : slide.image ? "Replace image" : "Insert image"}
          </button>
          {slide.image && (
            <button
              onClick={() => onUpdate({ ...slide, image: null })}
              className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
            >
              Remove
            </button>
          )}
        </div>
        {slide.image && (
          <p className="text-xs text-gray-500 mt-1">
            This slide shows an image and has no text. Remove the image to add text.
          </p>
        )}
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
          disabled={!!slide.image}
          className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none disabled:opacity-40"
          placeholder="Enter slide text…"
        />
      </div>

      {/* Section */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400 uppercase tracking-wider font-medium">
          Section
        </label>
        <input
          type="text"
          list="section-options"
          value={slide.section ?? ""}
          onChange={(e) => onSectionChange(e.target.value.trim() || null)}
          placeholder="e.g. Verse 1, Chorus…"
          className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <datalist id="section-options">
          {sectionOptions.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
      </div>

      {/* Audio */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400 uppercase tracking-wider font-medium">
          Background audio
        </label>
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/mpeg,audio/mp3,.mp3"
          onChange={handleAudioFile}
          className="hidden"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => audioInputRef.current?.click()}
            disabled={isUploadingAudio}
            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium disabled:opacity-40 transition-colors"
          >
            {isUploadingAudio ? "Uploading…" : slide.audio ? "Replace audio" : "Attach MP3"}
          </button>
          {slide.audio && (
            <button
              onClick={() => onUpdate({ ...slide, audio: null })}
              className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
            >
              Remove
            </button>
          )}
        </div>
        {slide.audio && (
          <>
            <audio controls src={slide.audio} className="w-full mt-1 h-9" />
            <p className="text-xs text-gray-500 mt-1">
              Plays automatically when this slide is shown in the audience view.
            </p>
          </>
        )}
      </div>

      {/* Background picker */}
      {/* <BackgroundPicker
        value={slide.background}
        onChange={(bg) => onUpdate({ ...slide, background: bg })}
      /> */}
    </div>
  );
}

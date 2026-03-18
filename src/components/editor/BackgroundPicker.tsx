"use client";

import { SLIDE_CONFIG, resolveBackground } from "@/lib/slide-config";

interface BackgroundPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function BackgroundPicker({ value, onChange }: BackgroundPickerProps) {
  const isPreset = SLIDE_CONFIG.presetBackgrounds.some((p) => p.key === value);
  const urlValue = isPreset ? "" : value;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Background</p>
      <div className="flex flex-wrap gap-2">
        {SLIDE_CONFIG.presetBackgrounds.map((preset) => (
          <button
            key={preset.key}
            title={preset.label}
            onClick={() => onChange(preset.key)}
            className={`w-8 h-8 rounded-md border-2 transition-all ${
              value === preset.key
                ? "border-blue-400 scale-110"
                : "border-transparent hover:border-gray-500"
            }`}
            style={{ background: resolveBackground(preset.key) }}
          />
        ))}
      </div>
      <div>
        <input
          type="text"
          placeholder="Or paste an image URL…"
          defaultValue={urlValue}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v) onChange(v);
          }}
          className="w-full px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}

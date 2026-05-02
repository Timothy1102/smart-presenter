// ─────────────────────────────────────────────────────────────────────────────
// Slide appearance config — edit this file to change how slides look globally.
// Users cannot change these values from the UI.
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SLIDE_BACKGROUND =
  "https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

export const SLIDE_CONFIG = {
  // How many visual lines of text before the auto-splitter starts a new slide
  maxLinesPerSlide: 4,

  // Approximate max characters per visual line before text wraps on a 16:9 slide.
  // Used by the smart splitter to estimate how many visual lines a long line takes up.
  maxCharsPerLine: 36,

  // Text appearance
  fontFamily: "'Inter', sans-serif",
  fontSize: "4rem",
  fontWeight: "600",
  lineHeight: "1.35",
  textColor: "#ffffff",
  textShadow: "0 2px 12px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.6)",
  textAlign: "center" as const,
  padding: "4rem",

  // Preset backgrounds (key stored in DB; css applied at render time)
  presetBackgrounds: [
    {
      key: "dark-default",
      label: "Dark",
      css: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)",
    },
    {
      key: "dark-blue",
      label: "Deep Blue",
      css: "linear-gradient(135deg, #0d1b2a 0%, #1b4f72 100%)",
    },
    {
      key: "dark-purple",
      label: "Deep Purple",
      css: "linear-gradient(135deg, #1a0533 0%, #4a0e8f 100%)",
    },
    {
      key: "midnight",
      label: "Midnight",
      css: "linear-gradient(135deg, #000000 0%, #2c3e50 100%)",
    },
    {
      key: "warm-dark",
      label: "Warm Dark",
      css: "linear-gradient(135deg, #1a0a00 0%, #5c3317 100%)",
    },
    {
      key: "forest",
      label: "Forest",
      css: "linear-gradient(135deg, #0a2e0a 0%, #1a5c1a 100%)",
    },
  ],
} as const;

// Resolve a background value (preset key or URL) to a CSS background value
export function resolveBackground(value: string): string {
  const preset = SLIDE_CONFIG.presetBackgrounds.find((p) => p.key === value);
  if (preset) return preset.css;
  // Assume it's a URL
  return `url(${value}) center/cover no-repeat`;
}

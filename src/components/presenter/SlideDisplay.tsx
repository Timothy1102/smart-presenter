import { Slide } from "@/types";
import { SLIDE_CONFIG, resolveBackground } from "@/lib/slide-config";

interface SlideDisplayProps {
  slide: Slide;
  slideNumber: number;
  totalSlides: number;
}

export function SlideDisplay({ slide, slideNumber, totalSlides }: SlideDisplayProps) {
  return (
    <div
      className="w-full h-full relative flex items-center justify-center"
      style={{ background: resolveBackground(slide.background) }}
    >
      {/* Slide text */}
      <div
        style={{
          padding: SLIDE_CONFIG.padding,
          maxWidth: "100%",
          textAlign: SLIDE_CONFIG.textAlign,
        }}
      >
        <p
          style={{
            fontFamily: SLIDE_CONFIG.fontFamily,
            fontSize: SLIDE_CONFIG.fontSize,
            fontWeight: SLIDE_CONFIG.fontWeight,
            lineHeight: SLIDE_CONFIG.lineHeight,
            color: SLIDE_CONFIG.textColor,
            textShadow: SLIDE_CONFIG.textShadow,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {slide.text}
        </p>
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-4 right-5 text-white/30 text-sm font-mono select-none">
        {slideNumber} / {totalSlides}
      </div>
    </div>
  );
}

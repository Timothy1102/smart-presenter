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
      {/* Slide content: image or text */}
      {slide.image ? (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ padding: SLIDE_CONFIG.padding, boxSizing: "border-box" }}
        >
          <img
            src={slide.image}
            alt=""
            className="max-w-full max-h-full object-contain select-none"
          />
        </div>
      ) : (
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
      )}

      {/* Logo */}
      <img
        src="/AC-logo.png"
        alt="Logo"
        className="absolute top-4 left-5 select-none"
        style={{ height: "80px", width: "auto", opacity: 0.9 }}
      />

      {/* Slide counter */}
      <div className="absolute bottom-4 right-5 text-white/30 text-sm font-mono select-none">
        {slideNumber} / {totalSlides}
      </div>
    </div>
  );
}

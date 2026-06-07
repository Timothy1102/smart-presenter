"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SlideInput } from "@/types";
import { resolveBackground } from "@/lib/slide-config";

interface SlideItemProps {
  slide: SlideInput & { id: string };
  index: number;
  isSelected: boolean;
  onSelect: (e?: React.MouseEvent) => void;
  onDelete: () => void;
}

export function SlideItem({ slide, index, isSelected, onSelect, onDelete }: SlideItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-start gap-2 p-2 rounded-lg cursor-pointer border transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-950/40"
          : "border-transparent hover:border-gray-700 hover:bg-gray-800/50"
      }`}
      onClick={(e) => onSelect(e)}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 mt-1 px-1 text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none"
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag to reorder"
      >
        <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
          <circle cx="3" cy="3" r="1.5" />
          <circle cx="9" cy="3" r="1.5" />
          <circle cx="3" cy="8" r="1.5" />
          <circle cx="9" cy="8" r="1.5" />
          <circle cx="3" cy="13" r="1.5" />
          <circle cx="9" cy="13" r="1.5" />
        </svg>
      </button>

      {/* Thumbnail */}
      <div
        className="flex-shrink-0 w-16 h-10 rounded overflow-hidden"
        style={{ background: resolveBackground(slide.background) }}
      >
        <div className="w-full h-full flex items-center justify-center p-1">
          <span className="text-white text-[6px] leading-tight text-center line-clamp-3 font-medium">
            {slide.text || "…"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-xs text-gray-500">{index + 1}</p>
          {slide.section && (
            <span className="text-[10px] text-blue-400 bg-blue-950 px-1 rounded">
              {slide.section}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-300 truncate leading-snug">
          {slide.text.split("\n")[0] || <span className="text-gray-600 italic">Empty</span>}
        </p>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all"
        aria-label="Delete slide"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="2" y1="2" x2="12" y2="12" />
          <line x1="12" y1="2" x2="2" y2="12" />
        </svg>
      </button>
    </div>
  );
}

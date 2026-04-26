"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { SlideInput } from "@/types";
import { SlideItem } from "./SlideItem";
import { LyricsImporter } from "./LyricsImporter";
import { PptxImporter } from "./PptxImporter";

interface SlidWithId extends SlideInput {
  id: string;
}

interface SlideListProps {
  slides: SlidWithId[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (slides: SlidWithId[]) => void;
  onAddSlide: () => void;
  onImport: (texts: string[]) => void;
}

export function SlideList({
  slides,
  selectedId,
  onSelect,
  onDelete,
  onReorder,
  onAddSlide,
  onImport,
}: SlideListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = slides.findIndex((s) => s.id === active.id);
      const newIndex = slides.findIndex((s) => s.id === over.id);
      onReorder(arrayMove(slides, oldIndex, newIndex));
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={slides.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {slides.map((slide, index) => (
              <SlideItem
                key={slide.id}
                slide={slide}
                index={index}
                isSelected={selectedId === slide.id}
                onSelect={() => onSelect(slide.id)}
                onDelete={() => onDelete(slide.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {slides.length === 0 && (
          <p className="text-center text-gray-600 text-sm py-8">
            No slides yet. Import lyrics or add a slide.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 pt-3 space-y-2 border-t border-gray-800 mt-2">
        <LyricsImporter onImport={onImport} />
        <PptxImporter onImport={onImport} />
        <button
          onClick={onAddSlide}
          className="w-full py-2 text-sm border border-dashed border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200 rounded-lg transition-colors"
        >
          + Add blank slide
        </button>
      </div>
    </div>
  );
}

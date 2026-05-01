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
  selectedIds: string[];
  onSelect: (id: string, shiftKey?: boolean) => void;
  onDelete: (id: string) => void;
  onReorder: (slides: SlidWithId[]) => void;
  onAddSlide: () => void;
  onImport: (texts: string[]) => void;
  onDuplicate: () => void;
}

export function SlideList({
  slides,
  selectedIds,
  onSelect,
  onDelete,
  onReorder,
  onAddSlide,
  onImport,
  onDuplicate,
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
                isSelected={selectedIds.includes(slide.id)}
                onSelect={(e) => onSelect(slide.id, e?.shiftKey)}
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
        {selectedIds.length > 0 && (
          <button
            onClick={onDuplicate}
            className="w-full py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
          >
            Duplicate {selectedIds.length > 1 ? `${selectedIds.length} slides` : "slide"}
          </button>
        )}
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

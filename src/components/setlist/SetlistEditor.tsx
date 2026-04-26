"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PresentationSummary } from "@/types";
import { SongPicker } from "./SongPicker";

interface SetlistItemData {
  id: string;
  presentationId: string;
  title: string;
  slideCount: number;
  isNew?: boolean;
}

interface SetlistEditorProps {
  setlistId: string;
  initialTitle: string;
  initialItems: SetlistItemData[];
}

function SortableItem({
  item,
  index,
  onRemove,
}: {
  item: SetlistItemData;
  index: number;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
        </svg>
      </button>
      <span className="text-gray-500 text-sm w-6 text-center">{index + 1}</span>
      <div className="flex-1 min-w-0">
        <span className="text-white font-medium block truncate">{item.title}</span>
        <span className="text-gray-500 text-xs">
          {item.slideCount} slide{item.slideCount !== 1 ? "s" : ""}
        </span>
      </div>
      <button
        onClick={onRemove}
        className="text-gray-500 hover:text-red-400 transition-colors p-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function SetlistEditor({ setlistId, initialTitle, initialItems }: SetlistEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [items, setItems] = useState<SetlistItemData[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const excludeIds = useMemo(
    () => new Set(items.map((i) => i.presentationId)),
    [items]
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
      setIsDirty(true);
    }
  }, []);

  const handleAddSong = useCallback((presentation: PresentationSummary) => {
    const newItem: SetlistItemData = {
      id: crypto.randomUUID(),
      presentationId: presentation.id,
      title: presentation.title,
      slideCount: presentation._count.slides,
      isNew: true,
    };
    setItems((prev) => [...prev, newItem]);
    setIsDirty(true);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/setlists/${setlistId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          items: items.map((i) => ({
            id: i.isNew ? undefined : i.id,
            presentationId: i.presentationId,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      // Sync with server response
      setItems(
        data.items.map((item: { id: string; presentationId: string; presentation: { title: string; _count: { slides: number } } }) => ({
          id: item.id,
          presentationId: item.presentationId,
          title: item.presentation.title,
          slideCount: item.presentation._count.slides,
        }))
      );
      setIsDirty(false);
    } catch {
      alert("Failed to save setlist. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [setlistId, title, items]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm">
              ← Library
            </Link>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setIsDirty(true);
              }}
              className="text-xl font-bold bg-transparent border-none outline-none text-white placeholder-gray-500 focus:ring-0"
              placeholder="Setlist title"
            />
          </div>
          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="text-amber-400 text-xs">Unsaved changes</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
            Songs ({items.length})
          </h2>
          <SongPicker onAdd={handleAddSong} excludeIds={excludeIds} />
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <p className="text-lg mb-2">No songs in this setlist yet</p>
            <p className="text-sm">Click &quot;Add Song&quot; to get started.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {items.map((item, index) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    index={index}
                    onRemove={() => handleRemove(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Present buttons */}
        {items.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-800 flex items-center gap-3">
            <Link
              href={`/setlists/${setlistId}/present/control`}
              target="_blank"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Open Presenter View
            </Link>
            <Link
              href={`/setlists/${setlistId}/present`}
              target="_blank"
              className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Open Audience View
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

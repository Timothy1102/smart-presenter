"use client";

import { useEffect, useReducer, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SlideList } from "@/components/editor/SlideList";
import { SlideEditor } from "@/components/editor/SlideEditor";
import { SlideInput } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SlideWithId extends SlideInput {
  id: string;
}

interface EditorState {
  title: string;
  slides: SlideWithId[];
  selectedId: string | null;
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;
}

type EditorAction =
  | { type: "LOAD_SUCCESS"; payload: { title: string; slides: SlideWithId[] } }
  | { type: "LOAD_ERROR"; payload: string }
  | { type: "SET_TITLE"; payload: string }
  | { type: "ADD_SLIDES"; payload: string[] }
  | { type: "ADD_BLANK_SLIDE" }
  | { type: "UPDATE_SLIDE"; payload: SlideWithId }
  | { type: "DELETE_SLIDE"; payload: string }
  | { type: "REORDER_SLIDES"; payload: SlideWithId[] }
  | { type: "SELECT_SLIDE"; payload: string | null }
  | { type: "SAVE_START" }
  | { type: "SAVE_SUCCESS"; payload: SlideWithId[] };

// ─── Reducer ─────────────────────────────────────────────────────────────────

const DEFAULT_BACKGROUND = "dark-default";

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "LOAD_SUCCESS":
      return {
        ...state,
        title: action.payload.title,
        slides: action.payload.slides,
        selectedId: action.payload.slides[0]?.id ?? null,
        isLoading: false,
        isDirty: false,
      };
    case "LOAD_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    case "SET_TITLE":
      return { ...state, title: action.payload, isDirty: true };
    case "ADD_SLIDES": {
      const newSlides = action.payload.map((text) => ({
        id: crypto.randomUUID(),
        text,
        background: DEFAULT_BACKGROUND,
        order: 0,
      }));
      const slides = [...state.slides, ...newSlides];
      return {
        ...state,
        slides,
        selectedId: newSlides[0]?.id ?? state.selectedId,
        isDirty: true,
      };
    }
    case "ADD_BLANK_SLIDE": {
      const blank: SlideWithId = {
        id: crypto.randomUUID(),
        text: "",
        background: DEFAULT_BACKGROUND,
        order: 0,
      };
      return {
        ...state,
        slides: [...state.slides, blank],
        selectedId: blank.id,
        isDirty: true,
      };
    }
    case "UPDATE_SLIDE":
      return {
        ...state,
        slides: state.slides.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
        isDirty: true,
      };
    case "DELETE_SLIDE": {
      const slides = state.slides.filter((s) => s.id !== action.payload);
      const selectedId =
        state.selectedId === action.payload
          ? (slides[0]?.id ?? null)
          : state.selectedId;
      return { ...state, slides, selectedId, isDirty: true };
    }
    case "REORDER_SLIDES":
      return { ...state, slides: action.payload, isDirty: true };
    case "SELECT_SLIDE":
      return { ...state, selectedId: action.payload };
    case "SAVE_START":
      return { ...state, isSaving: true };
    case "SAVE_SUCCESS":
      return { ...state, isSaving: false, isDirty: false, slides: action.payload };
    default:
      return state;
  }
}

const initialState: EditorState = {
  title: "",
  slides: [],
  selectedId: null,
  isDirty: false,
  isSaving: false,
  isLoading: true,
  error: null,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [state, dispatch] = useReducer(editorReducer, initialState);

  // Load presentation
  useEffect(() => {
    fetch(`/api/presentations/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        dispatch({
          type: "LOAD_SUCCESS",
          payload: { title: data.title, slides: data.slides },
        });
      })
      .catch((err) => dispatch({ type: "LOAD_ERROR", payload: err.message }));
  }, [id]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (state.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state.isDirty]);

  const handleSave = useCallback(async () => {
    dispatch({ type: "SAVE_START" });
    const res = await fetch(`/api/presentations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: state.title,
        slides: state.slides.map((s, i) => ({
          // UUIDs from crypto.randomUUID() contain hyphens; CUIDs from Prisma do not
          id: s.id.includes("-") ? undefined : s.id,
          text: s.text,
          background: s.background,
          order: i,
        })),
      }),
    });
    const data = await res.json();
    dispatch({ type: "SAVE_SUCCESS", payload: data.slides });
  }, [id, state.title, state.slides]);

  const selectedSlide = state.slides.find((s) => s.id === state.selectedId) ?? null;

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{state.error}</p>
          <Link href="/" className="text-blue-400 hover:underline">← Back to library</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Toolbar */}
      <header className="flex-shrink-0 flex items-center gap-4 px-4 py-3 border-b border-gray-800 bg-gray-900">
        <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm">
          ← Library
        </Link>
        <input
          type="text"
          value={state.title}
          onChange={(e) => dispatch({ type: "SET_TITLE", payload: e.target.value })}
          className="flex-1 max-w-xs px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
        />
        <div className="ml-auto flex items-center gap-3">
          {state.isDirty && (
            <span className="text-xs text-yellow-500">Unsaved changes</span>
          )}
          <button
            onClick={handleSave}
            disabled={state.isSaving || !state.isDirty}
            className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-40 transition-colors"
          >
            {state.isSaving ? "Saving…" : "Save"}
          </button>
          <Link
            href={`/presentations/${id}/present`}
            target="_blank"
            className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition-colors"
          >
            ▶ Audience View
          </Link>
          <Link
            href={`/presentations/${id}/present/control`}
            target="_blank"
            className="px-4 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded font-medium transition-colors"
          >
            🖥 Presenter View
          </Link>
        </div>
      </header>

      {/* Editor body */}
      <div className="flex flex-1 min-h-0">
        {/* Slides sidebar */}
        <aside className="w-64 flex-shrink-0 border-r border-gray-800 p-3 overflow-hidden flex flex-col">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex-shrink-0">
            Slides ({state.slides.length})
          </p>
          <SlideList
            slides={state.slides}
            selectedId={state.selectedId}
            onSelect={(sid) => dispatch({ type: "SELECT_SLIDE", payload: sid })}
            onDelete={(sid) => dispatch({ type: "DELETE_SLIDE", payload: sid })}
            onReorder={(slides) => dispatch({ type: "REORDER_SLIDES", payload: slides })}
            onAddSlide={() => dispatch({ type: "ADD_BLANK_SLIDE" })}
            onImport={(texts) => dispatch({ type: "ADD_SLIDES", payload: texts })}
          />
        </aside>

        {/* Main editor panel */}
        <main className="flex-1 p-6 overflow-y-auto">
          {selectedSlide ? (
            <SlideEditor
              slide={selectedSlide}
              onUpdate={(slide) =>
                dispatch({ type: "UPDATE_SLIDE", payload: slide as SlideWithId })
              }
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
              Select a slide to edit, or add one using the panel on the left.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

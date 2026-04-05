"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteButton({ id, variant = "menu" }: { id: string; variant?: "menu" | "inline" }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    try {
      await fetch(`/api/presentations/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (variant === "inline") {
    if (confirming) {
      return (
        <span className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-3 py-1 text-xs bg-red-900/50 hover:bg-red-800 rounded text-red-300 transition-colors disabled:opacity-50"
          >
            {loading ? "…" : "Confirm"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
          >
            Cancel
          </button>
        </span>
      );
    }
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          setConfirming(true);
        }}
        className="px-3 py-1 text-xs bg-gray-700 hover:bg-red-900/50 rounded text-red-400 transition-colors"
      >
        Delete
      </button>
    );
  }

  // menu variant (original)
  if (confirming) {
    return (
      <div>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50"
        >
          {loading ? "Deleting…" : "Confirm delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        setConfirming(true);
      }}
      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 transition-colors"
    >
      🗑 Delete
    </button>
  );
}

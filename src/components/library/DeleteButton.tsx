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
            className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 transition-all disabled:opacity-50"
          >
            {loading ? "…" : "Confirm"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white/60 transition-all"
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
        className="px-3 py-1 text-xs bg-white/10 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-lg text-white/50 hover:text-red-300 transition-all"
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
          className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {loading ? "Deleting…" : "Confirm delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="w-full text-left px-4 py-2.5 text-sm text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
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
      className="w-full text-left px-4 py-2.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/20 transition-colors"
    >
      🗑 Delete
    </button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteButton({ id }: { id: string }) {
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

  if (confirming) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded font-medium disabled:opacity-50"
        >
          {loading ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded"
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
      className="px-3 py-1 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors"
    >
      Delete
    </button>
  );
}

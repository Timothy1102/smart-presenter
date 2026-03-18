"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewPresentationPage() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/presentations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const data = await res.json();
      router.push(`/presentations/${data.id}/edit`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm mb-6 inline-block">
          ← Back to library
        </Link>
        <h1 className="text-2xl font-bold text-white mb-6">New Presentation</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Amazing Grace"
              autoFocus
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create Presentation"}
          </button>
        </form>
      </div>
    </div>
  );
}

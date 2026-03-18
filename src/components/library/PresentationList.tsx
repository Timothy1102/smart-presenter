import { PresentationSummary } from "@/types";
import { PresentationCard } from "./PresentationCard";

export function PresentationList({ presentations }: { presentations: PresentationSummary[] }) {
  if (presentations.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-xl mb-2">No presentations yet</p>
        <p className="text-sm">Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {presentations.map((p) => (
        <PresentationCard key={p.id} presentation={p} />
      ))}
    </div>
  );
}

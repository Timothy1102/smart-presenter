import Link from "next/link";
import { PresentationSummary } from "@/types";
import { DeleteButton } from "./DeleteButton";

export function PresentationCard({ presentation }: { presentation: PresentationSummary }) {
  const date = new Date(presentation.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="group bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
      <Link href={`/presentations/${presentation.id}/edit`} className="block">
        <h2 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors truncate mb-1">
          {presentation.title}
        </h2>
        <p className="text-sm text-gray-500">
          {presentation._count.slides} slide{presentation._count.slides !== 1 ? "s" : ""} · Updated {date}
        </p>
      </Link>
      <div className="flex items-center gap-3 mt-4">
        <Link
          href={`/presentations/${presentation.id}/edit`}
          className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
        >
          Edit
        </Link>
        <Link
          href={`/presentations/${presentation.id}/present`}
          target="_blank"
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded font-medium transition-colors"
        >
          Present
        </Link>
        <div className="ml-auto">
          <DeleteButton id={presentation.id} />
        </div>
      </div>
    </div>
  );
}

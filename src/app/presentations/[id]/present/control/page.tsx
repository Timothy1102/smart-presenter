import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PresenterView } from "@/components/presenter/PresenterView";

export const dynamic = "force-dynamic";

export default async function PresenterControlPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const presentation = await prisma.presentation.findUnique({
    where: { id },
    include: { slides: { orderBy: { order: "asc" } } },
  });

  if (!presentation) notFound();

  return (
    <div className="min-h-screen bg-gray-950">
      <PresenterView
        slides={presentation.slides}
        title={presentation.title}
        presentationId={id}
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PresentationView } from "@/components/presenter/PresentationView";

export const dynamic = "force-dynamic";

export default async function PresentPage({
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
    <div className="w-full h-dvh overflow-hidden bg-black">
      <PresentationView
        slides={presentation.slides}
        title={presentation.title}
      />
    </div>
  );
}

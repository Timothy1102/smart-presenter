import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SetlistEditor } from "@/components/setlist/SetlistEditor";

export const dynamic = "force-dynamic";

export default async function SetlistEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const setlist = await prisma.setlist.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          presentation: {
            include: { _count: { select: { slides: true } } },
          },
        },
      },
    },
  });

  if (!setlist) notFound();

  const initialItems = setlist.items.map((item) => ({
    id: item.id,
    presentationId: item.presentationId,
    title: item.presentation.title,
    slideCount: item.presentation._count.slides,
  }));

  return (
    <SetlistEditor
      setlistId={id}
      initialTitle={setlist.title}
      initialItems={initialItems}
    />
  );
}

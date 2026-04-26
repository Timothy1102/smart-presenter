import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PresentationView } from "@/components/presenter/PresentationView";
import { flattenSetlistSlides } from "@/lib/setlist";
import { SetlistItemWithSlides } from "@/types";

export const dynamic = "force-dynamic";

export default async function SetlistPresentPage({
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
            include: { slides: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });

  if (!setlist) notFound();

  const { slides } = flattenSetlistSlides(setlist.items as SetlistItemWithSlides[]);

  return (
    <div className="w-full h-dvh overflow-hidden bg-black">
      <PresentationView
        slides={slides}
        title={setlist.title}
        presentationId={`setlist-${id}`}
      />
    </div>
  );
}

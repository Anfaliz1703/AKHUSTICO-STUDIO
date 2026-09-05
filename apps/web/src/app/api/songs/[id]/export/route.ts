import { NextRequest, NextResponse } from "next/server";
import { songRepository } from "@/lib/repository";
import { requireOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return auth.errorResponse;
  }

  const { id } = await params;
  const song = await songRepository.getById(id);
  if (!song) {
    return NextResponse.json({ error: "Canción no encontrada" }, { status: 404 });
  }

  const exportPayload = {
    ...song,
    exportedAt: new Date().toISOString(),
    generator: "AKHUSTICO Studio v1.0",
  };

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${song.slug}-akhustico-v1.json"`,
    },
  });
}

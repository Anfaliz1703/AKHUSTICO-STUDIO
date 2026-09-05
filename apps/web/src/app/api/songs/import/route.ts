import { NextRequest, NextResponse } from "next/server";
import { parseLegacySong } from "@/lib/legacy-importer";
import { songRepository } from "@/lib/repository";
import { requireOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return auth.errorResponse;
  }

  try {
    const { content, previewOnly } = await req.json();
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Contenido no válido para importar" }, { status: 400 });
    }

    const { song, warnings, detectedFormat } = parseLegacySong(content);

    // Si solo se solicita vista previa
    if (previewOnly) {
      return NextResponse.json({ preview: song, warnings, detectedFormat });
    }

    // Persistir canción importada
    const created = await songRepository.create(song);
    return NextResponse.json({ data: created, warnings, detectedFormat }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error durante importación" }, { status: 500 });
  }
}

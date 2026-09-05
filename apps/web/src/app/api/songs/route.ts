import { NextRequest, NextResponse } from "next/server";
import { songRepository } from "@/lib/repository";
import { CanonicalSongSchema } from "@akhustico/shared";
import { requireOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return auth.errorResponse;
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const key = searchParams.get("key") || undefined;
  const tag = searchParams.get("tag") || undefined;
  const favorite = searchParams.has("favorite") ? searchParams.get("favorite") === "true" : undefined;
  const sortBy = (searchParams.get("sortBy") as any) || "recent";

  const songs = await songRepository.list({ search, key, tag, favorite, sortBy });
  return NextResponse.json({ data: songs });
}

export async function POST(req: NextRequest) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return auth.errorResponse;
  }

  try {
    const body = await req.json();

    // Comprobar deduplicación por hash SHA-256 (Sección 80)
    if (body.audioHash) {
      const existing = await songRepository.getByHash(body.audioHash);
      if (existing) {
        return NextResponse.json(
          { error: "Esta pista ya existe en tu cancionero", song: existing },
          { status: 409 }
        );
      }
    }

    const parseResult = CanonicalSongSchema.safeParse({
      schemaVersion: "1.0",
      id: body.id || `song-${Date.now()}`,
      slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: body.title,
      artist: body.artist,
      album: body.album || "",
      language: body.language || "es",
      originalAudioUrl: body.originalAudioUrl,
      audioHash: body.audioHash || `hash-${Date.now()}`,
      music: body.music || {
        originalKey: "C",
        preferredKey: "C",
        chordShapeKey: "C",
        capo: 0,
        tuning: "E A D G B E",
        bpm: 120,
        timeSignature: "4/4",
      },
      display: body.display || {
        fontScale: 1.0,
        readingMode: "large",
        showChords: true,
        showSections: true,
        autoscrollSpeed: 2,
      },
      tags: body.tags || [],
      isFavorite: body.isFavorite || false,
      status: body.status || "ready",
      lyrics: body.lyrics || { sections: [] },
      melody: body.melody || [],
      assets: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Datos de canción inválidos", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const created = await songRepository.create(parseResult.data);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}

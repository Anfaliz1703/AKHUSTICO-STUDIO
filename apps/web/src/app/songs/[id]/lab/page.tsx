"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { CanonicalSong } from "@akhustico/shared";
import { StemMixer } from "@/components/audio/StemMixer";
import { AppHeader } from "@/components/layout/AppHeader";
import { ArrowLeft, Sliders } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AudioLabPage({ params }: PageProps) {
  const { id } = use(params);
  const [song, setSong] = useState<CanonicalSong | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/songs/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Cancion no encontrada");
        setSong(json.data);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return <div className="flex-1 p-8 text-pitch-outOfTune">{error}</div>;
  }

  if (!song) {
    return <div className="flex-1 p-8 text-studio-muted font-mono">Cargando Audio Lab...</div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader title="Audio Lab" subtitle={`${song.title} - ${song.artist}`} />
      <main className="max-w-6xl mx-auto w-full p-6 md:p-8 space-y-6">
        <Link href={`/songs/${song.id}`} className="inline-flex items-center gap-2 text-sm text-studio-muted hover:text-studio-text">
          <ArrowLeft className="h-4 w-4" />
          Volver al atril
        </Link>
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-studio-text">
            <Sliders className="h-5 w-5 text-electric-400" />
            <h2 className="text-lg font-bold">Mixer sincronizado</h2>
          </div>
          <StemMixer stems={song.assets} masterAudioUrl={song.originalAudioUrl} bpm={song.music.bpm} />
          {Object.keys(song.assets || {}).length === 0 && (
            <p className="text-xs text-studio-muted">
              No hay stems reales guardados todavia. En demo se reproduce el master para validar transporte, tempo y mezcla.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

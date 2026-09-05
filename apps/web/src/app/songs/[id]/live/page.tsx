"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { CanonicalSong } from "@akhustico/shared";
import { LyricsViewer } from "@/components/reader/LyricsViewer";
import { Maximize, Minus, Pause, Play, Plus } from "lucide-react";
import { transposeChord } from "@akhustico/music-core";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LiveModePage({ params }: PageProps) {
  const { id } = use(params);
  const [song, setSong] = useState<CanonicalSong | null>(null);
  const [semitones, setSemitones] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    fetch(`/api/songs/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => setSong(json.data));
  }, [id]);

  if (!song) {
    return <div className="flex-1 p-8 text-studio-muted font-mono">Cargando Live Mode...</div>;
  }

  const key = transposeChord(song.music.preferredKey, semitones);
  const currentSection = song.lyrics.sections[0]?.label || "Inicio";
  const nextSection = song.lyrics.sections[1]?.label || "Final";

  return (
    <div className="min-h-screen bg-studio-bg text-studio-text">
      <header className="sticky top-0 z-40 border-b border-studio-border bg-studio-surface/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/songs/${song.id}`} className="text-xs font-bold uppercase text-electric-400">
              Salir de live
            </Link>
            <h1 className="truncate text-2xl font-black">{song.title}</h1>
            <p className="text-sm text-studio-muted">{song.artist}</p>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <div className="rounded-lg border border-studio-border bg-studio-elevated px-4 py-2">
              <span className="text-xs text-studio-dimmed">Tono </span>
              <span className="text-xl font-black text-electric-400">{key}</span>
            </div>
            <div className="rounded-lg border border-studio-border bg-studio-elevated px-4 py-2">
              <span className="text-xs text-studio-dimmed">Capo </span>
              <span className="text-xl font-black text-violetStudio-400">{song.music.capo}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-28">
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-studio-border bg-studio-surface p-4">
            <div className="text-xs uppercase text-studio-dimmed">Seccion actual</div>
            <div className="text-2xl font-black">{currentSection}</div>
          </div>
          <div className="rounded-xl border border-studio-border bg-studio-surface p-4">
            <div className="text-xs uppercase text-studio-dimmed">Siguiente</div>
            <div className="text-2xl font-black text-studio-muted">{nextSection}</div>
          </div>
        </div>
        <LyricsViewer lyrics={song.lyrics} semitones={semitones} showChords fontScale={1.35} />
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-studio-border bg-studio-surface/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-3">
          <button type="button" onClick={() => setSemitones((v) => v - 1)} className="rounded-xl bg-studio-elevated p-4 text-studio-text">
            <Minus className="h-6 w-6" />
          </button>
          <button type="button" onClick={() => setPlaying((v) => !v)} className="rounded-xl bg-electric-600 p-5 text-white">
            {playing ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7" />}
          </button>
          <button type="button" onClick={() => setSemitones((v) => v + 1)} className="rounded-xl bg-studio-elevated p-4 text-studio-text">
            <Plus className="h-6 w-6" />
          </button>
          <button type="button" onClick={() => document.documentElement.requestFullscreen?.()} className="rounded-xl bg-studio-elevated p-4 text-studio-text">
            <Maximize className="h-6 w-6" />
          </button>
        </div>
      </footer>
    </div>
  );
}

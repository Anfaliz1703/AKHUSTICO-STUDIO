"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { CanonicalSong } from "@akhustico/shared";
import { VocalCoachEngine } from "@/components/vocal/VocalCoachEngine";
import { StemMixer } from "@/components/audio/StemMixer";
import { ArrowLeft, Music, Sliders, Mic2 } from "lucide-react";
import { transposeChord } from "@akhustico/music-core";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function VocalPracticePage({ params }: PageProps) {
  const { id } = use(params);
  const [song, setSong] = useState<CanonicalSong | null>(null);
  const [loading, setLoading] = useState(true);
  const [transposition, setTransposition] = useState(0);

  useEffect(() => {
    fetch(`/api/songs/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setSong(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-studio-muted py-20 font-mono animate-pulse">
        Preparando estudio vocal...
      </div>
    );
  }

  if (!song) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-base text-studio-text">Canción no encontrada.</p>
        <Link href="/library" className="px-4 py-2 bg-electric-600 text-white rounded-lg text-sm font-semibold">
          Regresar
        </Link>
      </div>
    );
  }

  const currentKey = transposeChord(song.music.preferredKey, transposition);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-studio-bg select-none">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-studio-surface/95 backdrop-blur-md border-b border-studio-border px-6 py-3.5 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/songs/${song.id}`}
              className="p-2 rounded-lg bg-studio-elevated hover:bg-studio-border text-studio-muted hover:text-studio-text transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-violetStudio-600/20 text-violetStudio-400 font-bold uppercase font-mono">
                  Modo Vocal Coach
                </span>
                <h1 className="text-base font-bold text-studio-text tracking-wide">{song.title}</h1>
              </div>
              <p className="text-xs text-studio-muted">{song.artist}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="px-3 py-1 rounded bg-studio-elevated border border-studio-border flex items-center gap-2">
              <span className="text-studio-dimmed">Tono:</span>
              <span className="font-bold text-electric-400">{currentKey}</span>
            </div>
            <div className="px-3 py-1 rounded bg-studio-elevated border border-studio-border flex items-center gap-2">
              <span className="text-studio-dimmed">BPM:</span>
              <span className="font-bold text-studio-text">{Math.round(song.music.bpm)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Área Central: Motor de afinación y Mixer */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6 md:p-8 space-y-6">
        {/* Entrenador Vocal en Tiempo Real */}
        <VocalCoachEngine
          targetMelody={song.melody || []}
          originalKey={song.music.originalKey}
          transposition={transposition}
        />

        {/* Mixer de Stems y Transport */}
        <StemMixer
          stems={song.assets}
          masterAudioUrl={song.originalAudioUrl}
          bpm={song.music.bpm}
        />
      </main>
    </div>
  );
}

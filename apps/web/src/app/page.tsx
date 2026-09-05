import React from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { SongCard } from "@/components/songs/SongCard";
import { songRepository, jobRepository } from "@/lib/repository";
import { getCurrentSession } from "@/lib/auth";
import {
  Plus,
  Play,
  Mic2,
  ListMusic,
  Activity,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getCurrentSession();
  const userName = session?.user?.name ? session.user.name.split(" ")[0] : "Andrés";

  const allSongs = await songRepository.list({ sortBy: "recent" });
  const recentSongs = allSongs.slice(0, 4);
  const favoriteSongs = allSongs.filter((s) => s.isFavorite);
  const featuredSong = allSongs[0];

  const activeJobs = await jobRepository.list();
  const processingJobs = activeJobs.filter((j) => j.status === "processing" || j.status === "queued");

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader />

      <div className="flex-1 p-6 md:p-8 space-y-10 max-w-7xl mx-auto w-full">
        {/* Hero Saludo + Quick CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-studio-surface via-studio-elevated/80 to-electric-600/10 border border-studio-border rounded-2xl p-6 md:p-8 shadow-studio-card">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-widest font-mono text-electric-400 font-semibold">
              Music Lab & Cancionero Inteligente
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-studio-text tracking-tight">
              Buenas noches, {userName}
            </h1>
            <p className="text-sm text-studio-muted">
              Tienes {allSongs.length} canciones en tu biblioteca listas para ensayar o tocar en vivo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/songs/new"
              className="flex items-center gap-2 bg-gradient-to-r from-electric-600 to-electric-500 hover:from-electric-500 hover:to-electric-400 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-studio-glow transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ IMPORTAR CANCIÓN</span>
            </Link>
          </div>
        </div>

        {/* Sección: Continuar Practicando */}
        {featuredSong && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-studio-text flex items-center gap-2">
                <Mic2 className="w-5 h-5 text-electric-400" />
                Continuar Practicando
              </h2>
              <Link
                href={`/songs/${featuredSong.id}`}
                className="text-xs font-semibold text-electric-400 hover:text-electric-300 flex items-center gap-1"
              >
                <span>Abrir cancionero</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-studio-surface border border-studio-borderHighlight rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-studio-card">
              <div className="space-y-2 text-center md:text-left">
                <span className="px-2.5 py-1 rounded bg-electric-500/10 border border-electric-500/20 text-xs font-mono font-bold text-electric-400">
                  Última canción tocada
                </span>
                <h3 className="text-xl font-black text-studio-text tracking-tight">
                  {featuredSong.title}
                </h3>
                <p className="text-sm text-studio-muted">
                  {featuredSong.artist} • Tono:{" "}
                  <span className="font-bold text-electric-400">{featuredSong.music.preferredKey}</span> •{" "}
                  {Math.round(featuredSong.music.bpm)} BPM
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/songs/${featuredSong.id}`}
                  className="flex items-center gap-2 bg-studio-elevated hover:bg-studio-border text-studio-text text-sm font-semibold px-4 py-2.5 rounded-xl border border-studio-border transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Ver Letra & Acordes</span>
                </Link>
                <Link
                  href={`/songs/${featuredSong.id}/practice`}
                  className="flex items-center gap-2 bg-gradient-to-r from-violetStudio-600 to-electric-600 hover:from-violetStudio-500 hover:to-electric-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  <Mic2 className="w-4 h-4" />
                  <span>Práctica Vocal</span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Sección: Trabajos en Procesamiento (si hay) */}
        {processingJobs.length > 0 && (
          <section className="space-y-3 bg-studio-elevated/40 border border-amber-500/30 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-mono font-bold text-amber-400 flex items-center gap-2">
                <Activity className="w-4 h-4 animate-spin" />
                Análisis Asíncrono en Progreso
              </span>
            </div>
            <div className="space-y-2">
              {processingJobs.map((j) => (
                <Link
                  key={j.id}
                  href={`/jobs/${j.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-studio-surface border border-studio-border hover:border-amber-500/50 transition-colors"
                >
                  <span className="text-sm font-mono text-studio-text">Tarea {j.id} ({j.stage})</span>
                  <span className="text-xs font-bold text-amber-400 font-mono">{j.progress}%</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Grid: Canciones Recientes */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-studio-text flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-electric-400" />
              Canciones Recientes
            </h2>
            <Link
              href="/library"
              className="text-xs font-semibold text-electric-400 hover:text-electric-300 flex items-center gap-1"
            >
              <span>Ver cancionero completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentSongs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </section>

        {/* Mi Repertorio Favorito */}
        {favoriteSongs.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-studio-text flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Mi Repertorio Favorito
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {favoriteSongs.map((song) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

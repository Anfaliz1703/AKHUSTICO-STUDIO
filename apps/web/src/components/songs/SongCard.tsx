"use client";

import React from "react";
import Link from "next/link";
import { CanonicalSong } from "@akhustico/shared";
import { Music, Star, Clock, Activity, Play } from "lucide-react";

interface Props {
  song: CanonicalSong;
  onToggleFavorite?: (songId: string, current: boolean) => void;
}

export const SongCard: React.FC<Props> = ({ song, onToggleFavorite }) => {
  const isTransposed = song.music.preferredKey !== song.music.originalKey;

  return (
    <div className="group relative bg-studio-surface border border-studio-border hover:border-studio-borderHighlight rounded-xl p-5 transition-all duration-200 hover:shadow-studio-card flex flex-col justify-between overflow-hidden">
      {/* Glow highlight al hacer hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-electric-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Header de la card */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <Link href={`/songs/${song.id}`}>
            <h3 className="text-base font-bold text-studio-text hover:text-electric-400 truncate transition-colors">
              {song.title}
            </h3>
          </Link>
          <p className="text-xs text-studio-muted truncate">{song.artist}</p>
        </div>

        <button
          type="button"
          aria-label={song.isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite?.(song.id, song.isFavorite);
          }}
          className={`p-1.5 rounded-lg transition-colors ${
            song.isFavorite
              ? "text-amber-400 hover:bg-amber-400/10"
              : "text-studio-dimmed hover:text-studio-muted hover:bg-studio-elevated"
          }`}
        >
          <Star className="w-4 h-4 fill-current" />
        </button>
      </div>

      {/* Badges Musicales: Tonalidad, BPM, Capo */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-mono">
        <div className="px-2.5 py-1 rounded bg-studio-elevated border border-studio-border text-studio-text flex items-center gap-1.5">
          <span className="text-studio-dimmed text-[10px] uppercase">Tono</span>
          <span className="font-bold text-electric-400">{song.music.preferredKey}</span>
          {isTransposed && (
            <span className="text-[10px] text-studio-dimmed">({song.music.originalKey})</span>
          )}
        </div>

        <div className="px-2.5 py-1 rounded bg-studio-elevated border border-studio-border text-studio-text flex items-center gap-1.5">
          <span className="text-studio-dimmed text-[10px] uppercase">BPM</span>
          <span className="font-semibold text-studio-text">{Math.round(song.music.bpm)}</span>
        </div>

        {song.music.capo > 0 && (
          <div className="px-2.5 py-1 rounded bg-violetStudio-600/20 border border-violetStudio-500/30 text-violetStudio-400 flex items-center gap-1">
            <span className="text-[10px]">Capo</span>
            <span className="font-bold">{song.music.capo}</span>
          </div>
        )}
      </div>

      {/* Etiquetas */}
      {song.tags && song.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {song.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-studio-elevated/70 text-studio-muted border border-studio-border/50"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer de la tarjeta con acciones */}
      <div className="pt-3 border-t border-studio-border/60 flex items-center justify-between text-xs text-studio-dimmed">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {song.lastPracticedAt
              ? new Date(song.lastPracticedAt).toLocaleDateString("es-ES", {
                  month: "short",
                  day: "numeric",
                })
              : "Sin practicar"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/songs/${song.id}`}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-electric-600 hover:bg-electric-500 text-white transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Tocar</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

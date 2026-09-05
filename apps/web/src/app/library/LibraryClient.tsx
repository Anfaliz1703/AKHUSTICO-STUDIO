"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { SongCard } from "@/components/songs/SongCard";
import { CanonicalSong } from "@akhustico/shared";
import {
  Search,
  Plus,
  Star,
  BookOpen,
  ArrowUpDown,
} from "lucide-react";

interface Props {
  initialSongs: CanonicalSong[];
}

export function LibraryClient({ initialSongs }: Props) {
  const [songs, setSongs] = useState<CanonicalSong[]>(initialSongs);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string>("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "az" | "artist" | "last_practiced">("recent");

  // Toggle favorite
  const handleToggleFavorite = async (songId: string, current: boolean) => {
    // Optimista
    setSongs((prev) =>
      prev.map((s) => (s.id === songId ? { ...s, isFavorite: !current } : s))
    );
    try {
      await fetch(`/api/songs/${songId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !current }),
      });
    } catch (e) {
      // Revertir en caso de fallo
      setSongs((prev) =>
        prev.map((s) => (s.id === songId ? { ...s, isFavorite: current } : s))
      );
    }
  };

  // Extraer tags únicos de las canciones
  const allTags = useMemo(() => {
    const set = new Set<string>();
    songs.forEach((s) => s.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [songs]);

  // Extraer tonalidades únicas
  const allKeys = useMemo(() => {
    const set = new Set<string>();
    songs.forEach((s) => set.add(s.music.preferredKey));
    return Array.from(set);
  }, [songs]);

  // Filtrado y ordenación
  const filteredSongs = useMemo(() => {
    let result = [...songs];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedKey !== "all") {
      result = result.filter((s) => s.music.preferredKey === selectedKey);
    }

    if (selectedTag !== "all") {
      result = result.filter((s) => s.tags?.includes(selectedTag));
    }

    if (onlyFavorites) {
      result = result.filter((s) => s.isFavorite);
    }

    if (sortBy === "az") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "artist") {
      result.sort((a, b) => a.artist.localeCompare(b.artist));
    } else if (sortBy === "last_practiced") {
      result.sort((a, b) => (b.lastPracticedAt || "").localeCompare(a.lastPracticedAt || ""));
    } else {
      result.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    }

    return result;
  }, [songs, search, selectedKey, selectedTag, onlyFavorites, sortBy]);

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader title="Mi Cancionero" subtitle="Biblioteca inteligente de acordes y partituras" />

      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Barra de Filtros y Búsqueda */}
        <div className="bg-studio-surface border border-studio-border rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Buscador */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-studio-dimmed absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título, artista o etiqueta..."
                className="w-full bg-studio-elevated border border-studio-border rounded-lg pl-10 pr-4 py-2 text-sm text-studio-text placeholder-studio-dimmed focus:outline-none focus:border-electric-500 transition-colors"
              />
            </div>

            {/* Selector de Orden */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-studio-elevated border border-studio-border px-3 py-2 rounded-lg text-xs font-mono text-studio-muted">
                <ArrowUpDown className="w-3.5 h-3.5 text-electric-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  aria-label="Ordenar canciones por"
                  className="bg-transparent text-studio-text focus:outline-none cursor-pointer"
                >
                  <option value="recent" className="bg-studio-surface">Más recientes</option>
                  <option value="az" className="bg-studio-surface">Título (A-Z)</option>
                  <option value="artist" className="bg-studio-surface">Artista</option>
                  <option value="last_practiced" className="bg-studio-surface">Última práctica</option>
                </select>
              </div>

              {/* Botón Filtro Favoritos */}
              <button
                type="button"
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  onlyFavorites
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                    : "bg-studio-elevated border-studio-border text-studio-muted hover:text-studio-text"
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${onlyFavorites ? "fill-current" : ""}`} />
                <span>Favoritos</span>
              </button>

              <Link
                href="/songs/new"
                className="flex items-center gap-1.5 bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Canción</span>
              </Link>
            </div>
          </div>

          {/* Filtros rápidos: Tonalidad y Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-studio-border/60 text-xs">
            <span className="text-studio-dimmed text-[10px] uppercase font-mono mr-1">Tono:</span>
            <button
              type="button"
              onClick={() => setSelectedKey("all")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedKey === "all"
                  ? "bg-electric-600 text-white font-bold"
                  : "bg-studio-elevated text-studio-muted hover:text-studio-text"
              }`}
            >
              Todos
            </button>
            {allKeys.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSelectedKey(k)}
                className={`px-2.5 py-1 rounded-md font-mono transition-colors ${
                  selectedKey === k
                    ? "bg-electric-600 text-white font-bold"
                    : "bg-studio-elevated text-studio-muted hover:text-studio-text"
                }`}
              >
                {k}
              </button>
            ))}

            {allTags.length > 0 && (
              <>
                <span className="text-studio-dimmed text-[10px] uppercase font-mono ml-4 mr-1">Tags:</span>
                <button
                  type="button"
                  onClick={() => setSelectedTag("all")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    selectedTag === "all"
                      ? "bg-violetStudio-600 text-white font-bold"
                      : "bg-studio-elevated text-studio-muted hover:text-studio-text"
                  }`}
                >
                  Todos
                </button>
                {allTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTag(t)}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      selectedTag === t
                        ? "bg-violetStudio-600 text-white font-bold"
                        : "bg-studio-elevated text-studio-muted hover:text-studio-text"
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Listado / Grid de Canciones */}
        {filteredSongs.length === 0 ? (
          <div className="py-20 text-center bg-studio-surface border border-studio-border rounded-2xl p-8 space-y-4">
            <BookOpen className="w-12 h-12 text-studio-dimmed mx-auto" />
            <h3 className="text-lg font-bold text-studio-text">No se encontraron canciones</h3>
            <p className="text-sm text-studio-muted max-w-sm mx-auto">
              Intenta con otros filtros o importa una nueva canción a tu cancionero personal.
            </p>
            <Link
              href="/songs/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Importar Canción Ahora</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSongs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

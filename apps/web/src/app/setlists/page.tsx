"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { ListMusic, Plus, Play, Clock, Music, Calendar } from "lucide-react";

interface Setlist {
  id: string;
  name: string;
  description: string;
  songCount: number;
  totalDurationMin: number;
  updatedAt: string;
}

export default function SetlistsPage() {
  const [setlists, setSetlists] = useState<Setlist[]>([
    {
      id: "set-1",
      name: "Acústico Íntimo",
      description: "Repertorio de baladas y boleros para guitarra solista y voz",
      songCount: 8,
      totalDurationMin: 32,
      updatedAt: "Hace 2 días",
    },
    {
      id: "set-2",
      name: "Ensayo Banda Viernes",
      description: "Temas de rock acústico con bajo y batería",
      songCount: 12,
      totalDurationMin: 48,
      updatedAt: "Ayer",
    },
    {
      id: "set-3",
      name: "Serenata / En Vivo",
      description: "Lista rápida para tocar en vivo sin interrupciones",
      songCount: 6,
      totalDurationMin: 22,
      updatedAt: "Hace 1 semana",
    },
  ]);

  const [newSetName, setNewSetName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    if (!newSetName.trim()) return;
    setSetlists((prev) => [
      {
        id: `set-${Date.now()}`,
        name: newSetName.trim(),
        description: "Lista de repertorio recién creada",
        songCount: 0,
        totalDurationMin: 0,
        updatedAt: "Recién creada",
      },
      ...prev,
    ]);
    setNewSetName("");
    setIsCreating(false);
  };

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader title="Mis Setlists" subtitle="Organización de repertorio y conciertos en vivo" />

      <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Header Acciones */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-studio-text flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-electric-400" />
              Listas de Reproducción & Conciertos
            </h2>
            <p className="text-xs text-studio-muted mt-0.5">
              Agrupa canciones con presets preconfigurados (tono, capo, pistas) para tus presentaciones.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Crear Setlist</span>
          </button>
        </div>

        {/* Modal de Creación Rápida */}
        {isCreating && (
          <div className="p-4 bg-studio-surface border border-studio-borderHighlight rounded-xl flex items-center gap-3">
            <input
              type="text"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              placeholder="Nombre del setlist (ej. Evento Sábado)..."
              className="flex-1 bg-studio-elevated border border-studio-border rounded-lg px-3 py-2 text-sm text-studio-text focus:outline-none focus:border-electric-500"
            />
            <button
              type="button"
              onClick={handleCreate}
              className="px-4 py-2 bg-electric-600 hover:bg-electric-500 text-white rounded-lg text-xs font-bold"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-2 text-xs text-studio-dimmed hover:text-studio-text"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Grid de Setlists */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {setlists.map((item) => (
            <div
              key={item.id}
              className="bg-studio-surface border border-studio-border hover:border-studio-borderHighlight rounded-xl p-5 shadow-studio-card flex flex-col justify-between space-y-4 group transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-studio-dimmed">
                  <span className="flex items-center gap-1">
                    <Music className="w-3.5 h-3.5 text-electric-400" />
                    {item.songCount} canciones
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {item.totalDurationMin} min
                  </span>
                </div>
                <h3 className="text-base font-bold text-studio-text group-hover:text-electric-400 transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-studio-muted line-clamp-2">{item.description}</p>
              </div>

              <div className="pt-3 border-t border-studio-border flex items-center justify-between">
                <span className="text-[11px] text-studio-dimmed">{item.updatedAt}</span>
                <Link
                  href="/library"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-studio-elevated hover:bg-studio-border text-studio-text text-xs font-semibold transition-colors"
                >
                  <Play className="w-3 h-3 fill-current text-electric-400" />
                  <span>Abrir</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

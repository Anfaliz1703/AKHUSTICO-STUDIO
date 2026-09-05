"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, User, DatabaseZap } from "lucide-react";

interface Props {
  title?: string;
  subtitle?: string;
}

export const AppHeader: React.FC<Props> = ({ title, subtitle }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.services?.database === "in_memory_fallback") {
          setIsDemoMode(true);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="h-16 border-b border-studio-border bg-studio-surface/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      <div className="flex items-center gap-4">
        {title ? (
          <div>
            <h2 className="text-base font-bold text-studio-text tracking-wide">{title}</h2>
            {subtitle && <p className="text-xs text-studio-dimmed">{subtitle}</p>}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold text-studio-text tracking-wider">AKHUSTICO</span>
            <span className="text-xs text-electric-400 font-semibold px-2 py-0.5 rounded bg-electric-500/10 border border-electric-500/20">
              Music Lab
            </span>
          </div>
        )}

        {isDemoMode && (
          <div
            title="PostgreSQL no conectado. Utilizando repositorio en memoria con canciones de prueba."
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-medium tracking-wide animate-fade-in"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>DEMO MODE</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/songs/new"
          className="flex items-center gap-2 bg-gradient-to-r from-electric-600 to-electric-500 hover:from-electric-500 hover:to-electric-400 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Importar Canción</span>
        </Link>

        <div className="h-8 w-8 rounded-full bg-studio-elevated border border-studio-border flex items-center justify-center text-studio-muted">
          <User className="w-4 h-4 text-electric-400" />
        </div>
      </div>
    </header>
  );
};

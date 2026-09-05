"use client";

import React from "react";
import { X, Music } from "lucide-react";
import { GuitarChordSvg } from "../chords/GuitarChordSvg";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chords: string[];
  selectedChord?: string | null;
}

export const ChordsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  chords,
  selectedChord,
}) => {
  if (!isOpen) return null;

  // Eliminar duplicados
  const uniqueChords = Array.from(new Set(chords)).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-2xl bg-studio-surface border border-studio-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-studio-border bg-studio-elevated/40">
          <div className="flex items-center gap-2.5">
            <Music className="w-5 h-5 text-electric-400" />
            <h3 className="text-base font-bold text-studio-text tracking-wide">
              Acordes Utilizados en la Canción
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-studio-dimmed hover:text-studio-text hover:bg-studio-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid de diagramas */}
        <div className="p-6 overflow-y-auto flex-1">
          {uniqueChords.length === 0 ? (
            <p className="text-center text-studio-muted py-8 text-sm">
              No hay acordes registrados para esta canción.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {uniqueChords.map((chord) => {
                const isFocused = selectedChord === chord;
                return (
                  <div
                    key={chord}
                    className={`transition-all duration-200 rounded-xl p-1 ${
                      isFocused ? "ring-2 ring-electric-400 scale-105" : ""
                    }`}
                  >
                    <GuitarChordSvg chord={chord} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-studio-border bg-studio-bg/60 flex items-center justify-between text-xs text-studio-dimmed">
          <span>Afinación estándar: E A D G B E</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-studio-elevated hover:bg-studio-border text-studio-text font-semibold rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

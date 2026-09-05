"use client";

import React from "react";
import { LyricsData } from "@akhustico/shared";
import { transposeChord } from "@akhustico/music-core";

interface Props {
  lyrics: LyricsData;
  semitones: number;
  showChords: boolean;
  fontScale: number;
  onChordClick?: (chord: string) => void;
  activeLineIndex?: number;
}

export const LyricsViewer: React.FC<Props> = ({
  lyrics,
  semitones,
  showChords,
  fontScale,
  onChordClick,
  activeLineIndex,
}) => {
  if (!lyrics || !lyrics.sections || lyrics.sections.length === 0) {
    return (
      <div className="py-20 text-center text-studio-muted">
        <p className="text-base font-medium">Esta canción aún no cuenta con letra transcrita.</p>
        <p className="text-xs text-studio-dimmed mt-1">Puedes agregarla desde el editor o analizarla con IA.</p>
      </div>
    );
  }

  let globalLineCount = 0;

  return (
    <div
      className="space-y-10 max-w-3xl mx-auto px-4 py-6 transition-all select-text font-sans"
      style={{ fontSize: `${1.1 * fontScale}rem`, lineHeight: 2.2 }}
    >
      {lyrics.sections.map((section, sIdx) => (
        <section key={`sec-${sIdx}`} className="space-y-4">
          {/* Título de la sección (Intro, Verso, Coro, etc.) */}
          <div className="inline-block px-3 py-1 rounded bg-studio-elevated border border-studio-border text-xs uppercase font-mono font-bold tracking-wider text-studio-muted">
            {section.label}
          </div>

          {/* Líneas de la sección */}
          <div className="space-y-6">
            {section.lines.map((line, lIdx) => {
              const currentGlobalLine = globalLineCount++;
              const isHighlighted = activeLineIndex === currentGlobalLine;

              return (
                <div
                  key={`line-${sIdx}-${lIdx}`}
                  className={`relative transition-colors duration-200 rounded-lg p-2 ${
                    isHighlighted ? "bg-electric-600/10 border-l-2 border-electric-400 pl-3" : ""
                  }`}
                >
                  {/* Fila de Acordes sobre la letra */}
                  {showChords && line.chords && line.chords.length > 0 && (
                    <div className="relative h-6 text-sm font-mono font-bold text-electric-400 select-none">
                      {line.chords.map((chordObj, cIdx) => {
                        const transposedSymbol = transposeChord(chordObj.symbol, semitones);
                        // Posicionamiento aproximado por carácter
                        const leftPercent = Math.min(
                          95,
                          (chordObj.charIndex / Math.max(1, line.text.length)) * 100
                        );

                        return (
                          <button
                            key={`chord-${cIdx}`}
                            type="button"
                            onClick={() => onChordClick?.(transposedSymbol)}
                            style={{ left: `${leftPercent}%` }}
                            className="absolute -top-1 px-1 py-0.5 rounded bg-studio-surface hover:bg-studio-elevated border border-studio-border/80 hover:border-electric-500 shadow-sm cursor-pointer active:scale-95 transition-transform"
                          >
                            {transposedSymbol}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Texto de la letra */}
                  <p className="text-studio-text tracking-wide whitespace-pre-wrap">
                    {line.text || <span className="italic text-studio-dimmed">[Instrumental]</span>}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

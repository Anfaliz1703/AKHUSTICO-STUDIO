"use client";

import React from "react";

export interface ChordDiagramData {
  frets: number[]; // -1 para mute (X), 0 para cuerda al aire (O), 1..n para traste
  baseFret?: number;
  barres?: Array<{ fromString: number; toString: number; fret: number }>;
}

// Diccionario exhaustivo de digitaciones para guitarra acústica/eléctrica (afinación E A D G B E)
export const CHORD_LIBRARY: Record<string, ChordDiagramData> = {
  // Tríadas Mayores
  C: { frets: [-1, 3, 2, 0, 1, 0] },
  D: { frets: [-1, -1, 0, 2, 3, 2] },
  E: { frets: [0, 2, 2, 1, 0, 0] },
  F: { frets: [1, 3, 3, 2, 1, 1], barres: [{ fromString: 1, toString: 6, fret: 1 }] },
  G: { frets: [3, 2, 0, 0, 0, 3] },
  A: { frets: [-1, 0, 2, 2, 2, 0] },
  B: { frets: [-1, 2, 4, 4, 4, 2], baseFret: 2, barres: [{ fromString: 1, toString: 5, fret: 1 }] },
  Bb: { frets: [-1, 1, 3, 3, 3, 1], baseFret: 1, barres: [{ fromString: 1, toString: 5, fret: 1 }] },
  Eb: { frets: [-1, 6, 8, 8, 8, 6], baseFret: 6, barres: [{ fromString: 1, toString: 5, fret: 1 }] },
  Ab: { frets: [4, 6, 6, 5, 4, 4], baseFret: 4, barres: [{ fromString: 1, toString: 6, fret: 1 }] },
  Db: { frets: [-1, 4, 6, 6, 6, 4], baseFret: 4, barres: [{ fromString: 1, toString: 5, fret: 1 }] },
  Gb: { frets: [2, 4, 4, 3, 2, 2], baseFret: 2, barres: [{ fromString: 1, toString: 6, fret: 1 }] },
  "F#": { frets: [2, 4, 4, 3, 2, 2], baseFret: 2, barres: [{ fromString: 1, toString: 6, fret: 1 }] },
  "C#": { frets: [-1, 4, 6, 6, 6, 4], baseFret: 4, barres: [{ fromString: 1, toString: 5, fret: 1 }] },

  // Tríadas Menores
  Cm: { frets: [-1, 3, 5, 5, 4, 3], baseFret: 3, barres: [{ fromString: 1, toString: 5, fret: 1 }] },
  Dm: { frets: [-1, -1, 0, 2, 3, 1] },
  Em: { frets: [0, 2, 2, 0, 0, 0] },
  Fm: { frets: [1, 3, 3, 1, 1, 1], barres: [{ fromString: 1, toString: 6, fret: 1 }] },
  Gm: { frets: [3, 5, 5, 3, 3, 3], baseFret: 3, barres: [{ fromString: 1, toString: 6, fret: 1 }] },
  Am: { frets: [-1, 0, 2, 2, 1, 0] },
  Bm: { frets: [-1, 2, 4, 4, 3, 2], baseFret: 2, barres: [{ fromString: 1, toString: 5, fret: 1 }] },
  Bbm: { frets: [-1, 1, 3, 3, 2, 1], baseFret: 1, barres: [{ fromString: 1, toString: 5, fret: 1 }] },
  "F#m": { frets: [2, 4, 4, 2, 2, 2], baseFret: 2, barres: [{ fromString: 1, toString: 6, fret: 1 }] },
  "C#m": { frets: [-1, 4, 6, 6, 5, 4], baseFret: 4, barres: [{ fromString: 1, toString: 5, fret: 1 }] },
  "G#m": { frets: [4, 6, 6, 4, 4, 4], baseFret: 4, barres: [{ fromString: 1, toString: 6, fret: 1 }] },

  // Séptimas Dominantes (7)
  C7: { frets: [-1, 3, 2, 3, 1, 0] },
  D7: { frets: [-1, -1, 0, 2, 1, 2] },
  E7: { frets: [0, 2, 0, 1, 0, 0] },
  F7: { frets: [1, 3, 1, 2, 1, 1], barres: [{ fromString: 1, toString: 6, fret: 1 }] },
  G7: { frets: [3, 2, 0, 0, 0, 1] },
  A7: { frets: [-1, 0, 2, 0, 2, 0] },
  B7: { frets: [-1, 2, 1, 2, 0, 2] },
  Bb7: { frets: [-1, 1, 3, 1, 3, 1], baseFret: 1, barres: [{ fromString: 1, toString: 5, fret: 1 }] },

  // Menores con Séptima (m7)
  Cm7: { frets: [-1, 3, 5, 3, 4, 3], baseFret: 3, barres: [{ fromString: 1, toString: 5, fret: 1 }] },
  Dm7: { frets: [-1, -1, 0, 2, 1, 1] },
  Em7: { frets: [0, 2, 0, 0, 0, 0] },
  Fm7: { frets: [1, 3, 1, 1, 1, 1], barres: [{ fromString: 1, toString: 6, fret: 1 }] },
  Gm7: { frets: [3, 5, 3, 3, 3, 3], baseFret: 3, barres: [{ fromString: 1, toString: 6, fret: 1 }] },
  Am7: { frets: [-1, 0, 2, 0, 1, 0] },
  Bm7: { frets: [-1, 2, 0, 2, 0, 2] },
  "F#m7": { frets: [2, 4, 2, 2, 2, 2], baseFret: 2, barres: [{ fromString: 1, toString: 6, fret: 1 }] },
  FsharpM7: { frets: [2, 4, 2, 2, 2, 2], baseFret: 2, barres: [{ fromString: 1, toString: 6, fret: 1 }] },
  "C#m7": { frets: [-1, 4, 6, 4, 5, 4], baseFret: 4, barres: [{ fromString: 1, toString: 5, fret: 1 }] },

  // Mayores con Séptima Mayor (maj7)
  Cmaj7: { frets: [-1, 3, 2, 0, 0, 0] },
  Dmaj7: { frets: [-1, -1, 0, 2, 2, 2] },
  Emaj7: { frets: [0, 2, 1, 1, 0, 0] },
  Fmaj7: { frets: [-1, -1, 3, 2, 1, 0] },
  Gmaj7: { frets: [3, -1, 0, 0, 0, 2] },
  Amaj7: { frets: [-1, 0, 2, 1, 2, 0] },
  Bmaj7: { frets: [-1, 2, 4, 3, 4, 2], baseFret: 2, barres: [{ fromString: 1, toString: 5, fret: 1 }] },
  Bbmaj7: { frets: [-1, 1, 3, 2, 3, 1], baseFret: 1, barres: [{ fromString: 1, toString: 5, fret: 1 }] },

  // Suspendidos (sus2, sus4)
  Csus2: { frets: [-1, 3, 0, 0, 1, -1] },
  Dsus2: { frets: [-1, -1, 0, 2, 3, 0] },
  Asus2: { frets: [-1, 0, 2, 2, 0, 0] },
  Esus2: { frets: [0, 2, 4, 4, 0, 0] },
  Gsus2: { frets: [3, 0, 0, 0, 3, 3] },
  Csus4: { frets: [-1, 3, 3, 0, 1, 1] },
  Dsus4: { frets: [-1, -1, 0, 2, 3, 3] },
  Esus4: { frets: [0, 2, 2, 2, 0, 0] },
  Fsus4: { frets: [1, 3, 3, 3, 1, 1], barres: [{ fromString: 1, toString: 6, fret: 1 }] },
  Gsus4: { frets: [3, 3, 0, 0, 1, 3] },
  Asus4: { frets: [-1, 0, 2, 2, 3, 0] },
  Bsus4: { frets: [-1, 2, 4, 4, 5, 2], baseFret: 2, barres: [{ fromString: 1, toString: 5, fret: 1 }] },

  // Disminuidos y Aumentados (dim, dim7, aug)
  Cdim: { frets: [-1, -1, 1, 2, 1, 2] },
  Cdim7: { frets: [-1, -1, 1, 2, 1, 2] },
  Ddim: { frets: [-1, -1, 0, 1, 3, 1] },
  Edim: { frets: [-1, -1, 2, 3, 2, 3] },
  Fdim: { frets: [-1, -1, 0, 1, 0, 1] },
  Gdim: { frets: [-1, -1, 2, 3, 2, 3], baseFret: 3 },
  Adim: { frets: [-1, 0, 1, 2, 1, -1] },
  Bdim: { frets: [-1, 2, 3, 4, 3, -1], baseFret: 2 },
  Caug: { frets: [-1, 3, 2, 1, 1, 0] },
  Daug: { frets: [-1, -1, 0, 3, 3, 2] },
  Eaug: { frets: [0, 3, 2, 1, 1, 0] },
  Gaug: { frets: [3, 2, 1, 0, 0, 3] },
  Aaug: { frets: [-1, 0, 3, 2, 2, 1] },

  // Slash Chords Relevantes
  "C/G": { frets: [3, 3, 2, 0, 1, 0] },
  "D/A": { frets: [-1, 0, 0, 2, 3, 2] },
  "G/B": { frets: [-1, 2, 0, 0, 0, 3] },
  "D/F#": { frets: [2, 0, 0, 2, 3, 2] },
  "A/C#": { frets: [-1, 4, 2, 2, 2, -1], baseFret: 2 },
  "F/C": { frets: [-1, 3, 3, 2, 1, 1] },
};

interface Props {
  chord: string;
  width?: number;
  height?: number;
}

export const GuitarChordSvg: React.FC<Props> = ({ chord, width = 120, height = 150 }) => {
  // Limpiar posibles slash chords o notaciones equivalentes
  const baseChord = chord.split("/")[0];
  const data =
    CHORD_LIBRARY[chord] ||
    CHORD_LIBRARY[baseChord] ||
    CHORD_LIBRARY[baseChord.replace("#", "sharp")] ||
    CHORD_LIBRARY["C"];

  const numStrings = 6;
  const numFrets = 5;

  const startX = 20;
  const startY = 30;
  const stringSpacing = 16;
  const fretSpacing = 20;

  return (
    <div className="flex flex-col items-center bg-studio-elevated/60 border border-studio-border/80 rounded-lg p-2 shadow-sm">
      <span className="text-sm font-bold text-electric-400 font-mono tracking-wide mb-1">{chord}</span>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 120 150`}
        className="select-none"
      >
        {/* Cejuela superior (nut) */}
        <line
          x1={startX}
          y1={startY}
          x2={startX + (numStrings - 1) * stringSpacing}
          y2={startY}
          stroke="#94a3b8"
          strokeWidth={data.baseFret && data.baseFret > 1 ? 1 : 4}
        />

        {/* Trastes horizontales */}
        {Array.from({ length: numFrets }).map((_, i) => (
          <line
            key={`fret-${i}`}
            x1={startX}
            y1={startY + (i + 1) * fretSpacing}
            x2={startX + (numStrings - 1) * stringSpacing}
            y2={startY + (i + 1) * fretSpacing}
            stroke="#3b4870"
            strokeWidth={1}
          />
        ))}

        {/* Cuerdas verticales (6 = E grave a la izquierda, 1 = E aguda a la derecha) */}
        {Array.from({ length: numStrings }).map((_, i) => (
          <line
            key={`string-${i}`}
            x1={startX + i * stringSpacing}
            y1={startY}
            x2={startX + i * stringSpacing}
            y2={startY + numFrets * fretSpacing}
            stroke="#64748b"
            strokeWidth={i < 3 ? 1.8 : 1.2}
          />
        ))}

        {/* Número de traste base si es cejilla alta */}
        {data.baseFret && data.baseFret > 1 && (
          <text
            x={startX - 12}
            y={startY + 15}
            fill="#38bdf8"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {data.baseFret}fr
          </text>
        )}

        {/* Marcadores de cejilla (barre) */}
        {data.barres?.map((barre, idx) => {
          const x1 = startX + (6 - barre.toString) * stringSpacing;
          const x2 = startX + (6 - barre.fromString) * stringSpacing;
          const y = startY + (barre.fret - 0.5) * fretSpacing;
          return (
            <rect
              key={`barre-${idx}`}
              x={Math.min(x1, x2) - 4}
              y={y - 5}
              width={Math.abs(x2 - x1) + 8}
              height={10}
              rx={5}
              fill="#38bdf8"
              opacity={0.85}
            />
          );
        })}

        {/* Marcadores de trastes y cuerdas (O / X / Puntos) */}
        {data.frets.map((fret, stringIdx) => {
          // stringIdx 0 es 6ta cuerda (grave), 5 es 1ra cuerda (aguda)
          const cx = startX + stringIdx * stringSpacing;

          if (fret === -1) {
            // Mute (X)
            return (
              <text
                key={`mute-${stringIdx}`}
                x={cx}
                y={startY - 8}
                textAnchor="middle"
                fill="#ef4444"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
              >
                ✕
              </text>
            );
          }

          if (fret === 0) {
            // Open (O)
            return (
              <circle
                key={`open-${stringIdx}`}
                cx={cx}
                cy={startY - 11}
                r={3.5}
                fill="none"
                stroke="#22c55e"
                strokeWidth={1.5}
              />
            );
          }

          if (fret > 0) {
            // Punto de digitación
            const cy = startY + (fret - 0.5) * fretSpacing;
            return (
              <circle
                key={`finger-${stringIdx}`}
                cx={cx}
                cy={cy}
                r={5.5}
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth={1.5}
              />
            );
          }

          return null;
        })}
      </svg>
    </div>
  );
};

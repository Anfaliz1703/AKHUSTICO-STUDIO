// packages/music-core/src/notes.ts

export const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export type SharpNote = typeof SHARP_NOTES[number];
export type FlatNote = typeof FLAT_NOTES[number];
export type NoteName = SharpNote | FlatNote;

export const NOTE_TO_PITCH_CLASS: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
};

/**
 * Normaliza un nombre de nota o tonalidad (ej. 'sol' -> 'G', 'La menor' -> 'Am', 'Fa sostenido menor' -> 'F#m', 'Si bemol' -> 'Bb').
 */
export function normalizeNoteName(input: string): string {
  let trimmed = input.trim();
  if (!trimmed) return "C";

  // Reemplazar alteraciones en español
  trimmed = trimmed
    .replace(/\s*sostenido\s*/gi, "#")
    .replace(/\s*bemol\s*/gi, "b");

  // Detectar modalidad menor
  let isMinor = false;
  if (/\b(menor|min)\b/i.test(trimmed) || /^[A-Ga-g][#b]?m\b/.test(trimmed)) {
    isMinor = true;
    trimmed = trimmed.replace(/\b(menor|min)\b/gi, "").trim();
  }
  trimmed = trimmed.replace(/\b(mayor|maj)\b/gi, "").trim();

  const solfegeMap: Record<string, string> = {
    'do': 'C', 're': 'D', 'mi': 'E', 'fa': 'F', 'sol': 'G', 'la': 'A', 'si': 'B'
  };

  const lower = trimmed.toLowerCase();
  for (const [s, note] of Object.entries(solfegeMap)) {
    if (lower.startsWith(s)) {
      const rest = trimmed.slice(s.length).trim();
      trimmed = note + rest;
      break;
    }
  }

  const first = trimmed.charAt(0).toUpperCase();
  const rest = trimmed.slice(1);
  let res = first + rest;

  if (isMinor && !res.endsWith("m")) {
    res += "m";
  }

  return res;
}

/**
 * Convierte frecuencia en Hz a número MIDI continuo.
 */
export function frequencyToMidi(freq: number): number {
  if (freq <= 0) return 0;
  return 69 + 12 * Math.log2(freq / 440);
}

/**
 * Convierte número MIDI a frecuencia fundamental en Hz.
 */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Convierte un número MIDI a nombre de nota con octava (ej. 69 -> 'A4', 60 -> 'C4').
 */
export function midiToNoteName(midi: number, preferFlats = false): string {
  const roundedMidi = Math.round(midi);
  const pitchClass = ((roundedMidi % 12) + 12) % 12;
  const octave = Math.floor(roundedMidi / 12) - 1;
  const noteList = preferFlats ? FLAT_NOTES : SHARP_NOTES;
  return `${noteList[pitchClass]}${octave}`;
}

/**
 * Parsea un nombre de nota con octava opcional (ej. 'A4', 'C#3', 'Eb') a MIDI o pitch class.
 */
export function parseNote(noteStr: string): { pitchClass: number; octave: number | null; midi: number | null } | null {
  const normalized = normalizeNoteName(noteStr);
  const match = normalized.match(/^([A-Ga-g][#b]?)(-?\d+)?$/);
  if (!match) return null;

  const notePart = match[1].charAt(0).toUpperCase() + match[1].slice(1);
  const octavePart = match[2] !== undefined ? parseInt(match[2], 10) : null;

  const pitchClass = NOTE_TO_PITCH_CLASS[notePart];
  if (pitchClass === undefined) return null;

  const midi = octavePart !== null ? (octavePart + 1) * 12 + pitchClass : null;
  return { pitchClass, octave: octavePart, midi };
}

/**
 * Calcula la desviación en cents entre la frecuencia detectada y la frecuencia objetivo:
 * cents = 1200 * log2(userFreq / targetFreq)
 */
export function calculateCentsDifference(userFreq: number, targetFreq: number): number {
  if (userFreq <= 0 || targetFreq <= 0) return 0;
  return 1200 * Math.log2(userFreq / targetFreq);
}

/**
 * Clasifica la afinación según el valor absoluto de cents.
 */
export type PitchCategory = 'excellent' | 'in_tune' | 'near' | 'review' | 'out_of_tune';

export interface PitchClassification {
  category: PitchCategory;
  label: string;
  color: string;
  cents: number;
}

export function classifyPitchDeviation(cents: number, toleranceScale = 1.0): PitchClassification {
  const absCents = Math.abs(cents);
  const t = toleranceScale;

  if (absCents <= 15 * t) {
    return { category: 'excellent', label: 'Excelente', color: '#10b981', cents };
  }
  if (absCents <= 25 * t) {
    return { category: 'in_tune', label: 'Muy afinado', color: '#06b6d4', cents };
  }
  if (absCents <= 40 * t) {
    return { category: 'near', label: 'Cerca', color: '#f59e0b', cents };
  }
  if (absCents <= 50 * t) {
    return { category: 'review', label: 'Revisar', color: '#f97316', cents };
  }
  return { category: 'out_of_tune', label: 'Fuera', color: '#ef4444', cents };
}

// packages/music-core/src/chords.ts

import { NOTE_TO_PITCH_CLASS, SHARP_NOTES, FLAT_NOTES, normalizeNoteName } from './notes.js';

export interface ParsedChord {
  raw: string;
  root: string;
  rootPitchClass: number;
  suffix: string;
  bass: string | null;
  bassPitchClass: number | null;
}

// Regex robusto para acordes
// Grupo 1: Raíz (A-G con posible # o b)
// Grupo 2: Sufijo / extensión (opcional)
// Grupo 3: Nota de bajo tras '/' (opcional)
const CHORD_REGEX = /^([A-Ga-g][#b]?)(maj7|m7b5|m7|maj9|m9|min7|min|maj|sus2|sus4|dim7|dim|aug|add9|m|7|6|9|11|13|5)?(?:\/([A-Ga-g][#b]?))?$/;

/**
 * Parsea una cadena de acorde en sus componentes armónicos.
 */
export function parseChord(chordStr: string): ParsedChord | null {
  const clean = chordStr.trim();
  if (!clean) return null;

  const match = clean.match(CHORD_REGEX);
  if (!match) return null;

  const rootRaw = normalizeNoteName(match[1]);
  const root = rootRaw.charAt(0).toUpperCase() + rootRaw.slice(1);
  const rootPitchClass = NOTE_TO_PITCH_CLASS[root];
  if (rootPitchClass === undefined) return null;

  const suffix = match[2] || '';

  let bass: string | null = null;
  let bassPitchClass: number | null = null;

  if (match[3]) {
    const bassRaw = normalizeNoteName(match[3]);
    bass = bassRaw.charAt(0).toUpperCase() + bassRaw.slice(1);
    bassPitchClass = NOTE_TO_PITCH_CLASS[bass] ?? null;
  }

  return {
    raw: clean,
    root,
    rootPitchClass,
    suffix,
    bass,
    bassPitchClass,
  };
}

/**
 * Lista de tonalidades que tradicionalmente usan bemoles:
 * F (1b), Bb (2b), Eb (3b), Ab (4b), Db (5b), Gb (6b)
 * Dm (1b), Gm (2b), Cm (3b), Fm (4b), Bbm (5b), Ebm (6b)
 */
export const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm']);

/**
 * Determina si se deben preferir bemoles según la tonalidad o el contexto del acorde.
 */
export function shouldUseFlats(rootOrKey: string, preferFlatsParam?: boolean): boolean {
  if (preferFlatsParam !== undefined) return preferFlatsParam;
  if (FLAT_KEYS.has(rootOrKey)) return true;
  if (rootOrKey.includes('b')) return true;
  return false;
}

/**
 * Transpone una nota aislada (ej. 'C' +2 -> 'D', 'Bb' +2 -> 'C', 'F#' -2 -> 'E')
 */
export function transposeNote(note: string, semitones: number, preferFlats?: boolean): string {
  const norm = normalizeNoteName(note);
  const clean = norm.charAt(0).toUpperCase() + norm.slice(1);
  const pc = NOTE_TO_PITCH_CLASS[clean];
  if (pc === undefined) return note;

  const newPc = ((pc + semitones) % 12 + 12) % 12;
  const useFlats = preferFlats !== undefined ? preferFlats : shouldUseFlats(clean);
  const scale = useFlats ? FLAT_NOTES : SHARP_NOTES;
  return scale[newPc];
}

/**
 * Transpone un acorde completo, preservando sufijos y transponiendo el bajo si existe.
 * Ejemplos:
 * C +2 => D
 * Am +2 => Bm
 * F#m7 -2 => Em7
 * Bb +2 => C
 * C/G +2 => D/A
 * Bbmaj7 +1 => Bmaj7
 */
export function transposeChord(chordStr: string, semitones: number, preferFlats?: boolean): string {
  if (semitones === 0) return chordStr;
  const parsed = parseChord(chordStr);
  if (!parsed) return chordStr;

  const useFlats = preferFlats !== undefined ? preferFlats : (parsed.root.includes('b') || (parsed.bass ? parsed.bass.includes('b') : false));
  const newRoot = transposeNote(parsed.root, semitones, useFlats);
  
  let newBassPart = '';
  if (parsed.bass) {
    const newBass = transposeNote(parsed.bass, semitones, useFlats);
    newBassPart = `/${newBass}`;
  }

  return `${newRoot}${parsed.suffix}${newBassPart}`;
}

/**
 * Transpone una progresión de acordes separada por espacios o guiones.
 */
export function transposeProgression(progression: string, semitones: number, preferFlats?: boolean): string {
  return progression.split(/(\s+|-)/).map((token) => {
    if (!token.trim() || token === '-') return token;
    return transposeChord(token, semitones, preferFlats);
  }).join('');
}

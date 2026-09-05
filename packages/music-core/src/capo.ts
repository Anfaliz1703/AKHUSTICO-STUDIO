// packages/music-core/src/capo.ts

import { transposeNote, parseChord, transposeChord } from './chords.js';

export interface CapoSuggestion {
  capo: number;
  shapeKey: string;
  isCommonOpenShape: boolean;
  notes: string;
}

// Formas de acordes comunes y cómodas en guitarra (primeras posiciones abiertas)
const COMMON_OPEN_MAJOR_SHAPES = ['C', 'A', 'G', 'E', 'D'];
const COMMON_OPEN_MINOR_SHAPES = ['Am', 'Em', 'Dm'];

/**
 * Calcula el tono real sonoro a partir de la forma de acordes y la posición de la cejilla (capo):
 * Tono Real = Forma + Capo semitonos
 * Ejemplo: Forma 'A' con Capo 2 -> Tono Real 'B'
 */
export function calculateRealKey(shapeKey: string, capo: number): string {
  if (capo <= 0) return shapeKey;
  return transposeChord(shapeKey, capo);
}

/**
 * Calcula la forma de acordes necesaria para sonar en un tono real dado con una cejilla dada:
 * Forma = Tono Real - Capo semitonos
 * Ejemplo: Tono Real 'B' con Capo 2 -> Forma 'A'
 */
export function calculateChordShapeKey(realKey: string, capo: number): string {
  if (capo <= 0) return realKey;
  return transposeChord(realKey, -capo);
}

/**
 * Sugiere configuraciones prácticas de cejilla (capo 0 a 7) para tocar una tonalidad real dada,
 * buscando formas abiertas naturales que faciliten la ejecución en guitarra acústica.
 */
export function suggestCapoPositions(realKey: string): CapoSuggestion[] {
  const suggestions: CapoSuggestion[] = [];
  const parsed = parseChord(realKey);
  if (!parsed) return suggestions;

  const isMinor = parsed.suffix.startsWith('m') && !parsed.suffix.startsWith('maj');
  const targetShapes = isMinor ? COMMON_OPEN_MINOR_SHAPES : COMMON_OPEN_MAJOR_SHAPES;

  for (let capo = 0; capo <= 7; capo++) {
    const shape = calculateChordShapeKey(realKey, capo);
    const isCommon = targetShapes.includes(shape);

    if (isCommon || capo === 0) {
      suggestions.push({
        capo,
        shapeKey: shape,
        isCommonOpenShape: isCommon,
        notes: capo === 0 ? 'Sin cejilla (afinación estándar)' : `Cejilla en traste ${capo} tocando formas de ${shape}`,
      });
    }
  }

  // Ordenar priorizando formas comunes con trastes más bajos
  return suggestions.sort((a, b) => {
    if (a.isCommonOpenShape && !b.isCommonOpenShape) return -1;
    if (!a.isCommonOpenShape && b.isCommonOpenShape) return 1;
    return a.capo - b.capo;
  });
}

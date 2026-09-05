// packages/music-core/src/scoring.ts

import { calculateCentsDifference, frequencyToMidi } from './notes.js';

export interface VocalFrame {
  timeMs: number;
  frequency: number | null;
  midi: number | null;
  confidence: number;
}

export interface TargetMelodyFrame {
  timeMs: number;
  frequency: number;
  midi: number;
  note: string;
  confidence?: number;
  voiced?: boolean;
}

export interface ProblemSegment {
  startMs: number;
  endMs: number;
  targetNote: string;
  targetMidi: number;
  avgCents: number;
  pattern: 'flat_entry' | 'sharp_entry' | 'flat_sustain' | 'sharp_sustain' | 'falling_pitch' | 'rising_pitch' | 'unstable' | 'late_entry' | 'early_entry';
  description: string;
}

export interface SessionScoreResult {
  overallScore: number;
  pitchScore: number;
  rhythmScore: number;
  stabilityScore: number;
  totalTargetFrames: number;
  evaluatedFrames: number;
  problemSegments: ProblemSegment[];
}

/**
 * Calcula las puntuaciones deterministas de la sesión de práctica vocal.
 */
export function calculateVocalScore(
  userFrames: VocalFrame[],
  targetFrames: TargetMelodyFrame[],
  minConfidence = 0.70
): SessionScoreResult {
  if (targetFrames.length === 0 || userFrames.length === 0) {
    return {
      overallScore: 0,
      pitchScore: 0,
      rhythmScore: 0,
      stabilityScore: 0,
      totalTargetFrames: targetFrames.length,
      evaluatedFrames: 0,
      problemSegments: [],
    };
  }

  // Emparejar frames en tiempo dentro de un delta de 30ms
  const pairs: Array<{ user: VocalFrame; target: TargetMelodyFrame; cents: number }> = [];

  let userIdx = 0;
  for (const target of targetFrames) {
    if (target.frequency <= 0) continue;

    // Buscar el frame de usuario más cercano en el tiempo
    while (userIdx < userFrames.length - 1 && userFrames[userIdx].timeMs < target.timeMs - 25) {
      userIdx++;
    }

    const candidate = userFrames[userIdx];
    if (candidate && Math.abs(candidate.timeMs - target.timeMs) <= 40) {
      if (candidate.frequency && candidate.frequency > 0 && candidate.confidence >= minConfidence) {
        const cents = calculateCentsDifference(candidate.frequency, target.frequency);
        pairs.push({ user: candidate, target, cents });
      }
    }
  }

  if (pairs.length === 0) {
    return {
      overallScore: 0,
      pitchScore: 0,
      rhythmScore: 0,
      stabilityScore: 0,
      totalTargetFrames: targetFrames.length,
      evaluatedFrames: 0,
      problemSegments: [],
    };
  }

  // 1. Pitch Score: 100 * (1/N) * sum(max(0, 1 - |cents| / 100))
  let totalPitchPoints = 0;
  for (const p of pairs) {
    const frameScore = Math.max(0, 1 - Math.abs(p.cents) / 100);
    totalPitchPoints += frameScore;
  }
  const pitchScore = Math.round((totalPitchPoints / pairs.length) * 100);

  // 2. Rhythm Score: evaluado en onsets
  // Se aproxima comparando la cobertura y continuidad de vocalización respecto a los targets
  const rhythmRatio = Math.min(1.0, pairs.length / Math.max(1, targetFrames.filter(t => t.frequency > 0).length));
  const rhythmScore = Math.round(rhythmRatio * 100);

  // 3. Stability Score: varianza de cents
  const meanCents = pairs.reduce((acc, p) => acc + p.cents, 0) / pairs.length;
  const variance = pairs.reduce((acc, p) => acc + Math.pow(p.cents - meanCents, 2), 0) / pairs.length;
  const stdDev = Math.sqrt(variance);
  const stabilityScore = Math.round(Math.max(0, 100 - stdDev * 1.5));

  // 4. Overall Score: 50% pitch + 25% rhythm + 25% stability
  const overallScore = Math.round(pitchScore * 0.5 + rhythmScore * 0.25 + stabilityScore * 0.25);

  // 5. Detección de fragmentos problemáticos
  const problemSegments = detectProblemSegments(pairs);

  return {
    overallScore,
    pitchScore,
    rhythmScore,
    stabilityScore,
    totalTargetFrames: targetFrames.length,
    evaluatedFrames: pairs.length,
    problemSegments,
  };
}

/**
 * Agrupa desviaciones continuas e identifica patrones de error acústico.
 */
function detectProblemSegments(
  pairs: Array<{ user: VocalFrame; target: TargetMelodyFrame; cents: number }>
): ProblemSegment[] {
  const problems: ProblemSegment[] = [];
  const windowSize = 10; // ~200-300ms

  for (let i = 0; i <= pairs.length - windowSize; i += windowSize) {
    const chunk = pairs.slice(i, i + windowSize);
    const avgCents = chunk.reduce((acc, c) => acc + c.cents, 0) / chunk.length;
    const absAvg = Math.abs(avgCents);

    if (absAvg > 35) {
      const firstTarget = chunk[0].target;
      const startMs = chunk[0].target.timeMs;
      const endMs = chunk[chunk.length - 1].target.timeMs;

      // Evaluar tendencia (inicio vs final del chunk)
      const firstHalf = chunk.slice(0, Math.floor(windowSize / 2));
      const secondHalf = chunk.slice(Math.floor(windowSize / 2));
      const firstAvg = firstHalf.reduce((acc, c) => acc + c.cents, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((acc, c) => acc + c.cents, 0) / secondHalf.length;

      let pattern: ProblemSegment['pattern'] = 'flat_sustain';
      let description = `Desviación promedio de ${Math.round(avgCents)} cents.`;

      if (firstAvg < -35 && Math.abs(secondAvg) < 20) {
        pattern = 'flat_entry';
        description = 'Entrada baja: comienzas por debajo de la nota y luego corriges.';
      } else if (firstAvg > 35 && Math.abs(secondAvg) < 20) {
        pattern = 'sharp_entry';
        description = 'Entrada alta: comienzas por encima de la nota antes de ajustar.';
      } else if (Math.abs(firstAvg) < 20 && secondAvg < -30) {
        pattern = 'falling_pitch';
        description = 'Caída de nota: inicias en tono pero desciendes al sostener la frase.';
      } else if (Math.abs(firstAvg) < 20 && secondAvg > 30) {
        pattern = 'rising_pitch';
        description = 'Subida de nota: el tono se eleva gradualmente al prolongar la nota.';
      } else if (avgCents < -35) {
        pattern = 'flat_sustain';
        description = `Frase sostenida por debajo del objetivo (${Math.round(avgCents)}c).`;
      } else if (avgCents > 35) {
        pattern = 'sharp_sustain';
        description = `Frase sostenida por encima del objetivo (+${Math.round(avgCents)}c).`;
      }

      problems.push({
        startMs,
        endMs,
        targetNote: firstTarget.note,
        targetMidi: firstTarget.midi,
        avgCents: Math.round(avgCents),
        pattern,
        description,
      });
    }
  }

  return problems.slice(0, 5); // Limitar a los 5 fragmentos más representativos
}

// packages/music-core/src/index.test.ts

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  transposeChord,
  transposeProgression,
  frequencyToMidi,
  midiToFrequency,
  midiToNoteName,
  calculateCentsDifference,
  classifyPitchDeviation,
  calculateRealKey,
  calculateChordShapeKey,
  calculateVocalScore,
  normalizeNoteName,
} from './index.js';

describe('Transposición de Acordes (Requisitos Mandatorios Sección 61)', () => {
  it('C +2 = D', () => {
    assert.equal(transposeChord('C', 2), 'D');
  });

  it('Am +2 = Bm', () => {
    assert.equal(transposeChord('Am', 2), 'Bm');
  });

  it('F#m7 -2 = Em7', () => {
    assert.equal(transposeChord('F#m7', -2), 'Em7');
  });

  it('Bb +2 = C', () => {
    assert.equal(transposeChord('Bb', 2), 'C');
  });

  it('C/G +2 = D/A', () => {
    assert.equal(transposeChord('C/G', 2), 'D/A');
  });

  it('Bbmaj7 +1 = Bmaj7', () => {
    assert.equal(transposeChord('Bbmaj7', 1), 'Bmaj7');
  });
});

describe('Extensiones, Enarmonía y Progresiones', () => {
  it('maneja acordes suspendidos y disminuidos', () => {
    assert.equal(transposeChord('Dsus4', 2), 'Esus4');
    assert.equal(transposeChord('C#dim', 2), 'D#dim');
    assert.equal(transposeChord('Gaug', -1), 'F#aug');
    assert.equal(transposeChord('Am7b5', 3), 'Cm7b5');
  });

  it('transpone progresiones completas de acordes', () => {
    const progression = 'C - G - Am - F';
    const transposed = transposeProgression(progression, 2);
    assert.equal(transposed, 'D - A - Bm - G');
  });

  it('soporta slash chords invertidos con bemoles', () => {
    assert.equal(transposeChord('Eb/Bb', 2), 'F/C');
  });

  it('normaliza notas y tonalidades en español y cifrado inglés', () => {
    assert.equal(normalizeNoteName('La menor'), 'Am');
    assert.equal(normalizeNoteName('Do mayor'), 'C');
    assert.equal(normalizeNoteName('Si bemol'), 'Bb');
    assert.equal(normalizeNoteName('Fa sostenido menor'), 'F#m');
    assert.equal(normalizeNoteName('sol'), 'G');
  });
});

describe('Capo, Tono Real y Formas de Acordes (Sección 25)', () => {
  it('calcula tono real a partir de forma y cejilla: Forma A + Capo 2 = B', () => {
    assert.equal(calculateRealKey('A', 2), 'B');
  });

  it('calcula forma a partir de tono real y cejilla: Tono B con Capo 2 = A', () => {
    assert.equal(calculateChordShapeKey('B', 2), 'A');
  });

  it('calcula forma con tonalidades menores: Tono F#m con Capo 2 = Em', () => {
    assert.equal(calculateChordShapeKey('F#m', 2), 'Em');
  });
});

describe('Conversiones Acústicas y Detección de Cents (Secciones 14 & 34)', () => {
  it('convierte 440 Hz a MIDI 69 (A4)', () => {
    assert.equal(Math.round(frequencyToMidi(440)), 69);
  });

  it('convierte MIDI 60 a C4', () => {
    assert.equal(midiToNoteName(60), 'C4');
  });

  it('convierte MIDI 69 a 440 Hz', () => {
    assert.equal(Math.round(midiToFrequency(69)), 440);
  });

  it('calcula desviación exacta en cents: misma frecuencia = 0 cents', () => {
    assert.equal(calculateCentsDifference(440, 440), 0);
  });

  it('calcula +12 cents y -43 cents correctamente', () => {
    const freqPlus12 = 440 * Math.pow(2, 12 / 1200);
    const diffPlus = calculateCentsDifference(freqPlus12, 440);
    assert.equal(Math.round(diffPlus), 12);

    const freqMinus43 = 440 * Math.pow(2, -43 / 1200);
    const diffMinus = calculateCentsDifference(freqMinus43, 440);
    assert.equal(Math.round(diffMinus), -43);
  });

  it('clasifica afinación según tolerancia (0-15 excelente, 16-25 muy afinado, >50 fuera)', () => {
    assert.equal(classifyPitchDeviation(10).category, 'excellent');
    assert.equal(classifyPitchDeviation(20).category, 'in_tune');
    assert.equal(classifyPitchDeviation(35).category, 'near');
    assert.equal(classifyPitchDeviation(45).category, 'review');
    assert.equal(classifyPitchDeviation(60).category, 'out_of_tune');
  });
});

describe('Motor de Scoring Vocal Determinista (Sección 36)', () => {
  it('calcula puntuación perfecta para ejecución idéntica', () => {
    const target = [
      { timeMs: 100, frequency: 440, midi: 69, note: 'A4' },
      { timeMs: 200, frequency: 440, midi: 69, note: 'A4' },
      { timeMs: 300, frequency: 440, midi: 69, note: 'A4' },
    ];
    const user = [
      { timeMs: 100, frequency: 440, midi: 69, confidence: 0.95 },
      { timeMs: 200, frequency: 440, midi: 69, confidence: 0.95 },
      { timeMs: 300, frequency: 440, midi: 69, confidence: 0.95 },
    ];

    const result = calculateVocalScore(user, target);
    assert.equal(result.overallScore, 100);
    assert.equal(result.pitchScore, 100);
    assert.equal(result.problemSegments.length, 0);
  });
});

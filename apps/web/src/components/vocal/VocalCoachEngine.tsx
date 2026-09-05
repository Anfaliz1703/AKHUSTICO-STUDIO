"use client";

import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Play, Pause, Award, AlertCircle, RefreshCw } from "lucide-react";
import {
  calculateCentsDifference,
  classifyPitchDeviation,
  frequencyToMidi,
  midiToNoteName,
  calculateVocalScore,
} from "@akhustico/music-core";
import { MelodyPoint } from "@akhustico/shared";

interface Props {
  targetMelody: MelodyPoint[];
  originalKey: string;
  transposition: number;
}

export const VocalCoachEngine: React.FC<Props> = ({
  targetMelody,
  originalKey,
  transposition,
}) => {
  const [isMicActive, setIsMicActive] = useState(false);
  const [currentFreq, setCurrentFreq] = useState<number | null>(null);
  const [currentMidi, setCurrentMidi] = useState<number | null>(null);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [centsDiff, setCentsDiff] = useState<number | null>(null);
  const [classification, setClassification] = useState<any>(null);
  const [playbackTimeMs, setPlaybackTimeMs] = useState(0);
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  const [sessionReport, setSessionReport] = useState<any>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Buffer de frames registrados para scoring final
  const recordedUserFrames = useRef<Array<{ timeMs: number; frequency: number; midi: number; confidence: number }>>([]);

  // Iniciar / Detener Micrófono
  const toggleMic = async () => {
    if (isMicActive) {
      stopMic();
    } else {
      await startMic();
    }
  };

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
      });
      micStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsMicActive(true);
      recordedUserFrames.current = [];
      setIsSessionFinished(false);
      startPitchDetectionLoop();
    } catch (err) {
      alert("No se pudo acceder al micrófono. Verifica los permisos en el navegador.");
    }
  };

  const stopMic = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
    }
    setIsMicActive(false);

    // Calcular reporte final de sesión
    if (recordedUserFrames.current.length > 5) {
      const targets = targetMelody.map((t) => ({
        ...t,
        frequency: t.frequency * Math.pow(2, transposition / 12),
        midi: t.midi + transposition,
      }));
      const score = calculateVocalScore(recordedUserFrames.current, targets as any);
      setSessionReport(score);
      setIsSessionFinished(true);
    }
  };

  // Detección por autocorrelación precisa para voces
  const autoCorrelate = (buf: Float32Array, sampleRate: number): { freq: number; confidence: number } | null => {
    let size = buf.length;
    let rms = 0;
    for (let i = 0; i < size; i++) {
      const val = buf[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / size);
    if (rms < 0.015) return null; // Silencio o piso de ruido

    let r1 = 0;
    let r2 = size - 1;
    const thres = 0.2;
    for (let i = 0; i < size / 2; i++) {
      if (Math.abs(buf[i]) < thres) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < size / 2; i++) {
      if (Math.abs(buf[size - i]) < thres) {
        r2 = size - i;
        break;
      }
    }

    buf = buf.slice(r1, r2);
    size = buf.length;

    const c = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size - i; j++) {
        c[i] = c[i] + buf[j] * buf[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1;
    let maxpos = -1;
    for (let i = d; i < size; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    let T0 = maxpos;

    if (T0 > 0 && maxval > 0.01) {
      const freq = sampleRate / T0;
      if (freq >= 65 && freq <= 1000) {
        // Rango de voz humana C2 a B5
        const confidence = Math.min(1.0, maxval / c[0]);
        return { freq, confidence };
      }
    }
    return null;
  };

  // Loop de renderizado y análisis a 60 FPS
  const startPitchDetectionLoop = () => {
    const buffer = new Float32Array(2048);

    const update = () => {
      if (!analyserRef.current || !audioContextRef.current) return;

      analyserRef.current.getFloatTimeDomainData(buffer);
      const result = autoCorrelate(buffer, audioContextRef.current.sampleRate);

      const currentTime = playbackTimeMs;

      if (result && result.confidence > 0.65) {
        const freq = result.freq;
        const midi = frequencyToMidi(freq);
        const note = midiToNoteName(midi);

        setCurrentFreq(Math.round(freq * 10) / 10);
        setCurrentMidi(Math.round(midi * 10) / 10);
        setCurrentNote(note);

        // Buscar target más cercano en el tiempo
        const target = targetMelody.find((t) => Math.abs(t.timeMs - currentTime) < 200);
        if (target && target.frequency > 0) {
          const shiftedTargetFreq = target.frequency * Math.pow(2, transposition / 12);
          const cents = calculateCentsDifference(freq, shiftedTargetFreq);
          setCentsDiff(Math.round(cents));
          setClassification(classifyPitchDeviation(cents));
        }

        recordedUserFrames.current.push({
          timeMs: currentTime,
          frequency: freq,
          midi,
          confidence: result.confidence,
        });
      } else {
        setCurrentFreq(null);
        setCurrentNote(null);
        setCentsDiff(null);
        setClassification(null);
      }

      drawDualPitchGraph();
      animationFrameRef.current = requestAnimationFrame(update);
    };

    update();
  };

  // Dibujar Canvas: Melodía Original vs Voz del Usuario
  const drawDualPitchGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Fondo estudio oscuro
    ctx.fillStyle = "#0f1422";
    ctx.fillRect(0, 0, width, height);

    // Rejilla de semitonos (MIDI 48 C3 a 72 C5)
    const minMidi = 48;
    const maxMidi = 72;
    const midiRange = maxMidi - minMidi;

    ctx.strokeStyle = "#1e2742";
    ctx.lineWidth = 1;
    for (let m = minMidi; m <= maxMidi; m += 2) {
      const y = height - ((m - minMidi) / midiRange) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.font = "10px monospace";
      ctx.fillText(midiToNoteName(m), 10, y - 3);
    }

    // Dibujar Melodía Original Objetivo (Línea Azul Eléctrico)
    if (targetMelody.length > 0) {
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 3;
      ctx.beginPath();
      let started = false;

      targetMelody.forEach((pt, i) => {
        const x = ((pt.timeMs % 20000) / 20000) * width; // Loop visual de 20s
        const effectiveMidi = pt.midi + transposition;
        const y = height - ((effectiveMidi - minMidi) / midiRange) * height;

        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Dibujar Melodía del Usuario en Vivo (Puntos/Traza Verde o Cian según afinación)
    const recentFrames = recordedUserFrames.current.slice(-60);
    if (recentFrames.length > 0) {
      recentFrames.forEach((frame) => {
        const x = ((frame.timeMs % 20000) / 20000) * width;
        const y = height - ((frame.midi - minMidi) / midiRange) * height;

        ctx.fillStyle = classification ? classification.color : "#10b981";
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  };

  useEffect(() => {
    return () => {
      stopMic();
    };
  }, []);

  return (
    <div className="bg-studio-surface border border-studio-border rounded-xl p-6 shadow-studio-card select-none space-y-6">
      {/* Header del Entrenador */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-studio-border">
        <div>
          <h3 className="text-base font-bold text-studio-text tracking-wide flex items-center gap-2">
            <Mic className="w-5 h-5 text-electric-400" />
            Entrenador Vocal en Vivo
          </h3>
          <p className="text-xs text-studio-dimmed mt-0.5">
            Compara tu afinación en tiempo real con la melodía original extraída.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMic}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              isMicActive
                ? "bg-pitch-outOfTune/20 text-pitch-outOfTune border border-pitch-outOfTune/40 animate-pulse"
                : "bg-electric-600 hover:bg-electric-500 text-white"
            }`}
          >
            {isMicActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isMicActive ? "Detener Práctica" : "Activar Micrófono"}</span>
          </button>
        </div>
      </div>

      {/* Métricas en Tiempo Real (Nota, Frecuencia, Cents) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-studio-elevated/70 border border-studio-border rounded-lg p-3">
          <span className="text-[10px] uppercase font-mono tracking-wider text-studio-dimmed">Tu Nota</span>
          <div className="text-xl font-black font-mono text-studio-text mt-0.5">
            {currentNote || "--"}
          </div>
        </div>

        <div className="bg-studio-elevated/70 border border-studio-border rounded-lg p-3">
          <span className="text-[10px] uppercase font-mono tracking-wider text-studio-dimmed">Frecuencia</span>
          <div className="text-xl font-bold font-mono text-studio-text mt-0.5">
            {currentFreq ? `${currentFreq} Hz` : "--"}
          </div>
        </div>

        <div className="bg-studio-elevated/70 border border-studio-border rounded-lg p-3">
          <span className="text-[10px] uppercase font-mono tracking-wider text-studio-dimmed">Desviación</span>
          <div
            className="text-xl font-black font-mono mt-0.5"
            style={{ color: classification ? classification.color : "#94a3b8" }}
          >
            {centsDiff !== null ? `${centsDiff > 0 ? "+" : ""}${centsDiff} c` : "--"}
          </div>
        </div>

        <div className="bg-studio-elevated/70 border border-studio-border rounded-lg p-3">
          <span className="text-[10px] uppercase font-mono tracking-wider text-studio-dimmed">Afinación</span>
          <div
            className="text-sm font-bold mt-1 uppercase"
            style={{ color: classification ? classification.color : "#94a3b8" }}
          >
            {classification ? classification.label : "Esperando voz..."}
          </div>
        </div>
      </div>

      {/* Canvas Gráfico Dual Pitch */}
      <div className="relative rounded-xl overflow-hidden border border-studio-borderHighlight bg-studio-bg shadow-inner">
        <canvas
          ref={canvasRef}
          width={720}
          height={240}
          className="w-full h-60 block cursor-crosshair"
        />

        {/* Leyenda overlay */}
        <div className="absolute top-3 right-3 flex items-center gap-4 bg-studio-surface/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-studio-border text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-electric-500 inline-block" />
            <span className="text-studio-muted">Original</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pitch-excellent inline-block" />
            <span className="text-studio-muted">Tu Voz</span>
          </div>
        </div>
      </div>

      {/* Resumen de Sesión si finalizó */}
      {isSessionFinished && sessionReport && (
        <div className="bg-studio-elevated border border-studio-borderHighlight rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-bold text-studio-text">Resumen de la Sesión</h4>
            </div>
            <span className="text-xl font-black font-mono text-electric-400">
              {sessionReport.overallScore} / 100
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-2.5 bg-studio-surface rounded-lg border border-studio-border text-center">
              <div className="text-studio-dimmed text-[10px]">AFINACIÓN</div>
              <div className="text-base font-bold text-pitch-excellent mt-0.5">
                {sessionReport.pitchScore}%
              </div>
            </div>
            <div className="p-2.5 bg-studio-surface rounded-lg border border-studio-border text-center">
              <div className="text-studio-dimmed text-[10px]">RITMO</div>
              <div className="text-base font-bold text-electric-400 mt-0.5">
                {sessionReport.rhythmScore}%
              </div>
            </div>
            <div className="p-2.5 bg-studio-surface rounded-lg border border-studio-border text-center">
              <div className="text-studio-dimmed text-[10px]">ESTABILIDAD</div>
              <div className="text-base font-bold text-violetStudio-400 mt-0.5">
                {sessionReport.stabilityScore}%
              </div>
            </div>
          </div>

          {sessionReport.problemSegments && sessionReport.problemSegments.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-studio-dimmed uppercase tracking-wider flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                Fragmentos a practicar
              </span>
              <div className="space-y-1.5">
                {sessionReport.problemSegments.map((seg: any, idx: number) => (
                  <div
                    key={idx}
                    className="text-xs p-2 rounded bg-studio-surface/80 border border-studio-border flex items-center justify-between text-studio-muted"
                  >
                    <span>Nota {seg.targetNote}</span>
                    <span className="text-studio-dimmed">{seg.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

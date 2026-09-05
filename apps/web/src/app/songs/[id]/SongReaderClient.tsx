"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CanonicalSong } from "@akhustico/shared";
import {
  calculateRealKey,
  calculateChordShapeKey,
  transposeChord,
} from "@akhustico/music-core";
import { LyricsViewer } from "@/components/reader/LyricsViewer";
import { ChordsModal } from "@/components/reader/ChordsModal";
import { StemMixer } from "@/components/audio/StemMixer";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Music,
  Minus,
  Plus,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  Sliders,
  Mic2,
  Home,
  Save,
  Check,
  RotateCcw,
} from "lucide-react";

interface Props {
  initialSong: CanonicalSong;
  allSongs: CanonicalSong[];
}

export function SongReaderClient({ initialSong, allSongs }: Props) {
  const router = useRouter();

  const [song, setSong] = useState<CanonicalSong>(initialSong);
  const [semitones, setSemitones] = useState(0);
  const [fontScale, setFontScale] = useState(initialSong.display?.fontScale || 1.0);
  const [showChords, setShowChords] = useState(initialSong.display?.showChords !== false);
  const [isAutoscrolling, setIsAutoscrolling] = useState(false);
  const [autoscrollSpeed, setAutoscrollSpeed] = useState(2);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChordsModalOpen, setIsChordsModalOpen] = useState(false);
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [showMixer, setShowMixer] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const autoscrollIntervalRef = useRef<any>(null);

  // Autoscroll suave
  useEffect(() => {
    if (isAutoscrolling) {
      autoscrollIntervalRef.current = setInterval(() => {
        window.scrollBy({ top: autoscrollSpeed, behavior: "smooth" });
      }, 50);
    } else if (autoscrollIntervalRef.current) {
      clearInterval(autoscrollIntervalRef.current);
    }
    return () => {
      if (autoscrollIntervalRef.current) clearInterval(autoscrollIntervalRef.current);
    };
  }, [isAutoscrolling, autoscrollSpeed]);

  // Pantalla completa
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Cálculo de canciones previa y siguiente en el repertorio
  const currentIndex = allSongs.findIndex((s) => s.id === song.id || s.slug === song.slug);
  const prevSong = currentIndex > 0 ? allSongs[currentIndex - 1] : null;
  const nextSong = currentIndex >= 0 && currentIndex < allSongs.length - 1 ? allSongs[currentIndex + 1] : null;

  // Cálculos armónicos con music-core
  const currentKey = transposeChord(song.music.preferredKey, semitones);
  const realKey = calculateRealKey(currentKey, song.music.capo);
  const chordShapeKey = calculateChordShapeKey(currentKey, song.music.capo);

  // Extraer todos los acordes de la canción
  const allSongChords: string[] = [];
  song.lyrics.sections?.forEach((s) => {
    s.lines?.forEach((l) => {
      l.chords?.forEach((c) => {
        const transposed = transposeChord(c.symbol, semitones);
        allSongChords.push(transposed);
      });
    });
  });

  // Guardar modificaciones manuales del usuario (prioridad sobre IA)
  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);
      await fetch(`/api/songs/${song.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          music: {
            ...song.music,
            preferredKey: currentKey,
            chordShapeKey: chordShapeKey,
          },
          display: {
            ...song.display,
            fontScale,
            showChords,
          },
        }),
      });
      setSaveSuccess(true);
      setSemitones(0); // El nuevo preferredKey ahora es la base
      setSong((prev) => ({
        ...prev,
        music: { ...prev.music, preferredKey: currentKey, chordShapeKey },
        display: { ...prev.display, fontScale, showChords },
      }));
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error("Error guardando preferencias:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-studio-bg select-none">
      {/* Header Fijo Especializado de Atril */}
      <header className="sticky top-0 z-30 bg-studio-surface/95 backdrop-blur-md border-b border-studio-border px-3 md:px-6 py-2.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          {/* Fila 1: Navegación Principal, Título, Artista y Botones Anterior/Siguiente/Inicio */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Botón Inicio */}
              <Link
                href="/library"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-studio-elevated hover:bg-studio-border text-studio-muted hover:text-studio-text text-xs font-semibold transition-colors"
                title="Volver a la Biblioteca (Inicio)"
              >
                <Home className="w-3.5 h-3.5 text-electric-400" />
                <span className="hidden sm:inline">Inicio</span>
              </Link>

              {/* Botón Anterior */}
              <button
                type="button"
                disabled={!prevSong}
                onClick={() => prevSong && router.push(`/songs/${prevSong.id}`)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  prevSong
                    ? "bg-studio-elevated hover:bg-studio-border text-studio-text cursor-pointer"
                    : "bg-studio-elevated/40 text-studio-dimmed cursor-not-allowed opacity-50"
                }`}
                title={prevSong ? `Anterior: ${prevSong.title}` : "Primera canción"}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              {/* Botón Siguiente */}
              <button
                type="button"
                disabled={!nextSong}
                onClick={() => nextSong && router.push(`/songs/${nextSong.id}`)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  nextSong
                    ? "bg-studio-elevated hover:bg-studio-border text-studio-text cursor-pointer"
                    : "bg-studio-elevated/40 text-studio-dimmed cursor-not-allowed opacity-50"
                }`}
                title={nextSong ? `Siguiente: ${nextSong.title}` : "Última canción"}
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Título y Artista */}
            <div className="flex-1 text-center min-w-0 px-2">
              <h1 className="text-base md:text-lg font-black text-studio-text tracking-wide truncate">
                {song.title}
              </h1>
              <p className="text-xs text-studio-muted font-medium truncate">{song.artist}</p>
            </div>

            {/* Acciones Rápidas (Guardar tono / Práctica / Fullscreen) */}
            <div className="flex items-center gap-1.5">
              {semitones !== 0 && (
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={isSaving}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 text-xs font-bold font-mono transition-colors"
                  title="Guardar este tono como mi tonalidad preferida"
                >
                  {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  <span className="hidden md:inline">{saveSuccess ? "Guardado" : "Fijar Tono"}</span>
                </button>
              )}

              <Link
                href={`/songs/${song.id}/practice`}
                className="p-1.5 rounded-lg bg-gradient-to-r from-violetStudio-600 to-electric-600 text-white hover:opacity-90 transition-opacity"
                title="Modo de práctica vocal"
              >
                <Mic2 className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg bg-studio-elevated border border-studio-border text-studio-muted hover:text-studio-text transition-colors"
                title="Pantalla completa"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Fila 2: Metadata Musical Separada + Controles de Atril */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-studio-border/60">
            {/* Conceptos Musicales Separados */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              <div className="px-2 py-0.5 rounded bg-studio-elevated border border-studio-border text-studio-text flex items-center gap-1">
                <span className="text-[10px] text-studio-dimmed uppercase">Tono real:</span>
                <span className="font-bold text-electric-400">{realKey}</span>
              </div>

              <div className="px-2 py-0.5 rounded bg-studio-elevated border border-studio-border text-studio-text flex items-center gap-1">
                <span className="text-[10px] text-studio-dimmed uppercase">Mi tono:</span>
                <span className="font-bold text-studio-text">{currentKey}</span>
              </div>

              <div className="px-2 py-0.5 rounded bg-studio-elevated border border-studio-border text-studio-text flex items-center gap-1">
                <span className="text-[10px] text-studio-dimmed uppercase">Forma:</span>
                <span className="font-bold text-studio-text">{chordShapeKey}</span>
              </div>

              <div className="px-2 py-0.5 rounded bg-studio-elevated border border-studio-border text-studio-text flex items-center gap-1">
                <span className="text-[10px] text-studio-dimmed uppercase">Capo:</span>
                <span className="font-bold text-violetStudio-400">{song.music.capo}</span>
              </div>

              <div className="px-2 py-0.5 rounded bg-studio-elevated border border-studio-border text-studio-text flex items-center gap-1">
                <span className="text-[10px] text-studio-dimmed uppercase">Afinación:</span>
                <span className="font-bold text-studio-text">{song.music.tuning || "E A D G B E"}</span>
              </div>

              <div className="px-2 py-0.5 rounded bg-studio-elevated border border-studio-border text-studio-text flex items-center gap-1">
                <span className="text-[10px] text-studio-dimmed uppercase">BPM:</span>
                <span className="font-bold text-studio-text">{Math.round(song.music.bpm)}</span>
              </div>
            </div>

            {/* Controles de Atril: Tono -/+, Texto -/+, Acordes, Autoscroll */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Tono - / Tono + */}
              <div className="flex items-center bg-studio-elevated border border-studio-border rounded-lg p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setSemitones((s) => s - 1)}
                  className="px-2 py-1 hover:bg-studio-border text-studio-muted hover:text-studio-text rounded flex items-center gap-0.5"
                  title="Tono -"
                >
                  <Minus className="w-3 h-3" />
                  <span>Tono</span>
                </button>
                <span className="px-2 font-bold text-electric-400">
                  {semitones > 0 ? `+${semitones}` : semitones}
                </span>
                <button
                  type="button"
                  onClick={() => setSemitones((s) => s + 1)}
                  className="px-2 py-1 hover:bg-studio-border text-studio-muted hover:text-studio-text rounded flex items-center gap-0.5"
                  title="Tono +"
                >
                  <span>Tono</span>
                  <Plus className="w-3 h-3" />
                </button>
                {semitones !== 0 && (
                  <button
                    type="button"
                    onClick={() => setSemitones(0)}
                    className="p-1 hover:bg-studio-border text-studio-dimmed hover:text-studio-text rounded"
                    title="Restablecer tonalidad original"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Texto - / Texto + */}
              <div className="flex items-center bg-studio-elevated border border-studio-border rounded-lg p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setFontScale((f) => Math.max(0.7, f - 0.1))}
                  className="px-2 py-1 hover:bg-studio-border text-studio-muted hover:text-studio-text rounded"
                  title="Texto -"
                >
                  Texto -
                </button>
                <span className="px-1.5 text-studio-dimmed font-medium">
                  {Math.round(fontScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setFontScale((f) => Math.min(2.5, f + 0.1))}
                  className="px-2 py-1 hover:bg-studio-border text-studio-muted hover:text-studio-text rounded"
                  title="Texto +"
                >
                  Texto +
                </button>
              </div>

              {/* Ver/Ocultar Acordes */}
              <button
                type="button"
                onClick={() => setShowChords(!showChords)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  showChords
                    ? "bg-studio-elevated border-studio-border text-electric-400"
                    : "bg-studio-elevated/40 border-studio-border text-studio-dimmed"
                }`}
                title={showChords ? "Ocultar acordes" : "Mostrar acordes"}
              >
                {showChords ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              {/* Modal de Diagramas de Acordes */}
              <button
                type="button"
                onClick={() => setIsChordsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-electric-600/20 border border-electric-500/40 text-electric-400 hover:bg-electric-600/30 text-xs font-bold font-mono transition-colors"
                title="Ver diagramas de guitarra de los acordes usados"
              >
                <Music className="w-3.5 h-3.5" />
                <span>Acordes</span>
              </button>

              {/* Autoscroll */}
              <div className="flex items-center bg-studio-elevated border border-studio-border rounded-lg p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setIsAutoscrolling(!isAutoscrolling)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    isAutoscrolling
                      ? "bg-pitch-inTune text-studio-bg font-bold animate-pulse"
                      : "text-studio-muted hover:text-studio-text"
                  }`}
                  title={isAutoscrolling ? "Detener autoscroll" : "Iniciar autoscroll continuo"}
                >
                  {isAutoscrolling ? "Pausar Scroll" : "Autoscroll"}
                </button>
                {isAutoscrolling && (
                  <div className="flex items-center border-l border-studio-border/60 pl-1 ml-1">
                    <button
                      type="button"
                      onClick={() => setAutoscrollSpeed((s) => Math.max(1, s - 1))}
                      className="px-1 py-0.5 text-studio-dimmed hover:text-studio-text"
                      title="Velocidad -"
                    >
                      -
                    </button>
                    <span className="px-1 text-electric-400 font-bold">{autoscrollSpeed}x</span>
                    <button
                      type="button"
                      onClick={() => setAutoscrollSpeed((s) => Math.min(8, s + 1))}
                      className="px-1 py-0.5 text-studio-dimmed hover:text-studio-text"
                      title="Velocidad +"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              {/* Mixer Desplegable */}
              <button
                type="button"
                onClick={() => setShowMixer(!showMixer)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  showMixer
                    ? "bg-violetStudio-600/20 border-violetStudio-500 text-violetStudio-400"
                    : "bg-studio-elevated border-studio-border text-studio-muted hover:text-studio-text"
                }`}
                title="Abrir mixer multi-stem de audio"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mixer Desplegable si está activo */}
      {showMixer && (
        <div className="max-w-4xl mx-auto w-full px-4 pt-4 animate-fade-in">
          <StemMixer
            stems={song.assets}
            masterAudioUrl={song.originalAudioUrl}
            bpm={song.music.bpm}
            onTimeUpdate={(t) => setCurrentTimeMs(t)}
          />
        </div>
      )}

      {/* Visor Central de Letra y Cifrado */}
      <main className="flex-1 py-8 pb-32 md:pb-16 max-w-4xl mx-auto w-full px-4">
        <LyricsViewer
          lyrics={song.lyrics}
          semitones={semitones}
          showChords={showChords}
          fontScale={fontScale}
          onChordClick={(c) => {
            setSelectedChord(c);
            setIsChordsModalOpen(true);
          }}
        />
      </main>

      {/* Barra Inferior Fija para Móvil */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-studio-surface/95 backdrop-blur-lg border-t border-studio-border z-40 flex items-center justify-around px-3 select-none">
        <button
          type="button"
          disabled={!prevSong}
          onClick={() => prevSong && router.push(`/songs/${prevSong.id}`)}
          className={`p-2 ${prevSong ? "text-studio-text" : "text-studio-dimmed opacity-40"}`}
          title="Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <Link href="/library" className="p-2 text-studio-muted hover:text-studio-text" title="Inicio">
          <Home className="w-5 h-5" />
        </Link>

        <button
          type="button"
          onClick={() => setIsChordsModalOpen(true)}
          className="flex flex-col items-center text-[10px] font-bold text-electric-400"
          title="Acordes"
        >
          <Music className="w-5 h-5" />
          <span>ACORDES</span>
        </button>

        <button
          type="button"
          onClick={() => setSemitones((s) => (s >= 6 ? -6 : s + 1))}
          className="flex flex-col items-center text-[10px] font-bold text-studio-text font-mono"
          title="Transponer"
        >
          <span className="text-sm font-bold text-electric-400">{currentKey}</span>
          <span>TONO</span>
        </button>

        <button
          type="button"
          disabled={!nextSong}
          onClick={() => nextSong && router.push(`/songs/${nextSong.id}`)}
          className={`p-2 ${nextSong ? "text-studio-text" : "text-studio-dimmed opacity-40"}`}
          title="Siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Modal de Diagramas de Acordes */}
      <ChordsModal
        isOpen={isChordsModalOpen}
        onClose={() => {
          setIsChordsModalOpen(false);
          setSelectedChord(null);
        }}
        chords={allSongChords}
        selectedChord={selectedChord}
      />
    </div>
  );
}

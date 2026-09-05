"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { put } from "@vercel/blob/client";
import {
  UploadCloud,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  FileText,
  Music,
} from "lucide-react";

export default function NewSongPage() {
  const router = useRouter();
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const [activeTab, setActiveTab] = useState<"audio" | "legacy">("audio");

  // Estados Paso 1: Archivo
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  // Estados Paso 2: Metadatos
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [language, setLanguage] = useState("es");

  // Estados Paso 3: Opciones de Procesamiento
  const [options, setOptions] = useState({
    separateStems: true,
    transcribeLyrics: true,
    detectChords: true,
    detectBpm: true,
    detectKey: true,
    extractMelody: true,
  });

  // Estados de Importación Legacy
  const [legacyText, setLegacyText] = useState("");
  const [legacyLoading, setLegacyLoading] = useState(false);
  const [legacyError, setLegacyError] = useState<string | null>(null);

  const allowedExtensions = [".mp3", ".wav", ".m4a", ".flac", ".aac", ".ogg"];

  const handleFileSelect = (selectedFile: File) => {
    setFileError(null);
    const ext = "." + selectedFile.name.split(".").pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setFileError(`Formato no permitido (${ext}). Usa MP3, WAV, M4A, FLAC, AAC u OGG.`);
      return;
    }

    if (selectedFile.size > 150 * 1024 * 1024) {
      setFileError("El archivo supera el límite de 150 MB.");
      return;
    }

    setFile(selectedFile);

    // Deducir título y artista del nombre de archivo (ej. "Artista - Titulo.mp3")
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
    if (baseName.includes(" - ")) {
      const parts = baseName.split(" - ");
      setArtist(parts[0].trim());
      setTitle(parts.slice(1).join(" - ").trim());
    } else {
      setTitle(baseName);
      if (!artist) setArtist("Artista Desconocido");
    }
  };

  // Calcular hash SHA-256 en cliente para deduplicación (Sección 80)
  const calculateSha256 = async (blob: Blob): Promise<string> => {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleAnalyzeSong = async () => {
    if (!title.trim() || !artist.trim()) {
      alert("Por favor completa el título y el artista.");
      return;
    }

    setIsUploading(true);
    setUploadStatus("Calculando hash SHA-256...");
    setUploadProgress(10);

    try {
      let audioHash = `hash-${Date.now()}`;
      if (file) {
        audioHash = await calculateSha256(file);
      }

      setUploadProgress(30);
      setUploadStatus("Preparando subida de audio...");

      // 1. Obtener token de carga a Vercel Blob
      const pathname = `songs/${Date.now()}-${file?.name || "audio.mp3"}`;
      const tokenRes = await fetch("/api/upload/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathname }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenData.error || "No se pudo preparar Vercel Blob");

      let audioUrl =
        tokenData.mockUploadUrl ||
        "https://assets.mixkit.co/music/preview/mixkit-guitar-acoustic-happy-energy-1111.mp3";

      if (!tokenData.simulated && file) {
        abortControllerRef.current = new AbortController();
        setUploadStatus("Subiendo audio directo a Vercel Blob...");
        const uploaded = await put(pathname, file, {
          access: "public",
          token: tokenData.clientToken,
          multipart: file.size > 8 * 1024 * 1024,
          contentType: file.type || "application/octet-stream",
          abortSignal: abortControllerRef.current.signal,
          onUploadProgress: ({ percentage }) => {
            setUploadProgress(30 + Math.round(percentage * 0.35));
          },
        });
        audioUrl = uploaded.url;
      }

      setUploadProgress(60);
      setUploadStatus(tokenData.simulated ? "Modo demo: usando audio simulado..." : "Registrando metadata...");

      // 2. Registrar la canción
      const songRes = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          artist,
          album,
          language,
          audioHash,
          originalAudioUrl: audioUrl,
        }),
      });

      if (!songRes.ok) {
        const errJson = await songRes.json();
        if (songRes.status === 409) {
          alert(`Esta pista ya existe en tu cancionero: ${errJson.song?.title}`);
          router.push(`/songs/${errJson.song?.id}`);
          return;
        }
        throw new Error(errJson.error || "Error creando canción");
      }

      const { data: newSong } = await songRes.json();
      setUploadProgress(85);
      setUploadStatus("Creando job de analisis...");

      // 3. Despachar trabajo de análisis asíncrono
      const processRes = await fetch(`/api/songs/${newSong.id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });

      const { data: job } = await processRes.json();
      setUploadProgress(100);
      setUploadStatus("Listo");

      // Redirigir a la pantalla de procesamiento sin bloquear
      router.push(`/jobs/${job.id}`);
    } catch (err: any) {
      alert(err.message || "Error procesando el archivo");
      setIsUploading(false);
      setUploadStatus("");
    }
  };

  // Importar Cancionero Legacy
  const handleImportLegacy = async () => {
    if (!legacyText.trim()) return;
    setLegacyLoading(true);
    setLegacyError(null);

    try {
      const res = await fetch("/api/songs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: legacyText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al importar");

      router.push(`/songs/${data.data.id}`);
    } catch (e: any) {
      setLegacyError(e.message);
    } finally {
      setLegacyLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader title="Nueva Canción" subtitle="Importación a tu cancionero personal" />

      <div className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-8">
        {/* Selector de modo: Subir Audio vs Importar Cancionero Legacy */}
        <div className="flex items-center gap-2 p-1 bg-studio-surface border border-studio-border rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("audio")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === "audio"
                ? "bg-electric-600 text-white shadow-sm"
                : "text-studio-muted hover:text-studio-text"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Subir Audio y Analizar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("legacy")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === "legacy"
                ? "bg-violetStudio-600 text-white shadow-sm"
                : "text-studio-muted hover:text-studio-text"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Importar JSON / ChordPro Antiguo</span>
          </button>
        </div>

        {activeTab === "audio" ? (
          <div className="space-y-6">
            {/* PASO 1: Archivo de Audio */}
            <div className="bg-studio-surface border border-studio-border rounded-2xl p-6 shadow-studio-card space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider font-bold text-electric-400">
                <span>Paso 1</span>
                <span className="text-studio-dimmed">•</span>
                <span>Seleccionar Archivo</span>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
                }}
                className="border-2 border-dashed border-studio-border hover:border-electric-500/60 rounded-xl p-8 text-center transition-colors bg-studio-bg/40 flex flex-col items-center justify-center cursor-pointer"
                onClick={() => document.getElementById("audio-file-input")?.click()}
              >
                <input
                  id="audio-file-input"
                  type="file"
                  accept=".mp3,.wav,.m4a,.flac,.aac,.ogg,audio/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-studio-elevated border border-studio-border flex items-center justify-center text-electric-400 mb-3 shadow-inner">
                  <UploadCloud className="w-7 h-7" />
                </div>

                <p className="text-sm font-bold text-studio-text">
                  {file ? file.name : "Arrastra tu pista musical aquí o haz clic para buscar"}
                </p>
                <p className="text-xs text-studio-dimmed mt-1">
                  Formatos soportados: MP3, WAV, M4A, FLAC, AAC, OGG (hasta 150 MB)
                </p>
              </div>

              {fileError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-pitch-outOfTune/10 border border-pitch-outOfTune/30 text-pitch-outOfTune text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}
            </div>

            {/* PASO 2: Metadatos */}
            <div className="bg-studio-surface border border-studio-border rounded-2xl p-6 shadow-studio-card space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider font-bold text-electric-400">
                <span>Paso 2</span>
                <span className="text-studio-dimmed">•</span>
                <span>Metadatos de la Canción</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-studio-muted mb-1.5">Título *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. De Música Ligera"
                    className="w-full bg-studio-elevated border border-studio-border rounded-lg px-3.5 py-2 text-sm text-studio-text focus:outline-none focus:border-electric-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-studio-muted mb-1.5">Artista *</label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Ej. Soda Stereo"
                    className="w-full bg-studio-elevated border border-studio-border rounded-lg px-3.5 py-2 text-sm text-studio-text focus:outline-none focus:border-electric-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-studio-muted mb-1.5">Álbum (opcional)</label>
                  <input
                    type="text"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    placeholder="Ej. Canción Animal"
                    className="w-full bg-studio-elevated border border-studio-border rounded-lg px-3.5 py-2 text-sm text-studio-text focus:outline-none focus:border-electric-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-studio-muted mb-1.5">Idioma</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    aria-label="Idioma de la canción"
                    className="w-full bg-studio-elevated border border-studio-border rounded-lg px-3.5 py-2 text-sm text-studio-text focus:outline-none focus:border-electric-500"
                  >
                    <option value="es">Español</option>
                    <option value="en">Inglés</option>
                    <option value="pt">Portugués</option>
                    <option value="it">Italiano</option>
                    <option value="fr">Francés</option>
                  </select>
                </div>
              </div>
            </div>

            {/* PASO 3: Opciones de Procesamiento */}
            <div className="bg-studio-surface border border-studio-border rounded-2xl p-6 shadow-studio-card space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider font-bold text-electric-400">
                <span>Paso 3</span>
                <span className="text-studio-dimmed">•</span>
                <span>Procesamiento Deseado</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "separateStems", label: "Separar Stems (Voz, Bajo, Batería...)", desc: "Aisla pistas con BS-RoFormer" },
                  { key: "transcribeLyrics", label: "Transcribir Letra Sincronizada", desc: "Alineación temporal con Whisper" },
                  { key: "detectChords", label: "Detectar Acordes Armónicos", desc: "Cifrado por compás sobre el instrumental" },
                  { key: "detectBpm", label: "Detectar BPM y Pulsos", desc: "Tempo exacto para metrónomo y loops" },
                  { key: "detectKey", label: "Detectar Tonalidad Musical", desc: "Escala base y tónica de la canción" },
                  { key: "extractMelody", label: "Extraer Melodía Vocal F0", desc: "Curva continua para práctica de afinación" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start gap-3 p-3 rounded-xl bg-studio-elevated/60 border border-studio-border hover:border-studio-borderHighlight cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={(options as any)[item.key]}
                      onChange={(e) =>
                        setOptions((prev) => ({ ...prev, [item.key]: e.target.checked }))
                      }
                      className="mt-1 w-4 h-4 rounded border-studio-border text-electric-600 focus:ring-electric-500 bg-studio-bg"
                    />
                    <div>
                      <div className="text-xs font-bold text-studio-text">{item.label}</div>
                      <div className="text-[11px] text-studio-dimmed">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* PASO 4: Botón de Acción Principal */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <Link
                href="/library"
                className="px-5 py-2.5 rounded-xl border border-studio-border text-studio-muted hover:text-studio-text text-sm font-semibold transition-colors"
              >
                Cancelar
              </Link>

              <button
                type="button"
                disabled={isUploading}
                onClick={handleAnalyzeSong}
                className="flex items-center gap-2 bg-gradient-to-r from-electric-600 to-electric-500 hover:from-electric-500 hover:to-electric-400 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-studio-glow transition-all active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isUploading ? `Analizando (${uploadProgress}%)...` : "ANALIZAR CANCIÓN"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Pestaña: Importar Cancionero Legacy */
          <div className="bg-studio-surface border border-studio-border rounded-2xl p-6 shadow-studio-card space-y-4">
            <div>
              <h3 className="text-base font-bold text-studio-text">Importar Cancionero Anterior</h3>
              <p className="text-xs text-studio-muted mt-1">
                Pega el contenido JSON de tu cancionero previo o texto en formato ChordPro ([G]Letra).
                El importador normalizará tonos, secciones y cejilla automáticamente.
              </p>
            </div>

            <textarea
              rows={12}
              value={legacyText}
              onChange={(e) => setLegacyText(e.target.value)}
              placeholder={`{\n  "titulo": "Mi Canción",\n  "artista": "Autor",\n  "tono": "G",\n  "letra": "[G]Hace frío y estoy [D]lejos de casa"\n}`}
              className="w-full bg-studio-elevated border border-studio-border rounded-xl p-4 text-xs font-mono text-studio-text focus:outline-none focus:border-violetStudio-500"
            />

            {legacyError && (
              <div className="p-3 rounded-lg bg-pitch-outOfTune/10 border border-pitch-outOfTune/30 text-pitch-outOfTune text-xs">
                {legacyError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={legacyLoading || !legacyText.trim()}
                onClick={handleImportLegacy}
                className="flex items-center gap-2 bg-violetStudio-600 hover:bg-violetStudio-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                <span>{legacyLoading ? "Importando..." : "Importar a Mi Cancionero"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

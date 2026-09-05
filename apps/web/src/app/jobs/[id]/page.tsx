"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { ProcessingJob } from "@akhustico/shared";
import { Activity, AlertCircle, ArrowRight, CheckCircle2, Clock } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

const terminalStatuses = new Set(["completed", "failed", "cancelled", "partial"]);

const pipelineStages = [
  { key: "queued", label: "En espera" },
  { key: "preparing", label: "Preparando recursos" },
  { key: "normalizing", label: "Normalizando audio" },
  { key: "separating", label: "Separando instrumentos y stems" },
  { key: "transcribing", label: "Transcribiendo letra" },
  { key: "detecting_bpm", label: "Detectando BPM" },
  { key: "detecting_key", label: "Detectando tonalidad" },
  { key: "detecting_chords", label: "Reconociendo acordes" },
  { key: "extracting_melody", label: "Extrayendo melodia vocal" },
  { key: "building_songbook", label: "Generando cancionero" },
  { key: "completed", label: "Completado" },
];

export default function ProcessingJobPage({ params }: PageProps) {
  const { id } = use(params);
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    const pollJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          const nextJob = json.data as ProcessingJob;
          setJob(nextJob);
          setError(null);
          setLoading(false);

          if (terminalStatuses.has(nextJob.status)) {
            if (interval) clearInterval(interval);
          }
          return;
        }

        if (res.status === 404) {
          const json = await res.json().catch(() => ({}));
          setError(json.error || "Job no encontrado");
          setLoading(false);
          if (interval) clearInterval(interval);
          return;
        }

        throw new Error(`HTTP ${res.status}`);
      } catch (e) {
        console.error("Error consultando job:", e);
        setError("No se pudo consultar el estado del job.");
        setLoading(false);
        if (interval) clearInterval(interval);
      }
    };

    void pollJob();
    interval = setInterval(pollJob, 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id]);

  const getStageStatus = (stageKey: string) => {
    if (!job) return "waiting";
    const stageOrder = pipelineStages.map((s) => s.key);
    const currentIndex = stageOrder.indexOf(job.stage);
    const targetIndex = stageOrder.indexOf(stageKey);

    if (job.status === "completed") return "completed";
    if (job.status === "failed") return targetIndex === currentIndex ? "failed" : "waiting";
    if (job.status === "cancelled") return targetIndex <= currentIndex ? "cancelled" : "waiting";
    if (targetIndex < currentIndex) return "completed";
    if (targetIndex === currentIndex) return "in_progress";
    return "waiting";
  };

  const title =
    job?.status === "completed"
      ? "Analisis musical completado"
      : job?.status === "failed"
        ? "Analisis fallido"
        : job?.status === "cancelled"
          ? "Analisis cancelado"
          : "Procesando cancion";

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader title="Analisis en segundo plano" subtitle={`Tarea de procesamiento #${id}`} />

      <div className="p-6 md:p-8 max-w-3xl mx-auto w-full space-y-8">
        <div className="bg-studio-surface border border-studio-border rounded-2xl p-6 shadow-studio-card space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-electric-600/20 border border-electric-500/30 flex items-center justify-center text-electric-400">
                {error || job?.status === "failed" ? (
                  <AlertCircle className="w-5 h-5 text-pitch-outOfTune" />
                ) : job?.status === "completed" ? (
                  <CheckCircle2 className="w-5 h-5 text-pitch-excellent" />
                ) : (
                  <Activity className="w-5 h-5 animate-spin" />
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-studio-text">{title}</h2>
                <p className="text-xs text-studio-muted">
                  {loading
                    ? "Consultando estado..."
                    : terminalStatuses.has(job?.status || "")
                      ? "El proceso ya no esta en ejecucion."
                      : "Puedes abandonar esta pagina; el proceso continua en segundo plano."}
                </p>
              </div>
            </div>

            <span className="text-lg font-black font-mono text-electric-400">
              {job ? `${job.progress}%` : "0%"}
            </span>
          </div>

          {error && (
            <div className="rounded-xl border border-pitch-outOfTune/40 bg-pitch-outOfTune/10 p-4 text-sm text-studio-text">
              <div className="flex items-center gap-2 font-bold text-pitch-outOfTune">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={job?.songId ? `/songs/${job.songId}` : "/library"}
                  className="rounded-lg border border-studio-border bg-studio-elevated px-4 py-2 text-xs font-bold text-studio-text hover:border-electric-500/50"
                >
                  Volver a cancion
                </Link>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-lg bg-electric-600 px-4 py-2 text-xs font-bold text-white hover:bg-electric-500"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          <div className="w-full h-2 bg-studio-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-electric-600 to-violetStudio-500 transition-all duration-500"
              style={{ width: `${job?.progress || 0}%` }}
            />
          </div>
        </div>

        <div className="bg-studio-surface border border-studio-border rounded-2xl p-6 shadow-studio-card space-y-4">
          <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-studio-muted">
            Etapas del pipeline
          </h3>

          <div className="space-y-3">
            {pipelineStages.map((st) => {
              const status = getStageStatus(st.key);

              return (
                <div
                  key={st.key}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-mono transition-colors ${
                    status === "completed"
                      ? "bg-studio-elevated/40 border-studio-border text-studio-text"
                      : status === "in_progress"
                        ? "bg-electric-600/10 border-electric-500/40 text-electric-400 font-bold"
                        : status === "failed"
                          ? "bg-pitch-outOfTune/10 border-pitch-outOfTune/40 text-pitch-outOfTune"
                          : "bg-studio-bg/40 border-studio-border/50 text-studio-dimmed"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {status === "completed" && (
                      <CheckCircle2 className="w-4 h-4 text-pitch-excellent flex-shrink-0" />
                    )}
                    {status === "in_progress" && (
                      <Activity className="w-4 h-4 text-electric-400 animate-spin flex-shrink-0" />
                    )}
                    {status === "waiting" && (
                      <Clock className="w-4 h-4 text-studio-dimmed flex-shrink-0" />
                    )}
                    {status === "failed" && (
                      <AlertCircle className="w-4 h-4 text-pitch-outOfTune flex-shrink-0" />
                    )}
                    <span>{st.label}</span>
                  </div>

                  <span className="text-[11px] uppercase">
                    {status === "completed" && "Listo"}
                    {status === "in_progress" && "Analizando"}
                    {status === "waiting" && "En espera"}
                    {status === "failed" && "Error"}
                    {status === "cancelled" && "Cancelado"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {job?.status === "completed" && (
          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
            <div>
              <h4 className="text-sm font-bold text-emerald-400">Cancion lista en el cancionero</h4>
              <p className="text-xs text-studio-muted mt-0.5">
                Los resultados del pipeline demo quedaron integrados.
              </p>
            </div>

            <Link
              href={job.songId ? `/songs/${job.songId}` : "/library"}
              className="flex items-center gap-2 bg-pitch-excellent hover:bg-emerald-400 text-studio-bg font-bold text-xs px-5 py-2.5 rounded-xl transition-colors"
            >
              <span>Abrir en atril</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

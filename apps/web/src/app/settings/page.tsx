"use client";

import React, { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Settings, Sliders, Mic, Music, HardDrive, Cpu, Check } from "lucide-react";

export default function SettingsPage() {
  const [pitchTolerance, setPitchTolerance] = useState(25);
  const [preferFlats, setPreferFlats] = useState(false);
  const [latencyOffset, setLatencyOffset] = useState(0);
  const [recordPracticeAudio, setRecordPracticeAudio] = useState(false);
  const [stemProfile, setStemProfile] = useState("BALANCED");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader title="Configuración" subtitle="Preferencias personales de AKHUSTICO Studio" />

      <div className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-8">
        {/* Sección: Vocal Coach */}
        <div className="bg-studio-surface border border-studio-border rounded-2xl p-6 shadow-studio-card space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-studio-border">
            <Mic className="w-5 h-5 text-electric-400" />
            <h3 className="text-base font-bold text-studio-text">Entrenador Vocal & Afinación</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-studio-muted">
                  Tolerancia de Afinación (Cents)
                </label>
                <span className="text-xs font-mono font-bold text-electric-400">
                  ±{pitchTolerance} cents
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                value={pitchTolerance}
                onChange={(e) => setPitchTolerance(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-studio-elevated rounded-lg appearance-none cursor-pointer accent-electric-500"
              />
              <p className="text-[11px] text-studio-dimmed mt-1">
                Ajusta qué tan exigente es el coach al calificar una nota como afinada.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-studio-muted block mb-1.5">
                Compensación de Latencia de Micrófono (ms)
              </label>
              <input
                type="number"
                value={latencyOffset}
                onChange={(e) => setLatencyOffset(parseInt(e.target.value, 10))}
                className="w-32 bg-studio-elevated border border-studio-border rounded-lg px-3 py-1.5 text-xs font-mono text-studio-text focus:outline-none focus:border-electric-500"
              />
            </div>
          </div>
        </div>

        {/* Sección: Notación Musical */}
        <div className="bg-studio-surface border border-studio-border rounded-2xl p-6 shadow-studio-card space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-studio-border">
            <Music className="w-5 h-5 text-violetStudio-400" />
            <h3 className="text-base font-bold text-studio-text">Teoría & Notación Musical</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-studio-text">Preferencia Enarmónica</span>
                <p className="text-[11px] text-studio-dimmed">
                  Elige si prefieres sostenidos (C#, F#) o bemoles (Db, Gb) por defecto al transponer.
                </p>
              </div>
              <div className="flex items-center bg-studio-elevated border border-studio-border rounded-lg p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setPreferFlats(false)}
                  className={`px-3 py-1.5 rounded ${!preferFlats ? "bg-electric-600 text-white font-bold" : "text-studio-muted"}`}
                >
                  Sostenidos (#)
                </button>
                <button
                  type="button"
                  onClick={() => setPreferFlats(true)}
                  className={`px-3 py-1.5 rounded ${preferFlats ? "bg-violetStudio-600 text-white font-bold" : "text-studio-muted"}`}
                >
                  Bemoles (b)
                </button>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-studio-text block mb-1">Afinación por Defecto de Guitarra</span>
              <span className="text-xs font-mono text-studio-muted bg-studio-elevated px-2.5 py-1 rounded border border-studio-border inline-block">
                E A D G B E (Estándar 440 Hz)
              </span>
            </div>
          </div>
        </div>

        {/* Sección: Almacenamiento & Privacidad (Sección 40 & 81) */}
        <div className="bg-studio-surface border border-studio-border rounded-2xl p-6 shadow-studio-card space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-studio-border">
            <HardDrive className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-studio-text">Almacenamiento & Grabación</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-studio-text">Guardar Grabaciones de Voz</span>
              <p className="text-[11px] text-studio-dimmed">
                Por privacidad y ahorro de espacio en Blob, las grabaciones de voz de práctica están desactivadas por defecto.
              </p>
            </div>
            <input
              type="checkbox"
              checked={recordPracticeAudio}
              onChange={(e) => setRecordPracticeAudio(e.target.checked)}
              className="w-4 h-4 text-electric-600 rounded border-studio-border bg-studio-bg cursor-pointer"
            />
          </div>
        </div>

        {/* Sección: Motor de Audio Worker */}
        <div className="bg-studio-surface border border-studio-border rounded-2xl p-6 shadow-studio-card space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-studio-border">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-studio-text">Perfil de Separación de Stems</h3>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-studio-muted block">Perfil Predeterminado</label>
            <select
              value={stemProfile}
              onChange={(e) => setStemProfile(e.target.value)}
              className="w-full bg-studio-elevated border border-studio-border rounded-lg px-3.5 py-2 text-sm text-studio-text focus:outline-none focus:border-electric-500"
            >
              <option value="FAST">Rápido (2 Stems: Voz + Instrumental)</option>
              <option value="BALANCED">Balanceado (4 Stems: Voz, Batería, Bajo, Otros)</option>
              <option value="HIGH_QUALITY">Alta Calidad (6 Stems: Voz, Guitarra, Piano, Bajo, Batería, Otros)</option>
            </select>
          </div>
        </div>

        {/* Guardar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="text-xs font-bold text-pitch-excellent flex items-center gap-1">
              <Check className="w-4 h-4" /> Ajustes guardados
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-sm transition-colors"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { CanonicalSong, LyricsData } from "@akhustico/shared";
import { ArrowLeft, Check, Copy, Plus, Save, Trash2 } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

const tabs = ["GENERAL", "LETRA Y CIFRADO", "AUDIO", "MELODIA", "METADATOS"] as const;
const sectionTypes = ["intro", "verse", "pre_chorus", "chorus", "bridge", "solo", "instrumental", "outro", "other"];

function lyricsToChordPro(lyrics: LyricsData) {
  return lyrics.sections
    .map((section) => [
      `[${section.label || section.type}]`,
      ...section.lines.map((line) => {
        const chars = line.text.split("");
        const chords = [...(line.chords || [])].sort((a, b) => b.charIndex - a.charIndex);
        for (const chord of chords) {
          chars.splice(Math.max(0, chord.charIndex), 0, `[${chord.symbol}]`);
        }
        return chars.join("");
      }),
    ].join("\n"))
    .join("\n\n");
}

function chordProToLyrics(text: string): LyricsData {
  const sections: LyricsData["sections"] = [];
  let current = { type: "verse" as const, label: "Verso", lines: [] as LyricsData["sections"][number]["lines"] };

  for (const rawLine of text.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    const sectionMatch = trimmed.match(/^\[(.+)]$/);
    if (sectionMatch && !sectionMatch[1].match(/[A-G](#|b)?/)) {
      if (current.lines.length) sections.push(current);
      current = { type: "verse", label: sectionMatch[1], lines: [] };
      continue;
    }

    let plain = "";
    const chords: { symbol: string; charIndex: number }[] = [];
    const regex = /\[([^\]]+)]|([^\[]+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(rawLine))) {
      if (match[1]) chords.push({ symbol: match[1], charIndex: plain.length });
      if (match[2]) plain += match[2];
    }

    if (plain.trim() || chords.length) current.lines.push({ text: plain, chords });
  }

  if (current.lines.length || sections.length === 0) sections.push(current);
  return { sections, rawChordPro: text };
}

export default function SongEditPage({ params }: PageProps) {
  const { id } = use(params);
  const [song, setSong] = useState<CanonicalSong | null>(null);
  const [draft, setDraft] = useState<CanonicalSong | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("GENERAL");
  const [saveState, setSaveState] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");
  const [textMode, setTextMode] = useState("");

  useEffect(() => {
    fetch(`/api/songs/${id}`)
      .then((r) => r.json())
      .then((json) => {
        setSong(json.data);
        setDraft(json.data);
        setTextMode(lyricsToChordPro(json.data.lyrics));
      });
  }, [id]);

  useEffect(() => {
    if (!draft || saveState !== "dirty") return;
    const timer = setTimeout(async () => {
      setSaveState("saving");
      const res = await fetch(`/api/songs/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      setSaveState(res.ok ? "saved" : "error");
      if (res.ok) setSong(draft);
    }, 700);
    return () => clearTimeout(timer);
  }, [draft, saveState]);

  const visualLines = useMemo(() => {
    if (!draft) return [];
    return draft.lyrics.sections.flatMap((section) =>
      section.lines.map((line) => ({ section: section.label, line }))
    );
  }, [draft]);

  const updateDraft = (updates: Partial<CanonicalSong>) => {
    setDraft((prev) => (prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : prev));
    setSaveState("dirty");
  };

  if (!draft) {
    return <div className="flex-1 p-8 text-studio-muted font-mono">Cargando editor...</div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader title={`Editar: ${draft.title}`} subtitle="Cambios manuales con autosave" />
      <main className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={`/songs/${draft.id}`} className="flex items-center gap-2 text-sm text-studio-muted hover:text-studio-text">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono">
            {saveState === "dirty" && <span className="text-amber-400">Cambios sin guardar</span>}
            {saveState === "saving" && <span className="text-electric-400">Guardando...</span>}
            {saveState === "saved" && <span className="text-pitch-excellent flex items-center gap-1"><Check className="h-3 w-3" /> Guardado</span>}
            {saveState === "error" && <span className="text-pitch-outOfTune">Error</span>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-studio-border pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${activeTab === tab ? "bg-electric-600 text-white" : "bg-studio-surface text-studio-muted"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "GENERAL" && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ["title", "Titulo"],
              ["artist", "Artista"],
              ["album", "Album"],
              ["language", "Idioma"],
            ].map(([key, label]) => (
              <label key={key} className="space-y-1 text-xs font-bold text-studio-muted">
                {label}
                <input
                  value={(draft as any)[key] || ""}
                  onChange={(e) => updateDraft({ [key]: e.target.value } as any)}
                  className="w-full rounded-lg border border-studio-border bg-studio-surface px-3 py-2 text-sm text-studio-text"
                />
              </label>
            ))}
            {[
              ["originalKey", "Tono original"],
              ["preferredKey", "Tono preferido"],
              ["chordShapeKey", "Forma"],
              ["tuning", "Afinacion"],
              ["timeSignature", "Compas"],
            ].map(([key, label]) => (
              <label key={key} className="space-y-1 text-xs font-bold text-studio-muted">
                {label}
                <input
                  value={(draft.music as any)[key] || ""}
                  onChange={(e) => updateDraft({ music: { ...draft.music, [key]: e.target.value } })}
                  className="w-full rounded-lg border border-studio-border bg-studio-surface px-3 py-2 text-sm text-studio-text"
                />
              </label>
            ))}
            <label className="space-y-1 text-xs font-bold text-studio-muted">
              BPM
              <input
                type="number"
                value={draft.music.bpm}
                onChange={(e) => updateDraft({ music: { ...draft.music, bpm: Number(e.target.value) } })}
                className="w-full rounded-lg border border-studio-border bg-studio-surface px-3 py-2 text-sm text-studio-text"
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-studio-muted">
              Capo
              <input
                type="number"
                min={0}
                max={12}
                value={draft.music.capo}
                onChange={(e) => updateDraft({ music: { ...draft.music, capo: Number(e.target.value) } })}
                className="w-full rounded-lg border border-studio-border bg-studio-surface px-3 py-2 text-sm text-studio-text"
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-studio-muted md:col-span-2">
              Tags
              <input
                value={draft.tags.join(", ")}
                onChange={(e) => updateDraft({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                className="w-full rounded-lg border border-studio-border bg-studio-surface px-3 py-2 text-sm text-studio-text"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-studio-text">
              <input type="checkbox" checked={draft.isFavorite} onChange={(e) => updateDraft({ isFavorite: e.target.checked })} />
              Favorito
            </label>
          </section>
        )}

        {activeTab === "LETRA Y CIFRADO" && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-3">
              <textarea
                value={textMode}
                onChange={(e) => {
                  setTextMode(e.target.value);
                  updateDraft({ lyrics: chordProToLyrics(e.target.value) });
                }}
                rows={22}
                className="w-full rounded-xl border border-studio-border bg-studio-surface p-4 font-mono text-sm text-studio-text"
              />
              <button
                type="button"
                onClick={() => {
                  const next = `${textMode}\n\n[Coro]\n[G]Nueva linea`;
                  setTextMode(next);
                  updateDraft({ lyrics: chordProToLyrics(next) });
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-electric-600 px-3 py-2 text-xs font-bold text-white"
              >
                <Plus className="h-4 w-4" />
                Crear seccion
              </button>
            </div>
            <div className="space-y-3 rounded-xl border border-studio-border bg-studio-surface p-4">
              {visualLines.map(({ section, line }, index) => (
                <div key={index} className="rounded-lg border border-studio-border bg-studio-bg p-3">
                  <div className="mb-2 text-[10px] font-bold uppercase text-electric-400">{section}</div>
                  <div className="relative min-h-12 font-mono">
                    <div className="h-5 whitespace-pre text-xs text-electric-400">
                      {line.chords.map((chord) => `${" ".repeat(Math.max(0, chord.charIndex))}${chord.symbol}`).join("")}
                    </div>
                    <div className="text-sm text-studio-text">{line.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "AUDIO" && (
          <section className="space-y-4 text-sm text-studio-muted">
            <div className="rounded-xl border border-studio-border bg-studio-surface p-4">
              Audio original: {draft.originalAudioUrl ? <a className="text-electric-400" href={draft.originalAudioUrl}>abrir archivo</a> : "no configurado"}
            </div>
            <div className="rounded-xl border border-studio-border bg-studio-surface p-4">
              Hash SHA-256: {draft.audioHash || "no disponible"}
            </div>
          </section>
        )}

        {activeTab === "MELODIA" && (
          <section className="rounded-xl border border-studio-border bg-studio-surface p-4 text-sm text-studio-muted">
            {draft.melody.length} puntos de melodia guardados.
          </section>
        )}

        {activeTab === "METADATOS" && (
          <section className="space-y-3">
            <pre className="max-h-[520px] overflow-auto rounded-xl border border-studio-border bg-studio-surface p-4 text-xs text-studio-muted">
              {JSON.stringify(draft, null, 2)}
            </pre>
            <div className="flex gap-2">
              <button type="button" onClick={() => navigator.clipboard.writeText(JSON.stringify(draft, null, 2))} className="inline-flex items-center gap-2 rounded-lg border border-studio-border px-3 py-2 text-xs text-studio-text">
                <Copy className="h-4 w-4" />
                Copiar JSON
              </button>
              <button type="button" onClick={() => song && updateDraft(song)} className="inline-flex items-center gap-2 rounded-lg border border-studio-border px-3 py-2 text-xs text-studio-text">
                <Trash2 className="h-4 w-4" />
                Descartar cambios locales
              </button>
              <button type="button" onClick={() => setSaveState("dirty")} className="inline-flex items-center gap-2 rounded-lg bg-electric-600 px-3 py-2 text-xs font-bold text-white">
                <Save className="h-4 w-4" />
                Guardar ahora
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

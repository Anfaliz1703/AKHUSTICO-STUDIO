import { CanonicalSong, LyricsSection } from "@akhustico/shared";
import { normalizeNoteName } from "@akhustico/music-core";

export interface LegacyImportResult {
  song: CanonicalSong;
  warnings: string[];
  detectedFormat: "legacy_json" | "chordpro" | "unknown";
}

/**
 * Parsea e importa un cancionero en formato JSON antiguo o ChordPro,
 * adaptándolo tolerante y fielmente al esquema canónico AKHUSTICO v1.0.
 */
export function parseLegacySong(rawContent: string): LegacyImportResult {
  const warnings: string[] = [];
  let detectedFormat: "legacy_json" | "chordpro" | "unknown" = "unknown";

  const clean = rawContent.trim();

  // Intentar parsear como JSON
  if (clean.startsWith("{")) {
    try {
      const data = JSON.parse(clean);
      detectedFormat = "legacy_json";

      const title = data.title || data.titulo || data.name || "Canción Sin Título";
      const artist = data.artist || data.artista || data.autor || "Artista Desconocido";
      const originalKeyRaw = data.originalKey || data.tono_real || data.key || data.tono || "C";
      const originalKey = normalizeNoteName(originalKeyRaw);
      const preferredKeyRaw = data.preferredKey || data.tono || originalKey;
      const preferredKey = normalizeNoteName(preferredKeyRaw);
      const capo = typeof data.capo === "number" ? data.capo : (typeof data.cejilla === "number" ? data.cejilla : 0);
      const chordShapeKey = data.chordShapeKey || data.forma || preferredKey;
      const bpm = typeof data.bpm === "number" ? data.bpm : (typeof data.tempo === "number" ? data.tempo : 120);
      const tuning = data.tuning || data.afinacion || "E A D G B E";

      if (!data.title && !data.titulo) {
        warnings.push("No se encontró título explícito; se asignó valor por defecto.");
      }

      // Secciones y letra
      let sections: LyricsSection[] = [];
      if (Array.isArray(data.sections || data.secciones)) {
        const rawSections = data.sections || data.secciones;
        sections = rawSections.map((s: any, idx: number) => ({
          type: s.type || "verse",
          label: s.label || s.nombre || `Sección ${idx + 1}`,
          lines: Array.isArray(s.lines || s.lineas)
            ? (s.lines || s.lineas).map((l: any) => ({
                text: l.text || l.texto || "",
                chords: l.chords || l.acordes || [],
                words: l.words || [],
                startMs: l.startMs,
                endMs: l.endMs,
              }))
            : [],
        }));
      } else if (typeof data.letra === "string" || typeof data.lyrics === "string") {
        sections = parseChordProText(data.letra || data.lyrics);
      }

      const song: CanonicalSong = {
        schemaVersion: "1.0",
        id: `legacy-${Date.now()}`,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        title,
        artist,
        album: data.album || "",
        language: data.language || data.idioma || "es",
        music: {
          originalKey,
          preferredKey,
          chordShapeKey,
          capo,
          tuning,
          bpm,
          timeSignature: data.timeSignature || data.compas || "4/4",
        },
        display: {
          fontScale: 1.0,
          readingMode: "large",
          showChords: true,
          showSections: true,
          autoscrollSpeed: 2,
        },
        tags: data.tags || data.etiquetas || ["importado"],
        isFavorite: false,
        status: "ready",
        lyrics: { sections },
        melody: [],
        assets: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return { song, warnings, detectedFormat };
    } catch {
      // Continuar al parser ChordPro
    }
  }

  // Parser de texto ChordPro
  detectedFormat = "chordpro";
  const sections = parseChordProText(clean);
  const titleMatch = clean.match(/\{title:\s*([^}]+)\}/i) || clean.match(/\{t:\s*([^}]+)\}/i);
  const artistMatch = clean.match(/\{artist:\s*([^}]+)\}/i) || clean.match(/\{a:\s*([^}]+)\}/i);
  const keyMatch = clean.match(/\{key:\s*([^}]+)\}/i) || clean.match(/\{k:\s*([^}]+)\}/i);
  const capoMatch = clean.match(/\{capo:\s*([^}]+)\}/i);

  const title = titleMatch ? titleMatch[1].trim() : "Canción Importada";
  const artist = artistMatch ? artistMatch[1].trim() : "Artista";
  const key = keyMatch ? normalizeNoteName(keyMatch[1].trim()) : "C";
  const capo = capoMatch ? parseInt(capoMatch[1].trim(), 10) || 0 : 0;

  const song: CanonicalSong = {
    schemaVersion: "1.0",
    id: `chordpro-${Date.now()}`,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    title,
    artist,
    album: "",
    language: "es",
    music: {
      originalKey: key,
      preferredKey: key,
      chordShapeKey: key,
      capo,
      tuning: "E A D G B E",
      bpm: 120,
      timeSignature: "4/4",
    },
    display: {
      fontScale: 1.0,
      readingMode: "large",
      showChords: true,
      showSections: true,
      autoscrollSpeed: 2,
    },
    tags: ["chordpro", "importado"],
    isFavorite: false,
    status: "ready",
    lyrics: { sections },
    melody: [],
    assets: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { song, warnings, detectedFormat };
}

/**
 * Convierte texto con sintaxis [G]Acorde sobre palabra a secciones tipadas.
 */
function parseChordProText(text: string): LyricsSection[] {
  const lines = text.split("\n");
  const sections: LyricsSection[] = [];
  let currentSection: LyricsSection = {
    type: "verse",
    label: "Verso 1",
    lines: [],
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Detectar encabezados de sección ej. [Verso 1], [Coro], {sov}, etc.
    const sectionHeader = line.match(/^\[([a-zA-Z0-9_\sáéíóúÁÉÍÓÚ]+)\]$/);
    if (sectionHeader && !line.includes(" ") && line.length < 25) {
      if (currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      const label = sectionHeader[1];
      const lower = label.toLowerCase();
      let type: LyricsSection["type"] = "verse";
      if (lower.includes("intro")) type = "intro";
      else if (lower.includes("coro") || lower.includes("chorus")) type = "chorus";
      else if (lower.includes("puente") || lower.includes("bridge")) type = "bridge";
      else if (lower.includes("solo")) type = "solo";
      else if (lower.includes("outro") || lower.includes("final")) type = "outro";

      currentSection = { type, label, lines: [] };
      continue;
    }

    // Extraer acordes entre corchetes [Am]Hace frío
    let pureText = "";
    const chords: Array<{ symbol: string; charIndex: number }> = [];
    let i = 0;

    while (i < line.length) {
      if (line[i] === "[") {
        const closeIdx = line.indexOf("]", i);
        if (closeIdx !== -1) {
          const chordSymbol = line.slice(i + 1, closeIdx);
          chords.push({ symbol: chordSymbol, charIndex: pureText.length });
          i = closeIdx + 1;
          continue;
        }
      }
      pureText += line[i];
      i++;
    }

    currentSection.lines.push({
      text: pureText,
      chords,
    });
  }

  if (currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

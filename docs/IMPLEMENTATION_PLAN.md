# Plan de Implementación — AKHUSTICO Studio

Este documento rige la ejecución sistemática de **AKHUSTICO Studio**. Se mantiene actualizado a lo largo de cada fase con su estado real.

---

## Estado Global del Proyecto

| Fase | Descripción | Estado |
|---|---|---|
| **Fase 1** | Foundation (Scaffold Monorepo, Next.js, Auth Centralizada `requireOwner`, DB Drizzle/Neon, Blob direct upload, Jobs, Library, Demo Mode) | **DONE** |
| **Fase 2** | Cancionero Inteligente (Reader de Atril, Chords SVG Diagrams, Transposition Pura, Capo/Tono/Forma Separados, Legacy Import Tolerante, Export JSON Canónico, Autoscroll, Navegación Anterior/Siguiente) | **IN PROGRESS** (Core Estable y Operativo) |
| **Fase 3** | Audio Lab & Worker (FastAPI Worker, Stems separation, Waveform multi-track mixer, BPM/Key/Chords/Lyrics/Melody F0) | **QUEUED** |
| **Fase 4** | Vocal Coach (Web Audio Mic, Real-time Pitch Detection YIN/Autocorrelation, Graph Dual-pitch, Cents error, Scoring, Smart Loop) | **QUEUED** |
| **Fase 5** | Intelligence & Performance (Vocal profile estimation, Deterministic key recommender, Song presets, Setlists drag-and-drop) | **QUEUED** |

---

## Detalle de Fases

### FASE 1 — Foundation
- [x] Arquitectura general y especificaciones completas (`docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, etc.).
- [x] Definición de Agentes especializados en `.agents/agents/`.
- [x] Configuración del Monorepo con pnpm workspaces (`apps/web`, `packages/shared`, `packages/music-core`, `services/audio-worker`).
- [x] Implementación de `packages/music-core` con funciones puras y 20 tests exhaustivos (notas, MIDI, cents, transposición, capo, enarmonía).
- [x] Configuración de Base de Datos PostgreSQL con Drizzle ORM y esquemas tipados (`songs`, `song_assets`, `processing_jobs`, `practice_sessions`, etc.) + In-Memory Fallback para desarrollo sin DB.
- [x] Configuración de Autenticación centralizada (`requireOwner()`):
  - Google OAuth exclusivo para `OWNER_EMAIL` en producción.
  - Bypass controlado únicamente si `DEV_AUTH_BYPASS=true` explícito en desarrollo local / build local.
  - Bloqueo estricto en producción (`VERCEL_ENV=production`).
  - Códigos HTTP semánticos: 401 para no autenticados, 403 para usuarios no autorizados.
- [x] Indicador visual discreto `DEMO MODE` en el encabezado global cuando no hay PostgreSQL configurado.
- [x] Endpoint seguro de autorización para Vercel Blob (`/api/upload/token`) con modo simulado local.
- [x] Sistema de Jobs (`processing_jobs`) y Provider Pattern (`AudioProcessingProvider`, `MockAudioProcessingProvider`, `ExternalAudioWorkerProvider`).
- [x] UI Base: Layout de estudio musical moderno, dark theme, sidebar colapsable, header, dashboard con canciones recientes y métricas.
- [x] Verificación de todos los endpoints de la API (11 rutas probadas y operativas).
- [x] Health check `/api/health`.

### FASE 2 — Cancionero Inteligente
- [x] Vista `/library` con buscador en tiempo real, ordenación (recientes, A-Z, artista, práctica), filtro de favoritos, tags, tonalidades y Server Component preloading.
- [x] Lector de atril `/songs/[id]` optimizado para escenario:
  - Metadata musical explícita y separada: **Título, Artista, Tono real, Mi tono, Forma, Capo, Afinación, BPM**.
  - Controles de atril completos: **Tono -/+, Texto -/+, Acordes, Autoscroll con velocidad configurable, Pantalla completa, Anterior, Siguiente, Inicio**.
  - Opción de fijar tono preferido del usuario (persistido vía `PATCH /api/songs/[id]`).
- [x] Catálogo de diagramas SVG de acordes de guitarra (`GuitarChordSvg`, `ChordsModal`) cubriendo acordes mayores, menores, séptimas, suspendidos, disminuidos, aumentados y slash chords.
- [x] Motor matemático puro de transposición en `packages/music-core` (sin reemplazo ingenuo de strings) con soporte de notas en español (solfege, sostenidos, bemoles, menores).
- [x] Importador tolerante de cancionero previo (`parseLegacySong`) con detección de formato (JSON antiguo y ChordPro) y endpoint `/api/songs/import`.
- [x] Exportador de canciones a JSON canónico v1 (`/api/songs/[id]/export`).
- [x] Barra inferior persistente para navegación táctil en dispositivos móviles.
- [ ] Editor visual interactivo de letra y cifrado en tiempo real (modo texto y modo visual simultáneo).

### FASE 3 — Audio Lab & Processing Worker
- [ ] Servicio FastAPI en `services/audio-worker` con endpoints `/health`, `/process`, `/models`.
- [ ] Pipeline modular: Stems (audio-separator / BS-RoFormer), Whisper / WhisperX para letras sincronizadas, F0 Melody (torchcrepe / librosa.pyin), Essentia / Chroma para acordes y detección de BPM / Key.
- [ ] Mixer multi-stem con Web Audio API (reproducción sincronizada por clock compartido, solo, mute, gain).
- [ ] Visualizador de Waveform interactivo con selección de regiones y marcadores de beats.
- [ ] Sistema de callbacks autenticados con HMAC/token (`WORKER_SECRET`).

### FASE 4 — Vocal Coach
- [ ] Módulo de captura de micrófono con Web Audio API, análisis de nivel, piso de ruido y selector de dispositivos.
- [ ] Detector de pitch en tiempo real sin latencia de servidor (`RealtimePitchDetector`).
- [ ] Gráfico Canvas / WebGL sincronizado de melodía original vs voz del usuario en tiempo real.
- [ ] Medidor en vivo de desviación en cents (`1200 * log2(f_user / f_target)`) y clasificación de afinación.
- [ ] Algoritmo determinista de scoring (Afinación, Ritmo, Estabilidad, Continuidad).
- [ ] Detector de patrones de error (entra bajo/alto, sostiene bajo/alto, caída de nota).
- [ ] Modo Smart Loop A/B con incremento progresivo de velocidad y conteo.
- [ ] Registro de sesiones de práctica (`practice_sessions`).

### FASE 5 — Intelligence & Live Performance
- [ ] Perfil vocal dinámico (rango observado vs zona cómoda estimada).
- [ ] Recomendador determinista de tonalidad ideal para el usuario según su tesitura.
- [ ] Presets de interpretación para canciones (ensayo, en vivo, acústico, práctica vocal).
- [ ] Gestor de Setlists `/setlists` con cálculo de duración y ordenación drag-and-drop.

---

## Log de Estado

### DONE
- **Resolución del problema de autenticación 403 Forbidden**:
  - **Causa raíz identificada**: Al ejecutar `pnpm --filter @akhustico/web start`, Next.js opera con `NODE_ENV="production"`. La función de verificación previa exigía rígidamente `NODE_ENV !== "production"`, por lo que el bypass local fallaba y devolvía `403` al probar localmente la build de producción.
  - **Refactorización de seguridad centralizada**: Se implementó `requireOwner()` en `apps/web/src/lib/auth.ts`:
    1. Si no hay sesión -> `401 Unauthorized` (en lugar del 403 genérico).
    2. Si hay sesión pero no coincide con `OWNER_EMAIL` -> `403 Forbidden`.
    3. `isDevAuthBypassEnabled()`: Permite bypass **únicamente** si `DEV_AUTH_BYPASS="true"` está explícitamente establecido en el entorno local y `VERCEL_ENV !== "production"`. Nunca se activa por variables faltantes y queda completamente bloqueado en producción desplegada en Vercel.
    4. Se reemplazó la lógica duplicada en las 7 rutas API (`/api/songs`, `/api/songs/[id]`, `/api/songs/[id]/process`, `/api/songs/[id]/export`, `/api/songs/import`, `/api/jobs/[id]`, `/api/upload/token`).
  - **Verificación completa de API**: Probados los 11 endpoints del sistema con respuestas 200/201/202 válidas en JSON.
- **Indicador visual DEMO MODE**: Añadido badge discreto animado en `AppHeader` que se activa únicamente cuando la base de datos opera en fallback en memoria.
- **Transposición pura y normalización musical**:
  - `packages/music-core`: Soporta notas y tonalidades en español (`La menor` -> `Am`, `Do mayor` -> `C`, `Si bemol` -> `Bb`, `Fa sostenido menor` -> `F#m`).
  - 20 pruebas unitarias pasando al 100% incluyendo los requisitos obligatorios: `C +2 = D`, `Am +2 = Bm`, `F#m7 -2 = Em7`, `Bb +2 = C`, `C/G +2 = D/A`, `Bbmaj7 +1 = Bmaj7`, `Forma A + Capo 2 = B`, `Tono B con Capo 2 = Forma A`.
- **Lector de atril `/songs/[id]` y Biblioteca `/library`**:
  - Arquitectura Next.js App Router optimizada con Server Components para SSR instantáneo de letra, acordes y playlist sin pantallas de carga parpadeantes.
  - Metadatos separados: Tono real, Mi tono, Forma, Capo, Afinación, BPM.
  - Controles completos de atril: Tono -/+, Texto -/+, Acordes, Autoscroll con velocidad ajustable, Pantalla completa, Anterior, Siguiente, Inicio, Fijar Tono.
  - Catálogo de acordes SVG en `GuitarChordSvg` con digitaciones precisas (cejillas, mutes, cuerdas al aire).

### IN PROGRESS
- Consolidación del editor visual y textual de cancionero (Fase 2).
- Preparación del microservicio FastAPI en `services/audio-worker` para aislamiento de stems con BS-RoFormer (Fase 3).

### NEXT
- Editor de letras y acordes interactivo en `/songs/[id]/edit` con sincronización bidireccional.
- Microservicio FastAPI de audio worker (`services/audio-worker/main.py`) con soporte para separación de stems y extracción de F0.

### BLOCKERS
- Ninguno. El cancionero ya es completamente funcional para su uso diario de forma local e independiente de servicios externos.

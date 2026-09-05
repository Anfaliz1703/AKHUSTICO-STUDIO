# Modelo de Datos — AKHUSTICO Studio

El modelo de datos está diseñado para **PostgreSQL (Neon serverless)** utilizando **Drizzle ORM**. Se prioriza una estructura relacional limpia para entidades maestras (`songs`, `users`, `jobs`) y campos `JSONB` estructurados para información musical de series temporales (F0, letra sincronizada y acordes temporizados).

---

## 1. Esquema Relacional de Tablas

### `users`
| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `uuid` / `text` | PRIMARY KEY | Identificador único del usuario |
| `email` | `text` | NOT NULL, UNIQUE | Correo verificado (debe coincidir con `OWNER_EMAIL`) |
| `name` | `text` | | Nombre o alias del usuario |
| `image` | `text` | | URL de avatar |
| `createdAt` | `timestamp` | DEFAULT now() | Fecha de alta |

### `songs`
Entidad central que representa cada canción en el cancionero personal.
| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `uuid` / `text` | PRIMARY KEY | Identificador único |
| `slug` | `text` | NOT NULL, UNIQUE | Identificador amigable para URL |
| `title` | `text` | NOT NULL | Título de la canción |
| `artist` | `text` | NOT NULL | Artista o banda |
| `album` | `text` | | Álbum original |
| `language` | `varchar(10)` | DEFAULT 'es' | Idioma principal de la letra |
| `originalAudioUrl`| `text` | NOT NULL | URL privada en Vercel Blob |
| `audioHash` | `varchar(64)` | NOT NULL, INDEX | Hash SHA-256 para evitar duplicidad |
| `durationSeconds` | `real` | | Duración exacta del audio |
| `sampleRate` | `integer` | | Frecuencia de muestreo (Hz) |
| `originalKey` | `varchar(10)` | | Tonalidad detectada (ej. 'Cm', 'G#') |
| `preferredKey` | `varchar(10)` | | Tonalidad preferida por el usuario |
| `chordShapeKey`| `varchar(10)` | | Forma de acordes en guitarra (ej. 'Am') |
| `capo` | `smallint` | DEFAULT 0 | Posición de la cejilla / capo (0 a 12) |
| `tuning` | `varchar(30)` | DEFAULT 'E A D G B E'| Afinación de la guitarra |
| `bpm` | `real` | | Tempo en pulsos por minuto |
| `timeSignature` | `varchar(10)` | DEFAULT '4/4' | Métrica musical |
| `status` | `varchar(30)` | DEFAULT 'ready' | Estado de procesamiento |
| `tags` | `text[]` | DEFAULT '{}' | Etiquetas (ej. acústico, balada, rock) |
| `isFavorite` | `boolean` | DEFAULT false | Marcado como favorito |
| `lastPracticedAt`| `timestamp` | | Fecha de última práctica |
| `lyricsData` | `jsonb` | | Letra estructurada con acordes y timestamps |
| `chordsTimeline` | `jsonb` | | Lista cronológica de acordes detectados/editados |
| `melodyTimeline` | `jsonb` | | Serie temporal F0 (tiempo, hz, midi, confianza) |
| `beatsTimeline` | `jsonb` | | Lista de timestamps de beats y compases |
| `displaySettings`| `jsonb` | | Configuración visual (fontScale, showChords) |
| `schemaVersion` | `varchar(10)` | DEFAULT '1.0' | Versión canónica del esquema |
| `createdAt` | `timestamp` | DEFAULT now() | Fecha de registro |
| `updatedAt` | `timestamp` | DEFAULT now() | Última modificación |

### `song_assets` (Stems & Derivados)
Almacena las diferentes pistas de audio generadas para la canción.
| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `uuid` / `text` | PRIMARY KEY | Identificador único |
| `songId` | `uuid` / `text` | FK -> songs.id ON DELETE CASCADE | Canción vinculada |
| `stemType` | `varchar(30)` | NOT NULL | Tipo: vocals, drums, bass, guitar, piano, other |
| `blobPath` | `text` | NOT NULL | Ruta o URL en Vercel Blob |
| `mimeType` | `varchar(50)` | NOT NULL | Formato (audio/mp3, audio/wav, etc.) |
| `duration` | `real` | | Duración en segundos |
| `sampleRate` | `integer` | | Sample rate |
| `channels` | `smallint` | DEFAULT 2 | Canales (1 mono, 2 stereo) |
| `modelUsed` | `varchar(50)` | | Modelo generador (ej. 'bs-roformer-vocals') |
| `createdAt` | `timestamp` | DEFAULT now() | Fecha de creación |

### `processing_jobs`
Control del ciclo de vida de análisis asíncrono.
| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `uuid` / `text` | PRIMARY KEY | Identificador único de tarea |
| `songId` | `uuid` / `text` | FK -> songs.id ON DELETE CASCADE | Canción vinculada |
| `type` | `varchar(50)` | NOT NULL | Tipo de job (ej. 'full_analysis', 'stems') |
| `status` | `varchar(30)` | NOT NULL | queued, processing, ready, failed, etc. |
| `progress` | `smallint` | DEFAULT 0 | 0 a 100% |
| `stage` | `varchar(50)` | | Etapa actual (separating, transcribing...) |
| `provider` | `varchar(50)` | NOT NULL | 'worker', 'mock', 'replicate' |
| `inputPayload` | `jsonb` | | Parámetros enviados |
| `outputPayload`| `jsonb` | | Resultados estructurados |
| `errorMessage` | `text` | | Detalle en caso de fallo |
| `attempts` | `smallint` | DEFAULT 1 | Intentos de ejecución |
| `createdAt` | `timestamp` | DEFAULT now() | Creación |
| `startedAt` | `timestamp` | | Inicio de procesamiento |
| `finishedAt` | `timestamp` | | Finalización |

### `practice_sessions`
Registro histórico de sesiones de práctica vocal o instrumental.
| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `uuid` / `text` | PRIMARY KEY | Identificador de la sesión |
| `songId` | `uuid` / `text` | FK -> songs.id ON DELETE CASCADE | Canción practicada |
| `startedAt` | `timestamp` | DEFAULT now() | Fecha y hora de inicio |
| `durationSeconds`| `integer` | NOT NULL | Duración en segundos |
| `transposition` | `smallint` | DEFAULT 0 | Semitonos aplicados (-6 a +6) |
| `playbackSpeed` | `real` | DEFAULT 1.0 | Velocidad usada (0.5 a 1.25) |
| `overallScore` | `real` | | Puntuación general (0 - 100) |
| `pitchScore` | `real` | | Puntuación de afinación |
| `rhythmScore` | `real` | | Puntuación rítmica |
| `stabilityScore`| `real` | | Puntuación de estabilidad vocal |
| `problemSegments`| `jsonb` | | Fragmentos detectados con desviación |
| `pitchTrace` | `jsonb` | | Curva F0 del usuario registrada (opcional) |
| `notes` | `text` | | Notas personales del ensayo |

### `song_presets`
Configuraciones predefinidas para tocar en vivo o ensayar.
| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `uuid` / `text` | PRIMARY KEY | Identificador de preset |
| `songId` | `uuid` / `text` | FK -> songs.id ON DELETE CASCADE | Canción vinculada |
| `name` | `varchar(50)` | NOT NULL | Ej. 'En Vivo', 'Acústico', 'Práctica' |
| `semitones` | `smallint` | DEFAULT 0 | Transposición |
| `tempoPercent` | `smallint` | DEFAULT 100 | Velocidad (50 a 125) |
| `capo` | `smallint` | DEFAULT 0 | Capo recomendado |
| `chordShape` | `varchar(10)` | | Forma de acordes |
| `stemVolumes` | `jsonb` | NOT NULL | { vocals: 0, drums: 100, bass: 100, ... } |
| `stemMutes` | `jsonb` | NOT NULL | { vocals: true, drums: false, ... } |
| `isDefault` | `boolean` | DEFAULT false | Preset por defecto |

### `setlists` y `setlist_items`
Listas de canciones para repertorio o eventos.
- `setlists`: `id`, `name`, `description`, `color`, `createdAt`, `updatedAt`
- `setlist_items`: `id`, `setlistId`, `songId`, `presetId`, `orderIndex`, `customKey`, `customNotes`

---

## 2. Esquemas JSONB Detallados

### Estructura de Letra con Acordes (`lyricsData`):
```json
{
  "sections": [
    {
      "type": "intro",
      "label": "Intro",
      "lines": [
        {
          "text": "",
          "chords": [{ "symbol": "Am", "charIndex": 0 }, { "symbol": "G", "charIndex": 4 }],
          "startMs": 0,
          "endMs": 8000
        }
      ]
    },
    {
      "type": "verse",
      "label": "Verso 1",
      "lines": [
        {
          "text": "Hace frío y estoy lejos de casa",
          "chords": [
            { "symbol": "G", "charIndex": 0 },
            { "symbol": "D", "charIndex": 18 }
          ],
          "startMs": 8100,
          "endMs": 14200
        }
      ]
    }
  ]
}
```

### Serie Temporal de Melodía F0 (`melodyTimeline`):
```json
[
  { "timeMs": 8120, "frequency": 196.0, "midi": 55.0, "note": "G3", "confidence": 0.96, "voiced": true },
  { "timeMs": 8200, "frequency": 220.0, "midi": 57.0, "note": "A3", "confidence": 0.94, "voiced": true }
]
```
Se aplica downsampling a ~10-20ms por frame para optimizar peso en DB y garantizar fluidez a 60 FPS en el canvas de dibujo.

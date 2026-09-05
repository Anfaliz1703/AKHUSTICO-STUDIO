# Importación y Exportación de Cancionero Legacy — AKHUSTICO Studio

El módulo `LegacySongImporter` garantiza retrocompatibilidad con cancioneros personales anteriores, permitiendo importar colecciones existentes en formatos JSON flexibles o ChordPro y convertirlos sin pérdida al esquema canónico AKHUSTICO v1.0.

---

## 1. Mapeo de Conceptos

| Campo Legacy Habitual | Campo Canónico AKHUSTICO | Transformación / Normalización |
|---|---|---|
| `titulo`, `name` | `title` | Limpieza de espacios y capitalización |
| `artista`, `autor` | `artist` | Normalizado a cadena |
| `tono`, `key` | `preferredKey` | Normalización enarmónica (ej. 'Sol' -> 'G', 'Do#m' -> 'C#m') |
| `tono_real`, `original_key` | `originalKey` | Clave canónica del tema original |
| `forma`, `shape` | `chordShapeKey` | Acorde base en primera posición |
| `capo`, `cejilla` | `capo` | Entero entre 0 y 12 |
| `afinacion`, `tuning` | `tuning` | Notación 'E A D G B E' estándar o alternativa |
| `letra`, `cifrado`, `body` | `lyricsData` | Parser tolerante a tags `[G]`, acordes en línea superior o secciones `[Verso 1]` |
| `bpm`, `tempo` | `bpm` | Número flotante positivo |
| `secciones` | `lyricsData.sections` | Mapeo de etiquetas: Intro, Verso, Pre-Coro, Coro, Puente, Final |

---

## 2. Flujo de Importación con Vista Previa
1. **Carga de Archivo:** El usuario arrastra uno o varios JSON o texto ChordPro.
2. **Detección Automática de Esquema:** El parser evalúa si es JSON de cancionero previo, texto plano con cifrado intercalado o formato ChordPro estándar.
3. **Mapeo y Advertencias:** Si faltan campos opcionales o hay ambigüedad en acordes (ej. nombres no estándar), se generan advertencias (`warnings`) sin abortar.
4. **Vista Previa Interactiva:** El usuario confirma la tonalidad deducida y la división de secciones antes de persistir.
5. **Guardado:** Se inserta en la base de datos con `status: 'ready'` y `origin: 'imported'`.

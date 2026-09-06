# AKHUSTICO Studio 🎸🎙️

> **Cancionero Inteligente + Music Lab + Vocal Coach**

AKHUSTICO Studio es una aplicación web personal y suite acústica diseñada para importar canciones, generar automáticamente cancioneros con acordes y letra sincronizada, separar stems de audio (voz, bajo, batería, guitarra), transponer tonalidades para atril, y practicar canto mediante comparación melódica F0 en tiempo real con Web Audio API.

---

## 🌟 Características Principales

1. **Cancionero Inteligente (`/library`):**
   - Lector de atril para tocar en vivo con modo pantalla completa, autoscroll suave y botones de transporte.
   - Transposición matemática exacta de acordes y cálculo automático de cejilla (capo) y tono real.
   - Menú de acordes con diagramas vectoriales SVG de guitarra en afinación estándar.
   - Sincronización palabra-acorde estilo ChordPro tipado.

2. **Audio Lab & Mixer de Stems:**
   - Reproducción sincronizada de pistas de audio (voz, guitarra, bajo, batería, otros).
   - Controles independientes de ganancia (volumen), Mute y Solo.
   - Ajuste de velocidad (50% a 125%) conservando el tono musical.

3. **Vocal Coach en Tiempo Real (`/songs/[id]/practice`):**
   - Captura de micrófono local mediante Web Audio API (cero latencia de red, privacidad total).
   - Gráfica dual en Canvas: Melodía original (F0 extraída) vs Voz del usuario en vivo.
   - Medidor continuo de desviación en cents: $\Delta = 1200 \times \log_2(f_{\text{user}} / f_{\text{target}})$.
   - Clasificación de afinación y reporte final de sesión con detección de patrones acústicos (caída de nota, entrada baja/alta).

4. **Importación y Exportación Versátil:**
   - Carga de audio (MP3, WAV, M4A, FLAC, AAC, OGG) directo a Vercel Blob sin saturar funciones serverless.
   - Deduplicación automática por hash criptográfico SHA-256.
   - `LegacySongImporter`: importador tolerante para cancioneros previos en JSON o formato ChordPro.
   - Exportación de canciones al esquema canónico AKHUSTICO v1.0.

---

## 🛠️ Arquitectura del Monorepo

```text
akhustico/
├── apps/
│   └── web/                # Next.js 15 App Router, React 19, Tailwind CSS, Neon DB, Drizzle ORM
├── services/
│   └── audio-worker/       # Microservicio Python FastAPI para stems, F0 y análisis armónico
├── packages/
│   ├── shared/             # Esquemas canónicos Zod, contratos TypeScript y provider interfaces
│   └── music-core/         # Lógica pura de transposición, MIDI/Hz, cents, capo y scoring
├── docs/                   # Documentación de arquitectura, pipeline, base de datos y despliegue
├── .agents/agents/         # Subagentes especializados de desarrollo
└── README.md
```

---

## 🚀 Inicio Rápido Local

### Requisitos
- Node.js v20+ o v22+
- pnpm v10+ o v11+ (habilitado con `corepack enable`)
- Python 3.10+ (opcional para el worker local)

### 1. Instalación de dependencias
```bash
corepack enable
pnpm install
```

### 2. Configuración de Variables de Entorno
Copia el archivo de ejemplo:
```bash
cp .env.example .env
```
En desarrollo local, `DEV_AUTH_BYPASS="true"` viene activado por defecto, permitiendo probar toda la funcionalidad sin requerir credenciales de Google OAuth ni base de datos de producción (usando el fallback de demostración).

Sin `DATABASE_URL`, AKHUSTICO usa una base local persistente en `.akhustico-data/akhustico.local.json`. Eso conserva canciones, jobs, letra, acordes, melodía y assets demo entre reinicios del servidor local. Para cambiar la carpeta, define `AKHUSTICO_DATA_DIR`.

Con `DATABASE_URL=postgres://...`, la app usa PostgreSQL/Neon mediante Drizzle. En ese modo no hace fallback silencioso: si la conexión falla, la API devuelve un error claro para corregir credenciales o ejecutar migraciones.

Para preparar PostgreSQL:
```bash
pnpm db:push
```

### 3. Compilar paquetes y ejecutar pruebas unitarias
```bash
# Ejecutar suite de pruebas de teoría musical y transposición
pnpm --filter @akhustico/music-core test

# Compilar paquetes compartidos
pnpm --filter @akhustico/music-core build
pnpm --filter @akhustico/shared build
```

### 4. Iniciar la Aplicación Web
```bash
pnpm dev
```
Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

---

## 🐳 Ejecución de Audio Worker (Python) con Docker

```bash
cd services/audio-worker
docker build -t akhustico-worker .
docker run -p 8000:8000 -e WORKER_SECRET="akhustico-dev-secret-1234" akhustico-worker
```

O directamente con Python:
```bash
cd services/audio-worker
python -m venv .venv
# Activar entorno virtual
source .venv/bin/activate  # En Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📚 Documentación Técnica Detallada

- [Plan de Implementación y Estado](docs/IMPLEMENTATION_PLAN.md)
- [Arquitectura del Sistema](docs/ARCHITECTURE.md)
- [Modelo de Datos y Esquemas Drizzle](docs/DATA_MODEL.md)
- [Pipeline de Audio y Stems](docs/AUDIO_PIPELINE.md)
- [Despliegue en Vercel y Neon](docs/DEPLOY_VERCEL.md)
- [Especificación de Audio Worker](docs/AUDIO_WORKER.md)
- [Importación Legacy y ChordPro](docs/LEGACY_IMPORT.md)
- [Scoring Vocal y Cents](docs/VOCAL_SCORING.md)
- [Hoja de Ruta (Roadmap)](docs/ROADMAP.md)

---

## 🔒 Licencia y Uso
Desarrollado para uso personal de estudio musical y entrenamiento vocal.

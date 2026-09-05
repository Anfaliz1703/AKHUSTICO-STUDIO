# Hoja de Ruta (Roadmap) — AKHUSTICO Studio

Este documento detalla la evolución planificada para AKHUSTICO Studio, asegurando que las decisiones técnicas del presente preparen la arquitectura para expansiones futuras sin reescrituras estructurales.

---

## Versión 1.0 — Cancionero Inteligente + Music Lab + Vocal Coach (Actual)
- Monorepo con Next.js App Router, Tailwind CSS, Neon PostgreSQL y Vercel Blob.
- Transposición matemática exacta, manejo de capo/cejilla y diagramas vectoriales de guitarra.
- Lector de escenario interactivo con autoscroll y atajos.
- Separación de stems y extracción F0 de melodía vocal en audio-worker.
- Entrenador vocal en tiempo real con Web Audio API, Canvas de comparación y scoring objetivo.
- Importación/exportación de repertorio Legacy y cancionero en JSON canónico v1.
- Autenticación segura de propietario único con Google OAuth / Dev Bypass.

---

## Versión 1.1 — Ensayos & En Vivo
- Modo pantalla completa con soporte de pedalera Bluetooth / MIDI (pasar páginas, play/pause, loop con el pie).
- Metrónomo visual sincronizado con pulsos por compás.
- Afinador cromático integrado en la barra de herramientas.
- Historial acumulativo de sesiones y evolución del perfil vocal del cantante.

---

## Versión 2.0 — Rendimiento Multiplataforma & Inteligencia
- Aplicación empaquetada como PWA offline-first con sincronización de repertorio local en IndexedDB.
- Detección polifónica de guitarra acústica en vivo (reconocimiento de acordes ejecutados por el usuario).
- Generador automático de armonías vocales y pistas de acompañamiento complementarias.
- Adaptador para exportación a formato MusicXML y PDF de alta calidad para imprimir partituras/cifrados.

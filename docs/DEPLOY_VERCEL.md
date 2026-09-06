# Guía de Despliegue en Vercel — AKHUSTICO Studio

Este proyecto está optimizado para desplegarse mediante la conexión estándar de GitHub a **Vercel**, aprovechando Vercel Blob para almacenamiento y Neon PostgreSQL como base de datos serverless.

---

## 1. Requisitos Previos
1. Cuenta en [Vercel](https://vercel.com).
2. Proyecto de PostgreSQL Serverless en [Neon](https://neon.tech) o Vercel Postgres.
3. Repositorio en GitHub con el código de AKHUSTICO Studio.
4. Credenciales OAuth de Google Cloud Console (para inicio de sesión de usuario único).

---

## 2. Variables de Entorno en Vercel

Configurar en el panel de Vercel (**Settings -> Environment Variables**):

| Variable | Valor / Descripción |
|---|---|
| `DATABASE_URL` | String de conexión SSL de Neon PostgreSQL (`postgres://...`) |
| `AKHUSTICO_DATA_DIR` | Solo desarrollo local. Carpeta alternativa para `.akhustico-data`; no usar como persistencia en Vercel. |
| `AUTH_SECRET` | Secreto aleatorio seguro generado con `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Client ID de Google OAuth |
| `AUTH_GOOGLE_SECRET`| Client Secret de Google OAuth |
| `OWNER_EMAIL` | Tu correo personal exclusivo (único usuario con acceso permitido) |
| `BLOB_READ_WRITE_TOKEN` | Token de acceso para Vercel Blob (creado desde Vercel Storage tab) |
| `AUDIO_WORKER_URL` | URL pública del microservicio worker (ej. `https://worker.tudominio.com`) |
| `WORKER_SECRET` | Token compartido para firmar callbacks del worker |
| `NEXT_PUBLIC_APP_URL` | URL de producción de la app (ej. `https://akhustico.vercel.app`) |

---

## 3. Subida Directa a Vercel Blob

Para evitar superar el límite de payload de las funciones serverless de Vercel (normalmente 4.5 MB), AKHUSTICO implementa subidas cliente-servidor directas:

1. El frontend solicita un token de autorización temporal al endpoint `/api/upload/token`.
2. El SDK `@vercel/blob/client` sube el archivo de audio directamente desde el navegador del usuario al bucket de Vercel Blob en bloques multipart.
3. Una vez completada la carga, se recibe la URL segura y se procede a crear el registro de la canción e iniciar el procesamiento.

---

## 4. Migraciones de Base de Datos

En el script de compilación o antes del despliegue:
```bash
pnpm --filter @akhustico/web db:push
```
Esto aplica los esquemas de Drizzle ORM directamente a la base de datos de Neon sin bloquear la ejecución serverless.

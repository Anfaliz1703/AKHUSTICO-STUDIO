# Deploy Audio Worker

The audio worker is a separate FastAPI service. Do not deploy it as a Vercel Function; it is intended for any Docker-compatible CPU/GPU host.

## Local Docker

```bash
cd services/audio-worker
docker build -t akhustico-audio-worker .
docker run --rm -p 8000:8000 -e WORKER_SECRET="change-me" akhustico-audio-worker
```

## Web Configuration

Set these variables in the web app environment:

```env
AUDIO_WORKER_ENABLED=true
AUDIO_WORKER_URL=https://your-worker.example.com
WORKER_SECRET=the-same-secret-used-by-worker
```

Requests from web to worker and callbacks from worker to web are signed with HMAC SHA-256 over:

```text
timestamp.body
```

Headers:

```text
x-akhustico-timestamp
x-akhustico-signature
```

Timestamps older than five minutes are rejected.

## Current Execution Modes

- REAL: FastAPI endpoints, HMAC validation, Docker runtime, callback contract.
- MOCK: analysis modules return deterministic placeholder results unless optional ML libraries/models are installed.
- NOT CONFIGURED: GPU-specific separation and WhisperX/faster-whisper models are not bundled by default.

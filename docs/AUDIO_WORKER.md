# Audio Worker

`services/audio-worker` is the FastAPI service for heavy audio analysis. It is deployable with Docker and should run outside Vercel.

## Endpoints

- `GET /health`
- `GET /capabilities`
- `POST /jobs`
- `GET /jobs/{id}`

Legacy aliases are still available for compatibility:

- `POST /process`
- `GET /status/{id}`
- `POST /cancel/{id}`

## Security

All mutating/status job calls require:

```text
x-akhustico-timestamp
x-akhustico-signature
```

The signature is `HMAC_SHA256(WORKER_SECRET, timestamp + "." + body)`. Requests older than five minutes are rejected. Callbacks to the web app use the same scheme.

## Pipeline

The worker reports these persisted stages:

```text
queued -> preparing -> normalizing -> separating -> transcribing -> detecting_bpm -> detecting_key -> detecting_chords -> extracting_melody -> building_songbook -> completed
```

The service currently includes deterministic mock-compatible modules. Optional real ML providers can be installed behind the existing pipeline boundaries without changing the web app contract.

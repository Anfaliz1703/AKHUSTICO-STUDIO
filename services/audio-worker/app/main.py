# services/audio-worker/app/main.py

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.security import verify_worker_signature
from app.jobs import JobRequest, JobStatus, JOBS_STORE, start_background_job

app = FastAPI(
    title="AKHUSTICO Audio Worker",
    version="1.0.0",
    description="Microservicio de procesamiento de audio, separación de stems, extracción F0 y análisis armónico."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """Endpoint de salud del worker sin exponer secretos."""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "gpu_available": settings.enable_gpu,
        "models_cached": True
    }

@app.get("/capabilities")
def capabilities():
    return {
        "stages": [
            "normalizing",
            "separating",
            "transcribing",
            "detecting_bpm",
            "detecting_key",
            "detecting_chords",
            "extracting_melody",
            "building_songbook",
        ],
        "providers": {
            "stems": ["mock", "audio-separator-compatible"],
            "lyrics": ["mock", "faster-whisper-compatible"],
            "melody": ["mock", "librosa-pyin-compatible"],
            "bpm": ["mock", "librosa-compatible"],
            "key": ["mock", "chroma-compatible"],
            "chords": ["mock", "chord-detection-provider"],
        },
        "stemTypes": ["vocals", "instrumental", "drums", "bass", "guitar", "piano", "other"],
    }

@app.post("/jobs", status_code=status.HTTP_202_ACCEPTED, dependencies=[Depends(verify_worker_signature)])
def submit_job(req: JobRequest):
    """Encola un trabajo de procesamiento de audio en segundo plano."""
    start_background_job(req)
    return {
        "message": "Job encolado exitosamente",
        "jobId": req.jobId,
        "status": "queued"
    }

@app.post("/process", status_code=status.HTTP_202_ACCEPTED, dependencies=[Depends(verify_worker_signature)])
def submit_process_job(req: JobRequest):
    return submit_job(req)

@app.get("/jobs/{job_id}", response_model=JobStatus, dependencies=[Depends(verify_worker_signature)])
def get_job(job_id: str):
    """Obtiene el estado en tiempo real de un trabajo."""
    if job_id not in JOBS_STORE:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    return JOBS_STORE[job_id]

@app.get("/status/{job_id}", response_model=JobStatus, dependencies=[Depends(verify_worker_signature)])
def get_job_status(job_id: str):
    return get_job(job_id)

@app.post("/cancel/{job_id}", dependencies=[Depends(verify_worker_signature)])
def cancel_job(job_id: str):
    """Cancela un trabajo en ejecución."""
    if job_id not in JOBS_STORE:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    JOBS_STORE[job_id].status = "cancelled"
    JOBS_STORE[job_id].stage = "cancelled"
    return {"message": "Trabajo cancelado", "jobId": job_id}

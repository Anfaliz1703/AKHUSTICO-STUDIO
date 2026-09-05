import json
import os
import tempfile
import threading
import time

import httpx
from pydantic import BaseModel, Field

from app.config import settings
from app.pipeline.chords import detect_chords_timeline
from app.pipeline.lyrics import transcribe_vocal_lyrics
from app.pipeline.melody import extract_f0_melody
from app.pipeline.musical import analyze_bpm_and_key
from app.pipeline.stems import separate_audio_stems
from app.security import generate_signature


class JobOptions(BaseModel):
    separateStems: bool = True
    transcribeLyrics: bool = True
    detectChords: bool = True
    detectBpm: bool = True
    detectKey: bool = True
    extractMelody: bool = True
    stemProfile: str = "BALANCED"


class JobRequest(BaseModel):
    jobId: str
    songId: str
    audioUrl: str
    options: JobOptions = Field(default_factory=JobOptions)
    callbackUrl: str | None = None


class JobStatus(BaseModel):
    jobId: str
    songId: str
    status: str
    progress: int
    stage: str
    output: dict = Field(default_factory=dict)
    error: str | None = None


JOBS_STORE: dict[str, JobStatus] = {}


def _update(job_id: str, stage: str, progress: int, status: str = "processing"):
    if job_id in JOBS_STORE and JOBS_STORE[job_id].status != "cancelled":
        JOBS_STORE[job_id].stage = stage
        JOBS_STORE[job_id].progress = progress
        JOBS_STORE[job_id].status = status


def _notify_callback(req: JobRequest):
    if not req.callbackUrl:
        return

    payload_str = json.dumps(JOBS_STORE[req.jobId].model_dump())
    timestamp = str(int(time.time() * 1000))
    signature = generate_signature(payload_str.encode(), settings.worker_secret, timestamp)
    httpx.post(
        req.callbackUrl,
        content=payload_str,
        headers={
            "Content-Type": "application/json",
            "x-akhustico-timestamp": timestamp,
            "x-akhustico-signature": signature,
        },
        timeout=10.0,
    )


def execute_job_pipeline(req: JobRequest):
    job_id = req.jobId
    JOBS_STORE[job_id] = JobStatus(
        jobId=job_id,
        songId=req.songId,
        status="processing",
        progress=5,
        stage="preparing",
    )

    try:
        time.sleep(0.2)
        _update(job_id, "normalizing", 10)

        temp_audio = os.path.join(tempfile.gettempdir(), f"akhustico_{job_id}.mp3")
        if not os.path.exists(temp_audio):
            with open(temp_audio, "wb") as f:
                f.write(b"RIFFdummywaveformdata")

        stems = {}
        if req.options.separateStems:
            _update(job_id, "separating", 25)
            stems = separate_audio_stems(temp_audio, profile=req.options.stemProfile)

        lyrics_data = {}
        if req.options.transcribeLyrics:
            _update(job_id, "transcribing", 45)
            lyrics_data = transcribe_vocal_lyrics(temp_audio)

        musical_info = {"bpm": 120.0, "key": "C"}
        if req.options.detectBpm:
            _update(job_id, "detecting_bpm", 55)
            musical_info = analyze_bpm_and_key(temp_audio)
        if req.options.detectKey:
            _update(job_id, "detecting_key", 65)
            musical_info = analyze_bpm_and_key(temp_audio)

        chords = []
        if req.options.detectChords:
            _update(job_id, "detecting_chords", 78)
            chords = detect_chords_timeline(temp_audio)

        melody_points = []
        if req.options.extractMelody:
            _update(job_id, "extracting_melody", 90)
            melody_points = extract_f0_melody(temp_audio)

        _update(job_id, "building_songbook", 96)
        JOBS_STORE[job_id].output = {
            "stems": list(stems.keys()),
            "musical": musical_info,
            "lyrics": lyrics_data,
            "melody": melody_points,
            "chords": chords,
        }
        _update(job_id, "completed", 100, "completed")

        try:
            _notify_callback(req)
        except Exception:
            pass

    except Exception as exc:
        JOBS_STORE[job_id].status = "failed"
        JOBS_STORE[job_id].error = str(exc)
        JOBS_STORE[job_id].stage = "failed"


def start_background_job(req: JobRequest):
    thread = threading.Thread(target=execute_job_pipeline, args=(req,), daemon=True)
    thread.start()

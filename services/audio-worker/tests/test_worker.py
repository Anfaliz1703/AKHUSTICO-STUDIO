import json
import time

from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.security import generate_signature

client = TestClient(app)


def signed_headers(payload: dict | None = None):
    body = b"" if payload is None else json.dumps(payload, separators=(",", ":")).encode()
    timestamp = str(int(time.time() * 1000))
    return {
        "x-akhustico-timestamp": timestamp,
        "x-akhustico-signature": generate_signature(body, settings.worker_secret, timestamp),
    }


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "AKHUSTICO Audio Worker"


def test_capabilities_endpoint():
    response = client.get("/capabilities")
    assert response.status_code == 200
    data = response.json()
    assert "detecting_chords" in data["stages"]
    assert "vocals" in data["stemTypes"]


def test_unauthorized_process_request():
    response = client.post(
        "/jobs",
        json={
            "jobId": "test-1",
            "songId": "song-1",
            "audioUrl": "https://example.com/audio.mp3",
        },
    )
    assert response.status_code == 401


def test_authorized_process_flow():
    payload = {
        "jobId": "job-integration-1",
        "songId": "song-integration-1",
        "audioUrl": "https://example.com/demo.mp3",
        "options": {
            "separateStems": True,
            "transcribeLyrics": True,
            "detectChords": True,
            "detectBpm": True,
            "detectKey": True,
            "extractMelody": True,
            "stemProfile": "BALANCED",
        },
    }
    response = client.post("/jobs", json=payload, headers=signed_headers(payload))
    assert response.status_code == 202
    assert response.json()["status"] == "queued"

    status_response = client.get(f"/jobs/{payload['jobId']}", headers=signed_headers())
    assert status_response.status_code == 200
    status_data = status_response.json()
    assert status_data["jobId"] == payload["jobId"]

import hashlib
import hmac
import time
from fastapi import Header, HTTPException, Request, status
from app.config import settings

MAX_CLOCK_SKEW_SECONDS = 300


def generate_signature(payload_bytes: bytes, secret: str, timestamp: str) -> str:
    message = timestamp.encode() + b"." + payload_bytes
    return hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()


async def verify_worker_signature(
    request: Request,
    x_akhustico_timestamp: str | None = Header(None, alias="x-akhustico-timestamp"),
    x_akhustico_signature: str | None = Header(None, alias="x-akhustico-signature"),
):
    if not x_akhustico_timestamp or not x_akhustico_signature:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firma HMAC requerida.",
        )

    try:
        request_time = int(x_akhustico_timestamp) / 1000
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Timestamp invalido.")

    if abs(time.time() - request_time) > MAX_CLOCK_SKEW_SECONDS:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Timestamp expirado.")

    body = await request.body()
    expected = generate_signature(body, settings.worker_secret, x_akhustico_timestamp)
    if not hmac.compare_digest(expected, x_akhustico_signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Firma invalida.")

    return True

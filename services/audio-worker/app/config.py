# services/audio-worker/app/config.py

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "AKHUSTICO Audio Worker"
    worker_secret: str = os.getenv("WORKER_SECRET", "akhustico-dev-secret-1234")
    temp_dir: str = "/tmp/akhustico" if os.name != "nt" else os.path.join(os.getenv("TEMP", "C:\\temp"), "akhustico")
    enable_gpu: bool = False
    default_stem_model: str = "bs-roformer-vocals"

    class Config:
        env_file = ".env"

settings = Settings()

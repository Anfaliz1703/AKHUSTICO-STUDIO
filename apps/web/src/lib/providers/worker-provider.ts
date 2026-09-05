import crypto from "crypto";
import {
  AudioProcessingProvider,
  AudioProcessingJobRequest,
  ProcessingJob,
} from "@akhustico/shared";
import { jobRepository } from "../repository";

function signBody(secret: string, body: string, timestamp: string) {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export class ExternalAudioWorkerProvider implements AudioProcessingProvider {
  name = "worker";
  private workerUrl: string;
  private workerSecret: string;

  constructor() {
    this.workerUrl = process.env.AUDIO_WORKER_URL || "http://localhost:8000";
    this.workerSecret = process.env.WORKER_SECRET || "";
  }

  async submitJob(request: AudioProcessingJobRequest): Promise<ProcessingJob> {
    if (!this.workerSecret) {
      throw new Error("WORKER_SECRET is required when AUDIO_WORKER_ENABLED=true");
    }

    const existingJob = await jobRepository.getById(request.jobId);
    if (!existingJob) {
      throw new Error(`Job ${request.jobId} must be created before provider processing starts`);
    }

    const payload = {
      jobId: request.jobId,
      songId: request.songId,
      audioUrl: request.audioUrl,
      options: request.options,
      callbackUrl: request.callbackUrl,
    };
    const body = JSON.stringify(payload);
    const timestamp = Date.now().toString();
    const signature = signBody(this.workerSecret, body, timestamp);

    try {
      const res = await fetch(`${this.workerUrl}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-akhustico-timestamp": timestamp,
          "x-akhustico-signature": signature,
        },
        body,
      });

      if (!res.ok) {
        throw new Error(`Worker HTTP ${res.status}: ${await res.text()}`);
      }

      await jobRepository.update(request.jobId, {
        status: "processing",
        stage: "preparing",
        progress: 5,
        startedAt: existingJob.startedAt || new Date().toISOString(),
      });
    } catch (err: any) {
      await jobRepository.update(request.jobId, {
        error: err.message,
        stage: "failed",
        status: "failed",
        finishedAt: new Date().toISOString(),
      });
    }

    return (await jobRepository.getById(request.jobId)) || existingJob;
  }

  async getJobStatus(jobId: string): Promise<ProcessingJob> {
    if (this.workerSecret) {
      try {
        const timestamp = Date.now().toString();
        const signature = signBody(this.workerSecret, "", timestamp);
        const res = await fetch(`${this.workerUrl}/jobs/${jobId}`, {
          headers: {
            "x-akhustico-timestamp": timestamp,
            "x-akhustico-signature": signature,
          },
        });

        if (res.ok) {
          const data = await res.json();
          await jobRepository.update(jobId, {
            status: data.status,
            progress: data.progress,
            stage: data.stage,
            output: data.output,
            error: data.error,
            finishedAt: ["completed", "failed", "cancelled", "partial"].includes(data.status)
              ? new Date().toISOString()
              : undefined,
          });
        }
      } catch (e) {
        console.warn("No se pudo consultar el worker externo, usando estado persistido local:", e);
      }
    }

    const localJob = await jobRepository.getById(jobId);
    if (!localJob) throw new Error(`Job ${jobId} no existe`);
    return localJob;
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const updated = await jobRepository.update(jobId, {
      status: "cancelled",
      stage: "cancelled",
      finishedAt: new Date().toISOString(),
    });
    return !!updated;
  }
}

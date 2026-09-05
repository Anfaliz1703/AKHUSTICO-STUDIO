import { AudioProcessingProvider } from "@akhustico/shared";
import { MockAudioProcessingProvider } from "./mock-provider";
import { ExternalAudioWorkerProvider } from "./worker-provider";

export function getAudioProcessingProvider(): AudioProcessingProvider {
  // Si existe AUDIO_WORKER_URL configurada diferente a localhost o explícitamente se solicita, usamos el worker
  if (process.env.AUDIO_WORKER_URL && process.env.AUDIO_WORKER_ENABLED === "true") {
    return new ExternalAudioWorkerProvider();
  }
  return new MockAudioProcessingProvider();
}

export { MockAudioProcessingProvider, ExternalAudioWorkerProvider };

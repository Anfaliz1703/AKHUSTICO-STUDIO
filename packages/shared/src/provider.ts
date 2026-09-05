// packages/shared/src/provider.ts

import { ProcessingJob, CanonicalSong } from './schemas.js';

export interface SongAnalysisOptions {
  separateStems: boolean;
  transcribeLyrics: boolean;
  detectChords: boolean;
  detectBpm: boolean;
  detectKey: boolean;
  extractMelody: boolean;
  stemProfile?: 'FAST' | 'BALANCED' | 'HIGH_QUALITY';
}

export interface AudioProcessingJobRequest {
  jobId: string;
  songId: string;
  audioUrl: string;
  options: SongAnalysisOptions;
  callbackUrl?: string;
}

export interface AudioProcessingProvider {
  name: string;
  submitJob(request: AudioProcessingJobRequest): Promise<ProcessingJob>;
  getJobStatus(jobId: string): Promise<ProcessingJob>;
  cancelJob(jobId: string): Promise<boolean>;
}

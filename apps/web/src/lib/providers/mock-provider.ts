import {
  AudioProcessingProvider,
  AudioProcessingJobRequest,
  LyricsData,
  MelodyPoint,
  ProcessingJob,
  ProcessingStage,
  SongAsset,
} from "@akhustico/shared";
import { jobRepository, songRepository } from "../repository";

function buildDemoLyrics(title: string, artist: string): LyricsData {
  return {
    sections: [
      {
        type: "intro",
        label: "Intro",
        lines: [
          {
            text: "[Instrumental]",
            chords: [
              { symbol: "G", charIndex: 0 },
              { symbol: "D", charIndex: 8 },
              { symbol: "Em", charIndex: 15 },
              { symbol: "C", charIndex: 22 },
            ],
            startMs: 0,
            endMs: 8000,
          },
        ],
      },
      {
        type: "verse",
        label: "Verso 1",
        lines: [
          {
            text: `Primera pasada de ${title}`,
            chords: [
              { symbol: "G", charIndex: 0 },
              { symbol: "D", charIndex: 18 },
            ],
            words: [
              { text: "Primera", startMs: 8200, endMs: 8800, confidence: 0.92 },
              { text: "pasada", startMs: 8900, endMs: 9500, confidence: 0.9 },
              { text: "de", startMs: 9600, endMs: 9800, confidence: 0.88 },
              { text: title, startMs: 9900, endMs: 11200, confidence: 0.86 },
            ],
            startMs: 8200,
            endMs: 11600,
          },
          {
            text: `Guia demo para revisar la cancion de ${artist}`,
            chords: [
              { symbol: "C", charIndex: 0 },
              { symbol: "D", charIndex: 24 },
              { symbol: "G", charIndex: 38 },
            ],
            startMs: 11800,
            endMs: 16400,
          },
        ],
      },
      {
        type: "chorus",
        label: "Coro",
        lines: [
          {
            text: "Canta fuerte y vuelve al tono principal",
            chords: [
              { symbol: "Em", charIndex: 0 },
              { symbol: "C", charIndex: 14 },
              { symbol: "G", charIndex: 27 },
              { symbol: "D", charIndex: 35 },
            ],
            startMs: 16600,
            endMs: 22400,
          },
        ],
      },
    ],
    rawChordPro: `[Intro]\n[G][D][Em][C]\n\n[Verso 1]\n[G]Primera pasada de ${title} [D]\n[C]Guia demo para revisar la cancion de ${artist} [D] [G]\n\n[Coro]\n[Em]Canta fuerte y [C]vuelve al tono [G]principal [D]`,
  };
}

const demoMelody: MelodyPoint[] = [
  { timeMs: 8200, frequency: 196.0, midi: 55, note: "G3", confidence: 0.94, voiced: true },
  { timeMs: 8800, frequency: 220.0, midi: 57, note: "A3", confidence: 0.92, voiced: true },
  { timeMs: 9500, frequency: 246.9, midi: 59, note: "B3", confidence: 0.93, voiced: true },
  { timeMs: 10400, frequency: 293.7, midi: 62, note: "D4", confidence: 0.95, voiced: true },
  { timeMs: 12600, frequency: 261.6, midi: 60, note: "C4", confidence: 0.91, voiced: true },
  { timeMs: 14800, frequency: 293.7, midi: 62, note: "D4", confidence: 0.93, voiced: true },
  { timeMs: 17000, frequency: 329.6, midi: 64, note: "E4", confidence: 0.95, voiced: true },
  { timeMs: 19000, frequency: 392.0, midi: 67, note: "G4", confidence: 0.94, voiced: true },
  { timeMs: 21400, frequency: 329.6, midi: 64, note: "E4", confidence: 0.92, voiced: true },
];

function buildDemoAssets(songId: string, audioUrl?: string): Record<string, SongAsset> {
  const url =
    audioUrl || "https://assets.mixkit.co/music/preview/mixkit-guitar-acoustic-happy-energy-1111.mp3";
  return {
    master: {
      id: `${songId}-asset-master`,
      songId,
      stemType: "master",
      blobPath: url,
      mimeType: "audio/mpeg",
      duration: 120,
      sampleRate: 44100,
      channels: 2,
      model: "original-upload",
      createdAt: new Date().toISOString(),
    },
    vocals: {
      id: `${songId}-asset-vocals`,
      songId,
      stemType: "vocals",
      blobPath: url,
      mimeType: "audio/mpeg",
      duration: 120,
      sampleRate: 44100,
      channels: 2,
      model: "mock-vocals",
      createdAt: new Date().toISOString(),
    },
    instrumental: {
      id: `${songId}-asset-instrumental`,
      songId,
      stemType: "instrumental",
      blobPath: url,
      mimeType: "audio/mpeg",
      duration: 120,
      sampleRate: 44100,
      channels: 2,
      model: "mock-instrumental",
      createdAt: new Date().toISOString(),
    },
  };
}

export class MockAudioProcessingProvider implements AudioProcessingProvider {
  name = "mock";

  async submitJob(request: AudioProcessingJobRequest): Promise<ProcessingJob> {
    const existingJob = await jobRepository.getById(request.jobId);
    if (!existingJob) {
      throw new Error(`Job ${request.jobId} must be created before provider processing starts`);
    }

    await jobRepository.update(request.jobId, {
      status: "queued",
      stage: "queued",
      progress: 0,
      startedAt: existingJob.startedAt || new Date().toISOString(),
    });

    void this.runMockPipeline(request.jobId, request.songId);

    return (await jobRepository.getById(request.jobId)) || existingJob;
  }

  async getJobStatus(jobId: string): Promise<ProcessingJob> {
    const job = await jobRepository.getById(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} no encontrado`);
    }
    return job;
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const updated = await jobRepository.update(jobId, {
      status: "cancelled",
      stage: "cancelled",
      finishedAt: new Date().toISOString(),
    });
    return !!updated;
  }

  private async runMockPipeline(jobId: string, songId: string) {
    const stages: Array<{ stage: ProcessingStage; progress: number; delay: number }> = [
      { stage: "preparing", progress: 5, delay: 600 },
      { stage: "normalizing", progress: 10, delay: 700 },
      { stage: "separating", progress: 25, delay: 900 },
      { stage: "transcribing", progress: 45, delay: 1000 },
      { stage: "detecting_bpm", progress: 55, delay: 600 },
      { stage: "detecting_key", progress: 65, delay: 600 },
      { stage: "detecting_chords", progress: 78, delay: 800 },
      { stage: "extracting_melody", progress: 90, delay: 800 },
      { stage: "building_songbook", progress: 96, delay: 600 },
      { stage: "completed", progress: 100, delay: 400 },
    ];

    for (const step of stages) {
      const current = await jobRepository.getById(jobId);
      if (!current || current.status === "cancelled") return;

      await new Promise((resolve) => setTimeout(resolve, step.delay));
      await jobRepository.update(jobId, {
        stage: step.stage,
        progress: step.progress,
        status: step.stage === "completed" ? "completed" : "processing",
        finishedAt: step.stage === "completed" ? new Date().toISOString() : undefined,
        output: {
          ...(current.output || {}),
          logs: [
            ...((current.output?.logs as unknown[]) || []),
            {
              stage: step.stage,
              progress: step.progress,
              provider: this.name,
              timestamp: new Date().toISOString(),
            },
          ],
        },
      });
    }

    const song = await songRepository.getById(songId);
    if (!song) return;

    const hasManualLyrics = (song.lyrics?.sections?.length || 0) > 0;
    const hasMelody = (song.melody?.length || 0) > 0;
    const hasAssets = Object.keys(song.assets || {}).length > 0;
    const lyrics = hasManualLyrics ? song.lyrics : buildDemoLyrics(song.title, song.artist);
    const melody = hasMelody ? song.melody : demoMelody;
    const assets = hasAssets ? song.assets : buildDemoAssets(song.id, song.originalAudioUrl);

    await jobRepository.update(jobId, {
      output: {
        ...((await jobRepository.getById(jobId))?.output || {}),
        stems: Object.keys(assets),
        lyrics,
        melody,
        chords: lyrics.sections.flatMap((section) =>
          section.lines.flatMap((line) =>
            line.chords.map((chord) => ({
              startMs: line.startMs || 0,
              endMs: line.endMs || (line.startMs || 0) + 2000,
              chord: chord.symbol,
              confidence: 0.88,
            }))
          )
        ),
        musical: {
          key: "G",
          bpm: 96,
        },
      },
    });

    await songRepository.update(songId, {
      status: "ready",
      music: {
        originalKey: song.music.originalKey || "G",
        preferredKey: song.music.preferredKey || "G",
        chordShapeKey: song.music.chordShapeKey || "G",
        capo: 0,
        tuning: song.music.tuning || "E A D G B E",
        bpm: 96,
        timeSignature: song.music.timeSignature || "4/4",
      },
      lyrics,
      melody,
      assets,
      updatedAt: new Date().toISOString(),
    });
  }
}

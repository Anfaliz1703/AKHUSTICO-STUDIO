// packages/shared/src/schemas.ts

import { z } from 'zod';

export const MusicMetadataSchema = z.object({
  originalKey: z.string().default('C'),
  preferredKey: z.string().default('C'),
  chordShapeKey: z.string().default('C'),
  capo: z.number().int().min(0).max(12).default(0),
  tuning: z.string().default('E A D G B E'),
  bpm: z.number().positive().default(120),
  timeSignature: z.string().default('4/4'),
});

export const DisplaySettingsSchema = z.object({
  fontScale: z.number().min(0.5).max(3.0).default(1.0),
  readingMode: z.enum(['normal', 'large', 'stage', 'two_columns']).default('large'),
  showChords: z.boolean().default(true),
  showSections: z.boolean().default(true),
  autoscrollSpeed: z.number().min(0).max(10).default(2),
});

export const ChordPositionSchema = z.object({
  symbol: z.string(),
  charIndex: z.number().int().min(0),
});

export const LyricsWordSchema = z.object({
  text: z.string(),
  startMs: z.number().nonnegative(),
  endMs: z.number().nonnegative(),
  confidence: z.number().min(0).max(1).optional(),
});

export const LyricsLineSchema = z.object({
  text: z.string(),
  chords: z.array(ChordPositionSchema).default([]),
  words: z.array(LyricsWordSchema).optional(),
  startMs: z.number().nonnegative().optional(),
  endMs: z.number().nonnegative().optional(),
});

export const LyricsSectionSchema = z.object({
  type: z.enum(['intro', 'verse', 'pre_chorus', 'chorus', 'bridge', 'solo', 'outro', 'instrumental', 'other']),
  label: z.string(),
  lines: z.array(LyricsLineSchema),
});

export const LyricsDataSchema = z.object({
  sections: z.array(LyricsSectionSchema).default([]),
  rawChordPro: z.string().optional(),
});

export const MelodyPointSchema = z.object({
  timeMs: z.number().nonnegative(),
  frequency: z.number().nonnegative(),
  midi: z.number().nonnegative(),
  note: z.string(),
  confidence: z.number().min(0).max(1),
  voiced: z.boolean().default(true),
});

export const SongAssetSchema = z.object({
  id: z.string(),
  songId: z.string(),
  stemType: z.enum(['vocals', 'drums', 'bass', 'guitar', 'piano', 'other', 'instrumental', 'master']),
  blobPath: z.string(),
  mimeType: z.string(),
  duration: z.number().optional(),
  sampleRate: z.number().optional(),
  channels: z.number().optional(),
  model: z.string().optional(),
  createdAt: z.string().optional(),
});

export const ProcessingStageEnum = z.enum([
  'queued',
  'preparing',
  'uploading',
  'uploaded',
  'normalizing',
  'processing',
  'separating',
  'transcribing',
  'detecting_bpm',
  'detecting_key',
  'detecting_chords',
  'analyzing_key',
  'analyzing_bpm',
  'analyzing_chords',
  'extracting_melody',
  'building_songbook',
  'completed',
  'ready',
  'partial',
  'failed',
  'cancelled',
]);

export type ProcessingStage = z.infer<typeof ProcessingStageEnum>;

export const CanonicalSongSchema = z.object({
  schemaVersion: z.literal('1.0'),
  id: z.string(),
  slug: z.string(),
  title: z.string().min(1, 'El título es requerido'),
  artist: z.string().min(1, 'El artista es requerido'),
  album: z.string().optional().default(''),
  language: z.string().default('es'),
  originalAudioUrl: z.string().url().optional(),
  audioHash: z.string().optional(),
  music: MusicMetadataSchema,
  display: DisplaySettingsSchema,
  tags: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
  status: ProcessingStageEnum.default('ready'),
  lyrics: LyricsDataSchema,
  melody: z.array(MelodyPointSchema).default([]),
  assets: z.record(z.string(), SongAssetSchema).default({}),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  lastPracticedAt: z.string().optional(),
});

export type MusicMetadata = z.infer<typeof MusicMetadataSchema>;
export type DisplaySettings = z.infer<typeof DisplaySettingsSchema>;
export type ChordPosition = z.infer<typeof ChordPositionSchema>;
export type LyricsWord = z.infer<typeof LyricsWordSchema>;
export type LyricsLine = z.infer<typeof LyricsLineSchema>;
export type LyricsSection = z.infer<typeof LyricsSectionSchema>;
export type LyricsData = z.infer<typeof LyricsDataSchema>;
export type MelodyPoint = z.infer<typeof MelodyPointSchema>;
export type SongAsset = z.infer<typeof SongAssetSchema>;
export type CanonicalSong = z.infer<typeof CanonicalSongSchema>;

export const ProcessingJobSchema = z.object({
  id: z.string(),
  songId: z.string(),
  type: z.enum(['full_analysis', 'stems_only', 'lyrics_only', 'chords_only', 'melody_only']),
  status: ProcessingStageEnum,
  progress: z.number().int().min(0).max(100).default(0),
  stage: ProcessingStageEnum.default('queued'),
  provider: z.enum(['mock', 'worker', 'replicate']),
  input: z.record(z.string(), z.any()).optional(),
  output: z.record(z.string(), z.any()).optional(),
  error: z.string().optional(),
  attempts: z.number().int().default(1),
  createdAt: z.string(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
});

export type ProcessingJob = z.infer<typeof ProcessingJobSchema>;

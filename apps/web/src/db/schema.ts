import {
  pgTable,
  text,
  varchar,
  integer,
  real,
  smallint,
  boolean,
  timestamp,
  jsonb,
  uuid,
  index
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const songs = pgTable(
  "songs",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    artist: text("artist").notNull(),
    album: text("album").default(""),
    language: varchar("language", { length: 10 }).default("es").notNull(),
    originalAudioUrl: text("original_audio_url"),
    audioHash: varchar("audio_hash", { length: 64 }).notNull(),
    durationSeconds: real("duration_seconds"),
    sampleRate: integer("sample_rate"),
    originalKey: varchar("original_key", { length: 10 }).default("C").notNull(),
    preferredKey: varchar("preferred_key", { length: 10 }).default("C").notNull(),
    chordShapeKey: varchar("chord_shape_key", { length: 10 }).default("C").notNull(),
    capo: smallint("capo").default(0).notNull(),
    tuning: varchar("tuning", { length: 30 }).default("E A D G B E").notNull(),
    bpm: real("bpm").default(120).notNull(),
    timeSignature: varchar("time_signature", { length: 10 }).default("4/4").notNull(),
    status: varchar("status", { length: 30 }).default("ready").notNull(),
    tags: text("tags").array().default([]).notNull(),
    isFavorite: boolean("is_favorite").default(false).notNull(),
    lastPracticedAt: timestamp("last_practiced_at", { withTimezone: true }),
    lyricsData: jsonb("lyrics_data").$type<any>().default({ sections: [] }),
    chordsTimeline: jsonb("chords_timeline").$type<any[]>().default([]),
    melodyTimeline: jsonb("melody_timeline").$type<any[]>().default([]),
    beatsTimeline: jsonb("beats_timeline").$type<any[]>().default([]),
    displaySettings: jsonb("display_settings").$type<any>().default({
      fontScale: 1.0,
      readingMode: "large",
      showChords: true,
      showSections: true,
      autoscrollSpeed: 2
    }),
    schemaVersion: varchar("schema_version", { length: 10 }).default("1.0").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("songs_audio_hash_idx").on(table.audioHash),
    index("songs_artist_idx").on(table.artist),
    index("songs_preferred_key_idx").on(table.preferredKey),
  ]
);

export const songAssets = pgTable("song_assets", {
  id: text("id").primaryKey(),
  songId: text("song_id").references(() => songs.id, { onDelete: "cascade" }).notNull(),
  stemType: varchar("stem_type", { length: 30 }).notNull(), // vocals, drums, bass, guitar, piano, other
  blobPath: text("blob_path").notNull(),
  mimeType: varchar("mime_type", { length: 50 }).notNull(),
  duration: real("duration"),
  sampleRate: integer("sample_rate"),
  channels: smallint("channels").default(2),
  modelUsed: varchar("model_used", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const songAnalysisVersions = pgTable("song_analysis_versions", {
  id: text("id").primaryKey(),
  songId: text("song_id").references(() => songs.id, { onDelete: "cascade" }).notNull(),
  model: varchar("model", { length: 50 }).notNull(),
  version: varchar("version", { length: 20 }).notNull(),
  parameters: jsonb("parameters").default({}),
  results: jsonb("results").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const processingJobs = pgTable("processing_jobs", {
  id: text("id").primaryKey(),
  songId: text("song_id").references(() => songs.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  status: varchar("status", { length: 30 }).notNull(), // queued, processing, ready, failed, cancelled
  progress: smallint("progress").default(0).notNull(),
  stage: varchar("stage", { length: 50 }).default("queued").notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  inputPayload: jsonb("input_payload").default({}),
  outputPayload: jsonb("output_payload").default({}),
  errorMessage: text("error_message"),
  attempts: smallint("attempts").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

export const presets = pgTable("presets", {
  id: text("id").primaryKey(),
  songId: text("song_id").references(() => songs.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  semitones: smallint("semitones").default(0).notNull(),
  tempoPercent: smallint("tempo_percent").default(100).notNull(),
  capo: smallint("capo").default(0).notNull(),
  chordShape: varchar("chord_shape", { length: 10 }),
  stemVolumes: jsonb("stem_volumes").notNull(),
  stemMutes: jsonb("stem_mutes").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const practiceSessions = pgTable("practice_sessions", {
  id: text("id").primaryKey(),
  songId: text("song_id").references(() => songs.id, { onDelete: "cascade" }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  transposition: smallint("transposition").default(0).notNull(),
  playbackSpeed: real("playback_speed").default(1.0).notNull(),
  overallScore: real("overall_score"),
  pitchScore: real("pitch_score"),
  rhythmScore: real("rhythm_score"),
  stabilityScore: real("stability_score"),
  problemSegments: jsonb("problem_segments").$type<any[]>().default([]),
  pitchTrace: jsonb("pitch_trace").$type<any[]>().default([]),
  notes: text("notes"),
});

export const practiceSegments = pgTable("practice_segments", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => practiceSessions.id, { onDelete: "cascade" }).notNull(),
  startMs: integer("start_ms").notNull(),
  endMs: integer("end_ms").notNull(),
  targetNote: varchar("target_note", { length: 10 }).notNull(),
  avgCents: real("avg_cents").notNull(),
  pattern: varchar("pattern", { length: 50 }).notNull(),
  description: text("description"),
});

export const setlists = pgTable("setlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }).default("#3b82f6"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const setlistItems = pgTable("setlist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  setlistId: uuid("setlist_id").references(() => setlists.id, { onDelete: "cascade" }).notNull(),
  songId: text("song_id").references(() => songs.id, { onDelete: "cascade" }).notNull(),
  presetId: text("preset_id").references(() => presets.id, { onDelete: "set null" }),
  orderIndex: integer("order_index").notNull(),
  customKey: varchar("custom_key", { length: 10 }),
  customNotes: text("custom_notes"),
});

export const appSettings = pgTable("app_settings", {
  id: varchar("id", { length: 50 }).primaryKey(), // 'user_settings'
  audioInputDevice: text("audio_input_device"),
  audioOutputDevice: text("audio_output_device"),
  latencyOffsetMs: integer("latency_offset_ms").default(0),
  pitchToleranceCents: integer("pitch_tolerance_cents").default(25),
  pitchSmoothing: boolean("pitch_smoothing").default(true),
  preferFlats: boolean("prefer_flats").default(false),
  recordPracticeAudio: boolean("record_practice_audio").default(false),
  defaultStemProfile: varchar("default_stem_profile", { length: 20 }).default("BALANCED"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

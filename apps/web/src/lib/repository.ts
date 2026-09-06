import { CanonicalSong, ProcessingJob, SongAsset } from "@akhustico/shared";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEMO_SONGS } from "./demo-data";

type AkhusticoMemoryStore = {
  songs: CanonicalSong[];
  jobs: ProcessingJob[];
};

type AkhusticoLocalDatabase = AkhusticoMemoryStore & {
  schemaVersion: 1;
  updatedAt: string;
};

type DatabaseContext = {
  db: NonNullable<(typeof import("@/db"))["db"]>;
  schema: typeof import("@/db")["schema"];
  eq: typeof import("drizzle-orm")["eq"];
  desc: typeof import("drizzle-orm")["desc"];
};

const globalStore = globalThis as typeof globalThis & {
  __akhusticoMemoryStore?: AkhusticoMemoryStore;
  __akhusticoMemoryStoreLoaded?: boolean;
  __akhusticoMemoryStoreLoading?: Promise<void>;
  __akhusticoMemoryStoreWriteQueue?: Promise<void>;
};

const memoryStore =
  globalStore.__akhusticoMemoryStore ??
  (globalStore.__akhusticoMemoryStore = {
    songs: [...DEMO_SONGS],
    jobs: [],
  });

const dataRoot =
  process.env.AKHUSTICO_DATA_DIR ||
  path.resolve(
    process.cwd(),
    process.cwd().endsWith(path.join("apps", "web")) ? "../.." : ".",
    ".akhustico-data"
  );
const localDatabasePath = path.join(dataRoot, "akhustico.local.json");

function isDatabaseEnabled() {
  const databaseUrl = process.env.DATABASE_URL;
  return Boolean(databaseUrl && databaseUrl.startsWith("postgres"));
}

async function loadMemoryStoreFromDisk() {
  try {
    const raw = await readFile(localDatabasePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<AkhusticoLocalDatabase>;
    memoryStore.songs = Array.isArray(parsed.songs) ? parsed.songs : [];
    memoryStore.jobs = Array.isArray(parsed.jobs) ? parsed.jobs : [];
  } catch (err: any) {
    if (err?.code !== "ENOENT") {
      console.error("AKHUSTICO local database read error:", err);
      throw new Error(
        `Local AKHUSTICO storage failed to load from ${localDatabasePath}. Check file permissions or remove the corrupted file after backing it up.`
      );
    }
    await persistMemoryStore();
  }
}

async function ensureMemoryStoreLoaded() {
  if (isDatabaseEnabled() || globalStore.__akhusticoMemoryStoreLoaded) return;

  globalStore.__akhusticoMemoryStoreLoading ??= loadMemoryStoreFromDisk().then(() => {
    globalStore.__akhusticoMemoryStoreLoaded = true;
  });

  await globalStore.__akhusticoMemoryStoreLoading;
}

async function persistMemoryStore() {
  if (isDatabaseEnabled()) return;

  globalStore.__akhusticoMemoryStoreWriteQueue = (globalStore.__akhusticoMemoryStoreWriteQueue || Promise.resolve()).then(
    async () => {
      await mkdir(dataRoot, { recursive: true });
      const payload: AkhusticoLocalDatabase = {
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        songs: memoryStore.songs,
        jobs: memoryStore.jobs,
      };
      const tmpPath = `${localDatabasePath}.${process.pid}.tmp`;
      await writeFile(tmpPath, JSON.stringify(payload, null, 2), "utf8");
      await rename(tmpPath, localDatabasePath);
    }
  );

  await globalStore.__akhusticoMemoryStoreWriteQueue;
}

function handleDatabaseError(operation: string, err: unknown): never {
  console.error(`AKHUSTICO database error during ${operation}:`, err);
  throw new Error(
    `DATABASE_URL is configured, but PostgreSQL failed during ${operation}. Check Neon connectivity, credentials, and run pnpm --filter @akhustico/web db:push.`
  );
}

async function getDatabaseContext(): Promise<DatabaseContext | null> {
  if (!isDatabaseEnabled()) {
    return null;
  }

  try {
    const [{ db, schema }, { eq, desc }] = await Promise.all([import("@/db"), import("drizzle-orm")]);
    if (!db) return null;
    return { db, schema, eq, desc };
  } catch (err) {
    handleDatabaseError("database initialization", err);
  }
}

function assetRowsToRecord(rows: any[] = []): Record<string, SongAsset> {
  return rows.reduce<Record<string, SongAsset>>((assets, row) => {
    assets[row.stemType] = {
      id: row.id,
      songId: row.songId,
      stemType: row.stemType,
      blobPath: row.blobPath,
      mimeType: row.mimeType,
      duration: row.duration || undefined,
      sampleRate: row.sampleRate || undefined,
      channels: row.channels || undefined,
      model: row.modelUsed || undefined,
      createdAt: row.createdAt?.toISOString?.() || row.createdAt || undefined,
    };
    return assets;
  }, {});
}

async function getSongAssets(database: DatabaseContext, songId: string): Promise<Record<string, SongAsset>> {
  const rows = await database.db.query.songAssets.findMany({
    where: database.eq(database.schema.songAssets.songId, songId),
  });
  return assetRowsToRecord(rows);
}

async function replaceSongAssets(database: DatabaseContext, song: CanonicalSong) {
  await database.db.delete(database.schema.songAssets).where(database.eq(database.schema.songAssets.songId, song.id));

  const assets = Object.values(song.assets || {});
  if (assets.length === 0) return;

  await database.db.insert(database.schema.songAssets).values(
    assets.map((asset) => ({
      id: asset.id,
      songId: song.id,
      stemType: asset.stemType,
      blobPath: asset.blobPath,
      mimeType: asset.mimeType,
      duration: asset.duration,
      sampleRate: asset.sampleRate,
      channels: asset.channels,
      modelUsed: asset.model,
      createdAt: asset.createdAt ? new Date(asset.createdAt) : new Date(),
    }))
  );
}

function rowToSong(r: any, assets: Record<string, SongAsset> = {}): CanonicalSong {
  return {
    schemaVersion: "1.0",
    id: r.id,
    slug: r.slug,
    title: r.title,
    artist: r.artist,
    album: r.album || "",
    language: r.language,
    originalAudioUrl: r.originalAudioUrl || undefined,
    audioHash: r.audioHash,
    music: {
      originalKey: r.originalKey,
      preferredKey: r.preferredKey,
      chordShapeKey: r.chordShapeKey,
      capo: r.capo,
      tuning: r.tuning,
      bpm: r.bpm,
      timeSignature: r.timeSignature,
    },
    display:
      r.displaySettings || {
        fontScale: 1.0,
        readingMode: "large",
        showChords: true,
        showSections: true,
        autoscrollSpeed: 2,
      },
    tags: r.tags || [],
    isFavorite: r.isFavorite,
    status: r.status || "ready",
    lastPracticedAt: r.lastPracticedAt?.toISOString(),
    lyrics: r.lyricsData || { sections: [] },
    melody: r.melodyTimeline || [],
    assets,
    createdAt: r.createdAt?.toISOString(),
    updatedAt: r.updatedAt?.toISOString(),
  };
}

function rowToJob(r: any): ProcessingJob {
  return {
    id: r.id,
    songId: r.songId,
    type: r.type,
    status: r.status,
    progress: r.progress,
    stage: r.stage,
    provider: r.provider,
    input: r.inputPayload || undefined,
    output: r.outputPayload || undefined,
    error: r.errorMessage || undefined,
    attempts: r.attempts,
    createdAt: r.createdAt?.toISOString?.() || r.createdAt,
    startedAt: r.startedAt?.toISOString?.() || r.startedAt || undefined,
    finishedAt: r.finishedAt?.toISOString?.() || r.finishedAt || undefined,
  };
}

export interface SongQueryFilters {
  search?: string;
  artist?: string;
  key?: string;
  tag?: string;
  favorite?: boolean;
  sortBy?: "az" | "artist" | "recent" | "last_practiced";
}

export const songRepository = {
  async list(filters?: SongQueryFilters): Promise<CanonicalSong[]> {
    const database = await getDatabaseContext();
    if (database) {
      const { db, schema, desc } = database;
      try {
        const rows = await db.query.songs.findMany({
          orderBy: [desc(schema.songs.updatedAt)],
        });
        return Promise.all(rows.map(async (row: any) => rowToSong(row, await getSongAssets(database, row.id))));
      } catch (err) {
        handleDatabaseError("song list", err);
      }
    }

    await ensureMemoryStoreLoaded();

    // Filtrado en almacenamiento local
    let result = [...memoryStore.songs];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
      );
    }
    if (filters?.key) {
      result = result.filter((s) => s.music.preferredKey === filters.key);
    }
    if (filters?.tag) {
      result = result.filter((s) => s.tags.includes(filters.tag!));
    }
    if (filters?.favorite !== undefined) {
      result = result.filter((s) => s.isFavorite === filters.favorite);
    }

    if (filters?.sortBy === "az") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (filters?.sortBy === "artist") {
      result.sort((a, b) => a.artist.localeCompare(b.artist));
    } else if (filters?.sortBy === "last_practiced") {
      result.sort((a, b) => (b.lastPracticedAt || "").localeCompare(a.lastPracticedAt || ""));
    } else {
      // Recent por defecto
      result.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    }

    return result;
  },

  async getById(id: string): Promise<CanonicalSong | null> {
    const database = await getDatabaseContext();
    if (database) {
      const { db, schema, eq } = database;
      try {
        const row = await db.query.songs.findFirst({
          where: eq(schema.songs.id, id),
        });
        if (row) {
          return rowToSong(row, await getSongAssets(database, row.id));
        }
      } catch (err) {
        handleDatabaseError("song getById", err);
      }
    }

    await ensureMemoryStoreLoaded();
    return memoryStore.songs.find((s) => s.id === id || s.slug === id) || null;
  },

  async getByHash(audioHash: string): Promise<CanonicalSong | null> {
    const database = await getDatabaseContext();
    if (database) {
      const { db, schema, eq } = database;
      try {
        const row = await db.query.songs.findFirst({
          where: eq(schema.songs.audioHash, audioHash),
        });
        if (row) return songRepository.getById(row.id);
      } catch (err) {
        handleDatabaseError("song getByHash", err);
      }
    }
    await ensureMemoryStoreLoaded();
    return memoryStore.songs.find((s) => s.audioHash === audioHash) || null;
  },

  async create(song: CanonicalSong): Promise<CanonicalSong> {
    const database = await getDatabaseContext();
    if (database) {
      const { db, schema } = database;
      try {
        await db.insert(schema.songs).values({
          id: song.id,
          slug: song.slug,
          title: song.title,
          artist: song.artist,
          album: song.album,
          language: song.language,
          originalAudioUrl: song.originalAudioUrl,
          audioHash: song.audioHash || "no-hash",
          originalKey: song.music.originalKey,
          preferredKey: song.music.preferredKey,
          chordShapeKey: song.music.chordShapeKey,
          capo: song.music.capo,
          tuning: song.music.tuning,
          bpm: song.music.bpm,
          timeSignature: song.music.timeSignature,
          tags: song.tags,
          isFavorite: song.isFavorite,
          lyricsData: song.lyrics,
          melodyTimeline: song.melody,
          displaySettings: song.display,
        });
        await replaceSongAssets(database, song);
        return song;
      } catch (err) {
        handleDatabaseError("song create", err);
      }
    }

    await ensureMemoryStoreLoaded();
    memoryStore.songs.unshift(song);
    await persistMemoryStore();
    return song;
  },

  async update(id: string, updates: Partial<CanonicalSong>): Promise<CanonicalSong | null> {
    const database = await getDatabaseContext();
    if (database) {
      const { db, schema, eq } = database;
      const existing = await songRepository.getById(id);
      if (!existing) return null;
      const merged = {
        ...existing,
        ...updates,
        music: { ...existing.music, ...(updates.music || {}) },
        display: { ...existing.display, ...(updates.display || {}) },
        updatedAt: new Date().toISOString(),
      };

      try {
        await db
          .update(schema.songs)
          .set({
            slug: merged.slug,
            title: merged.title,
            artist: merged.artist,
            album: merged.album,
            language: merged.language,
            originalAudioUrl: merged.originalAudioUrl,
            audioHash: merged.audioHash || "no-hash",
            originalKey: merged.music.originalKey,
            preferredKey: merged.music.preferredKey,
            chordShapeKey: merged.music.chordShapeKey,
            capo: merged.music.capo,
            tuning: merged.music.tuning,
            bpm: merged.music.bpm,
            timeSignature: merged.music.timeSignature,
            status: merged.status,
            tags: merged.tags,
            isFavorite: merged.isFavorite,
            lyricsData: merged.lyrics,
            melodyTimeline: merged.melody,
            displaySettings: merged.display,
            updatedAt: new Date(),
          })
          .where(eq(schema.songs.id, id));
        await replaceSongAssets(database, merged);
        return merged;
      } catch (err) {
        handleDatabaseError("song update", err);
      }
    }

    await ensureMemoryStoreLoaded();
    const existingIndex = memoryStore.songs.findIndex((s) => s.id === id);
    if (existingIndex !== -1) {
      const merged = {
        ...memoryStore.songs[existingIndex],
        ...updates,
        music: { ...memoryStore.songs[existingIndex].music, ...(updates.music || {}) },
        display: { ...memoryStore.songs[existingIndex].display, ...(updates.display || {}) },
        updatedAt: new Date().toISOString(),
      };
      memoryStore.songs[existingIndex] = merged;
      await persistMemoryStore();
      return merged;
    }
    return null;
  },

  async delete(id: string): Promise<boolean> {
    const database = await getDatabaseContext();
    if (database) {
      const { db, schema, eq } = database;
      try {
        await db.delete(schema.songs).where(eq(schema.songs.id, id));
        return true;
      } catch (err) {
        handleDatabaseError("song delete", err);
      }
    }
    await ensureMemoryStoreLoaded();
    const initialLen = memoryStore.songs.length;
    memoryStore.songs = memoryStore.songs.filter((s) => s.id !== id);
    const deleted = memoryStore.songs.length < initialLen;
    if (deleted) {
      memoryStore.jobs = memoryStore.jobs.filter((j) => j.songId !== id);
      await persistMemoryStore();
    }
    return deleted;
  },
};

export const jobRepository = {
  async list(): Promise<ProcessingJob[]> {
    const database = await getDatabaseContext();
    if (database) {
      const { db, schema, desc } = database;
      try {
        const rows = await db.query.processingJobs.findMany({
          orderBy: [desc(schema.processingJobs.createdAt)],
        });
        return rows.map(rowToJob);
      } catch (err) {
        handleDatabaseError("job list", err);
      }
    }

    await ensureMemoryStoreLoaded();
    return memoryStore.jobs;
  },

  async getById(id: string): Promise<ProcessingJob | null> {
    const database = await getDatabaseContext();
    if (database) {
      const { db, schema, eq } = database;
      try {
        const row = await db.query.processingJobs.findFirst({
          where: eq(schema.processingJobs.id, id),
        });
        return row ? rowToJob(row) : null;
      } catch (err) {
        handleDatabaseError("job getById", err);
      }
    }

    await ensureMemoryStoreLoaded();
    return memoryStore.jobs.find((j) => j.id === id) || null;
  },

  async create(job: ProcessingJob): Promise<ProcessingJob> {
    const database = await getDatabaseContext();
    if (database) {
      const { db, schema } = database;
      try {
        await db.insert(schema.processingJobs).values({
          id: job.id,
          songId: job.songId,
          type: job.type,
          status: job.status,
          progress: job.progress,
          stage: job.stage,
          provider: job.provider,
          inputPayload: job.input || {},
          outputPayload: job.output || {},
          errorMessage: job.error,
          attempts: job.attempts,
          createdAt: new Date(job.createdAt),
          startedAt: job.startedAt ? new Date(job.startedAt) : null,
          finishedAt: job.finishedAt ? new Date(job.finishedAt) : null,
        });
        return job;
      } catch (err) {
        handleDatabaseError("job create", err);
      }
    }

    await ensureMemoryStoreLoaded();
    const existingIndex = memoryStore.jobs.findIndex((j) => j.id === job.id);
    if (existingIndex !== -1) {
      memoryStore.jobs[existingIndex] = job;
    } else {
      memoryStore.jobs.unshift(job);
    }
    await persistMemoryStore();
    return job;
  },

  async update(id: string, updates: Partial<ProcessingJob>): Promise<ProcessingJob | null> {
    const database = await getDatabaseContext();
    if (database) {
      const { db, schema, eq } = database;
      const existing = await jobRepository.getById(id);
      if (!existing) return null;
      const merged = { ...existing, ...updates };

      try {
        await db
          .update(schema.processingJobs)
          .set({
            songId: merged.songId,
            type: merged.type,
            status: merged.status,
            progress: merged.progress,
            stage: merged.stage,
            provider: merged.provider,
            inputPayload: merged.input || {},
            outputPayload: merged.output || {},
            errorMessage: merged.error,
            attempts: merged.attempts,
            startedAt: merged.startedAt ? new Date(merged.startedAt) : null,
            finishedAt: merged.finishedAt ? new Date(merged.finishedAt) : null,
          })
          .where(eq(schema.processingJobs.id, id));
        return merged;
      } catch (err) {
        handleDatabaseError("job update", err);
      }
    }

    await ensureMemoryStoreLoaded();
    const idx = memoryStore.jobs.findIndex((j) => j.id === id);
    if (idx !== -1) {
      memoryStore.jobs[idx] = { ...memoryStore.jobs[idx], ...updates };
      await persistMemoryStore();
      return memoryStore.jobs[idx];
    }
    return null;
  },
};

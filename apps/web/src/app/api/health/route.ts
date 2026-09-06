import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const isBlobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const workerUrl = process.env.AUDIO_WORKER_URL;
  let databaseStatus = "local_file_demo";

  if (process.env.DATABASE_URL?.startsWith("postgres")) {
    try {
      const [{ db }, { sql }] = await Promise.all([import("@/db"), import("drizzle-orm")]);
      if (!db) throw new Error("Database client was not initialized");
      await db.execute(sql`select 1`);
      databaseStatus = "healthy";
    } catch {
      databaseStatus = "unhealthy";
    }
  }

  let workerStatus = "not_configured";
  if (workerUrl) {
    try {
      const res = await fetch(`${workerUrl}/health`, { signal: AbortSignal.timeout(1500) });
      workerStatus = res.ok ? "healthy" : "unhealthy";
    } catch {
      workerStatus = "unreachable";
    }
  }

  return NextResponse.json({
    status: "ok",
    app: "AKHUSTICO Studio Web",
    timestamp: new Date().toISOString(),
    services: {
      web: "healthy",
      database: databaseStatus,
      blobStorage: isBlobConfigured ? "configured" : "simulated_demo",
      audioWorker: workerStatus,
    },
  });
}

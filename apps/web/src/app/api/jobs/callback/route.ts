import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { jobRepository, songRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

function verifySignature(secret: string, body: string, timestamp: string, signature: string) {
  const age = Math.abs(Date.now() - Number(timestamp));
  if (!Number.isFinite(age) || age > MAX_CLOCK_SKEW_MS) return false;

  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(req: NextRequest) {
  const secret = process.env.WORKER_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "WORKER_SECRET no configurado" }, { status: 503 });
  }

  const timestamp = req.headers.get("x-akhustico-timestamp") || "";
  const signature = req.headers.get("x-akhustico-signature") || "";
  const body = await req.text();

  if (!timestamp || !signature || !verifySignature(secret, body, timestamp, signature)) {
    return NextResponse.json({ error: "Firma de worker invalida" }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const jobId = payload.id || payload.jobId;
  const existing = await jobRepository.getById(jobId);

  if (!existing) {
    return NextResponse.json({ error: "Job inexistente" }, { status: 404 });
  }

  const status = payload.status || existing.status;
  const updated = await jobRepository.update(jobId, {
    status,
    progress: payload.progress ?? existing.progress,
    stage: payload.stage || existing.stage,
    output: payload.output || existing.output,
    error: payload.error || existing.error,
    finishedAt: ["completed", "failed", "cancelled", "partial"].includes(status)
      ? new Date().toISOString()
      : existing.finishedAt,
  });

  if (status === "completed") {
    await songRepository.update(existing.songId, { status: "ready" });
  }

  return NextResponse.json({ data: updated });
}

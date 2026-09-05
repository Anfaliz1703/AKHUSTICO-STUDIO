import { NextRequest, NextResponse } from "next/server";
import { jobRepository, songRepository } from "@/lib/repository";
import { getAudioProcessingProvider } from "@/lib/providers";
import { requireOwner } from "@/lib/auth";
import { ProcessingJob } from "@akhustico/shared";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return auth.errorResponse;
  }

  const { id } = await params;
  const song = await songRepository.getById(id);
  if (!song) {
    return NextResponse.json({ error: "Canción no encontrada" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const options = {
    separateStems: body.separateStems ?? true,
    transcribeLyrics: body.transcribeLyrics ?? true,
    detectChords: body.detectChords ?? true,
    detectBpm: body.detectBpm ?? true,
    detectKey: body.detectKey ?? true,
    extractMelody: body.extractMelody ?? true,
    stemProfile: body.stemProfile || "BALANCED",
  };

  const provider = getAudioProcessingProvider();
  const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();

  const initialJob: ProcessingJob = {
    id: jobId,
    songId: song.id,
    type: "full_analysis",
    status: "queued",
    progress: 0,
    stage: "queued",
    provider: provider.name as ProcessingJob["provider"],
    input: { options },
    attempts: 1,
    createdAt,
  };

  await jobRepository.create(initialJob);
  await songRepository.update(song.id, { status: "processing" });

  const job = await provider.submitJob({
    jobId,
    songId: song.id,
    audioUrl: song.originalAudioUrl || "https://example.com/demo.mp3",
    options,
    callbackUrl: process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/jobs/callback`
      : undefined,
  });

  return NextResponse.json({ data: job }, { status: 202 });
}

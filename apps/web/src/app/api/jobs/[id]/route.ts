import { NextRequest, NextResponse } from "next/server";
import { jobRepository } from "@/lib/repository";
import { requireOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return auth.errorResponse;
  }

  const { id } = await params;
  const job = await jobRepository.getById(id);
  if (!job) {
    return NextResponse.json({ error: "Job no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: job });
}

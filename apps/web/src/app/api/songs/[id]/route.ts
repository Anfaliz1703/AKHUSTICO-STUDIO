import { NextRequest, NextResponse } from "next/server";
import { songRepository } from "@/lib/repository";
import { requireOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return auth.errorResponse;
  }

  const { id } = await params;
  const song = await songRepository.getById(id);
  if (!song) {
    return NextResponse.json({ error: "Canción no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ data: song });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return auth.errorResponse;
  }

  const { id } = await params;
  try {
    const updates = await req.json();
    const updated = await songRepository.update(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Canción no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return auth.errorResponse;
  }

  const { id } = await params;
  const success = await songRepository.delete(id);
  if (!success) {
    return NextResponse.json({ error: "Canción no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

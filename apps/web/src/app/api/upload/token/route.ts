import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return auth.errorResponse;
  }

  const body = await req.json().catch(() => ({}));
  const pathname = body.pathname || `uploads/${Date.now()}.mp3`;

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    // Modo de desarrollo sin token de Vercel Blob configurado
    return NextResponse.json({
      clientToken: "mock-blob-token-local-dev",
      simulated: true,
      mockUploadUrl: "https://assets.mixkit.co/music/preview/mixkit-guitar-acoustic-happy-energy-1111.mp3",
    });
  }

  try {
    const clientToken = await generateClientTokenFromReadWriteToken({
      token: blobToken,
      pathname,
      maximumSizeInBytes: 150 * 1024 * 1024, // 150 MB máximo para archivos de audio
      allowedContentTypes: [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/x-wav",
        "audio/flac",
        "audio/x-m4a",
        "audio/aac",
        "audio/ogg",
      ],
    });

    return NextResponse.json({ clientToken, simulated: false });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al generar token" }, { status: 500 });
  }
}

import React from "react";
import { notFound } from "next/navigation";
import { songRepository } from "@/lib/repository";
import { SongReaderClient } from "./SongReaderClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SongReaderPage({ params }: Props) {
  const { id } = await params;
  const song = await songRepository.getById(id);

  if (!song) {
    notFound();
  }

  const allSongs = await songRepository.list({ sortBy: "recent" });
  return <SongReaderClient initialSong={song} allSongs={allSongs} />;
}

import React from "react";
import { songRepository } from "@/lib/repository";
import { LibraryClient } from "./LibraryClient";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const songs = await songRepository.list({ sortBy: "recent" });
  return <LibraryClient initialSongs={songs} />;
}

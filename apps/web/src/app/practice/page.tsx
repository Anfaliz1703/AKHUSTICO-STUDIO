import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { songRepository } from "@/lib/repository";
import { Mic2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PracticeIndexPage() {
  const songs = await songRepository.list({ sortBy: "recent" });

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader title="Practica vocal" subtitle="Selecciona una cancion para abrir Vocal Coach" />
      <main className="mx-auto w-full max-w-5xl space-y-4 p-6 md:p-8">
        {songs.map((song) => (
          <Link
            key={song.id}
            href={`/songs/${song.id}/practice`}
            className="flex items-center justify-between rounded-xl border border-studio-border bg-studio-surface p-4 hover:border-electric-500/50"
          >
            <div>
              <h2 className="font-bold text-studio-text">{song.title}</h2>
              <p className="text-sm text-studio-muted">{song.artist}</p>
            </div>
            <Mic2 className="h-5 w-5 text-electric-400" />
          </Link>
        ))}
      </main>
    </div>
  );
}

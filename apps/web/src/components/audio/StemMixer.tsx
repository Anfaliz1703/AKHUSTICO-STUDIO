"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FastForward, Pause, Play, RotateCcw } from "lucide-react";

export interface StemChannel {
  id: string;
  name: string;
  url: string;
  volume: number;
  muted: boolean;
  solo: boolean;
}

interface Props {
  stems?: Record<string, any>;
  masterAudioUrl?: string;
  bpm?: number;
  onTimeUpdate?: (currentTimeMs: number) => void;
}

const channelNames: Record<string, string> = {
  vocals: "Voz",
  guitar: "Guitarra",
  bass: "Bajo",
  drums: "Bateria",
  piano: "Piano",
  other: "Otros",
  instrumental: "Instrumental",
  master: "Master",
};

export const StemMixer: React.FC<Props> = ({ stems = {}, masterAudioUrl, bpm = 120, onTimeUpdate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);
  const [channels, setChannels] = useState<StemChannel[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const nextChannels = Object.entries(stems)
      .map(([id, asset]: [string, any]) => ({
        id,
        name: channelNames[id] || id,
        url: asset?.blobPath || asset?.url || "",
        volume: id === "master" ? 85 : 80,
        muted: false,
        solo: false,
      }))
      .filter((channel) => channel.url);

    if (nextChannels.length === 0 && masterAudioUrl) {
      nextChannels.push({
        id: "master",
        name: "Master",
        url: masterAudioUrl,
        volume: 85,
        muted: false,
        solo: false,
      });
    }

    setChannels(nextChannels);
  }, [stems, masterAudioUrl]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  const playbackUrl = useMemo(
    () =>
      masterAudioUrl ||
      channels.find((channel) => channel.id === "master")?.url ||
      channels[0]?.url ||
      "https://assets.mixkit.co/music/preview/mixkit-guitar-acoustic-happy-energy-1111.mp3",
    [channels, masterAudioUrl]
  );

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (timeSec: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = timeSec;
    setCurrentTime(timeSec);
    onTimeUpdate?.(timeSec * 1000);
  };

  const toggleMute = (channelId: string) => {
    setChannels((prev) => prev.map((c) => (c.id === channelId ? { ...c, muted: !c.muted } : c)));
  };

  const toggleSolo = (channelId: string) => {
    setChannels((prev) => {
      const isCurrentlySolo = prev.find((c) => c.id === channelId)?.solo;
      return prev.map((c) => ({ ...c, solo: c.id === channelId ? !isCurrentlySolo : false }));
    });
  };

  const updateVolume = (channelId: string, val: number) => {
    setChannels((prev) => prev.map((c) => (c.id === channelId ? { ...c, volume: val } : c)));
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="bg-studio-surface border border-studio-border rounded-xl p-5 shadow-studio-card select-none space-y-5">
      <audio
        ref={audioRef}
        src={playbackUrl}
        loop={isLooping}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setCurrentTime(t);
          onTimeUpdate?.(t * 1000);
        }}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 120)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-studio-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-electric-600 to-electric-500 hover:from-electric-500 hover:to-electric-400 text-white flex items-center justify-center shadow-studio-glow transition-all active:scale-95"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <div className="text-xs font-mono text-studio-muted">
            <span className="text-studio-text font-bold text-sm">{formatTime(currentTime)}</span>
            <span className="mx-1">/</span>
            <span>{formatTime(duration)}</span>
            <span className="ml-3 text-studio-dimmed">{Math.round(bpm)} BPM</span>
          </div>
        </div>

        <div className="flex-1 min-w-[200px] flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-studio-elevated rounded-lg appearance-none cursor-pointer accent-electric-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 bg-studio-elevated px-2 py-1 rounded-lg border border-studio-border">
            <FastForward className="w-3.5 h-3.5 text-electric-400" />
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              aria-label="Velocidad de reproduccion"
              className="bg-transparent text-studio-text font-mono focus:outline-none cursor-pointer"
            >
              <option value="0.5" className="bg-studio-surface">50%</option>
              <option value="0.75" className="bg-studio-surface">75%</option>
              <option value="0.8" className="bg-studio-surface">80%</option>
              <option value="0.9" className="bg-studio-surface">90%</option>
              <option value="1.0" className="bg-studio-surface">100%</option>
              <option value="1.1" className="bg-studio-surface">110%</option>
              <option value="1.25" className="bg-studio-surface">125%</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            className={`p-2 rounded-lg border transition-colors ${
              isLooping
                ? "bg-electric-600/20 border-electric-500 text-electric-400 font-bold"
                : "bg-studio-elevated border-studio-border text-studio-dimmed hover:text-studio-muted"
            }`}
            title="Repetir en bucle continuo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {channels.length === 0 ? (
        <div className="rounded-lg border border-studio-border bg-studio-bg/40 p-4 text-sm text-studio-muted">
          No hay pistas de audio disponibles para esta cancion.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
          {channels.map((ch) => {
            const anySoloActive = channels.some((c) => c.solo);
            const isAudible = anySoloActive ? ch.solo : !ch.muted;

            return (
              <div
                key={ch.id}
                className={`p-3 rounded-lg border transition-colors ${
                  isAudible
                    ? "bg-studio-elevated/80 border-studio-borderHighlight"
                    : "bg-studio-bg/40 border-studio-border/50 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-studio-text font-mono truncate">{ch.name}</span>
                  <span className="text-[10px] text-studio-dimmed font-mono">{ch.volume}%</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ch.volume}
                  onChange={(e) => updateVolume(ch.id, parseInt(e.target.value, 10))}
                  aria-label={`Volumen de ${ch.name}`}
                  className="w-full h-1 bg-studio-bg rounded appearance-none cursor-pointer accent-electric-400 mb-3"
                />

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleMute(ch.id)}
                    className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${
                      ch.muted
                        ? "bg-pitch-outOfTune/20 text-pitch-outOfTune border border-pitch-outOfTune/40"
                        : "bg-studio-surface text-studio-dimmed hover:text-studio-text border border-studio-border"
                    }`}
                  >
                    MUTE
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSolo(ch.id)}
                    className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${
                      ch.solo
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-studio-surface text-studio-dimmed hover:text-studio-text border border-studio-border"
                    }`}
                  >
                    SOLO
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

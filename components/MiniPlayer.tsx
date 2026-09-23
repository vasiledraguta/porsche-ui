"use client";

import { Heart, Pause, Play, Search, Shuffle, SkipBack, SkipForward, SlidersHorizontal } from "lucide-react";
import { AlbumArt } from "./AlbumArt";
import { TRACKS, useCar } from "@/lib/store";

export function MiniPlayer() {
  const s = useCar();
  const t = TRACKS[s.track];
  const liked = s.liked.includes(s.track);
  return (
    <div className="overflow-hidden rounded-[14px] bg-[#16191d] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
      <button onClick={() => s.openSheet("media")} className="flex w-full items-center gap-3.5 p-3 text-left">
        <AlbumArt size={54} radius={8} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-medium text-white">{t.title}</div>
          <div className="truncate text-[13px] text-white/50">{t.artist}</div>
        </div>
        <span className="flex items-center gap-1.5 pr-1 text-[11px] text-white/40">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff4a4a]" />
          Media
        </span>
      </button>
      <div className="h-[2px] bg-white/[0.06]">
        <div className="h-full bg-white/80" style={{ width: `${(s.progress / t.length) * 100}%` }} />
      </div>
      <div className="flex items-center justify-between px-3 py-1.5 text-white/75">
        <Btn label="Previous" onClick={() => s.nextTrack(-1)}>
          <SkipBack size={19} fill="currentColor" strokeWidth={1.4} />
        </Btn>
        <Btn label={s.playing ? "Pause" : "Play"} onClick={() => s.set({ playing: !s.playing })}>
          {s.playing ? <Pause size={21} fill="currentColor" strokeWidth={0} /> : <Play size={21} fill="currentColor" strokeWidth={0} />}
        </Btn>
        <Btn label="Next" onClick={() => s.nextTrack(1)}>
          <SkipForward size={19} fill="currentColor" strokeWidth={1.4} />
        </Btn>
        <Btn
          label="Like"
          onClick={() => s.set({ liked: liked ? s.liked.filter((x) => x !== s.track) : [...s.liked, s.track] })}
        >
          <Heart size={18} strokeWidth={1.6} fill={liked ? "#ff4a4a" : "none"} color={liked ? "#ff4a4a" : "currentColor"} />
        </Btn>
        <Btn label="Shuffle" onClick={() => s.nextTrack(1)}>
          <Shuffle size={17} strokeWidth={1.6} />
        </Btn>
        <Btn label="Sound" onClick={() => s.openSheet("media")}>
          <SlidersHorizontal size={17} strokeWidth={1.6} />
        </Btn>
        <Btn label="Search" onClick={() => s.openSheet("media")}>
          <Search size={17} strokeWidth={1.6} />
        </Btn>
      </div>
    </div>
  );
}

function Btn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-white/[0.06] hover:text-white active:scale-95"
    >
      {children}
    </button>
  );
}

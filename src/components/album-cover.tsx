"use client";

import { cn } from "@/lib/utils";
import type { AlbumCover, CoverMotif } from "@/lib/types";

function Motif({ motif, accent }: { motif: CoverMotif; accent: string }) {
  if (motif === "rings") {
    return (
      <>
        <div
          className="absolute inset-[18%] rounded-full border"
          style={{ borderColor: accent }}
        />
        <div
          className="absolute inset-[32%] rounded-full border opacity-70"
          style={{ borderColor: accent }}
        />
        <div
          className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: accent }}
        />
      </>
    );
  }
  if (motif === "grid") {
    return (
      <div
        className="absolute inset-5 opacity-70"
        style={{
          backgroundImage: `linear-gradient(${accent}33 1px, transparent 1px), linear-gradient(90deg, ${accent}33 1px, transparent 1px)`,
          backgroundSize: "18% 18%",
        }}
      />
    );
  }
  if (motif === "split") {
    return (
      <div
        className="absolute inset-y-0 right-0 w-1/3 opacity-80"
        style={{ background: accent }}
      />
    );
  }
  if (motif === "orbit") {
    return (
      <>
        <div
          className="absolute left-[12%] top-[18%] size-16 rounded-full border"
          style={{ borderColor: accent }}
        />
        <div
          className="absolute right-[14%] bottom-[16%] size-8 rounded-full"
          style={{ background: accent }}
        />
      </>
    );
  }
  if (motif === "bars") {
    return (
      <div className="absolute inset-x-6 bottom-6 flex h-1/2 items-end gap-1.5">
        {[40, 70, 55, 90, 35, 64].map((height, index) => (
          <div
            key={index}
            className="flex-1 rounded-sm"
            style={{ height: `${height}%`, background: accent }}
          />
        ))}
      </div>
    );
  }
  return (
    <div
      className="absolute -right-8 -bottom-10 size-40 rounded-full opacity-70"
      style={{ background: accent }}
    />
  );
}

export function AlbumCover({
  cover,
  className,
  title,
}: {
  cover: AlbumCover;
  className?: string;
  title: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-xl shadow-[0_18px_40px_-18px_rgba(0,0,0,0.65)] ring-1 ring-white/10",
        className
      )}
      style={{
        background: `linear-gradient(145deg, ${cover.from}, ${cover.to})`,
      }}
    >
      <Motif motif={cover.motif} accent={cover.accent} />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-3">
        <p className="truncate font-heading text-sm tracking-wide text-white/90">
          {title}
        </p>
      </div>
    </div>
  );
}

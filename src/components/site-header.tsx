"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Disc3Icon } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SiteHeader({
  query,
  onQueryChange,
  actions,
}: {
  query?: string;
  onQueryChange?: (value: string) => void;
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[oklch(0.16_0.025_55)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Disc3Icon className="size-4" />
          </span>
          <span className="font-heading text-lg tracking-tight">Music Cloud</span>
        </Link>
        {onQueryChange ? (
          <div className="flex-1 md:px-8">
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search albums, artists, tracks"
              aria-label="Search the library"
              className="h-10 bg-white/5"
            />
          </div>
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}

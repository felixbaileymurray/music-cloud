"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";

export function CollageModeSwitch() {
  const pathname = usePathname();
  const router = useRouter();
  const value = pathname.startsWith("/images") ? "images" : "music";

  return (
    <SegmentedControl
      label="Collage mode"
      value={value}
      layout="fill"
      size="sm"
      onChange={(next) => {
        router.push(next === "images" ? "/images" : "/music");
      }}
    >
      <SegmentedControlItem value="music" label="Music" />
      <SegmentedControlItem value="images" label="Images" />
    </SegmentedControl>
  );
}

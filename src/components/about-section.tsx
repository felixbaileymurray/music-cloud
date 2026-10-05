"use client";

import { useState } from "react";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Heart, Info } from "lucide-react";
import { AboutModal } from "@/components/about-modal";
import { author } from "@/lib/author";

export function AboutSection() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      <HStack gap={1} vAlign="center" width="100%">
        <IconButton
          label="About"
          tooltip="About"
          variant="ghost"
          size="sm"
          onClick={() => setAboutOpen(true)}
          icon={<Icon icon={Info} size="sm" />}
        />
        <IconButton
          label="Support"
          tooltip="Support"
          variant="ghost"
          size="sm"
          href={author.buyMeACoffeeUrl}
          target="_blank"
          rel="noopener noreferrer"
          icon={<Icon icon={Heart} size="sm" />}
        />
      </HStack>
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}

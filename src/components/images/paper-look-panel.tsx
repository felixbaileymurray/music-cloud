"use client";

import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { CollageKnob } from "@/components/collage/collage-knob";
import { PAPER_PALETTES, type PaperPalette } from "@/lib/paper-presets";
import { Button } from "@astryxdesign/core/Button";
import { HStack } from "@astryxdesign/core/HStack";

export function PaperLookPanel({
  paletteId,
  onPaletteIdChange,
  roughness,
  onRoughnessChange,
}: {
  paletteId: string;
  onPaletteIdChange: (id: string) => void;
  roughness: number;
  onRoughnessChange: (value: number) => void;
}) {
  return (
    <VStack gap={4} width="100%">
      <VStack gap={2} width="100%">
        <Heading level={3}>Canvas</Heading>
        <Text type="body" color="secondary">
          Paper colour and grain behind your photos. Covers stay sharp on top.
        </Text>
      </VStack>

      <VStack gap={2} width="100%">
        <Heading level={4}>Paper style</Heading>
        <HStack gap={2} width="100%">
          {PAPER_PALETTES.map((palette) => (
            <Button
              key={palette.id}
              label={palette.label}
              variant={paletteId === palette.id ? "primary" : "secondary"}
              size="sm"
              onClick={() => onPaletteIdChange(palette.id)}
            />
          ))}
        </HStack>
      </VStack>

      <CollageKnob
        label="Grain"
        hint="Fine paper grain across the canvas."
        display={roughness.toFixed(2)}
        min={0}
        max={1}
        step={0.05}
        value={roughness}
        onChange={onRoughnessChange}
      />
    </VStack>
  );
}

export function paletteById(id: string): PaperPalette {
  return PAPER_PALETTES.find((p) => p.id === id) ?? PAPER_PALETTES[0];
}

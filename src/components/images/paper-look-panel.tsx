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
  overlap,
  onOverlapChange,
  frame,
  onFrameChange,
}: {
  paletteId: string;
  onPaletteIdChange: (id: string) => void;
  roughness: number;
  onRoughnessChange: (value: number) => void;
  overlap: number;
  onOverlapChange: (value: number) => void;
  frame: number;
  onFrameChange: (value: number) => void;
}) {
  return (
    <VStack gap={4} width="100%">
      <VStack gap={2} width="100%">
        <Heading level={3}>Canvas</Heading>
        <Text type="body" color="secondary">
          Paper colour and grain behind your photos.
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

      <VStack gap={3} width="100%">
        <Heading level={4}>Items</Heading>
        <CollageKnob
          label="Spacing"
          hint="Extra gap between items."
          display={`${overlap}px`}
          min={0}
          max={24}
          step={1}
          value={overlap}
          onChange={onOverlapChange}
        />
        <CollageKnob
          label="Frame"
          hint="Border thickness around each item."
          display={`${frame}px`}
          min={0}
          max={8}
          step={1}
          value={frame}
          onChange={onFrameChange}
        />
      </VStack>
    </VStack>
  );
}

export function paletteById(id: string): PaperPalette {
  return PAPER_PALETTES.find((p) => p.id === id) ?? PAPER_PALETTES[0];
}

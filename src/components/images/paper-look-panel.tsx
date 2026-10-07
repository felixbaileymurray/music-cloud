"use client";

import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Switch } from "@astryxdesign/core/Switch";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { CollageKnob } from "@/components/collage/collage-knob";
import {
  PAPER_PALETTES,
  type PaperPalette,
  type PaperTextureControls,
} from "@/lib/paper-presets";

export function PaperLookPanel({
  enabled,
  onEnabledChange,
  paletteId,
  onPaletteIdChange,
  controls,
  onControlsChange,
}: {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  paletteId: string;
  onPaletteIdChange: (id: string) => void;
  controls: PaperTextureControls;
  onControlsChange: (next: Partial<PaperTextureControls>) => void;
}) {
  return (
    <VStack gap={4} width="100%">
      <VStack gap={2} width="100%">
        <Heading level={3}>Canvas</Heading>
        <Text type="body" color="secondary">
          Paper colour and grain behind your photos. Covers stay sharp on top.
        </Text>
      </VStack>

      <Switch
        label="Paper texture"
        description="Grain, wrinkles, and speckles over the canvas colour."
        value={enabled}
        onChange={onEnabledChange}
        labelPosition="start"
        labelSpacing="spread"
        width="100%"
        size="sm"
      />

      <VStack gap={2} width="100%">
        <Heading level={4}>Paper colour</Heading>
        <HStack gap={2} width="100%" wrap="wrap" vAlign="start">
          {PAPER_PALETTES.map((palette) => {
            const selected = paletteId === palette.id;
            return (
              <button
                key={palette.id}
                type="button"
                className={
                  selected
                    ? "spa-paper-swatch spa-paper-swatch--selected"
                    : "spa-paper-swatch"
                }
                data-palette={palette.id}
                aria-label={palette.label}
                aria-pressed={selected}
                title={palette.label}
                onClick={() => onPaletteIdChange(palette.id)}
              />
            );
          })}
        </HStack>
      </VStack>

      <CollageKnob
        label="Blending"
        hint="How strongly paper pattern mixes with the sheet."
        display={controls.blending.toFixed(2)}
        min={0}
        max={1}
        step={0.01}
        value={controls.blending}
        onChange={(blending) => onControlsChange({ blending })}
      />
      <CollageKnob
        label="Seed"
        hint="Shifts every pattern so the grain layout changes."
        display={String(Math.round(controls.seed))}
        min={0}
        max={1000}
        step={1}
        value={controls.seed}
        onChange={(seed) => onControlsChange({ seed })}
      />
      <CollageKnob
        label="Roughness"
        hint="Fine paper grain across the canvas."
        display={controls.roughness.toFixed(2)}
        min={0}
        max={1}
        step={0.01}
        value={controls.roughness}
        onChange={(roughness) => onControlsChange({ roughness })}
      />
      <CollageKnob
        label="Wrinkles"
        hint="Faceted creases repeating across the surface."
        display={controls.wrinkles.toFixed(2)}
        min={0}
        max={1}
        step={0.01}
        value={controls.wrinkles}
        onChange={(wrinkles) => onControlsChange({ wrinkles })}
      />
      <CollageKnob
        label="Drops"
        hint="Speckle pattern that darkens the paper."
        display={controls.drops.toFixed(2)}
        min={0}
        max={1}
        step={0.01}
        value={controls.drops}
        onChange={(drops) => onControlsChange({ drops })}
      />
    </VStack>
  );
}

export function paletteById(id: string): PaperPalette {
  return PAPER_PALETTES.find((p) => p.id === id) ?? PAPER_PALETTES[0];
}

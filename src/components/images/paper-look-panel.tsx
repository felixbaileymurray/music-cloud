"use client";

import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Switch } from "@astryxdesign/core/Switch";
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
  frame,
  onFrameChange,
}: {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  paletteId: string;
  onPaletteIdChange: (id: string) => void;
  controls: PaperTextureControls;
  onControlsChange: (next: Partial<PaperTextureControls>) => void;
  frame: number;
  onFrameChange: (value: number) => void;
}) {
  return (
    <VStack gap={8} width="100%">
      <VStack gap={4} width="100%">
        <Heading level={3}>Canvas</Heading>

        <VStack gap={6} width="100%">
          <VStack gap={2} width="100%">
            <Heading level={4}>Background colour</Heading>
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
                    style={{ background: palette.colorPaper }}
                    aria-label={palette.label}
                    aria-pressed={selected}
                    title={palette.label}
                    onClick={() => onPaletteIdChange(palette.id)}
                  />
                );
              })}
            </HStack>
          </VStack>

          <VStack gap={4} width="100%">
            <Switch
              label="Paper texture"
              value={enabled}
              onChange={onEnabledChange}
              labelPosition="start"
              labelSpacing="spread"
              width="100%"
              size="sm"
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
        </VStack>
      </VStack>

      <VStack gap={3} width="100%">
        <Heading level={3}>Frame</Heading>
        <CollageKnob
          label="Width"
          hint="Border thickness around each photo. Visual only — does not affect spacing."
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

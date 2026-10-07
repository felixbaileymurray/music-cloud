"use client";

import { Slider } from "@astryxdesign/core/Slider";

export function CollageKnob({
  label,
  hint,
  display,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  display: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Slider
      label={label}
      labelTooltip={hint}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      formatValue={() => display}
      valueDisplay="text"
      width="100%"
    />
  );
}

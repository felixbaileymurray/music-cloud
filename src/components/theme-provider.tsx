"use client";

import { Theme } from "@astryxdesign/core/theme";
import { bricolaTheme } from "@/theme/bricola";
import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <Theme theme={bricolaTheme} mode="light">
      {children}
    </Theme>
  );
}

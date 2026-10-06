import { Bricolage_Grotesque, DM_Sans } from "next/font/google";

/** All non-heading UI (body, labels, buttons, inputs). */
export const fontBody = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bricola-body",
  display: "swap",
});

/** Headings — bold only (matches loaded weight). */
export const fontHeading = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-bricola-heading",
  display: "swap",
});

export const fontClassNames = `${fontBody.variable} ${fontHeading.variable}`;

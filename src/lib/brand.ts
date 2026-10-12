/** Product brand — see `.cursor/rules/brand.mdc`. Change here when the product is renamed. */
const domain = "bricola.art";

export const brand = {
  /** Wordmark / chrome — lowercase. */
  name: "bricola",
  /** Prose ("Bricola is a …"). */
  nameSentence: "Bricola",
  /** Filenames and UA token. */
  slug: "bricola",
  domain,
  origin: `https://${domain}`,
  /** Feedback, support, and other product contact. */
  contactEmail: `felix@${domain}`,
} as const;

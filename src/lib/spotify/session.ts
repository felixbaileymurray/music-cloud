import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

function deriveKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

export function sealPayload<T>(payload: T, secret: string): string {
  const iv = randomBytes(12);
  const key = deriveKey(secret);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const json = JSON.stringify(payload);
  const encrypted = Buffer.concat([
    cipher.update(json, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function unsealPayload<T>(sealed: string, secret: string): T | null {
  try {
    const raw = Buffer.from(sealed, "base64url");
    if (raw.length < 12 + 16 + 1) return null;
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);
    const key = deriveKey(secret);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export type SpotifyTokenPayload = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export const SPOTIFY_TOKEN_COOKIE = "mc_spotify_session";
export const SPOTIFY_OAUTH_STATE_COOKIE = "mc_spotify_oauth_state";
export const SPOTIFY_CODE_VERIFIER_COOKIE = "mc_spotify_code_verifier";

export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

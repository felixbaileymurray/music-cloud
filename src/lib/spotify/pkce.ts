import { createHash, randomBytes } from "crypto";

function base64UrlEncode(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateCodeVerifier() {
  return base64UrlEncode(randomBytes(32));
}

export function generateCodeChallenge(verifier: string) {
  const digest = createHash("sha256").update(verifier).digest();
  return base64UrlEncode(digest);
}

export function generateOAuthState() {
  return base64UrlEncode(randomBytes(16));
}

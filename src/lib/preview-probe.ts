/** Confirm a preview URL returns audio bytes (Deezer tokens die; empty geo stubs exist). */
export async function previewUrlPlayable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: { Range: "bytes=0-1023" },
      cache: "no-store",
    });
    if (!(response.ok || response.status === 206)) return false;
    const type = response.headers.get("content-type") ?? "";
    if (type && !type.startsWith("audio/") && !type.includes("mpeg")) {
      return false;
    }
    const bytes = await response.arrayBuffer();
    return bytes.byteLength > 0;
  } catch {
    return false;
  }
}

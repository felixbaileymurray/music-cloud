import { expect, type Page, type Route } from "@playwright/test";

const MOCK_COVER_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const MOCK_CLIP = { kind: "deezer" as const, trackId: 1 };

async function fulfillPreview(route: Route) {
  const body = route.request().postDataJSON() as {
    album?: string;
    artist?: string;
  };
  const album = body.album ?? "Unknown album";
  const artist = body.artist ?? "Unknown artist";
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      album,
      artist,
      coverUrl: MOCK_COVER_URL,
      clips: [MOCK_CLIP],
    }),
  });
}

async function fulfillPreviewTrack(route: Route) {
  const body = route.request().postDataJSON() as {
    track?: string;
    artist?: string;
    album?: string;
  };
  const track = body.track ?? "Unknown track";
  const artist = body.artist ?? "Unknown artist";
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      track,
      artist,
      album: body.album,
      coverUrl: MOCK_COVER_URL,
      clips: [MOCK_CLIP],
    }),
  });
}

/** Mock preview lookups so create/resolve does not hit Deezer or iTunes. */
export async function installPreviewMocks(page: Page) {
  await page.route("**/api/spotify/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ connected: false, configured: false }),
    });
  });
  await page.route("**/api/preview", fulfillPreview);
  await page.route("**/api/preview-track", fulfillPreviewTrack);
}

export async function clickSeeAnExample(page: Page) {
  await expect(
    page.getByText("Choose a way to create your personalised music cloud.")
  ).toBeVisible();
  const example = page.getByRole("button", { name: "See an example" });
  await example.scrollIntoViewIfNeeded();
  await example.evaluate((button) => {
    (button as HTMLButtonElement).click();
  });
}

import { expect, type Page } from "@playwright/test";
import { clickSeeAnExample, installPreviewMocks } from "./mock-apis";

/** Controls sidebar (brand, create/share/save, import status, about). */
export function sidebar(page: Page) {
  return page.getByLabel("Cloud sidebar");
}

/** Album/track details sidebar on the right. */
export function detailsSidebar(page: Page) {
  return page.getByLabel("Details sidebar");
}

export function cloudCovers(page: Page) {
  return page
    .getByLabel("Cloud canvas")
    .getByRole("button", { name: / by / });
}

/** Dismiss the audio unlock overlay when it covers the cloud canvas. */
export async function dismissAudioUnlock(page: Page) {
  const unlock = page.getByRole("button", {
    name: "Click to view cloud and enable audio",
  });
  if (await unlock.isVisible().catch(() => false)) {
    await unlock.click();
  }
}

/** Create → See an example → wait until at least one cover is on the canvas. */
export async function seedCloudViaExample(page: Page) {
  await installPreviewMocks(page);
  await page.goto("/");
  await sidebar(page).getByRole("button", { name: "Create" }).click();
  await clickSeeAnExample(page);
  await expect(page.getByText("Fetching covers and snippets")).toBeVisible();
  await expect(cloudCovers(page).first()).toBeVisible({ timeout: 60_000 });
  await dismissAudioUnlock(page);
}

export async function expectCoverVisible(
  page: Page,
  album: string,
  artist: string,
  timeout = 60_000
) {
  await expect(
    page.getByRole("button", { name: `${album} by ${artist}` })
  ).toBeVisible({ timeout });
}

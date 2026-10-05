import { test, expect } from "@playwright/test";
import { clickSeeAnExample, installPreviewMocks } from "../helpers/mock-apis";
import {
  cloudCovers,
  dismissAudioUnlock,
} from "../helpers/cloud";

test.describe("create via example", () => {
  test("shows cover buttons after example resolve", async ({ page }) => {
    await installPreviewMocks(page);
    await page.goto("/");

    await page
      .getByLabel("Cloud canvas")
      .getByRole("button", { name: "Create" })
      .click();
    await clickSeeAnExample(page);

    await expect(page.getByText("Fetching covers and snippets")).toBeVisible();
    await expect(cloudCovers(page).first()).toBeVisible({ timeout: 60_000 });
    await dismissAudioUnlock(page);
    await expect(cloudCovers(page).first()).toBeVisible();
  });
});

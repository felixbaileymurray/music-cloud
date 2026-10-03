import { test, expect } from "@playwright/test";
import {
  expectCoverVisible,
  seedCloudViaExample,
  sidebar,
} from "../helpers/cloud";
import { installPreviewMocks } from "../helpers/mock-apis";
import { shareHashForDocument } from "../helpers/share";

test.describe("share cloud", () => {
  test("copies share link to clipboard", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await seedCloudViaExample(page);

    await sidebar(page).getByRole("button", { name: "Share" }).click();
    await expect(page.getByText("Share cloud")).toBeVisible();

    const copyButton = page.getByRole("button", { name: "Copy share link" });
    await expect(copyButton).toBeEnabled({ timeout: 30_000 });
    await copyButton.click();
    await expect(page.getByText("Link copied.")).toBeVisible();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain("#mc1=");
    expect(clipboard).toContain("127.0.0.1:43217");
  });

  test("opens a shared cloud from hash link", async ({ page }) => {
    await installPreviewMocks(page);
    const hash = await shareHashForDocument();
    await page.goto(`/#${hash}`);

    await expectCoverVisible(page, "Abbey Road", "The Beatles", 60_000);
  });
});

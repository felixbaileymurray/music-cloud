import { test, expect } from "@playwright/test";
import { seedCloudViaExample, sidebar } from "../helpers/cloud";
import fs from "node:fs/promises";
import { isShareDocument } from "../../../src/lib/share-payload";

test.describe("save cloud", () => {
  test("downloads JSON snapshot of visible items", async ({ page }) => {
    await seedCloudViaExample(page);

    await sidebar(page).getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Save cloud")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download JSON" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /^music-cloud-album-\d{4}-\d{2}-\d{2}\.json$/
    );

    const path = await download.path();
    expect(path).toBeTruthy();
    const text = await fs.readFile(path!, "utf8");

    const parsed = JSON.parse(text) as unknown;
    expect(isShareDocument(parsed)).toBe(true);
    if (isShareDocument(parsed)) {
      expect(parsed.kind).toBe("album");
      expect(parsed.listens.length).toBeGreaterThan(0);
    }
  });
});

import { test, expect } from "@playwright/test";
import { seedCloudViaExample, sidebar } from "../helpers/cloud";

test.describe("replace gate", () => {
  test("warns before overwriting an existing cloud", async ({ page }) => {
    await seedCloudViaExample(page);

    await sidebar(page).getByRole("button", { name: "Create" }).click();
    await expect(page.getByText("Replace current cloud?")).toBeVisible();
    await expect(
      page.getByText("Creating a new cloud will overwrite the existing one.")
    ).toBeVisible();

    await page.getByRole("button", { name: "Create anyway" }).click();
    await expect(page.getByRole("button", { name: "See an example" })).toBeVisible();
  });
});

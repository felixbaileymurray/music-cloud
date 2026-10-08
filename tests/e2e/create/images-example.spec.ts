import { test, expect } from "@playwright/test";

test.describe("images create via example", () => {
  test("chooser offers Create Manually and See an example", async ({ page }) => {
    await page.goto("/images");

    await page
      .getByLabel("Cloud canvas")
      .getByRole("button", { name: "Create" })
      .click();

    await expect(
      page.getByText("Choose a way to create your image collage.")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Manually" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "See an example" })
    ).toBeVisible();
  });

  test("See an example loads architecture photos on the canvas", async ({
    page,
  }) => {
    await page.goto("/images");

    await page
      .getByLabel("Cloud canvas")
      .getByRole("button", { name: "Create" })
      .click();

    const example = page.getByRole("button", { name: "See an example" });
    await example.scrollIntoViewIfNeeded();
    await example.evaluate((button) => {
      (button as HTMLButtonElement).click();
    });

    const covers = page.locator(".cover-cloud__node");
    await expect(covers.first()).toBeVisible({ timeout: 30_000 });
    await expect(covers).toHaveCount(24, { timeout: 30_000 });
  });

  test("Create Manually opens the file intake step", async ({ page }) => {
    await page.goto("/images");

    await page
      .getByLabel("Cloud canvas")
      .getByRole("button", { name: "Create" })
      .click();

    const manual = page.getByRole("button", { name: "Create Manually" });
    await manual.scrollIntoViewIfNeeded();
    // ClickableCard content can intercept Playwright's actionability click;
    // mirror the music example helper and fire a DOM click.
    await manual.evaluate((button) => {
      (button as HTMLButtonElement).click();
    });

    await expect(
      page.getByRole("button", { name: "Choose images" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
  });
});


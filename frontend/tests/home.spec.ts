import { test, expect } from "@playwright/test";
for (const width of [360, 390, 768, 1024, 1440]) {
  test(`inicio accesible y sin desbordamiento a ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Compara carreras.",
    );
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    if (width < 768) {
      await page.getByRole("button", { name: "Abrir menú" }).click();
      await expect(
        page
          .getByRole("navigation")
          .getByRole("link", { name: "Carreras", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: "Abrir menú" }),
      ).toHaveAttribute("aria-expanded", "false");
    }
    await page.screenshot({
      path: testInfo.outputPath(`inicio-${width}.jpg`),
      fullPage: true,
      type: "jpeg",
      quality: 75,
    });
    await page.getByRole("button", { name: "Modo ligero" }).click();
    await expect(page.locator(".hero-art")).toBeHidden();
  });
}
test("ruta inexistente permite volver", async ({ page }) => {
  await page.goto("/ruta-inexistente");
  await page.getByRole("link", { name: "Volver al inicio" }).click();
  await expect(page).toHaveURL("/");
});

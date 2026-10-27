import { test, expect } from "./fixtures/test";

test("carrusel permite recorrer instituciones y abrir su catálogo", async ({
  page,
}) => {
  await page.goto("/");
  const carousel = page.getByRole("region", {
    name: "Universidades e institutos para explorar.",
  });
  await expect(
    carousel.getByRole("link", { name: /^Explorar carreras en / }),
  ).toHaveCount(23);
  const previous = carousel.getByRole("button", {
    name: "Instituciones anteriores",
  });
  await expect(previous).toBeDisabled();
  await carousel.getByRole("button", { name: "Más instituciones" }).click();
  await expect(previous).toBeEnabled();
  await previous.click();
  await expect(previous).toBeDisabled();
  await carousel
    .getByRole("link", {
      name: "Explorar carreras en Universidad Tecnológica del Perú",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/institucion_id=1/);
});

test("cifras finales disponibles con movimiento reducido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const stats = page.getByRole("region", { name: "El catálogo en cifras" });
  await stats.scrollIntoViewIfNeeded();
  for (const [index, value] of [170, 414, 23, 8].entries()) {
    await expect(
      stats.locator("strong > span[aria-hidden]").nth(index),
    ).toHaveText(String(value));
  }
});
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

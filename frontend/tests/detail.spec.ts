import { expect, test } from "./fixtures/test";
test("detalle conserva filtros y presenta fuentes", async ({ page }) => {
  await page.goto("/carreras?q=software&distrito_id=5");
  await page
    .getByTestId("offer-card")
    .first()
    .getByRole("link", { name: "Ver detalles" })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Software",
  );
  await expect(
    page.getByRole("heading", { name: "Fuentes de esta opción." }),
  ).toBeVisible();
  await expect(
    page.getByText("Síntesis editorial ORIENTA", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Volver al catálogo" }).click();
  await expect(page).toHaveURL(/q=software&distrito_id=5/);
});
for (const width of [360, 390, 768, 1024, 1440])
  test(`detalle sin desbordamiento ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/carreras/10");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Software",
    );
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`detalle-${width}.jpg`),
      type: "jpeg",
      quality: 65,
      fullPage: true,
    });
  });
test("oferta inexistente conserva acceso al catalogo", async ({ page }) => {
  await page.goto("/carreras/999999");
  await expect(page.getByRole("alert")).toContainText("no está en el catálogo");
  await expect(
    page.getByRole("link", { name: "Volver al catálogo" }),
  ).toBeVisible();
});

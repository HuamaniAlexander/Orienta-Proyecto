import { expect, test } from "./fixtures/test";
test("seleccion de dos ofertas se conserva y permite reemplazo", async ({
  page,
}) => {
  await page.goto("/carreras");
  await page
    .getByTestId("offer-card")
    .nth(0)
    .getByRole("button", { name: "Comparar", exact: true })
    .click();
  await page
    .getByTestId("offer-card")
    .nth(1)
    .getByRole("button", { name: "Comparar", exact: true })
    .click();
  await expect(
    page
      .getByTestId("offer-card")
      .nth(2)
      .getByRole("button", { name: "Comparar", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("complementary", { name: "Opciones seleccionadas" }),
  ).toContainText("2 de 2 opciones");
  await page
    .getByRole("link", { name: "Comparar opciones", exact: true })
    .click();
  await expect(
    page.getByText("Comparas dos ofertas de la misma carrera:", {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /^Quitar / })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Completa tu comparación" }),
  ).toBeVisible();
});
for (const width of [360, 390, 768, 1024, 1440])
  test(`comparacion legible ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/comparar?opciones=10,110");
    await expect(
      page.getByRole("region", { name: "Criterios de comparación" }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`comparador-${width}.jpg`),
      fullPage: true,
      type: "jpeg",
      quality: 65,
    });
    await page.getByRole("checkbox", { name: "Solo diferencias" }).check();
    await expect(page.locator(".comparison-row:not(.different)")).toHaveCount(
      0,
    );
  });
test("enlace duplicado se rechaza sin perder el catalogo", async ({ page }) => {
  await page.goto("/comparar?opciones=10,10");
  await expect(page.getByRole("alert")).toContainText("opciones diferentes");
  await expect(
    page.getByRole("link", { name: "Volver al catálogo" }),
  ).toBeVisible();
});

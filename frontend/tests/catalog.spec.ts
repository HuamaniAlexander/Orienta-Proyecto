import { expect, test } from "./fixtures/test";

test("busqueda combinada, URL y estado vacio", async ({ page }) => {
  await page.goto("/carreras?q=software&distrito_id=5");
  await expect(page.getByTestId("offer-card")).toHaveCount(3);
  await page.getByLabel("Modalidad", { exact: true }).selectOption("1");
  await expect(page).toHaveURL(/modalidad_id=1/);
  await expect(page.getByTestId("offer-card").first()).toContainText(
    "Software",
  );
  await page
    .getByLabel("Buscar carrera o institución")
    .fill("zzzinexistentezz");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "No encontramos opciones con estos filtros.",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver todas las opciones" }).click();
  await expect(page.getByTestId("offer-card")).toHaveCount(12);
  await page.getByRole("button", { name: "Siguiente" }).click();
  await expect(page).toHaveURL(/page=2/);
});

for (const width of [360, 390, 768, 1024, 1440]) {
  test(`catalogo sin desbordamiento ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/carreras?area_id=1");
    await expect(page.getByTestId("offer-card").first()).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`catalogo-${width}.jpg`),
      fullPage: true,
      type: "jpeg",
      quality: 70,
    });
  });
}

test("fallo de red permite reintentar", async ({ page }) => {
  await page.route("**/api/ofertas?**", (route) =>
    route.fulfill({
      status: 503,
      json: { detail: "Servicio temporalmente no disponible" },
    }),
  );
  await page.goto("/carreras");
  await expect(page.getByRole("alert")).toContainText(
    "Servicio temporalmente no disponible",
  );
  await expect(
    page.getByRole("button", { name: "Volver a intentar" }),
  ).toBeVisible();
});

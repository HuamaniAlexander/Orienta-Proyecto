import { expect, test } from "./fixtures/test";
import ucss from "./fixtures/ucss.json" with { type: "json" };

test("el tarifario conserva los importes y distingue crédito de matrícula", async ({
  page,
}) => {
  await page.route(`**/api/ofertas/${ucss.oferta.oferta_id}`, (route) =>
    route.fulfill({ json: ucss }),
  );
  await page.goto(`/carreras/${ucss.oferta.oferta_id}`);
  await expect(page.getByRole("table")).not.toBeVisible();
  await page.getByText("Ver tarifario por categoría", { exact: false }).click();
  const table = page.getByRole("table");
  await expect(
    table.getByRole("columnheader", { name: "Por crédito" }),
  ).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Matrícula" }),
  ).toBeVisible();
  const first = table.locator("tbody tr").first();
  await expect(first).toContainText("38.50");
  await expect(first).toContainText("350.00");
});

test("la ficha presenta datos ausentes sin convertirlos en cero", async ({
  page,
}) => {
  await page.route(`**/api/ofertas/${ucss.oferta.oferta_id}`, (route) =>
    route.fulfill({
      json: {
        ...ucss,
        oferta: { ...ucss.oferta, duracion_valor: null, consulta_costos: null },
        tarifas: [],
      },
    }),
  );
  await page.goto(`/carreras/${ucss.oferta.oferta_id}`);
  await expect(
    page.getByText("Consulta la duración", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".detail-costs")).toContainText(
    "No hay un costo publicado",
  );
  await expect(page.locator(".detail-costs")).not.toContainText("S/ 0");
});
test("detalle conserva filtros y presenta fuentes", async ({ page }) => {
  await page.goto("/carreras?q=software&distrito_id=5");
  await page
    .getByTestId("offer-card")
    .first()
    .getByRole("link", { name: "Ver carrera" })
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
    if (width >= 1024) {
      const panels = await page
        .locator(".detail-content-grid > .detail-section")
        .evaluateAll((elements) =>
          elements
            .slice(0, 4)
            .map((element) => element.getBoundingClientRect().height),
        );
      expect(panels[0]).toBeCloseTo(panels[1], 0);
      expect(panels[2]).toBeCloseTo(panels[3], 0);
    }
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

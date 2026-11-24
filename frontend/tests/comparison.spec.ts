import { expect, test } from "./fixtures/test";
import fixture from "./fixtures/catalog.json" with { type: "json" };
import ucss from "./fixtures/ucss.json" with { type: "json" };
test("footer compacto fuera del catálogo aunque existan selecciones", async ({
  page,
}) => {
  await page.goto("/carreras");
  await page
    .getByTestId("offer-card")
    .first()
    .getByRole("button", { name: "Añadir a comparación", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Opciones seleccionadas" }),
  ).toBeVisible();
  await page.goto("/");
  await expect(
    page.getByRole("complementary", { name: "Opciones seleccionadas" }),
  ).toHaveCount(0);
  const footer = await page.locator(".site-footer").boundingBox();
  expect(footer?.height).toBeLessThan(200);
});
test("seleccion de dos ofertas se conserva y permite reemplazo", async ({
  page,
}) => {
  await page.goto("/carreras?q=software");
  await page
    .getByTestId("offer-card")
    .nth(0)
    .getByRole("button", { name: "Añadir a comparación", exact: true })
    .click();
  await page
    .getByTestId("offer-card")
    .nth(1)
    .getByRole("button", { name: "Añadir a comparación", exact: true })
    .click();
  await expect(
    page
      .getByTestId("offer-card")
      .nth(2)
      .getByRole("button", { name: "Añadir a comparación", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("complementary", { name: "Opciones seleccionadas" }),
  ).toContainText("2 de 2 opciones");
  await page.getByRole("link", { name: "Comparar ahora", exact: true }).click();
  await page.getByText("Ver comparación completa", { exact: true }).click();
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
    await page.getByText("Ver comparación completa", { exact: true }).click();
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

test("Ubicación enlaza las direcciones reales de ambas sedes", async ({
  page,
}) => {
  await page.route("https://maps.google.com/**", (route) =>
    route.fulfill({ body: "Mapa" }),
  );
  await page.goto("/comparar?opciones=10,110");
  await page.getByRole("button", { name: "Ubicación", exact: true }).click();
  const map = page.getByTitle(/^Mapa de /).first();
  await expect(map).toBeVisible();
  await expect(page.getByTitle(/^Mapa de /)).toHaveCount(2);
  const address = new URL((await map.getAttribute("src"))!).searchParams.get(
    "q",
  );
  expect(address).toContain("Av. Alfredo Mendiola 6377");
  const lookup = page.getByRole("link", { name: "Abrir ubicación" }).first();
  expect(
    new URL((await lookup.getAttribute("href"))!).searchParams.get("query"),
  ).toBe(address);
  await expect(
    page.getByRole("link", { name: "Explicar con IA" }),
  ).toHaveAttribute("href", "/analisis?opciones=10,110");
});

test("muestra la malla por año y distingue cuotas de créditos", async ({
  page,
}) => {
  const original = fixture.comparisons["10,110"];
  await page.route("**/api/comparaciones", (route) =>
    route.fulfill({
      json: {
        ...original,
        opciones: [
          { ...original.opciones[0], oferta_id: 9 },
          { ...ucss.oferta, oferta_id: 148 },
        ],
      },
    }),
  );
  await page.route("**/api/ofertas/148", (route) =>
    route.fulfill({ json: ucss }),
  );
  await page.goto("/comparar?opciones=9,148");
  await expect(
    page.getByText("Principios de Algoritmos", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "2.º año" }).click();
  await expect(
    page.getByText("Taller de Programación", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ver malla curricular" }),
  ).toHaveCount(2);
  await page.getByRole("button", { name: "Costos", exact: true }).click();
  await expect(page.getByText("S/ 815.00", { exact: true })).toBeVisible();
  await expect(page.getByText("Por cuota · 5 cuotas")).toBeVisible();
  await expect(page.getByText("S/ 38.50", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Tarifa por crédito", { exact: true }),
  ).toBeVisible();
});

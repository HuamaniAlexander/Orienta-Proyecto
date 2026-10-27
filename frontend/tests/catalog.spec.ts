import { expect, test } from "./fixtures/test";

test("tipo e institución restringen las carreras y limpian selecciones incompatibles", async ({
  page,
}) => {
  await page.goto("/carreras");
  const type = page.getByLabel("Tipo de institución", { exact: true });
  const institution = page.getByLabel("Institución", { exact: true });
  const career = page.getByLabel("Carrera", { exact: true });
  await type.selectOption("2");
  await institution.selectOption("9");
  await expect(institution.locator("option[value='1']")).toHaveCount(0);
  await type.selectOption("1");
  await expect(institution).toHaveValue("");
  await expect(institution.locator("option[value='9']")).toHaveCount(0);
  await expect(institution.locator("option[value='1']")).toHaveCount(1);
  await expect(career.locator("option[value='120']")).toHaveCount(0);
  await institution.selectOption("1");
  await expect(career.locator("option")).not.toHaveCount(1);
  await page.reload();
  await expect(type).toHaveValue("1");
  await expect(institution).toHaveValue("1");
  await expect(career.locator("option[value='120']")).toHaveCount(0);
});

test("enlace con filtros incompatibles se normaliza sin perder búsqueda", async ({
  page,
}) => {
  await page.goto(
    "/carreras?tipo_id=1&institucion_id=9&carrera_id=120&q=software&page=2",
  );
  await expect(
    page.getByLabel("Tipo de institución", { exact: true }),
  ).toHaveValue("1");
  await expect(page.getByLabel("Institución", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Carrera", { exact: true })).toHaveValue("");
  await expect(page).toHaveURL(/q=software/);
  await expect(page).not.toHaveURL(/institucion_id|carrera_id|page=/);
});

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

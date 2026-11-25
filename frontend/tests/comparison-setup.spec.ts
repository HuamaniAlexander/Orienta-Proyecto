import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures/test";
import fixture from "./fixtures/catalog.json" with { type: "json" };

for (const width of [390, 768, 1024, 1536]) {
  test(`selección simétrica, búsqueda y comparación a ${width} px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1024 });
    const offers = fixture.comparisons["10,110"].opciones;
    await page.route("**/api/ofertas?**", (route) =>
      route.fulfill({
        json: { items: offers, total: 2, page: 1, page_size: 6 },
      }),
    );
    await page.goto("/comparar");
    const first = page.getByRole("region", { name: "Primera opción" });
    const second = page.getByRole("region", { name: "Segunda opción" });
    const compare = page.getByRole("button", {
      name: "Comparar opciones",
      exact: true,
    });
    await expect(compare).toBeDisabled();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: testInfo.outputPath(`seleccion-vacia-${width}.png`),
      fullPage: true,
    });
    if (width > 720) {
      const a = await first.boundingBox();
      const b = await second.boundingBox();
      expect(a!.width).toBeCloseTo(b!.width, 0);
      expect(a!.height).toBeCloseTo(b!.height, 0);
      expect(a!.y).toBeCloseTo(b!.y, 0);
      const firstSearch = await first
        .getByRole("combobox", { name: /Carrera o institución/ })
        .boundingBox();
      const secondSearch = await second
        .getByRole("combobox", { name: /Carrera o institución/ })
        .boundingBox();
      expect(firstSearch!.y).toBeCloseTo(secondSearch!.y, 0);
    }
    await second.getByRole("button", { name: "Buscar segunda opción" }).click();
    await second
      .getByRole("button", { name: /^Elegir / })
      .nth(1)
      .click();
    await expect(second.locator(".compare-setup-chosen")).toContainText(
      offers[1].carrera_oficial,
    );
    await expect(compare).toBeDisabled();
    await first
      .getByRole("combobox", { name: /Carrera o institución/ })
      .fill("software");
    const request = page.waitForRequest(
      (request) =>
        request.url().includes("/api/ofertas?") &&
        new URL(request.url()).searchParams.get("q") === "software",
    );
    await first.getByRole("button", { name: "Buscar primera opción" }).click();
    await request;
    await expect(
      first.getByRole("button", { name: "Ya seleccionada" }),
    ).toBeDisabled();
    await first.getByRole("button", { name: /^Elegir / }).click();
    await expect(compare).toBeEnabled();
    await page.getByRole("button", { name: "Intercambiar opciones" }).click();
    await expect(first.locator(".compare-setup-chosen")).toContainText(
      offers[1].carrera_oficial,
    );
    await page.getByRole("button", { name: "Quitar primera opción" }).click();
    await expect(second.locator(".compare-setup-chosen")).toContainText(
      offers[0].carrera_oficial,
    );
    await expect(compare).toBeDisabled();
    await first.getByRole("button", { name: "Buscar primera opción" }).click();
    await first.getByRole("button", { name: /^Elegir / }).click();
    await page.getByRole("button", { name: "Intercambiar opciones" }).click();
    await page.reload();
    await expect(compare).toBeEnabled();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await page.screenshot({
      path: testInfo.outputPath(`seleccion-lista-${width}.png`),
      fullPage: true,
    });
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(audit.violations.map((item) => item.id)).toEqual([]);
    await compare.click();
    await expect(page).toHaveURL(/opciones=10%2C110|opciones=10,110/);
    await expect(
      page.getByRole("region", { name: "Criterios de comparación" }),
    ).toBeVisible();
  });
}

test("la búsqueda vacía y el error se pueden recuperar", async ({ page }) => {
  let fail = true;
  await page.route("**/api/ofertas?**", (route) =>
    fail
      ? route.fulfill({
          status: 503,
          json: { detail: "El catálogo no responde. Intenta nuevamente." },
        })
      : route.fulfill({ json: { items: [], total: 0, page: 1, page_size: 6 } }),
  );
  await page.goto("/comparar");
  await page.getByRole("button", { name: "Buscar primera opción" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "El catálogo no responde",
  );
  fail = false;
  await page.getByRole("button", { name: "Volver a intentar" }).click();
  await expect(
    page.getByText("No encontramos ofertas.", { exact: false }),
  ).toBeVisible();
});

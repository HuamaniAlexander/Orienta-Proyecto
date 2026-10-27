import { expect, test } from "./fixtures/test";
import response from "./fixtures/analysis.json" with { type: "json" };
import AxeBuilder from "@axe-core/playwright";

for (const width of [360, 390, 768, 1024, 1440])
  test(`resultado IA legible ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route("**/api/explicaciones", (route) =>
      route.fulfill({ json: response }),
    );
    await page.goto("/analisis?opciones=10,110");
    await page
      .getByRole("button", { name: "Explorar diferencias con IA" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Una mirada a tus diferencias." }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
  });
test("explicacion se solicita una vez y muestra sus limites", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/explicaciones", async (route) => {
    calls++;
    await route.fulfill({ json: response });
  });
  await page.goto("/analisis?opciones=10,110");
  await page
    .getByLabel("Cuéntanos un poco más", { exact: false })
    .fill("Me interesa el software");
  await page
    .getByRole("button", { name: "Explorar diferencias con IA" })
    .dblclick();
  await expect(
    page.getByRole("heading", { name: "Una mirada a tus diferencias." }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Respuesta simulada exclusiva de pruebas; no se sirve en la aplicación.",
    ),
  ).toBeVisible();
  expect(calls).toBe(1);
});
test("Gemini no disponible conserva la comparacion", async ({ page }) => {
  await page.route("**/api/explicaciones", (route) =>
    route.fulfill({
      status: 503,
      json: {
        detail:
          "Gemini no está disponible en este momento. Tu comparación sigue disponible.",
      },
    }),
  );
  await page.goto("/analisis?opciones=10,110");
  await page
    .getByRole("button", { name: "Explorar diferencias con IA" })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Gemini no está disponible",
  );
  await page
    .getByRole("link", { name: "Tu comparación básica sigue disponible" })
    .click();
  await expect(
    page.getByRole("region", { name: "Criterios de comparación" }),
  ).toBeVisible();
});
for (const width of [360, 390, 768, 1024, 1440])
  test(`preferencias legibles ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/analisis?opciones=10,110");
    await expect(
      page.getByRole("heading", { name: "¿Qué es importante para ti?" }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`analisis-${width}.jpg`),
      type: "jpeg",
      quality: 65,
      fullPage: true,
    });
  });

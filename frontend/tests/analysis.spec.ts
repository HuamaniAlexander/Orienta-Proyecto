import { expect, test } from "./fixtures/test";
import response from "./fixtures/analysis.json" with { type: "json" };
import AxeBuilder from "@axe-core/playwright";

test("referencias y prosa identifican las carreras e instituciones", async ({
  page,
}) => {
  const labeled = structuredClone(response);
  labeled.explicacion.sugerencia.motivo =
    "La opción A y la oferta 110 se documentan en la fuente 1.";
  await page.route("**/api/explicaciones", (route) =>
    route.fulfill({ json: labeled }),
  );
  await page.goto("/analisis?opciones=10,110");
  await page.getByRole("button", { name: "Explicar con IA" }).click();
  const suggestion = page.locator(".suggestion-panel");
  await expect(suggestion).toContainText("Universidad Tecnológica del Perú");
  await expect(suggestion).toContainText("Universidad César Vallejo");
  await expect(suggestion).not.toContainText(/opción A|oferta 110|fuente 1/i);
  await page
    .getByRole("navigation", { name: "Pasos de la explicación" })
    .getByRole("button", { name: "Fuentes y próximos pasos" })
    .click();
  await expect(page.locator(".analysis-sources")).not.toContainText(
    /Fuente \d+/,
  );
});

for (const width of [360, 390, 768, 1024, 1440])
  test(`resultado IA legible ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route("**/api/explicaciones", (route) =>
      route.fulfill({ json: response }),
    );
    await page.goto("/analisis?opciones=10,110");
    await page.getByRole("button", { name: "Explicar con IA" }).click();
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
    .getByLabel("¿Qué te gustaría entender mejor?", { exact: false })
    .fill("Me interesa el software");
  await page.getByRole("button", { name: "Explicar con IA" }).dblclick();
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
  await page.getByRole("button", { name: "Explicar con IA" }).click();
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
test("explicacion permite reintentar tras un error temporal", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/explicaciones", async (route) => {
    calls++;
    if (calls === 1) {
      await route.fulfill({
        status: 503,
        json: {
          detail:
            "Gemini no está disponible en este momento. Tu comparación sigue disponible.",
        },
      });
      return;
    }
    await route.fulfill({ json: response });
  });
  await page.goto("/analisis?opciones=10,110");
  await page.getByRole("button", { name: "Explicar con IA" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Gemini no está disponible",
  );
  await page.getByRole("button", { name: "Volver a intentar" }).click();
  await expect(
    page.getByRole("heading", { name: "Una mirada a tus diferencias." }),
  ).toBeVisible();
  expect(calls).toBe(2);
});
for (const width of [360, 390, 768, 1024, 1440])
  test(`preferencias legibles ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/analisis?opciones=10,110");
    await expect(
      page.getByRole("heading", {
        name: "¿En qué quieres centrar la explicación?",
      }),
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

test("la explicación general recorre los cuatro pasos y conserva sus fuentes", async ({
  page,
}) => {
  await page.route("**/api/explicaciones", async (route) => {
    const payload = route.request().postDataJSON();
    expect(payload.preferencias.prioridades).toEqual([]);
    expect(payload.preferencias.intereses).toBe("");
    await route.fulfill({ json: response });
  });
  await page.goto("/analisis?opciones=10,110");
  await page
    .getByLabel("¿Qué te gustaría entender mejor?")
    .fill("Texto opcional");
  await page.getByRole("button", { name: "Continuar sin prioridades" }).click();
  const steps = page.getByRole("navigation", {
    name: "Pasos de la explicación",
  });
  await expect(steps.getByRole("button", { name: "Resumen" })).toHaveAttribute(
    "aria-current",
    "step",
  );
  await steps.getByRole("button", { name: "Qué significa para ti" }).click();
  await expect(
    page.getByText("Explicación general", { exact: false }),
  ).toBeVisible();
  await steps.getByRole("button", { name: "Fuentes y próximos pasos" }).click();
  await expect(
    page.getByRole("heading", { name: "Consulta la información original." }),
  ).toBeVisible();
  await page.getByLabel("Revisar ambos planes de estudio").check();
  await expect(
    page.getByLabel("Revisar ambos planes de estudio"),
  ).toBeChecked();
});

test("una respuesta rechazada muestra el catálogo y permite reintentar Gemini", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/explicaciones", (route) => {
    calls++;
    return calls === 1
      ? route.fulfill({
          status: 503,
          json: {
            detail:
              "La respuesta de IA no superó la validación. Tu comparación sigue disponible.",
          },
        })
      : route.fulfill({ json: response });
  });
  await page.goto("/analisis?opciones=10,110");
  await page.getByRole("button", { name: "Explicar con IA" }).click();
  await expect(
    page.getByRole("heading", { name: "Resumen del catálogo" }),
  ).toBeVisible();
  await expect(
    page.getByText("La respuesta de Gemini quedó descartada", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reintentar con IA" }).click();
  await expect(
    page.getByRole("heading", { name: "Una mirada a tus diferencias." }),
  ).toBeVisible();
  expect(calls).toBe(2);
});

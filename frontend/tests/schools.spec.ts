import { test, expect } from "./fixtures/test";
import AxeBuilder from "@axe-core/playwright";

test("el plan conserva periodo, cupos y datos al volver a las tarifas", async ({
  page,
}) => {
  await page.goto("/colegios");
  await page.getByRole("button", { name: "3 meses" }).click();
  const tier = page.locator(".schools-tier").nth(1);
  await expect(tier.locator(".schools-price")).toContainText("810");
  await tier.getByRole("button").click();
  await expect(page.getByLabel("Resumen del plan elegido")).toContainText(
    "200 cupos",
  );
  await expect(page.getByLabel("Resumen del plan elegido")).toContainText(
    "810",
  );
  await page
    .getByLabel("Nombre de la institución educativa")
    .fill("Colegio local");
  await page.getByRole("button", { name: "Cambiar plan" }).click();
  await expect(page.getByRole("button", { name: "3 meses" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page
    .getByRole("button", { name: "Solicitar plan", exact: true })
    .click();
  await expect(
    page.getByLabel("Nombre de la institución educativa"),
  ).toHaveValue("Colegio local");
});

test("la solicitud envía el plan seleccionado y presenta su confirmación", async ({
  page,
}) => {
  await page.route("**/api/colegios/solicitudes", async (route) => {
    const body = route.request().postDataJSON();
    expect(body).toMatchObject({
      tier_cupos: 500,
      period_months: 6,
      school_name: "Colegio local",
    });
    await route.fulfill({
      status: 201,
      json: {
        id: "LOCAL-123",
        school_name: body.school_name,
        tier_cupos: 500,
        period_months: 6,
        total_pen: 2295,
        per_student_pen: 4.59,
      },
    });
  });
  await page.goto("/colegios");
  await page.getByRole("button", { name: "6 meses" }).click();
  await page.locator(".schools-tier").nth(2).getByRole("button").click();
  await page
    .getByLabel("Nombre de la institución educativa")
    .fill("Colegio local");
  await page.getByLabel("Distrito", { exact: true }).fill("Los Olivos");
  await page
    .getByLabel("Nombre de la persona de contacto")
    .fill("Coordinación");
  await page
    .getByLabel("Correo institucional o de contacto")
    .fill("contacto@example.org");
  await page
    .getByRole("button", { name: "Solicitar activación institucional" })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "LOCAL-123" }),
  ).toBeVisible();
});

for (const width of [390, 1440])
  test(`planes y solicitud accesibles a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/colegios");
    for (const request of [false, true]) {
      if (request)
        await page
          .getByRole("button", { name: "Solicitar plan", exact: true })
          .click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(scan.violations).toEqual([]);
    }
  });

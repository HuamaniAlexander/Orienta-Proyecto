import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures/test";

for (const width of [390, 768, 1440]) {
  test(`progreso real, respuestas y recorrido accesibles a ${width} px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/descubre");
    const progress = page.getByRole("progressbar", {
      name: "Avance del cuestionario",
    });
    await expect(progress).toHaveAttribute("value", "0");
    const first = page.getByLabel("Construir o reparar objetos");
    await first.focus();
    await first.press("Space");
    await page.getByLabel("Investigar cómo funcionan las cosas").check();
    await expect(first).toBeChecked();
    await expect(
      page.getByLabel("Crear imágenes, historias o diseños"),
    ).toBeDisabled();
    await expect(progress).toHaveAttribute("value", "1");
    await expect(page.locator(".questionnaire-skip")).toHaveClass(/button/);
    await expect(page.locator(".questionnaire-save")).toHaveClass(/button/);
    const audit = await new AxeBuilder({ page })
      .include(".questionnaire-experience")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(audit.violations.map((issue) => issue.id)).toEqual([]);
    await page.screenshot({
      path: testInfo.outputPath(`experiencia-${width}.png`),
      fullPage: true,
    });
    for (let step = 1; step <= 4; step++)
      await page.getByRole("button", { name: "Siguiente pregunta" }).click();
    const journey = page.getByRole("complementary", { name: "Tu recorrido" });
    await expect(
      journey.getByRole("button", { name: /Actividades e intereses/ }),
    ).toContainText("Tramo revisado");
    await expect(
      journey.getByRole("button", { name: /Situaciones de elección/ }),
    ).toHaveAttribute("aria-current", "step");
    await journey
      .getByRole("button", { name: /Actividades e intereses/ })
      .click();
    await expect(
      page.getByText("Pregunta 1 de 24", { exact: true }),
    ).toBeVisible();
    await expect(first).toBeChecked();
    await expect(progress).toHaveAttribute("value", "4");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  });
}

test("el movimiento reducido conserva el progreso sin animaciones", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/descubre");
  await page.getByLabel("Construir o reparar objetos").check();
  await expect(page.locator(".questionnaire-progress-fill")).toHaveCSS(
    "transition-duration",
    "0s",
  );
  await expect(page.locator(".questionnaire-question")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "1");
});

for (const width of [390, 1440]) {
  test(`revisión ordenada y edición alineada a ${width} px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(() => {
      localStorage.setItem(
        "orienta-progress-v1",
        JSON.stringify({
          offers: [],
          comparisons: [],
          questions: [],
          questionnaire: {
            step: 24,
            answers: Object.fromEntries(
              Array.from({ length: 24 }, (_, i) => [i, i === 0 ? [0, 1] : [0]]),
            ),
            preferences: {
              interests: [
                "Investigar cómo funcionan las cosas",
                "Organizar proyectos",
              ],
              extra: "",
              district: "",
              flexible: false,
              modalities: [1, 2],
              availability: "Por las mañanas",
            },
          },
        }),
      );
    });
    await page.goto("/descubre");
    const review = page.locator(".questionnaire-review-sections");
    await review.locator("summary").first().click();
    const buttons = review.getByRole("button", { name: /Editar pregunta/ });
    await expect(buttons).toHaveCount(4);
    const boxes = await buttons.evaluateAll((elements) =>
      elements.map((element) => {
        const box = element.getBoundingClientRect();
        return { x: box.x, width: box.width };
      }),
    );
    for (const box of boxes) expect(box).toEqual(boxes[0]);
    await expect(page.locator(".questionnaire-preference-facts dt")).toHaveText(
      ["Intereses", "Distrito", "Modalidad", "Disponibilidad"],
    );
    await expect(page.locator(".questionnaire-route .is-complete")).toHaveCount(
      6,
    );
    const audit = await new AxeBuilder({ page })
      .include(".questionnaire-experience")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(audit.violations.map((issue) => issue.id)).toEqual([]);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: testInfo.outputPath(`revision-${width}.png`),
      fullPage: true,
    });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await buttons.first().click();
    await expect(
      page.getByText("Pregunta 1 de 24", { exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Construir o reparar objetos")).toBeChecked();
    await page
      .getByRole("button", { name: "Guardar y volver a la revisión" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Resumen de tus respuestas" }),
    ).toBeVisible();
  });
}

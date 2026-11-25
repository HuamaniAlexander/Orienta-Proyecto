import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures/test";
import catalog from "./fixtures/catalog.json" with { type: "json" };
import { ORIENTATION_ZOOM_URL } from "../src/features/ruta/zoom";

for (const width of [390, 1440]) {
  test(`guía por pasos conserva ediciones y pagina sin extender la lista a ${width} px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(
      (offers) => {
        const questions = [
          "¿Qué proyectos realizaré?",
          "¿Cómo se organizan las prácticas?",
          "¿Qué materiales necesitaré?",
          "¿Dónde puedo revisar los horarios?",
          "¿Qué incluye la matrícula?",
        ];
        localStorage.setItem(
          "orienta-progress-v1",
          JSON.stringify({
            offers,
            comparisons: [],
            questions,
            conversation: {
              summary:
                "Quiero conocer los proyectos y las condiciones de estudio de estas carreras.",
              questions: questions.map((text) => ({
                text,
                source: "De tu ruta",
              })),
              offers: offers.map((offer) => offer.oferta_id),
              selectedQuestions: questions,
            },
          }),
        );
      },
      catalog.default.items.slice(0, 3),
    );
    await page.goto("/mi-ruta/preparar");
    await expect(page.locator(".conversation-source")).toHaveCount(0);
    await expect(page.locator(".conversation-questions > li")).toHaveCount(2);
    await page
      .getByRole("button", { name: "Preguntas de la guía: siguientes" })
      .click();
    await page
      .getByRole("textbox", { name: "Pregunta 3", exact: true })
      .fill("¿Qué materiales necesitaré en el primer ciclo?");
    await page
      .getByRole("button", { name: "Paso anterior", exact: true })
      .click();
    await expect(page.locator(".conversation-editor")).toHaveCount(0);
    await expect(
      page
        .locator(".conversation-source-options fieldset")
        .first()
        .getByRole("checkbox"),
    ).toHaveCount(2);
    await page.screenshot({
      path: testInfo.outputPath(`seleccion-${width}.png`),
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Siguiente paso", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Preguntas de la guía: siguientes" })
      .click();
    await expect(
      page.getByRole("textbox", { name: "Pregunta 3", exact: true }),
    ).toHaveValue("¿Qué materiales necesitaré en el primer ciclo?");
    const audit = await new AxeBuilder({ page })
      .include("main")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(audit.violations.map((issue) => issue.id)).toEqual([]);
    if (width > 900)
      expect(
        (await page.locator(".conversation-editor").boundingBox())!.height,
      ).toBeLessThan(650);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: testInfo.outputPath(`editor-${width}.png`),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Guardar borrador" }).click();
    await page
      .getByRole("button", { name: "Revisar antes de compartir" })
      .click();
    await page
      .getByRole("button", { name: "Vista previa de preguntas: siguientes" })
      .click();
    await expect(
      page.locator(".conversation-structured-preview"),
    ).toContainText("¿Qué materiales necesitaré en el primer ciclo?");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  });
}

test("las sesiones comparten Zoom y mantienen las tres acciones simétricas", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() =>
    localStorage.setItem(
      "orienta-sesiones-v1",
      JSON.stringify(
        ["Luis Mendoza", "Ana Torres", "Valeria Rojas"].map((name, index) => ({
          id: `session-${index}`,
          advisor_name: name,
          channel: "zoom",
          status: index ? "confirmada" : "recibida",
          starts_at: "2030-11-25T21:00:00Z",
        })),
      ),
    ),
  );
  await page.goto("/conecta?mis-sesiones=1");
  const groups = page.locator(".connect-session-actions");
  await expect(groups).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await expect(
      groups.nth(i).getByRole("link", { name: "Ir a la reunión en Zoom" }),
    ).toHaveAttribute("href", ORIENTATION_ZOOM_URL);
    const boxes = await groups
      .nth(i)
      .locator(".button")
      .evaluateAll((elements) =>
        elements.map((element) => ({
          width: element.getBoundingClientRect().width,
          height: element.getBoundingClientRect().height,
        })),
      );
    expect(new Set(boxes.map((box) => box.width)).size).toBe(1);
    expect(new Set(boxes.map((box) => box.height)).size).toBe(1);
  }
  await page.screenshot({
    path: testInfo.outputPath("sesiones-alineadas.png"),
    fullPage: true,
  });
});

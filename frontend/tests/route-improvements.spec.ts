import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures/test";
import dataset from "./fixtures/catalog.json" with { type: "json" };

test("guardar una comparación es visible y permite retomarla sin duplicados", async ({
  page,
}) => {
  await page.goto("/comparar?opciones=10,110");
  const bar = page.locator(".comparison-save-bar");
  await bar.getByRole("button", { name: "Guardar comparación" }).click();
  await expect(
    bar.getByRole("button", { name: "Retirar comparación" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(
    bar.getByRole("button", { name: "Retirar comparación" }),
  ).toBeVisible();
  await bar.getByRole("link", { name: "Ver mis comparaciones" }).click();
  await expect(
    page.getByRole("link", { name: "Comparaciones · 1" }),
  ).toBeVisible();
  await expect(
    page.getByText("Comparación guardada", { exact: true }),
  ).toBeVisible();
});

test("la IA propone preguntas editables y solo guarda las que se añaden", async ({
  page,
}) => {
  await page.route("**/api/orientacion/preparar", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      offers: [],
      questions: [],
      comparisons: [],
      question_count: 3,
      exclude_questions: [],
    });
    await route.fulfill({
      json: {
        questions: [
          "¿Qué proyectos realizaré?",
          "¿Cómo son las prácticas?",
          "¿Qué actividades de laboratorio hay?",
        ],
      },
    });
  });
  await page.goto("/mi-ruta?vista=preguntas");
  await page.getByRole("button", { name: "Generar preguntas con IA" }).click();
  await expect(page.getByLabel("Pregunta sugerida 1")).toHaveValue(
    "¿Qué proyectos realizaré?",
  );
  await page
    .getByLabel("Pregunta sugerida 1")
    .fill("¿Qué proyectos haré en primer ciclo?");
  await expect(page.getByRole("link", { name: "Preguntas · 0" })).toBeVisible();
  await page
    .getByRole("button", { name: "Añadir a mis preguntas" })
    .first()
    .click();
  await expect(page.getByRole("link", { name: "Preguntas · 1" })).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("¿Qué proyectos haré en primer ciclo?", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("¿Cómo son las prácticas?", { exact: true }),
  ).toHaveCount(0);
});

test("un fallo de IA mantiene la opción manual y no inventa preguntas", async ({
  page,
}) => {
  await page.route("**/api/orientacion/preparar", (route) =>
    route.fulfill({ status: 503, json: { detail: "Servicio no disponible" } }),
  );
  await page.goto("/mi-ruta?vista=preguntas");
  await page.getByRole("button", { name: "Generar preguntas con IA" }).click();
  await expect(
    page.getByText(
      "No pudimos generar preguntas con IA. Inténtalo de nuevo o escribe tu pregunta.",
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Escribe una nueva pregunta")).toBeEnabled();
  await expect(page.getByRole("link", { name: "Preguntas · 0" })).toBeVisible();
});

for (const width of [390, 1440]) {
  test(`Mi ruta y resultados organizados y accesibles a ${width} px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    const offers = [
      dataset.default.items[0],
      dataset.default.items.find(
        (item) => item.institucion !== dataset.default.items[0].institucion,
      )!,
    ];
    await page.addInitScript((offers) => {
      const preferences = {
        interests: ["Organizar proyectos"],
        district: "",
        flexible: false,
        extra: "",
        modalities: [1, 2],
        availability: "Por las mañanas",
      };
      localStorage.setItem(
        "orienta-progress-v1",
        JSON.stringify({
          offers,
          comparisons: [[offers[0], offers[1]]],
          questions: ["¿Qué proyectos realizaré durante mis estudios?"],
          current: {
            version: 1,
            preferences,
            suggestions: offers.map((offer) => ({
              offer,
              reasons: ["Coincide con tus intereses."],
              source: null,
            })),
          },
        }),
      );
    }, offers);
    for (const [url, name] of [
      ["/mi-ruta", "carreras"],
      ["/mi-ruta?vista=comparaciones", "comparaciones"],
      ["/mi-ruta?vista=preguntas", "preguntas"],
      ["/mi-ruta?vista=preferencias", "preferencias"],
      ["/descubre", "resultados"],
    ]) {
      await page.goto(url);
      await page.evaluate(() => document.fonts.ready);
      if (name === "carreras") {
        await expect(page.locator(".my-route-saved-logo > img")).toHaveCount(2);
        if (width > 900) {
          const card = page.locator(".my-route-offer").first();
          const identity = await card
            .locator(":scope > div")
            .nth(1)
            .boundingBox();
          const actions = await card
            .locator(":scope > .route-stack")
            .boundingBox();
          expect(actions!.x).toBeGreaterThan(identity!.x + identity!.width);
          const widths = await card
            .locator(":scope > .route-stack > .button")
            .evaluateAll((items) =>
              items.map((item) => item.getBoundingClientRect().width),
            );
          expect(new Set(widths).size).toBe(1);
        }
      }
      if (name === "comparaciones") {
        const logos = page.locator(".my-route-university-logo > img");
        await expect(logos).toHaveCount(2);
        await expect
          .poll(() =>
            logos.evaluateAll((images) =>
              images.every(
                (image) =>
                  (image as HTMLImageElement).complete &&
                  (image as HTMLImageElement).naturalWidth > 0,
              ),
            ),
          )
          .toBe(true);
        await expect(
          page.getByRole("link", { name: "Explicar con IA" }),
        ).toHaveClass(/button/);
      }
      if (name === "preferencias") {
        const danger = page.getByRole("button", {
          name: "Borrar avance de este dispositivo",
        });
        await expect(danger).toHaveCSS("border-top-color", "rgb(180, 35, 42)");
        await danger.hover();
        await expect(danger).toHaveCSS("background-color", "rgb(142, 27, 33)");
        await expect(danger).toHaveCSS("border-top-color", "rgb(142, 27, 33)");
        if (width > 900) {
          const first = await page
            .locator(".route-preferences-panel")
            .boundingBox();
          const second = await page.locator(".route-data-panel").boundingBox();
          expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height);
          expect(first!.width).toBeCloseTo(second!.width, 0);
        }
      }
      if (name === "resultados") {
        await expect(
          page.getByRole("link", { name: "Ajustar condiciones" }),
        ).toHaveClass(/button/);
        await expect(
          page.getByRole("combobox", { name: /^Distrito/ }),
        ).toHaveCSS("font-weight", "400");
        await expect(
          page.getByRole("button", { name: "Retirar de Mi ruta" }).first(),
        ).toHaveCSS("border-top-color", "rgb(253, 186, 48)");
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
      const audit = await new AxeBuilder({ page })
        .include("main")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(audit.violations.map((issue) => issue.id)).toEqual([]);
      await page.screenshot({
        path: testInfo.outputPath(`${name}-${width}.png`),
        fullPage: true,
      });
    }
  });
}

test("cada nueva tanda ofrece tres preguntas diferentes sin guardar automáticamente", async ({
  page,
}) => {
  let calls = 0;
  const first = [
    "¿Qué proyectos realizaré?",
    "¿Cómo son las prácticas?",
    "¿Qué incluye el plan de estudios?",
  ];
  const second = [
    "¿Qué materiales necesitaré?",
    "¿Cómo se evalúan los cursos?",
    "¿Dónde consultar los horarios?",
  ];
  await page.route("**/api/orientacion/preparar", async (route) => {
    calls++;
    const payload = route.request().postDataJSON();
    expect(payload.question_count).toBe(3);
    expect(payload.exclude_questions).toEqual(calls === 1 ? [] : first);
    await route.fulfill({ json: { questions: calls === 1 ? first : second } });
  });
  await page.goto("/mi-ruta?vista=preguntas");
  await page.getByRole("button", { name: "Generar preguntas con IA" }).click();
  await expect(page.locator(".route-ai-proposal")).toHaveCount(3);
  await page.getByRole("button", { name: "Generar nuevas preguntas" }).click();
  await expect(page.getByLabel("Pregunta sugerida 1")).toHaveValue(second[0]);
  await expect(page.locator(".route-ai-proposal")).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Preguntas · 0" })).toBeVisible();
});

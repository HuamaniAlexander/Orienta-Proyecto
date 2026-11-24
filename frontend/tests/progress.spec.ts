import { expect, test } from "./fixtures/test";

test("las preferencias conservan las sugerencias previas y el avance se puede borrar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/descubre");
  await page.getByLabel("Organizar una actividad o un negocio").check();
  await page.getByRole("button", { name: "Siguiente pregunta" }).click();
  await page
    .getByRole("button", { name: "Guardar y continuar después" })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Avance guardado" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText("Pregunta 2 de 24")).toBeVisible();
  await page.getByRole("button", { name: "Siguiente pregunta" }).click();
  await page.getByRole("radio", { name: "4 Bastante" }).check();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.getByRole("button", { name: "Aún no lo sé" }).click();
  await page.getByRole("button", { name: "Anterior", exact: true }).click();
  await page.getByRole("button", { name: "Anterior", exact: true }).click();
  for (let step = 2; step < 24; step++) {
    await page.getByRole("button", { name: "Siguiente pregunta" }).click();
  }
  await page.getByRole("button", { name: "Revisar mis respuestas" }).click();
  await expect(page.getByText("Intereses: Organizar proyectos")).toBeVisible();
  await page.locator("summary").getByText("Actividades e intereses").click();
  await page
    .getByRole("button", { name: "Editar pregunta 1", exact: true })
    .click();
  await expect(
    page.getByLabel("Organizar una actividad o un negocio"),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Guardar y volver a la revisión" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Resumen de tus respuestas" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver sugerencias" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Alternativas para seguir explorando.",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Guardar en Mi ruta" })
    .first()
    .click();
  await page.getByRole("link", { name: "Volver a mis respuestas" }).click();
  await expect(
    page.getByRole("heading", { name: "Resumen de tus respuestas" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver sugerencias" }).click();
  await page.getByLabel("Horario").selectOption("Por las tardes");
  await page.getByRole("button", { name: "Solicitar alternativas" }).click();
  await expect(
    page.getByText("Sugerencias anteriores · versión 2"),
  ).toBeVisible();
  await expect(page.getByLabel("Horario")).toHaveValue("Por las tardes");
  await page.getByRole("link", { name: "Editar mis respuestas" }).click();
  await page.getByLabel("Organizar una actividad o un negocio").uncheck();
  for (let step = 1; step < 24; step++) {
    await page.getByRole("button", { name: "Siguiente pregunta" }).click();
  }
  await page.getByRole("button", { name: "Revisar mis respuestas" }).click();
  await page.getByRole("button", { name: "Ver sugerencias" }).click();
  await expect(
    page.getByText("Sugerencias anteriores · versión 3"),
  ).toBeVisible();
  await page.goto("/mi-ruta");
  await expect(
    page.getByRole("button", { name: "Retirar de Mi ruta" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Preguntas · 0" }).click();
  await page
    .getByLabel("Escribe una nueva pregunta")
    .fill("¿Qué incluye la matrícula?");
  await page.getByRole("button", { name: "Guardar pregunta" }).click();
  await page.reload();
  await expect(
    page.getByText("¿Qué incluye la matrícula?", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Preferencias y datos" }).click();
  await page
    .getByRole("button", { name: "Borrar avance de este dispositivo" })
    .click();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByText(/1 preguntas$/)).toBeVisible();
  await page
    .getByRole("button", { name: "Borrar avance de este dispositivo" })
    .click();
  await page.getByRole("button", { name: "Sí, borrar mi avance" }).click();
  await expect(page.getByText(/0 preguntas$/)).toBeVisible();
  await page.goto("/descubre");
  await expect(
    page.getByRole("heading", { name: "Explora lo que te interesa." }),
  ).toBeVisible();
});

for (const width of [390, 1440]) {
  test(`la tarjeta conserva su tamaño en las 24 preguntas a ${width} px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/descubre");
    const card = page.locator(".questionnaire-form");
    const size = () =>
      card.evaluate(({ offsetWidth, offsetHeight }) => ({
        width: offsetWidth,
        height: offsetHeight,
      }));
    const initial = await size();
    for (let question = 2; question <= 24; question++) {
      await page.getByRole("button", { name: "Siguiente pregunta" }).click();
      await expect(
        card.getByText(`Pregunta ${question} de 24`, { exact: true }),
      ).toBeVisible();
      expect(await size()).toEqual(initial);
    }
    await page.getByRole("button", { name: "Anterior", exact: true }).click();
    expect(await size()).toEqual(initial);
  });
}

test("prepara con IA, edita y revisa una pregunta de Mi ruta antes de copiar", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("orienta-progress-v1")) return;
    localStorage.setItem(
      "orienta-progress-v1",
      JSON.stringify({
        offers: [
          {
            oferta_id: 10,
            carrera_oficial: "Ingeniería de Sistemas",
            institucion: "UTP",
            distrito: "Los Olivos",
          },
        ],
        comparisons: [],
        questions: ["¿Qué proyectos realizaré?"],
      }),
    );
  });
  await page.route("**/api/orientacion/preparar", (route) => {
    const body = route.request().postDataJSON();
    expect(body.questions).toEqual(["¿Qué proyectos realizaré?"]);
    expect(body.offers).toEqual(["Ingeniería de Sistemas (UTP)"]);
    return route.fulfill({
      json: {
        summary: "Estoy explorando Ingeniería de Sistemas.",
        questions: ["¿Qué cursos conviene comparar?"],
      },
    });
  });
  await page.goto("/mi-ruta?vista=preguntas");
  await page
    .getByRole("checkbox", { name: "Investigada: ¿Qué proyectos realizaré?" })
    .check();
  await expect(
    page.getByRole("button", { name: "Investigadas · 1" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Preparar mi conversación" }).click();
  await page.getByRole("button", { name: "Preparar con IA" }).click();
  await expect(page.getByLabel("Resumen de mi ruta")).toHaveValue(
    "Estoy explorando Ingeniería de Sistemas.",
  );
  await page
    .getByRole("textbox", { name: "Pregunta 1", exact: true })
    .fill("¿Qué proyectos realizaré en el primer año?");
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Revisar antes de compartir" })
    .click();
  await expect(
    page.getByText("¿Qué proyectos realizaré en el primer año?", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Copiar guía" })).toBeVisible();
});

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
  await page.getByRole("button", { name: "Ver sugerencias" }).click();
  await expect(
    page.getByRole("heading", { name: "Opciones para seguir explorando." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Guardar en Mi ruta" })
    .first()
    .click();
  await page.getByRole("link", { name: "Editar preferencias" }).click();
  await page.getByLabel("Organizar una actividad o un negocio").uncheck();
  for (let step = 1; step < 24; step++) {
    await page.getByRole("button", { name: "Siguiente pregunta" }).click();
  }
  await page.getByRole("button", { name: "Revisar mis respuestas" }).click();
  await page.getByRole("button", { name: "Ver sugerencias" }).click();
  await expect(
    page.getByText("Sugerencias anteriores · versión 1"),
  ).toBeVisible();
  await page.goto("/mi-ruta");
  await expect(
    page.getByRole("button", { name: "Retirar de Mi ruta" }),
  ).toBeVisible();
  await page
    .getByLabel("Escribe una nueva pregunta")
    .fill("¿Qué incluye la matrícula?");
  await page.getByRole("button", { name: "Guardar pregunta" }).click();
  await page.reload();
  await expect(
    page.getByText("¿Qué incluye la matrícula?", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Gestionar avance" }).click();
  await page
    .getByRole("button", { name: "Borrar avance de este dispositivo" })
    .click();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByText("1 preguntas")).toBeVisible();
  await page
    .getByRole("button", { name: "Borrar avance de este dispositivo" })
    .click();
  await page.getByRole("button", { name: "Sí, borrar mi avance" }).click();
  await expect(page.getByText("0 preguntas")).toBeVisible();
  await page.goto("/descubre");
  await expect(
    page.getByRole("heading", { name: "Explora lo que te interesa." }),
  ).toBeVisible();
});

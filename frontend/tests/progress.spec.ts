import { expect, test } from "./fixtures/test";

test("las preferencias conservan las sugerencias previas y el avance se puede borrar", async ({
  page,
}) => {
  await page.goto("/descubre");
  await page.getByLabel("Organizar proyectos").check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByLabel("Dónde te gustaría estudiar")).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
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
  await page.getByLabel("Organizar proyectos").uncheck();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
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
    page.getByRole("heading", { name: "Empieza por lo que te interesa." }),
  ).toBeVisible();
});

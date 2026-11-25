import { test, expect } from "./fixtures/test";

test("las sugerencias ignoran tildes y se eligen con teclado", async ({
  page,
}) => {
  await page.goto("/carreras");
  const input = page.getByRole("combobox", {
    name: "Buscar carrera o institución",
  });
  await input.fill("ingenieria");
  const suggestions = page.getByRole("listbox", {
    name: "Sugerencias de búsqueda",
  });
  await expect(suggestions).toBeVisible();
  await expect(suggestions.getByRole("option").first()).toContainText(
    /Ingeniería/,
  );
  await input.press("ArrowDown");
  const chosen = await suggestions
    .locator('[aria-selected="true"]')
    .innerText();
  await input.press("Enter");
  await expect(input).toHaveValue(chosen);
  await expect(page).toHaveURL(
    new RegExp(`q=${encodeURIComponent(chosen).replace(/%20/g, "\\+")}`),
  );
  await expect(suggestions).toHaveCount(0);
});

test("Inicio y Comparar comparten sugerencias y permiten cerrar con Escape", async ({
  page,
}) => {
  for (const route of ["/", "/comparar"]) {
    await page.goto(route);
    const input = page.getByRole("combobox").first();
    await input.fill("ingenieria");
    await expect(page.getByRole("listbox")).toBeVisible();
    await input.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(input).toHaveValue("ingenieria");
  }
});

for (const width of [390, 1440]) {
  test(`escala tipográfica común y barra inferior visible a ${width} px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/carreras",
      "/comparar",
      "/descubre",
      "/mi-ruta",
      "/conecta",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1")).toHaveCSS(
        "font-size",
        width > 720 ? "32px" : "28px",
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
    }
    await page.goto("/carreras");
    const tray = page.getByRole("complementary", {
      name: "Opciones seleccionadas",
    });
    await expect(tray).toBeVisible();
    await expect(tray.locator(".tray-title")).toBeVisible();
    await expect(tray).toContainText("0 de 2");
    await expect(
      tray.getByRole("button", { name: "Comparar ahora" }),
    ).toBeDisabled();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(tray).toBeInViewport();
  });
}

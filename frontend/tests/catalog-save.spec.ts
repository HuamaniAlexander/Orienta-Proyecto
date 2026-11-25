import { test, expect } from "./fixtures/test";

for (const width of [390, 1440]) {
  test(`guardar una carrera cambia el icono y conserva Mi ruta a ${width} px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/carreras");
    const card = page.getByTestId("offer-card").first();
    const career = await card.getByRole("heading").innerText();
    const save = card.getByRole("button", {
      name: "Guardar en Mi ruta",
      exact: true,
    });
    await expect(save).toHaveAttribute("aria-pressed", "false");
    await expect(
      card.getByRole("link", { name: "Ver carrera", exact: true }),
    ).toHaveClass(/button/);
    await expect(card.locator(".offer-institution-footer img")).toBeVisible();
    await save.click();
    const saved = card.getByRole("button", {
      name: "Retirar de Mi ruta",
      exact: true,
    });
    await expect(saved).toHaveAttribute("aria-pressed", "true");
    await expect(saved).toHaveCSS("color", "rgb(253, 186, 48)");
    await expect(saved.locator("svg")).toHaveAttribute("fill", "currentColor");
    await page.reload();
    await expect(saved).toHaveAttribute("aria-pressed", "true");
    await card.evaluate((element) =>
      window.scrollTo({
        top: window.scrollY + element.getBoundingClientRect().top - 100,
        behavior: "instant",
      }),
    );
    await page.evaluate(() => document.fonts.ready);
    await card.screenshot({
      path: testInfo.outputPath(`tarjeta-guardada-${width}.png`),
    });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await page.goto("/mi-ruta");
    await expect(page.locator(".my-route-offer")).toHaveCount(1);
    await expect(page.locator(".my-route-offer")).toContainText(career);
    await page.goto("/carreras");
    await saved.click();
    await expect(save).toHaveAttribute("aria-pressed", "false");
    await page.goto("/mi-ruta");
    await expect(page.locator(".my-route-offer")).toHaveCount(0);
  });
}

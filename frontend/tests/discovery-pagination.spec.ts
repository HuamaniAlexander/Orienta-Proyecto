import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures/test";
import dataset from "./fixtures/catalog.json" with { type: "json" };

for (const width of [390, 768, 1440]) {
  test(`opciones y versiones navegan en el mismo espacio a ${width} px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    const offers = dataset.default.items.slice(0, 5);
    const previousOffers = dataset.default.items.slice(5, 8);
    await page.addInitScript(
      ({ offers, previousOffers }) => {
        const preferences = {
          interests: [
            "Organizar proyectos",
            "Investigar cómo funcionan las cosas",
          ],
          district: "",
          flexible: false,
          extra: "",
          modalities: [1, 2],
          availability: "",
        };
        const suggestions = (items: typeof offers) =>
          items.map((offer) => ({
            offer,
            reasons: ["Coincide con tus intereses."],
            source: null,
          }));
        localStorage.setItem(
          "orienta-progress-v1",
          JSON.stringify({
            offers: [],
            comparisons: [],
            questions: [],
            current: {
              version: 2,
              preferences,
              suggestions: suggestions(offers),
            },
            previous: {
              version: 1,
              preferences: {
                ...preferences,
                interests: ["Crear con tecnología"],
              },
              suggestions: suggestions(previousOffers),
            },
          }),
        );
      },
      { offers, previousOffers },
    );
    await page.goto("/descubre");
    const cards = page.locator(".discovery-career-card");
    const pageSize = width <= 600 ? 1 : 2;
    await expect(cards).toHaveCount(pageSize);
    if (pageSize > 1) {
      await page.evaluate(() => document.fonts.ready);
      const neighborHeight = (await cards.first().boundingBox())!.height;
      const opened = cards.nth(1);
      const closedHeight = (await opened.boundingBox())!.height;
      await opened.getByText("Ver detalles y fuentes", { exact: true }).click();
      expect((await cards.first().boundingBox())!.height).toBeLessThanOrEqual(
        neighborHeight + 1,
      );
      expect((await opened.boundingBox())!.height).toBeGreaterThan(
        closedHeight,
      );
      await page.screenshot({
        path: testInfo.outputPath(`detalle-independiente-${width}.png`),
        fullPage: true,
      });
      await opened.getByText("Ver detalles y fuentes", { exact: true }).click();
    }
    const pager = page.getByRole("navigation", {
      name: "Navegar opciones sugeridas",
    });
    await expect(pager).toContainText(`1–${pageSize} de 5`);
    await expect(
      pager.getByRole("button", { name: "Opciones anteriores" }),
    ).toBeDisabled();
    await pager.getByRole("button", { name: "Ver más opciones" }).click();
    await expect(cards).toHaveCount(pageSize);
    await expect(pager).toContainText(`${pageSize + 1}–${pageSize * 2} de 5`);
    while (
      await pager.getByRole("button", { name: "Ver más opciones" }).isEnabled()
    )
      await pager.getByRole("button", { name: "Ver más opciones" }).click();
    await expect(pager).toContainText("5–5 de 5");
    await expect(cards).toHaveCount(1);
    await pager.getByRole("button", { name: "Opciones anteriores" }).click();
    const versions = page.getByRole("navigation", {
      name: "Versiones de sugerencias",
    });
    await versions
      .getByRole("button", { name: "Sugerencias anteriores · versión 1" })
      .click();
    await expect(pager).toContainText(`1–${pageSize} de 3`);
    await expect(page.locator(".discovery-interest-bar")).toContainText(
      "Crear con tecnología",
    );
    await expect(cards).toHaveCount(pageSize);
    await versions
      .getByRole("button", { name: "Sugerencias actuales · versión 2" })
      .click();
    await expect(pager).toContainText(`1–${pageSize} de 5`);
    const filterBox = await page.locator("#discovery-conditions").boundingBox();
    const resultsBox = await page
      .locator('[aria-labelledby="affine-careers"]')
      .boundingBox();
    expect(filterBox!.y + filterBox!.height).toBeLessThan(resultsBox!.y);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    const audit = await new AxeBuilder({ page })
      .include("main")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(audit.violations.map((issue) => issue.id)).toEqual([]);
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement)
        document.activeElement.blur();
      scrollTo(0, 0);
    });
    await page.screenshot({
      path: testInfo.outputPath(`descubre-lateral-${width}.png`),
      fullPage: true,
    });
  });
}

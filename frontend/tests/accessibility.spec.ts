import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures/test";
const pages = [
  ["inicio", "/", ".hero"],
  ["catalogo", "/carreras?q=software&distrito_id=5", ".offer-card"],
  ["detalle", "/carreras/10", ".source-list"],
  ["comparador", "/comparar?opciones=10,110", ".comparison-table"],
  ["preferencias", "/analisis?opciones=10,110", ".preferences-panel"],
];
for (const [name, url, ready] of pages)
  for (const width of [390, 1440])
    test(`accesibilidad ${name} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(url);
      await page.locator(ready).first().waitFor();
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        result.violations.map((item) => ({
          id: item.id,
          nodes: item.nodes.map((node) => ({
            target: node.target,
            summary: node.failureSummary,
          })),
        })),
      ).toEqual([]);
    });

import { test as base, expect } from "@playwright/test";
import dataset from "./catalog.json" with { type: "json" };

// UI contract tests use captured public academic rows; live persistence has separate tests.
export const test = base.extend<{ catalogApi: void }>({
  catalogApi: [
    async ({ page }, use) => {
      await page.route("**/api/filtros", (route) =>
        route.fulfill({ json: dataset.facets }),
      );
      await page.route("**/api/ofertas?**", (route) => {
        const params = new URL(route.request().url()).searchParams;
        const q = params.get("q") ?? "";
        const result = q.includes("zzzinexistente")
          ? { ...dataset.default, items: [], total: 0 }
          : q.includes("software")
            ? dataset.software
            : dataset.default;
        return route.fulfill({
          json: { ...result, page: Number(params.get("page") ?? 1) },
        });
      });
      await use();
    },
    { auto: true },
  ],
});
export { expect };

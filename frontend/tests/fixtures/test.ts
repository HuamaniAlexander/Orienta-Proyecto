import { test as base, expect } from "@playwright/test";
import dataset from "./catalog.json" with { type: "json" };

// UI contract tests use captured public academic rows; live persistence has separate tests.
export const test = base.extend<{ catalogApi: void }>({
  catalogApi: [
    async ({ page }, use) => {
      await page.route("**/api/filtros", (route) =>
        route.fulfill({ json: dataset.facets }),
      );
      await page.route("**/api/comparaciones", (route) => {
        if (route.request().method() === "OPTIONS")
          return route.fulfill({
            status: 204,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST,OPTIONS",
              "Access-Control-Allow-Headers": "content-type",
            },
          });
        if (!route.request().postData())
          return route.fulfill({
            status: 422,
            json: { detail: "Solicitud sin opciones" },
          });
        const body = route.request().postDataJSON() as { oferta_ids: number[] };
        const key = body.oferta_ids.join(",");
        const comparisons: Record<string, unknown> = dataset.comparisons;
        return comparisons[key]
          ? route.fulfill({ json: comparisons[key] })
          : route.fulfill({
              status: 422,
              json: { detail: "Selecciona dos opciones diferentes." },
            });
      });
      await page.route("**/api/ofertas/*", (route) => {
        const id =
          new URL(route.request().url()).pathname.split("/").pop() ?? "";
        const details: Record<string, unknown> = dataset.details;
        const offer = [
          ...dataset.default.items,
          ...dataset.software.items,
        ].find((item) => String(item.oferta_id) === id);
        if (!details[id] && offer)
          return route.fulfill({
            json: { oferta: offer, fuentes: [], tarifas: [] },
          });
        return details[id]
          ? route.fulfill({ json: details[id] })
          : route.fulfill({
              status: 404,
              json: { detail: "Esta opción no está en el catálogo." },
            });
      });
      await page.route("**/api/ofertas?**", (route) => {
        const params = new URL(route.request().url()).searchParams;
        const q = params.get("q") ?? "";
        const result = q.includes("zzzinexistente")
          ? { ...dataset.default, items: [], total: 0 }
          : q.includes("software")
            ? dataset.software
            : dataset.default;
        if (params.get("page_size") === "48") {
          const offers =
            q || params.has("area_id")
              ? result.items
              : [
                  ...result.items,
                  ...dataset.software.items,
                  ...dataset.comparisons["10,110"].opciones,
                ];
          const items = [
            ...new Map(
              offers.map((offer) => [offer.oferta_id, offer]),
            ).values(),
          ];
          return route.fulfill({
            json: { items, total: items.length, page: 1, page_size: 48 },
          });
        }
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

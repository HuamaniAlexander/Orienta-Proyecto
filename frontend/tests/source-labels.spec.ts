import { expect, test } from "./fixtures/test";
import detail from "./fixtures/ucss.json" with { type: "json" };

test("documento de costos identifica la carrera e institución de su ficha", async ({
  page,
}) => {
  await page.route(`**/api/ofertas/${detail.oferta.oferta_id}`, (route) =>
    route.fulfill({ json: detail }),
  );
  await page.goto(`/carreras/${detail.oferta.oferta_id}`);
  const document = detail.fuentes.find((source) => source.fuente_id === 344)!;
  const link = page
    .locator(`a[href="${document.url}"]`)
    .filter({ hasText: "Documento institucional:" });
  await expect(link).toContainText("Administración");
  await expect(link).toContainText("Universidad Católica Sedes Sapientiae");
  await expect(link).not.toContainText("Fuente 344");
});

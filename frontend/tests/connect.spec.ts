import { expect, test } from "./fixtures/test";

for (const width of [375, 1440]) {
  test(`Conecta muestra el directorio, la agenda y la sesión a ${width} px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const id = "ea741ad2-1fd3-4456-ad9f-2f26f4981161";
    let confirmed = false;
    const starts = "2030-11-26T21:00:00Z";
    await page.route("**/api/orientacion/orientadores", (route) =>
      route.fulfill({
        json: [
          {
            id: "ana",
            name: "Ana Torres",
            focus: "Ingeniería de Sistemas",
            conditions: "Conversa sobre proyectos.",
            topics: ["Proyectos"],
            accepts_text: true,
            response_window: "En dos días hábiles",
            duration_minutes: 30,
            slots: [
              { id: "nov", starts_at: starts },
              { id: "dic", starts_at: "2030-12-03T23:00:00Z" },
            ],
          },
        ],
      }),
    );
    const receipt = () => ({
      id,
      status: confirmed ? "confirmada" : "recibida",
      channel: "zoom",
      starts_at: starts,
      response_window: "En dos días hábiles",
      response: null,
      advisor_name: "Ana Torres",
      advisor_focus: "Ingeniería de Sistemas",
      guide_shared: false,
      meeting_url: confirmed ? "https://zoom.us/j/123456" : null,
    });
    await page.route("**/api/orientacion/solicitudes", (route) => {
      const body = route.request().postDataJSON();
      expect(body.slot_id).toBe("nov");
      expect(body.summary).toBeNull();
      return route.fulfill({ status: 201, json: receipt() });
    });
    await page.route(`**/api/orientacion/solicitudes/${id}`, (route) =>
      route.fulfill({ json: receipt() }),
    );
    const checkWidth = async () =>
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
    await page.goto("/conecta");
    await page
      .getByRole("textbox", { name: "Buscar por carrera o nombre" })
      .fill("ingenieria");
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Ana Torres" }),
    ).toBeVisible();
    await checkWidth();
    await page.getByRole("link", { name: "Ver perfil y horarios" }).click();
    await page
      .getByRole("button", { name: "Mes siguiente con horarios" })
      .click();
    await expect(page.getByText("diciembre de 2030")).toBeVisible();
    await page
      .getByRole("button", { name: "Mes anterior con horarios" })
      .click();
    await page
      .locator('[aria-label="Horarios disponibles"]')
      .getByRole("button")
      .click();
    await page.getByLabel("Correo de contacto").fill("prueba@example.org");
    await checkWidth();
    await page.getByRole("button", { name: "Solicitar reserva" }).click();
    await expect(
      page.getByRole("heading", { name: "Solicitud recibida" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Abrir reunión en Zoom" }),
    ).toHaveCount(0);
    confirmed = true;
    await page.getByRole("button", { name: "Actualizar estado" }).click();
    await expect(
      page.getByRole("link", { name: "Abrir reunión en Zoom" }),
    ).toHaveAttribute("href", "https://zoom.us/j/123456");
    await checkWidth();
    await page.getByRole("link", { name: "Mis sesiones" }).click();
    await expect(page.getByRole("link", { name: /Ana Torres/ })).toBeVisible();
  });
}

test("Conecta conserva la preparación de Mi ruta cuando falta el directorio", async ({
  page,
}) => {
  await page.route("**/api/orientacion/orientadores", (route) =>
    route.fulfill({ status: 404, json: { detail: "Not Found" } }),
  );
  await page.goto("/conecta");
  await expect(
    page.getByText("El directorio de orientadores aún no está disponible."),
  ).toBeVisible();
  await expect(page.getByText("Not Found", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Buscar", exact: true }),
  ).toBeDisabled();
  await page.getByRole("link", { name: "Preparar mi conversación" }).click();
  await expect(
    page.getByRole("heading", { name: "Prepara tu conversación." }),
  ).toBeVisible();
});

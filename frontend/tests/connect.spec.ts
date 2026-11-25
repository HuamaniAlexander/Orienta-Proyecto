import { expect, test } from "./fixtures/test";

for (const width of [375, 1440]) {
  test(`Conecta muestra el directorio, la agenda y la sesión a ${width} px`, async ({
    page,
  }, testInfo) => {
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
      .getByRole("combobox", { name: "Buscar por carrera o nombre" })
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
    const session = page
      .locator(".connect-session-row")
      .filter({ hasText: "Ana Torres" });
    await expect(
      session.getByRole("link", { name: "Ver sesión" }),
    ).toBeVisible();
    await expect(
      session.getByRole("link", { name: "Ir a la reunión en Zoom" }),
    ).toHaveAttribute("href", "https://zoom.us/j/123456");
    await expect(
      page.getByRole("button", { name: /Añadir.*calendario/ }),
    ).toHaveCount(0);
    await page.screenshot({
      path: testInfo.outputPath(`sesiones-${width}.png`),
      fullPage: true,
    });
    await session
      .getByRole("button", { name: "Eliminar de Mis sesiones" })
      .click();
    await expect(page.locator(".connect-session-row")).toHaveCount(0);
    await page.reload();
    await expect(
      page.getByText("Aún no tienes solicitudes guardadas en este navegador."),
    ).toBeVisible();
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

for (const width of [390, 1440]) {
  test(`cinco orientadores con retratos y tarjetas breves a ${width} px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    const people = [
      ["ana-torres", "Ana Torres", "ana", "Ingeniería de Sistemas"],
      ["luis-mendoza", "Luis Mendoza", "luis", "Administración"],
      ["valeria-rojas", "Valeria Rojas", "valeria", "Psicología"],
      [
        "carlos-paredes",
        "Carlos Paredes",
        "carlos",
        "Derecho y Comunicaciones",
      ],
      ["sofia-quispe", "Sofía Quispe", "sofia", "Ingeniería y Arquitectura"],
    ];
    await page.route("**/api/orientacion/orientadores", (route) =>
      route.fulfill({
        json: people.map(([id, name, photo, focus]) => ({
          id,
          name,
          focus,
          photo_url: `/images/orientadores/${photo}.jpg`,
          conditions: "Información detallada para consultar en el perfil.",
          topics: ["Proyectos y formación"],
          tags: ["Proyectos", "Formación"],
          duration_minutes: 30,
          demonstration: true,
          accepts_text: false,
          response_window: "Demostración",
          slots: [],
        })),
      }),
    );
    await page.goto("/conecta");
    await expect(page.locator(".connect-card")).toHaveCount(5);
    await expect
      .poll(() =>
        page
          .locator(".connect-card .connect-portrait img")
          .evaluateAll(
            (items) =>
              items.length === 5 &&
              items.every(
                (item) =>
                  (item as HTMLImageElement).complete &&
                  (item as HTMLImageElement).naturalWidth > 0,
              ),
          ),
      )
      .toBe(true);
    await expect(
      page
        .locator(".connect-card")
        .getByText("Información detallada para consultar en el perfil."),
    ).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await page.screenshot({
      path: testInfo.outputPath(`orientadores-${width}.png`),
      fullPage: true,
    });
  });
}

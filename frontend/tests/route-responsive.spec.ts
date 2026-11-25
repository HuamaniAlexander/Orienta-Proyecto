import { expect, test } from "./fixtures/test";

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`Mi ruta, preparación y Descubre se adaptan a ${width} px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.addInitScript(() => {
      const offer = {
        oferta_id: 10,
        carrera_oficial:
          "Ingeniería de Sistemas de Información y Transformación Digital",
        institucion: "Universidad Tecnológica del Perú",
        distrito: "Los Olivos",
        area_id: 1,
      };
      const second = {
        ...offer,
        oferta_id: 110,
        carrera_oficial: "Administración",
      };
      const question =
        "¿Qué proyectos y prácticas profesionales realizaré durante los primeros ciclos?";
      localStorage.setItem(
        "orienta-progress-v1",
        JSON.stringify({
          offers: [offer, second],
          comparisons: [[offer, second]],
          questions: [question],
          questionDetails: { [question]: { offerId: 10, researched: true } },
          current: {
            version: 1,
            preferences: {
              interests: ["Crear con tecnología"],
              district: "",
              flexible: false,
              extra: "",
              modalities: [1],
              availability: "",
            },
            suggestions: [offer, second].map((entry) => ({
              offer: entry,
              reasons: ["Coincide con tus intereses."],
              source: null,
            })),
          },
          conversation: {
            summary: "Quiero revisar el plan de estudios.",
            questions: [{ text: question, source: "De tu ruta" }],
            offers: [10],
            selectedQuestions: [question],
          },
        }),
      );
    });
    const views = [
      ["/mi-ruta", "Carreras que quieres conocer mejor"],
      ["/mi-ruta?vista=comparaciones", "Tus opciones, listas para retomar."],
      ["/mi-ruta?vista=preguntas", "Lo que quieres averiguar."],
      ["/mi-ruta?vista=preferencias", "Tus preferencias de exploración"],
      ["/mi-ruta/preparar", "Tu guía para conversar"],
      ["/descubre", "Opciones sugeridas"],
    ];
    for (const [path, heading] of views) {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        path,
      ).toBe(width);
    }
    const cards = page.locator(".discovery-career-card");
    const first = await cards.nth(0).boundingBox();
    if (width <= 600) {
      await expect(cards).toHaveCount(1);
      await page.getByRole("button", { name: "Ver más opciones" }).click();
    }
    const second = await cards.nth(width <= 600 ? 0 : 1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first!.width).toBeCloseTo(second!.width, 0);
    if (width > 600) {
      expect(first!.y).toBeCloseTo(second!.y, 0);
      expect(first!.height).toBeCloseTo(second!.height, 0);
    }
  });
}

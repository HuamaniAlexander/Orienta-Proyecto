import { api } from "../../shared/api/client";
import type { CatalogPage } from "../../shared/types/catalog";
import { savedOffer, type Preferences, type Suggestion } from "./Progress";

export const INTERESTS = [
  { label: "Resolver problemas", terms: /ingenier|sistema|procesos|matemat/ },
  {
    label: "Crear con tecnología",
    terms: /tecnolog|software|programa|informat/,
  },
  { label: "Organizar proyectos", terms: /gestion|administr|negocio|proyecto/ },
  {
    label: "Ayudar a otras personas",
    terms: /salud|educa|enferm|psicolog|social/,
  },
  { label: "Diseñar y comunicar", terms: /diseno|comunic|arquitect|creativ/ },
  {
    label: "Investigar cómo funcionan las cosas",
    terms: /ciencia|investig|laboratorio|ingenier/,
  },
];
export const INITIAL: Preferences = {
  interests: [],
  extra: "",
  district: "",
  flexible: false,
  modalities: [],
  availability: "",
};
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export async function discover(
  preferences: Preferences,
  signal: AbortSignal,
): Promise<Suggestion[]> {
  const params = new URLSearchParams({ page_size: "48" });
  if (preferences.district && !preferences.flexible)
    params.set("distrito_id", preferences.district);
  const first = await api<CatalogPage>(`/api/ofertas?${params}`, { signal });
  const offers = [...first.items];
  for (let page = 2; page <= Math.ceil(first.total / first.page_size); page++) {
    params.set("page", String(page));
    const result = await api<CatalogPage>(`/api/ofertas?${params}`, { signal });
    offers.push(...result.items);
  }
  const extraWords = normalize(preferences.extra).match(/[a-z0-9]{3,}/g) ?? [];
  const hasInterests =
    preferences.interests.length > 0 || extraWords.length > 0;
  const ranked = offers
    .filter(
      (offer) =>
        !preferences.modalities.length ||
        preferences.modalities.includes(offer.modalidad_id) ||
        (offer.modalidad_id === 5 &&
          preferences.modalities.some((id) => id === 1 || id === 2)),
    )
    .map((offer) => {
      const content = normalize(
        [
          offer.carrera_oficial,
          offer.area,
          offer.enfoque_editorial,
          offer.ambitos_editoriales,
        ].join(" "),
      );
      const matches = INTERESTS.filter(
        ({ label, terms }) =>
          preferences.interests.includes(label) && terms.test(content),
      ).map(
        ({ label }) =>
          `El nombre, el área o el enfoque de la ficha se relacionan con «${label}».`,
      );
      if (
        extraWords.length &&
        extraWords.every((word) => content.split(/\W+/).includes(word))
      ) {
        matches.push(`La ficha contiene términos de «${preferences.extra}».`);
      }
      const districtMatch = preferences.district === String(offer.distrito_id);
      const reasons = [...matches];
      if (districtMatch)
        reasons.push(`Se ofrece en el distrito elegido, ${offer.distrito}.`);
      if (preferences.modalities.length)
        reasons.push(
          `Su modalidad coincide con tu selección, ${offer.modalidad}.`,
        );
      if (!reasons.length && !hasInterests)
        reasons.push("Oferta disponible para explorar en el catálogo.");
      return {
        offer,
        reasons,
        matches: matches.length,
        score: matches.length * 2 + Number(districtMatch),
      };
    })
    .filter((item) => !hasInterests || item.matches > 0)
    .sort((a, b) => b.score - a.score);
  const unique = new Set<number>();
  const suggestions: Suggestion[] = [];
  for (const { offer, reasons } of ranked) {
    if (unique.has(offer.carrera_id)) continue;
    unique.add(offer.carrera_id);
    suggestions.push({
      offer: savedOffer(offer),
      reasons,
      source: offer.ficha_url ?? offer.fuente_oferta_url,
    });
    if (suggestions.length === 6) break;
  }
  return suggestions;
}

import { api } from "../../shared/api/client";
import type { CatalogPage, Offer } from "../../shared/types/catalog";

export const OFFERS_PER_PAGE = 12;

const connectors = new Set(["de", "del", "la", "las", "el", "los", "y", "en"]);
function words(value: string) {
  return (
    value
      .normalize("NFKD")
      .toLowerCase()
      .replace(/\p{M}/gu, "")
      .match(/[a-z0-9]+/g) ?? []
  ).filter((word) => !connectors.has(word));
}

function matchesName(value: string, query: string[]) {
  const name = words(value);
  return name.some((_, start) =>
    query.every((word, offset) => name[start + offset]?.startsWith(word)),
  );
}

export async function groupedOffers(
  path: string,
  options?: RequestInit,
): Promise<Offer[]> {
  const params = new URLSearchParams(path.split("?")[1]);
  const query = words(params.get("q") ?? "");
  params.set("page_size", "48");
  const load = (page: number) => {
    params.set("page", String(page));
    return api<CatalogPage>(`/api/ofertas?${params}`, options);
  };
  const first = await load(1);
  const unique = new Map<string, Offer>();
  function add(items: Offer[]) {
    for (const offer of items) {
      if (
        query.length &&
        !matchesName(offer.carrera_oficial, query) &&
        !matchesName(offer.institucion, query)
      )
        continue;
      const key = `${offer.carrera_id}:${offer.institucion_id}`;
      if (!unique.has(key)) unique.set(key, offer);
    }
  }
  add(first.items);
  const lastPage = Math.ceil(first.total / first.page_size);
  for (let start = 2; start <= lastPage; start += 6) {
    const pages = await Promise.all(
      Array.from({ length: Math.min(6, lastPage - start + 1) }, (_, index) =>
        load(start + index),
      ),
    );
    for (const page of pages) add(page.items);
  }
  return [...unique.values()];
}

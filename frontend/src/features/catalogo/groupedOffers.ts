import { api } from "../../shared/api/client";
import type { CatalogPage, Offer } from "../../shared/types/catalog";

export const OFFERS_PER_PAGE = 12;

export async function groupedOffers(
  path: string,
  options?: RequestInit,
): Promise<Offer[]> {
  const params = new URLSearchParams(path.split("?")[1]);
  params.set("page_size", "48");
  const load = (page: number) => {
    params.set("page", String(page));
    return api<CatalogPage>(`/api/ofertas?${params}`, options);
  };
  const first = await load(1);
  const unique = new Map<string, Offer>();
  function add(items: Offer[]) {
    for (const offer of items) {
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

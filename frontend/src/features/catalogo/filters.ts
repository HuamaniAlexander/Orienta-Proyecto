import type { Facets } from "../../shared/types/catalog";

// Parent filters constrain children. Keep a child's selection whenever it remains valid.
export const filterOrder = [
  "tipo_id",
  "institucion_id",
  "area_id",
  "carrera_id",
  "modalidad_id",
  "distrito_id",
] as const;
export type FilterKey = (typeof filterOrder)[number];

export function compatibleRows(
  facets: Facets,
  params: URLSearchParams,
  key: FilterKey,
) {
  const parents = filterOrder.slice(0, filterOrder.indexOf(key));
  return facets.relaciones.filter((row) =>
    parents.every(
      (parent) =>
        !params.has(parent) || String(row[parent]) === params.get(parent),
    ),
  );
}

export function normalizeFilters(facets: Facets, params: URLSearchParams) {
  const next = new URLSearchParams(params);
  for (const key of filterOrder) {
    if (
      next.has(key) &&
      !compatibleRows(facets, next, key).some(
        (row) => String(row[key]) === next.get(key),
      )
    ) {
      next.delete(key);
      next.delete("page");
    }
  }
  return next;
}

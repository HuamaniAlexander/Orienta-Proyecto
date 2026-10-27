import { useEffect } from "react";
import {
  Building2,
  GraduationCap,
  BookOpen,
  Monitor,
  MapPin,
  Layers,
  ChevronDown,
  ArrowDownAZ,
} from "lucide-react";
import {
  compatibleRows,
  normalizeFilters,
  filterOrder,
  type FilterKey,
} from "../features/catalogo/filters";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useApi } from "../shared/api/client";
import { Failure, Loading } from "../shared/components/Feedback";
import { OfferCard } from "../shared/components/OfferCard";
import { SelectButton } from "../features/comparador/Selection";
import type { CatalogPage, Facets } from "../shared/types/catalog";
import "../features/catalogo/catalog.css";

export function Catalog() {
  const [rawParams, setParams] = useSearchParams();
  const facets = useApi<Facets>("/api/filtros");
  const params = facets.data
    ? normalizeFilters(facets.data, rawParams)
    : rawParams;
  const canonical = params.toString();
  useEffect(() => {
    if (facets.data && canonical !== rawParams.toString())
      setParams(canonical, { replace: true });
  }, [canonical, rawParams, setParams, facets.data]);
  const result = useApi<CatalogPage>(`/api/ofertas?${params.toString()}`);
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(facets.data ? normalizeFilters(facets.data, next) : next);
  }
  const filters = facets.data
    ? [
        {
          key: "tipo_id" as FilterKey,
          icon: GraduationCap,
          label: "Tipo de institución",
          options: facets.data.tipos.map(
            (v) => [v.codigo_id, v.etiqueta] as const,
          ),
        },
        {
          key: "institucion_id" as FilterKey,
          icon: Building2,
          label: "Institución",
          options: facets.data.instituciones.map(
            (v) => [v.institucion_id, v.nombre] as const,
          ),
        },
        {
          key: "carrera_id" as FilterKey,
          icon: BookOpen,
          label: "Carrera",
          options: facets.data.carreras.map(
            (v) => [v.carrera_id, v.nombre_catalogado] as const,
          ),
        },
        {
          key: "modalidad_id" as FilterKey,
          icon: Monitor,
          label: "Modalidad",
          options: facets.data.modalidades.map(
            (v) => [v.codigo_id, v.etiqueta] as const,
          ),
        },
        {
          key: "distrito_id" as FilterKey,
          icon: MapPin,
          label: "Distrito",
          options: facets.data.distritos.map(
            (v) => [v.distrito_id, v.distrito] as const,
          ),
        },
        {
          key: "area_id" as FilterKey,
          icon: Layers,
          label: "Área académica",
          options: facets.data.areas.map(
            (v) => [v.area_id, v.nombre_area] as const,
          ),
        },
      ]
    : [];
  filters.sort(
    (a, b) => filterOrder.indexOf(a.key) - filterOrder.indexOf(b.key),
  );
  const available = filters.map((filter) => ({
    ...filter,
    options: filter.options.filter(
      ([id]) =>
        facets.data &&
        compatibleRows(facets.data, params, filter.key).some(
          (row) => row[filter.key] === id,
        ),
    ),
  }));
  const active = filters.filter((filter) => params.has(filter.key));
  const pages = result.data
    ? Math.max(1, Math.ceil(result.data.total / result.data.page_size))
    : 1;
  return (
    <div className="container catalog-page">
      <div className="page-heading">
        <p className="eyebrow">EXPLORA TUS POSIBILIDADES</p>
        <h1>Encuentra tu próxima carrera.</h1>
        <p>
          Universidades e institutos de Lima Norte. Un lugar para empezar a
          decidir.
        </p>
      </div>
      <form
        className="catalog-search"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          change("q", String(new FormData(event.currentTarget).get("q") ?? ""));
        }}
      >
        <Search size={22} />
        <input
          key={params.get("q") ?? ""}
          defaultValue={params.get("q") ?? ""}
          type="search"
          name="q"
          aria-label="Buscar carrera o institución"
          placeholder="Busca una carrera o institución…"
          maxLength={150}
        />
        <button className="button" type="submit">
          Buscar <ArrowRight size={16} />
        </button>
      </form>
      <div className="catalog-layout">
        <aside>
          <details className="filters-panel" open>
            <summary>
              <SlidersHorizontal size={18} /> Filtrar opciones
            </summary>
            <div className="filters-title">
              <h2>Filtrar opciones</h2>
              <button onClick={() => setParams({})}>Limpiar</button>
            </div>
            {facets.loading ? (
              <Loading text="Cargando filtros…" />
            ) : facets.error ? (
              <Failure message={facets.error} retry={facets.retry} />
            ) : (
              <div className="filters-fields">
                {available.map((filter) => (
                  <label key={filter.key} htmlFor={filter.key}>
                    {filter.label}
                    <span className="filter-select">
                      <filter.icon
                        className="filter-icon"
                        size={18}
                        aria-hidden="true"
                      />
                      <select
                        id={filter.key}
                        aria-label={filter.label}
                        title={
                          filter.options.find(
                            ([id]) => String(id) === params.get(filter.key),
                          )?.[1] ??
                          `Sin restricción: ${filter.label.toLowerCase()}`
                        }
                        value={params.get(filter.key) ?? ""}
                        onChange={(event) =>
                          change(filter.key, event.target.value)
                        }
                      >
                        <option value="">
                          {["tipo_id", "distrito_id"].includes(filter.key)
                            ? "Todos"
                            : "Todas"}
                        </option>
                        {filter.options.map(([id, label]) => (
                          <option key={id} value={id}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="select-chevron"
                        size={16}
                        aria-hidden="true"
                      />
                    </span>
                  </label>
                ))}
              </div>
            )}
            <p className="filters-help">
              Cada filtro muestra las alternativas compatibles con los
              anteriores.
            </p>
          </details>
        </aside>
        <section
          className="catalog-results"
          aria-label="Resultados del catálogo"
        >
          <div className="results-toolbar">
            <div>
              <h2>Opciones académicas</h2>
              <p role="status">
                {result.loading
                  ? "Buscando opciones…"
                  : result.data
                    ? `${result.data.total} ${result.data.total === 1 ? "opción encontrada" : "opciones encontradas"}`
                    : "La consulta no se pudo completar"}
              </p>
            </div>
            <label className="sort-label">
              Ordenar por
              <span className="filter-select sort-select">
                <ArrowDownAZ
                  className="filter-icon"
                  size={16}
                  aria-hidden="true"
                />
                <select
                  value={params.get("order") ?? "nombre"}
                  onChange={(event) => change("order", event.target.value)}
                >
                  <option value="nombre">Carrera</option>
                  <option value="institucion">Institución</option>
                </select>
                <ChevronDown
                  className="select-chevron"
                  size={16}
                  aria-hidden="true"
                />
              </span>
            </label>
          </div>
          {(active.length > 0 || params.get("q")) && (
            <div className="filter-chips">
              {params.get("q") && (
                <button onClick={() => change("q", "")}>
                  “{params.get("q")}” <X size={13} />
                </button>
              )}
              {active.map((filter) => (
                <button key={filter.key} onClick={() => change(filter.key, "")}>
                  {filter.options.find(
                    (v) => String(v[0]) === params.get(filter.key),
                  )?.[1] ?? filter.label}
                  <X size={13} />
                </button>
              ))}
              <button className="clear-all" onClick={() => setParams({})}>
                Limpiar filtros
              </button>
            </div>
          )}
          {result.loading ? (
            <Loading />
          ) : result.error ? (
            <Failure message={result.error} retry={result.retry} />
          ) : result.data?.items.length ? (
            <>
              <div className="offer-grid">
                {result.data.items.map((offer) => (
                  <OfferCard
                    key={offer.oferta_id}
                    offer={offer}
                    action={<SelectButton offer={offer} />}
                  />
                ))}
              </div>
              <nav className="pagination" aria-label="Páginas del catálogo">
                <button
                  className="button secondary"
                  disabled={result.data.page <= 1}
                  onClick={() => change("page", String(result.data!.page - 1))}
                >
                  <ArrowLeft size={16} />
                  Anterior
                </button>
                <span>
                  Página {result.data.page} de {pages}
                </span>
                <button
                  className="button secondary"
                  disabled={result.data.page >= pages}
                  onClick={() => change("page", String(result.data!.page + 1))}
                >
                  Siguiente
                  <ArrowRight size={16} />
                </button>
              </nav>
            </>
          ) : (
            <div className="feedback">
              <Search size={36} />
              <h2>No encontramos opciones con estos filtros.</h2>
              <p>Prueba con un nombre más corto o cambia algún filtro.</p>
              <button
                className="button secondary"
                onClick={() => setParams({})}
              >
                Ver todas las opciones
              </button>
            </div>
          )}
          <p className="catalog-caption">
            La información académica conserva sus fuentes y fechas de consulta.
          </p>
        </section>
      </div>
    </div>
  );
}

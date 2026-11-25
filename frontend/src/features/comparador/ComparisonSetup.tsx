import {
  ArrowLeftRight,
  ArrowRight,
  Banknote,
  Clock,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Check,
  GraduationCap,
  Info,
  Laptop,
  Layers,
  MapPin,
  Scale,
  Search,
  Target,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../../shared/api/client";
import { Failure, Loading } from "../../shared/components/Feedback";
import {
  InstitutionLogo,
  InstitutionMark,
} from "../../shared/components/InstitutionLogo";
import {
  SearchInput,
  catalogSuggestions,
} from "../../shared/components/SearchInput";
import type { CatalogPage, Facets, Offer } from "../../shared/types/catalog";
import { duration } from "../../shared/types/catalog";
import "./setup.css";

export function ComparisonSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="compare-setup-steps" aria-label="Pasos de la comparación">
      {[
        "Elige tus opciones",
        "Compara por criterio",
        "Explica las diferencias con IA",
      ].map((label, index) => (
        <li
          key={label}
          aria-current={index + 1 === current ? "step" : undefined}
        >
          <span className="compare-step-body">
            <span className="compare-step-number" aria-hidden="true">
              {index + 1}
            </span>
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function ComparisonSetup({
  offers: initialOffers,
  onChange,
  onCompare,
}: {
  offers: Offer[];
  onChange: (offers: Offer[]) => void;
  onCompare: () => void;
}) {
  const facets = useApi<Facets>("/api/filtros");
  const [slots, setSlots] = useState<(Offer | undefined)[]>([
    initialOffers[0],
    initialOffers[1],
  ]);
  const offers = slots.filter((offer): offer is Offer => Boolean(offer));
  function update(next: (Offer | undefined)[]) {
    setSlots(next);
    onChange(next.filter((offer): offer is Offer => Boolean(offer)));
  }
  return (
    <div
      className={`container compare-page compare-setup-page${offers.length === 2 ? " is-ready" : ""}`}
    >
      <nav className="compare-breadcrumb" aria-label="Ruta de navegación">
        <Link to="/descubre">Descubre</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Comparador de carreras</span>
      </nav>
      <header className="compare-setup-heading">
        <div>
          <h1>Compara dos opciones académicas</h1>
          <p>
            Elige dos carreras o una misma carrera en distintas instituciones y
            analiza sus diferencias.
          </p>
        </div>
        <span className="compare-setup-count">
          <Scale size={25} aria-hidden="true" />
          {offers.length} de 2 seleccionadas
          {offers.length === 2 && (
            <span className="compare-setup-complete">
              <Check size={16} aria-hidden="true" />
            </span>
          )}
        </span>
      </header>
      <ComparisonSteps current={1} />
      {facets.error && <Failure message={facets.error} retry={facets.retry} />}
      <div className="compare-setup-panels">
        {[0, 1].map((index) => (
          <OptionPicker
            key={index}
            index={index}
            offer={slots[index]}
            areas={facets.data?.areas ?? []}
            suggestions={catalogSuggestions(facets.data)}
            otherId={slots[1 - index]?.oferta_id}
            onSelect={(offer) => {
              const next = [...slots];
              next[index] = offer;
              update(next);
            }}
            onRemove={() =>
              update(
                slots.map((offer, position) =>
                  position === index ? undefined : offer,
                ),
              )
            }
          />
        ))}
        <button
          className="compare-setup-swap"
          type="button"
          disabled={offers.length !== 2}
          aria-label="Intercambiar opciones"
          onClick={() => update([...slots].reverse())}
        >
          <ArrowLeftRight size={24} aria-hidden="true" />
        </button>
      </div>
      <p className="compare-setup-note">
        <Info size={21} aria-hidden="true" />
        Puedes comparar carreras distintas o instituciones que ofrecen la misma
        carrera.
      </p>
      <section
        className="compare-setup-summary"
        aria-labelledby="setup-summary-title"
      >
        <div className={offers.length === 2 ? "sr-only" : undefined}>
          <h2 id="setup-summary-title">
            Tu comparación <span>{offers.length} / 2</span>
          </h2>
          <p role="status">
            {offers.length === 2
              ? "Tus opciones están listas para comparar."
              : offers.length === 1
                ? "Añade una segunda opción para continuar."
                : "Añade las dos opciones para continuar."}
          </p>
        </div>
        <div className="compare-setup-continue">
          <button
            className="button"
            disabled={offers.length !== 2}
            onClick={onCompare}
          >
            {offers.length === 2 && <Scale size={23} aria-hidden="true" />}
            Comparar opciones <ArrowRight size={20} aria-hidden="true" />
          </button>
          <p>
            {offers.length === 2
              ? "Revisa un criterio a la vez"
              : "Selecciona 2 opciones"}
          </p>
        </div>
      </section>
      <div className="compare-setup-criteria">
        <strong>Después podrás comparar:</strong>
        <ul>
          {(
            [
              [Clock, "Duración"],
              [Target, "Enfoque"],
              [Banknote, "Costos"],
              [MapPin, "Ubicación"],
              [Laptop, "Modalidad"],
            ] as const
          ).map(([Icon, label]) => (
            <li key={label}>
              <Icon size={25} aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function OptionPicker({
  index,
  offer,
  areas,
  suggestions,
  otherId,
  onSelect,
  onRemove,
}: {
  index: number;
  offer?: Offer;
  areas: Facets["areas"];
  suggestions: string[];
  otherId?: number;
  onSelect: (offer: Offer) => void;
  onRemove: () => void;
}) {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [search, setSearch] = useState<string | null>("page_size=6&page=1");
  const [editing, setEditing] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const order = index === 0 ? "primera" : "segunda";
  return (
    <section
      className={`compare-setup-panel${index === 0 ? " is-first" : ""}${offer && !editing ? " has-selection" : ""}`}
      aria-labelledby={`option-title-${index}`}
    >
      <header>
        <span className="compare-setup-number" aria-hidden="true">
          0{index + 1}
        </span>
        <div>
          <h2 id={`option-title-${index}`} ref={heading} tabIndex={-1}>
            {index === 0 ? "Primera opción" : "Segunda opción"}
          </h2>
          <p>
            {index === 0
              ? "Busca una carrera y elige la institución donde se ofrece."
              : "Añade otra oferta para verlas lado a lado."}
          </p>
        </div>
        {offer && !editing && (
          <GraduationCap
            className="compare-setup-cap"
            size={28}
            aria-hidden="true"
          />
        )}
      </header>
      {offer && !editing ? (
        <div className="compare-setup-chosen">
          <div className="compare-setup-identity">
            <div className="compare-setup-selected-logo">
              <InstitutionLogo
                id={offer.institucion_id}
                name={offer.institucion}
              />
            </div>
            <div className="compare-setup-career-name">
              <h3>{offer.carrera_oficial}</h3>
              <p>{offer.institucion}</p>
            </div>
          </div>
          <dl className="compare-setup-facts">
            <div>
              <dt>
                <MapPin size={22} aria-hidden="true" />
                <span className="sr-only">Ubicación</span>
              </dt>
              <dd title={offer.sede}>{offer.distrito}</dd>
            </div>
            <div>
              <dt>
                <Layers size={22} aria-hidden="true" />
                <span className="sr-only">Modalidad</span>
              </dt>
              <dd title={offer.modalidad}>
                {/^consultar\b/i.test(offer.modalidad)
                  ? "Consultar modalidad"
                  : offer.modalidad}
              </dd>
            </div>
            <div>
              <dt>
                <CalendarDays size={22} aria-hidden="true" />
                <span className="sr-only">Duración</span>
              </dt>
              <dd>{duration(offer)}</dd>
            </div>
          </dl>
          <section
            className="compare-setup-about"
            aria-labelledby={`about-career-${index}`}
          >
            <ChartNoAxesColumnIncreasing size={28} aria-hidden="true" />
            <div>
              <h4 id={`about-career-${index}`}>Sobre la carrera</h4>
              <p>
                {offer.enfoque_editorial ||
                  "Revisa el plan de estudios y las actividades de esta carrera en su ficha oficial."}
              </p>
              {offer.enfoque_editorial && (
                <small>Síntesis editorial del catálogo</small>
              )}
            </div>
          </section>
          <div className="compare-setup-chosen-actions">
            <button
              className="button secondary compare-setup-change"
              aria-label={`Cambiar ${order} opción`}
              onClick={() => setEditing(true)}
            >
              <ArrowLeftRight size={19} aria-hidden="true" />
              Cambiar opción
            </button>
            <button
              className="button secondary compare-setup-remove"
              aria-label={`Quitar ${order} opción`}
              onClick={onRemove}
            >
              <Trash2 size={19} aria-hidden="true" />
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <>
          <form
            className="compare-setup-form"
            onSubmit={(event) => {
              event.preventDefault();
              const params = new URLSearchParams({ page_size: "6", page: "1" });
              if (query.trim()) params.set("q", query.trim());
              if (area) params.set("area_id", area);
              setSearch(params.toString());
            }}
          >
            <label className="compare-setup-search">
              <Search size={23} aria-hidden="true" />
              <SearchInput
                type="search"
                aria-label={`Carrera o institución, ${order} opción`}
                placeholder="Carrera o institución"
                value={query}
                onValueChange={setQuery}
                suggestions={suggestions}
                submitOnChoose
              />
            </label>
            <select
              aria-label={`Área de estudio, ${order} opción`}
              value={area}
              onChange={(event) => {
                const nextArea = event.target.value;
                setArea(nextArea);
                const params = new URLSearchParams({ page_size: "6", page: "1" });
                if (query.trim()) params.set("q", query.trim());
                if (nextArea) params.set("area_id", nextArea);
                setSearch(params.toString());
              }}
            >
              <option value="">Todas las áreas de estudio</option>
              {areas.map((item) => (
                <option key={item.area_id} value={item.area_id}>
                  {item.nombre_area}
                </option>
              ))}
            </select>
            <div className="compare-setup-search-actions">
              <button className={`button${index === 1 ? " secondary" : ""}`}>
                Buscar {order} opción{" "}
                <ArrowRight size={20} aria-hidden="true" />
              </button>
              {offer && (
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setEditing(false)}
                >
                  Cancelar cambio
                </button>
              )}
            </div>
          </form>
          <p className="compare-setup-hint">
            <Info size={20} aria-hidden="true" />
            Seleccionarás una oferta del catálogo.
          </p>
          {search && (
            <SearchResults
              key={search}
              search={search}
              otherId={otherId}
              onSelect={(chosen) => {
                onSelect(chosen);
                setEditing(false);
                setSearch(null);
                heading.current?.focus();
              }}
            />
          )}
        </>
      )}
    </section>
  );
}

function SearchResults({
  search,
  otherId,
  onSelect,
}: {
  search: string;
  otherId?: number;
  onSelect: (offer: Offer) => void;
}) {
  const [page, setPage] = useState(1);
  const params = new URLSearchParams(search);
  params.set("page", String(page));
  const result = useApi<CatalogPage>(`/api/ofertas?${params}`);
  if (result.loading) return <Loading text="Buscando ofertas del catálogo…" />;
  if (result.error)
    return <Failure message={result.error} retry={result.retry} />;
  if (!result.data) return null;
  const { items, total, page_size } = result.data;
  return (
    <div className="compare-setup-results">
      <p role="status">
        {total
          ? `${total} ofertas encontradas`
          : "No encontramos ofertas. Prueba con otra carrera o área de estudio."}
      </p>
      <ul>
        {items.map((offer) => (
          <li key={offer.oferta_id}>
            <div className="compare-setup-result-info">
              <InstitutionMark
                id={offer.institucion_id}
                name={offer.institucion}
              />
              <div>
                <strong>{offer.carrera_oficial}</strong>
                <p>{offer.institucion}</p>
                <small>
                  {offer.sede} · {offer.distrito} · {offer.modalidad}
                </small>
              </div>
            </div>
            <button
              className="button secondary"
              disabled={offer.oferta_id === otherId}
              onClick={() => onSelect(offer)}
              aria-label={
                offer.oferta_id === otherId
                  ? undefined
                  : `Elegir ${offer.carrera_oficial} en ${offer.institucion}, ${offer.sede}, ${offer.modalidad}`
              }
            >
              {offer.oferta_id === otherId ? "Ya seleccionada" : "Elegir"}
            </button>
          </li>
        ))}
      </ul>
      {total > page_size && (
        <nav
          className="compare-setup-pagination"
          aria-label="Páginas de resultados"
        >
          <button
            type="button"
            className="button secondary"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </button>
          <span>
            {page} / {Math.ceil(total / page_size)}
          </span>
          <button
            type="button"
            className="button secondary"
            disabled={page * page_size >= total}
            onClick={() => setPage(page + 1)}
          >
            Siguiente
          </button>
        </nav>
      )}
    </div>
  );
}

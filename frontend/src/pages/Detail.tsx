import { SaveOffer } from "../features/ruta/Progress";
import { sourceLabel } from "../shared/types/labels";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Banknote,
  Building2,
  Layers,
  Clock,
  Info,
  BriefcaseBusiness,
  ClipboardList,
  Award,
  FileText,
  Files,
  CalendarDays,
  ExternalLink,
  GraduationCap,
  MapPin,
  Monitor,
  Scale,
} from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useApi } from "../shared/api/client";
import { Failure, Loading } from "../shared/components/Feedback";
import { InstitutionLogo } from "../shared/components/InstitutionLogo";
import { duration, type OfferDetail } from "../shared/types/catalog";
import "../features/detalle/detail.css";

export function officialUrl(value: string | null) {
  try {
    const url = new URL(value ?? "");
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
export function dateLabel(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

const currency = (value: number | null | undefined) =>
  value == null
    ? "No publicado"
    : new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: "PEN",
      }).format(value);

export function Detail() {
  const { id } = useParams();
  const result = useApi<OfferDetail>(`/api/ofertas/${id}`);
  const location = useLocation();
  const from =
    typeof location.state?.from === "string" &&
    location.state.from.startsWith("/carreras")
      ? location.state.from
      : "/carreras";
  if (result.loading)
    return (
      <div className="container">
        <Loading text="Cargando esta opción académica…" />
      </div>
    );
  if (result.error || !result.data)
    return (
      <div className="container section">
        <Link className="text-link" to={from}>
          <ArrowLeft size={17} />
          Volver al catálogo
        </Link>
        <Failure
          message={result.error ?? "No encontramos esta opción."}
          retry={result.retry}
        />
      </div>
    );
  const { oferta: offer, fuentes: sources, tarifas: tariffs } = result.data;
  const program = officialUrl(offer.ficha_url);
  const site = officialUrl(offer.fuente_oferta_url);
  const topics = (offer.ambitos_editoriales || "")
    .split(/[;\n]+/)
    .map((text) => text.trim())
    .filter(Boolean);
  return (
    <div className="container detail-page">
      <nav className="detail-breadcrumb" aria-label="Ruta de navegación">
        <Link className="back-link" to={from}>
          <ArrowLeft size={16} aria-hidden="true" />
          Volver al catálogo
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Ficha de carrera</span>
      </nav>
      <header className="detail-hero">
        <div className="detail-identity">
          <div className="detail-institution-logo">
            <InstitutionLogo
              id={offer.institucion_id}
              name={offer.institucion}
            />
          </div>
          <div className="detail-title">
            <h1>{offer.carrera_oficial}</h1>
            <p>{offer.institucion}</p>
            <div className="detail-tags">
              <span>
                <Layers size={15} aria-hidden="true" />
                {offer.area}
              </span>
              <span>
                <Building2 size={15} aria-hidden="true" />
                {offer.tipo} · {offer.gestion}
              </span>
            </div>
          </div>
          <div className="detail-primary-actions">
            <Link
              className="button"
              to={`/comparar?opciones=${offer.oferta_id}`}
            >
              <Scale size={18} aria-hidden="true" />
              Agregar al comparador
            </Link>
            <SaveOffer offer={offer} iconOnly />
          </div>
        </div>
        <dl className="detail-facts">
          {(
            [
              [Clock, "Duración publicada", duration(offer)],
              [Monitor, "Modalidad", offer.modalidad || "Por confirmar"],
              [MapPin, "Distrito", offer.distrito || "Por confirmar"],
              [
                GraduationCap,
                "Nivel formativo",
                offer.nivel || "Por confirmar",
              ],
            ] as const
          ).map(([Icon, label, value]) => (
            <div key={label}>
              <dt>
                <Icon size={20} aria-hidden="true" />
                {label}
              </dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p className="detail-source-date">
          <CalendarDays size={15} aria-hidden="true" />
          Consulta de la fuente: {dateLabel(offer.fecha_consulta)}
          <a href="#fuentes">
            Ver fuentes <ArrowRight size={14} aria-hidden="true" />
          </a>
        </p>
      </header>

      <div className="detail-content-grid">
        <section
          className="detail-section detail-overview"
          aria-labelledby="detail-overview-title"
        >
          <header className="detail-section-heading">
            <BookOpen size={22} aria-hidden="true" />
            <h2 id="detail-overview-title">Sobre la carrera</h2>
          </header>
          <p className="detail-editorial-label">Síntesis editorial ORIENTA</p>
          <div className="detail-copy-group">
            <p>
              {offer.enfoque_editorial ||
                "Consulta el enfoque de la carrera en su programa oficial."}
            </p>
          </div>
          <div className="detail-copy-group">
            <h3>
              <BriefcaseBusiness size={18} aria-hidden="true" />
              Ámbitos de actividad
            </h3>
            {topics.length > 1 ? (
              <ul className="detail-topics">
                {topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            ) : (
              <p>
                {topics[0] ||
                  "Consulta los ámbitos de actividad en el perfil de egreso oficial."}
              </p>
            )}
          </div>
          <p className="detail-footnote">
            Síntesis orientativa; confirma el perfil de egreso y la malla en el
            programa oficial.
          </p>
          {program && (
            <a
              className="text-link detail-section-link"
              href={program}
              target="_blank"
              rel="noopener noreferrer"
            >
              Consultar el programa oficial{" "}
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          )}
        </section>

        <section
          className="detail-section detail-costs"
          aria-labelledby="detail-costs-title"
        >
          <header className="detail-section-heading">
            <Banknote size={22} aria-hidden="true" />
            <h2 id="detail-costs-title">Costos y condiciones</h2>
          </header>
          <p className="published-cost-description">
            {offer.consulta_costos ||
              "No hay un costo publicado en esta ficha. Solicita el tarifario vigente a la institución."}
          </p>
          <p className="detail-footnote">
            <Info size={17} aria-hidden="true" />
            Confirma concepto, periodo y categoría. Matrícula y enseñanza son
            conceptos distintos.
          </p>
          {tariffs.length > 0 && (
            <details className="detail-tariffs">
              <summary>
                <FileText size={18} aria-hidden="true" />
                Ver tarifario por categoría · {tariffs[0].periodo}
              </summary>
              <p>
                Referencia para {tariffs[0].creditos_matriculados} créditos.
                Confirma tu categoría y carga académica.
              </p>
              <table>
                <caption className="sr-only">
                  Tarifas publicadas por categoría en soles
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Categoría</th>
                    <th scope="col">Por crédito</th>
                    <th scope="col">Matrícula</th>
                  </tr>
                </thead>
                <tbody>
                  {tariffs.map((item) => (
                    <tr key={`${item.periodo}-${item.categoria}`}>
                      <th scope="row">{item.categoria}</th>
                      <td>{currency(item.tarifa_por_credito_pen)}</td>
                      <td>{currency(item.matricula_pen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {[...new Set(tariffs.map((item) => item.aplicacion))].map(
                (condition) => (
                  <p key={condition}>{condition}</p>
                ),
              )}
            </details>
          )}
          <a className="text-link detail-section-link" href="#fuentes">
            Revisar documentos y fechas{" "}
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </section>

        <section
          className="detail-section detail-location"
          aria-labelledby="detail-location-title"
        >
          <header className="detail-section-heading">
            <MapPin size={22} aria-hidden="true" />
            <h2 id="detail-location-title">Sede y ubicación</h2>
          </header>
          <dl className="detail-location-data">
            <div>
              <dt>Distrito</dt>
              <dd>{offer.distrito || "Por confirmar"}</dd>
            </div>
            <div>
              <dt>Sede</dt>
              <dd>{offer.sede || "Por confirmar"}</dd>
            </div>
            <div>
              <dt>Dirección</dt>
              <dd>
                {offer.direccion ||
                  "Consulta la dirección del local con la institución."}
              </dd>
            </div>
          </dl>
          {site && (
            <a
              className="text-link detail-section-link"
              href={site}
              target="_blank"
              rel="noopener noreferrer"
            >
              Consultar sede <ExternalLink size={16} aria-hidden="true" />
            </a>
          )}
        </section>

        <section
          className="detail-section detail-checklist"
          aria-labelledby="detail-checklist-title"
        >
          <header className="detail-section-heading">
            <ClipboardList size={22} aria-hidden="true" />
            <h2 id="detail-checklist-title">Antes de elegir, confirma</h2>
          </header>
          <p>Estos datos requieren consulta directa con la institución.</p>
          <ul className="detail-questions">
            {(
              [
                [BookOpen, "Malla curricular y perfil de egreso"],
                [FileText, "Requisitos de admisión"],
                [Clock, "Horarios y prácticas"],
                [Award, "Acreditaciones y convenios"],
                [BriefcaseBusiness, "Bolsa laboral y datos de empleabilidad"],
                [Banknote, "Costos completos de tu convocatoria"],
              ] as const
            ).map(([Icon, label]) => (
              <li key={label}>
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="detail-section detail-sources"
          id="fuentes"
          aria-labelledby="detail-sources-title"
        >
          <header className="detail-section-heading">
            <Files size={22} aria-hidden="true" />
            <h2 id="detail-sources-title">Fuentes de esta opción.</h2>
          </header>
          <div className="source-list">
            {!sources.length && (
              <p>
                No hay documentos asociados disponibles. Consulta el programa
                oficial de la institución.
              </p>
            )}
            {sources.map((source) => (
              <a
                key={source.fuente_id}
                href={officialUrl(source.url)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText
                  size={20}
                  className="source-icon"
                  aria-hidden="true"
                />
                <div>
                  <strong>{sourceLabel(source, [offer])}</strong>
                  <span className="detail-source-url">{source.url}</span>
                  <small>
                    <CalendarDays size={13} aria-hidden="true" />
                    {source.fecha_o_periodo_fuente ===
                    `Consulta ${source.fecha_consulta}`
                      ? ""
                      : `${source.fecha_o_periodo_fuente} · `}
                    Consulta {dateLabel(source.fecha_consulta)}
                  </small>
                </div>
                <ExternalLink size={17} aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

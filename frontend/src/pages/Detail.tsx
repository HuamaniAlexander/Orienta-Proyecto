import { sourceLabel } from "../shared/types/labels";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  MapPin,
  Monitor,
  Scale,
} from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useApi } from "../shared/api/client";
import { Failure, Loading } from "../shared/components/Feedback";
import { careerImage, Institution } from "../shared/components/OfferCard";
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
          <ArrowLeft size={17} /> Volver al catálogo
        </Link>
        <Failure
          message={result.error ?? "No encontramos esta opción."}
          retry={result.retry}
        />
      </div>
    );
  const { oferta: offer, fuentes: sources, tarifas: tariffs } = result.data;
  return (
    <div className="container detail-page">
      <Link className="back-link" to={from}>
        <ArrowLeft size={16} /> Volver al catálogo
      </Link>
      <section className="detail-hero">
        <div>
          <p className="eyebrow">{offer.area}</p>
          <h1>{offer.carrera_oficial}</h1>
          <Institution offer={offer} />
          <div className="detail-tags">
            <span>
              <GraduationCap size={15} />
              {offer.tipo}
            </span>
            <span>
              <MapPin size={15} />
              {offer.distrito}
            </span>
            <span>{offer.gestion}</span>
          </div>
          <p className="detail-intro">
            Conoce cómo se ofrece esta carrera y qué aspectos conviene revisar
            antes de decidir.
          </p>
          <Link className="button" to={`/comparar?opciones=${offer.oferta_id}`}>
            <Scale size={18} /> Agregar al comparador
          </Link>
          <p className="source-date">
            <CheckCircle2 size={14} /> Consulta de la fuente:{" "}
            {dateLabel(offer.fecha_consulta)}
          </p>
        </div>
        <figure className="detail-image illustration">
          <img
            src={careerImage(offer)}
            alt={`Ilustración del área de ${offer.area}`}
            width="640"
            height="400"
          />
          <figcaption>Imagen ilustrativa generada con IA</figcaption>
        </figure>
      </section>
      <div className="detail-layout">
        <div>
          <section className="detail-section">
            <div className="section-heading">
              <p className="eyebrow">LA OPCIÓN, EN CONTEXTO</p>
              <h2>Lo esencial para empezar.</h2>
            </div>
            <div className="essentials-grid">
              <article>
                <BookOpen size={23} />
                <span>Duración publicada</span>
                <strong>{duration(offer)}</strong>
              </article>
              <article>
                <Monitor size={23} />
                <span>Modalidad</span>
                <strong>{offer.modalidad}</strong>
              </article>
              <article>
                <MapPin size={23} />
                <span>Ubicación</span>
                <strong>{offer.distrito}</strong>
                <small>{offer.sede}</small>
              </article>
              <article>
                <GraduationCap size={23} />
                <span>Nivel formativo</span>
                <strong>{offer.nivel}</strong>
              </article>
            </div>
          </section>
          <section className="detail-section editorial-panel">
            <span className="type-badge">Síntesis editorial ORIENTA</span>
            <h2>¿Qué explora esta carrera?</h2>
            <p>{offer.enfoque_editorial}</p>
            <h3>Ámbitos de actividad</h3>
            <p>{offer.ambitos_editoriales}</p>
            <p className="editorial-note">
              Esta síntesis ayuda a explorar diferencias. No sustituye el perfil
              de egreso ni la malla oficial y no garantiza empleo.
            </p>
          </section>
          <section className="detail-section">
            <h2>Costos y condiciones.</h2>
            <p className="section-intro">
              {offer.consulta_costos ??
                "Solicita a la institución los costos vigentes de esta oferta."}
            </p>
            <div className="info-note">
              Distingue admisión, matrícula, enseñanza y otros derechos. No hay
              un monto comparable de enseñanza publicado para todas las opciones
              del catálogo.
            </div>
            {tariffs.length > 0 && (
              <div className="tariff-panel">
                <h3>Referencia UCSS · {tariffs[0].periodo}</h3>
                <p>
                  Tarifa por crédito según categoría. La categoría aplicable y
                  la cantidad de créditos deben ser confirmadas con la
                  institución.
                </p>
                <ul>
                  {tariffs.map((item) => (
                    <li key={item.categoria}>
                      Categoría {item.categoria}:{" "}
                      <strong>
                        S/ {item.tarifa_por_credito_pen} por crédito
                      </strong>{" "}
                      · matrícula de referencia S/ {item.matricula_pen}
                    </li>
                  ))}
                </ul>
                <p>{tariffs[0].aplicacion}</p>
              </div>
            )}
          </section>
          <section className="detail-section">
            <h2>Antes de elegir, pregunta.</h2>
            <p className="section-intro">
              El libro de datos no documenta todos los aspectos de cada
              programa. Consulta estas condiciones directamente con la
              institución.
            </p>
            <div className="questions-grid">
              {[
                "Malla curricular y perfil de egreso",
                "Requisitos de admisión",
                "Horarios y prácticas",
                "Acreditaciones y convenios",
                "Bolsa laboral y datos de empleabilidad",
                "Costos completos de tu convocatoria",
              ].map((label) => (
                <div key={label}>
                  <CheckCircle2 size={17} />
                  {label}
                </div>
              ))}
            </div>
            {officialUrl(offer.ficha_url) && (
              <a
                className="text-link"
                href={officialUrl(offer.ficha_url)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Consultar el programa oficial <ExternalLink size={16} />
              </a>
            )}
          </section>
          <section className="detail-section" id="fuentes">
            <h2>Fuentes de esta opción.</h2>
            <div className="source-list">
              {sources.map((source) => (
                <a
                  key={source.fuente_id}
                  href={officialUrl(source.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="source-icon">
                    <ExternalLink size={19} />
                  </span>
                  <div>
                    <strong>{sourceLabel(source, [offer])}</strong>
                    <span>{source.url}</span>
                    <small>
                      <CalendarDays size={12} />
                      {source.fecha_o_periodo_fuente} · Consulta{" "}
                      {dateLabel(source.fecha_consulta)}
                    </small>
                  </div>
                  <ArrowRight size={16} />
                </a>
              ))}
            </div>
          </section>
        </div>
        <aside className="detail-sidebar">
          <div className="aside-card">
            <span className="step-icon">
              <MapPin size={24} />
            </span>
            <h3>Tu lugar de estudio</h3>
            <strong>{offer.distrito}</strong>
            <p>
              {offer.direccion ??
                "Consulta la dirección del local con la institución."}
            </p>
            <small>Sede: {offer.sede}</small>
            {officialUrl(offer.fuente_oferta_url) && (
              <a
                className="text-link"
                href={officialUrl(offer.fuente_oferta_url)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Consultar sede <ExternalLink size={15} />
              </a>
            )}
          </div>
          <div className="aside-card aside-blue">
            <Scale size={26} />
            <h3>Una opción se entiende mejor al compararla.</h3>
            <p>
              Elige otra carrera u otra oferta de la misma carrera y revisa qué
              cambia.
            </p>
            <Link
              className="button"
              to={`/comparar?opciones=${offer.oferta_id}`}
            >
              Comparar opciones <ArrowRight size={16} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

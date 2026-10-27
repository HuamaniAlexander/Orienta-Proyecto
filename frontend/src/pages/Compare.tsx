import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Scale,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../shared/api/client";
import { Failure, Loading } from "../shared/components/Feedback";
import { careerImage, Institution } from "../shared/components/OfferCard";
import { useSelection } from "../features/comparador/Selection";
import type { Offer, OfferDetail } from "../shared/types/catalog";
import { officialUrl } from "./Detail";
import "../features/comparador/compare.css";

export interface Comparison {
  opciones: Offer[];
  criterios: {
    key: string;
    title: string;
    a: string | null;
    b: string | null;
    different: boolean;
    editorial: boolean;
  }[];
  misma_carrera: boolean;
  explicacion: string;
  diferencia_duracion: string | null;
  pendientes: string[];
}
export function Compare() {
  const [params, setParams] = useSearchParams();
  const { items, remove, replaceAll } = useSelection();
  const paramIds = (params.get("opciones") ?? "")
    .split(",")
    .filter(Boolean)
    .map(Number);
  const validIds =
    paramIds.length > 0 &&
    paramIds.length <= 2 &&
    paramIds.every((id) => Number.isSafeInteger(id) && id > 0) &&
    new Set(paramIds).size === paramIds.length;
  const ids = validIds
    ? paramIds
    : params.has("opciones")
      ? []
      : items.map((item) => item.oferta_id);
  const key = ids.join(",");
  const [state, setState] = useState<{
    data?: Comparison;
    single?: Offer;
    error?: string;
    loading: boolean;
  }>({ loading: !!key });
  const [attempt, setAttempt] = useState(0);
  const [onlyDifferent, setOnlyDifferent] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    if (!key) {
      setState({ loading: false });
      return;
    }
    setState({ loading: true });
    const values = key.split(",").map(Number);
    if (values.length === 1) {
      api<OfferDetail>(`/api/ofertas/${values[0]}`, {
        signal: controller.signal,
      }).then(
        (data) => {
          if (!controller.signal.aborted) {
            setState({ single: data.oferta, loading: false });
            replaceAll([data.oferta]);
          }
        },
        (error) => {
          if (!controller.signal.aborted)
            setState({ loading: false, error: error.message });
        },
      );
    } else {
      api<Comparison>("/api/comparaciones", {
        method: "POST",
        body: JSON.stringify({ oferta_ids: values }),
        signal: controller.signal,
      }).then(
        (data) => {
          if (!controller.signal.aborted) {
            setState({ data, loading: false });
            replaceAll(data.opciones);
          }
        },
        (error) => {
          if (!controller.signal.aborted)
            setState({ loading: false, error: error.message });
        },
      );
    }
    return () => controller.abort();
  }, [key, attempt, replaceAll]);
  function change(offer: Offer) {
    remove(offer.oferta_id);
    const remaining = ids.filter((id) => id !== offer.oferta_id);
    setParams(remaining.length ? { opciones: remaining.join(",") } : {}, {
      replace: true,
    });
  }
  const selected = state.data?.opciones ?? (state.single ? [state.single] : []);
  return (
    <div className="container compare-page">
      <Link className="back-link" to="/carreras">
        <ArrowLeft size={16} />
        Volver al catálogo
      </Link>
      <div className="page-heading">
        <p className="eyebrow">
          <Scale size={15} /> DOS OPCIONES, MÁS PERSPECTIVA
        </p>
        <h1>Compara. Descubre qué cambia.</h1>
        <p>
          Primero la carrera. Después, la oferta que mejor encaja con tus
          prioridades.
        </p>
      </div>
      {params.has("opciones") && !validIds ? (
        <Failure message="El enlace debe contener una o dos opciones diferentes. Elige de nuevo desde el catálogo." />
      ) : state.loading ? (
        <Loading text="Preparando tu comparación…" />
      ) : state.error ? (
        <Failure
          message={state.error}
          retry={() => setAttempt((value) => value + 1)}
        />
      ) : (
        <>
          <div className="compare-options">
            {selected.map((offer, index) => (
              <article className="comparison-option" key={offer.oferta_id}>
                <div className="comparison-option-image illustration">
                  <img
                    src={careerImage(offer)}
                    alt=""
                    width="640"
                    height="400"
                  />
                  <span>OPCIÓN {index === 0 ? "A" : "B"}</span>
                </div>
                <div>
                  <div className="option-heading">
                    <h2>{offer.carrera_oficial}</h2>
                    <button
                      onClick={() => change(offer)}
                      aria-label={`Quitar opción ${index === 0 ? "A" : "B"}`}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <Institution offer={offer} />
                  <p className="option-meta">
                    {offer.distrito} · {offer.modalidad}
                  </p>
                  <Link
                    className="text-link"
                    to="/carreras"
                    onClick={() => {
                      replaceAll(
                        selected.filter(
                          (item) => item.oferta_id !== offer.oferta_id,
                        ),
                      );
                    }}
                  >
                    Cambiar esta opción <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
            {Array.from({ length: 2 - selected.length }, (_, index) => (
              <div key={index} className="empty-option">
                <span className="step-icon">
                  <Search size={28} />
                </span>
                <h2>
                  {selected.length
                    ? "Completa tu comparación"
                    : "Tu próxima decisión empieza aquí."}
                </h2>
                <p>
                  {selected.length
                    ? "Elige otra carrera o una oferta de la misma carrera."
                    : "Selecciona dos opciones del catálogo para ver sus diferencias."}
                </p>
                <Link className="button secondary" to="/carreras">
                  Explorar carreras <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
          {state.data && (
            <>
              <div className="comparison-intro">
                <div>
                  <Check size={19} />
                  <p>{state.data.explicacion}</p>
                </div>
                <label>
                  <input
                    type="checkbox"
                    checked={onlyDifferent}
                    onChange={(event) => setOnlyDifferent(event.target.checked)}
                  />
                  Solo diferencias
                </label>
              </div>
              <section
                className="comparison-table"
                aria-label="Criterios de comparación"
              >
                <div className="comparison-table-head">
                  <span>Criterio</span>
                  <strong>Opción A</strong>
                  <strong>Opción B</strong>
                </div>
                {state.data.criterios
                  .filter((row) => !onlyDifferent || row.different)
                  .map((row) => (
                    <div
                      className={
                        row.different
                          ? "comparison-row different"
                          : "comparison-row"
                      }
                      key={row.key}
                    >
                      <div className="criterion-title">
                        <strong>{row.title}</strong>
                        {row.editorial && <small>Síntesis editorial</small>}
                        {row.different && (
                          <span className="difference-label">Diferencia</span>
                        )}
                      </div>
                      <p>{row.a ?? "Consulta este dato con la institución"}</p>
                      <p>{row.b ?? "Consulta este dato con la institución"}</p>
                    </div>
                  ))}
              </section>
              {state.data.diferencia_duracion && (
                <p className="duration-note">
                  {state.data.diferencia_duracion}
                </p>
              )}
              <div className="info-note">
                Los años y ciclos se conservan como unidades distintas. Los
                costos requieren confirmar concepto, categoría y periodo; no se
                calcula una diferencia con datos incompletos.
              </div>
              <section className="comparison-pending">
                <h2>Lo que falta confirmar.</h2>
                <p>
                  Consulta las fuentes para revisar{" "}
                  {state.data.pendientes.join(", ").toLowerCase()}. Las síntesis
                  editoriales no sustituyen esos documentos.
                </p>
                <div>
                  {state.data.opciones.map((offer, index) => (
                    <a
                      className="button secondary"
                      key={offer.oferta_id}
                      href={officialUrl(offer.ficha_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Fuente oficial · Opción {index === 0 ? "A" : "B"}
                      <ExternalLink size={15} />
                    </a>
                  ))}
                </div>
              </section>
              <section className="ai-callout">
                <span>
                  <Sparkles size={29} />
                </span>
                <div>
                  <h2>¿Qué diferencias importan para ti?</h2>
                  <p>
                    Cuéntanos tus prioridades y explora esta comparación con
                    ayuda de la IA.
                  </p>
                </div>
                <Link className="button" to={`/analisis?opciones=${key}`}>
                  Explorar con IA <ArrowRight size={17} />
                </Link>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}

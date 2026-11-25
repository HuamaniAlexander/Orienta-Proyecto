import { SaveComparison } from "../features/ruta/Progress";
import { offerLabel } from "../shared/types/labels";
import {
  ArrowRight,
  Bookmark,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../shared/api/client";
import { Failure, Loading } from "../shared/components/Feedback";
import { InstitutionLogo } from "../shared/components/InstitutionLogo";
import { CriteriaGuide } from "../features/comparador/CriteriaGuide";
import { useSelection } from "../features/comparador/Selection";
import {
  ComparisonSetup,
  ComparisonSteps,
} from "../features/comparador/ComparisonSetup";
import type { Offer, OfferDetail } from "../shared/types/catalog";
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
  const hasOptions = params.has("opciones");
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
  useEffect(() => {
    const controller = new AbortController();
    if (!key || !hasOptions) {
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
  }, [key, attempt, replaceAll, hasOptions]);
  function change(offer: Offer) {
    remove(offer.oferta_id);
    const remaining = ids.filter((id) => id !== offer.oferta_id);
    setParams(remaining.length ? { opciones: remaining.join(",") } : {}, {
      replace: true,
    });
  }
  const selected = state.data?.opciones ?? (state.single ? [state.single] : []);
  if (
    (!hasOptions || (validIds && paramIds.length === 1)) &&
    !state.loading &&
    !state.error
  ) {
    return (
      <ComparisonSetup
        offers={hasOptions ? selected : items}
        onChange={(offers) => {
          replaceAll(offers);
          if (hasOptions) setParams({}, { replace: true });
        }}
        onCompare={() =>
          setParams({ opciones: items.map((item) => item.oferta_id).join(",") })
        }
      />
    );
  }
  return (
    <div className="container compare-page">
      <nav className="compare-breadcrumb" aria-label="Ruta de navegación">
        <Link aria-label="Volver al catálogo" to="/carreras">
          Carreras
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Comparar</span>
      </nav>
      <div className="page-heading">
        <h1>Compara a tu ritmo.</h1>
        <p>Un criterio a la vez, tus dos opciones siempre a la vista.</p>
      </div>
      <ComparisonSteps current={2} />
      {state.data && !state.loading && !state.error && (
        <div className="comparison-save-bar">
          <p>
            <Bookmark size={18} aria-hidden="true" />
            Guarda estas dos opciones para retomarlas en Mi ruta.
          </p>
          <div className="route-actions">
            <SaveComparison offers={state.data.opciones} />
            <Link
              className="button secondary"
              to="/mi-ruta?vista=comparaciones"
            >
              Ver mis comparaciones <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
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
            {selected.map((offer) => (
              <article className="comparison-option" key={offer.oferta_id}>
                <div className="compare-institution-logo">
                  <InstitutionLogo
                    id={offer.institucion_id}
                    name={offer.institucion}
                  />
                </div>
                <div>
                  <div className="option-heading">
                    <h2>{offer.carrera_oficial}</h2>
                    <button
                      onClick={() => change(offer)}
                      aria-label={`Quitar ${offerLabel(offer)}`}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <p className="option-meta">
                    <MapPin size={15} aria-hidden="true" /> {offer.distrito}
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
                    Cambiar opción <ArrowRight size={15} />
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
              <CriteriaGuide key={key} comparison={state.data} ids={key} />
            </>
          )}
        </>
      )}
    </div>
  );
}

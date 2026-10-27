import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  LoaderCircle,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, useApi } from "../shared/api/client";
import { Failure, Loading } from "../shared/components/Feedback";
import { careerImage } from "../shared/components/OfferCard";
import type { Facets, Source } from "../shared/types/catalog";
import type { Comparison } from "./Compare";
import { officialUrl } from "./Detail";
import "../features/explicacion-ia/analysis.css";

interface Point {
  texto: string;
  naturaleza: "documentado" | "editorial" | "preferencia" | "limite";
  fuente_ids: number[];
}
interface AnalysisResult {
  explicacion: {
    oferta_ids: number[];
    diferencias_principales: Point[];
    coincidencias: Point[];
    relacion_preferencias: Point[];
    ventajas_condicionadas: Point[];
    sugerencia: {
      oferta_id: number | null;
      motivo: string;
      fuente_ids: number[];
    };
    limites: string[];
  };
  fuentes: Source[];
  contenido: {
    estado: string;
    opciones: { carrera_id: number; terminos_compartidos: string[] }[];
  };
  modelo: string;
}
const PRIORITIES = [
  ["enfoque", "Lo que aprenderé"],
  ["ubicacion", "Estudiar cerca"],
  ["modalidad", "La modalidad"],
  ["duracion", "La duración"],
  ["costos", "Los costos"],
];

export function Analysis() {
  const [params] = useSearchParams();
  const values = (params.get("opciones") ?? "").split(",").map(Number);
  if (
    values.length !== 2 ||
    new Set(values).size !== 2 ||
    values.some((id) => !Number.isSafeInteger(id) || id < 1)
  )
    return (
      <div className="container section">
        <Failure message="Selecciona dos opciones diferentes para explorar sus diferencias con IA." />
        <Link className="button" to="/carreras">
          Explorar carreras <ArrowRight size={17} />
        </Link>
      </div>
    );
  return <AnalysisContent ids={values.join(",")} />;
}

function AnalysisContent({ ids }: { ids: string }) {
  const [comparison, setComparison] = useState<Comparison>();
  const [comparisonError, setComparisonError] = useState("");
  const facets = useApi<Facets>("/api/filtros");
  const [priorities, setPriorities] = useState<string[]>(["enfoque"]);
  const [district, setDistrict] = useState("");
  const [modality, setModality] = useState("");
  const [interests, setInterests] = useState("");
  const [result, setResult] = useState<AnalysisResult>();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const output = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    api<Comparison>("/api/comparaciones", {
      method: "POST",
      body: JSON.stringify({ oferta_ids: ids.split(",").map(Number) }),
      signal: controller.signal,
    }).then(
      (data) => {
        if (!controller.signal.aborted) setComparison(data);
      },
      (err) => {
        if (!controller.signal.aborted) setComparisonError(err.message);
      },
    );
    return () => {
      controller.abort();
      abort.current?.abort();
    };
  }, [ids]);
  useEffect(() => {
    if (result)
      output.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);
  async function submit() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    setResult(undefined);
    abort.current = new AbortController();
    try {
      const response = await api<AnalysisResult>("/api/explicaciones", {
        method: "POST",
        body: JSON.stringify({
          oferta_ids: ids.split(",").map(Number),
          preferencias: {
            prioridades: priorities,
            intereses: interests,
            distrito_id: district ? Number(district) : null,
            modalidad_id: modality ? Number(modality) : null,
          },
        }),
        signal: abort.current.signal,
      });
      setResult(response);
    } catch (err) {
      if (!abort.current.signal.aborted)
        setError(
          err instanceof Error
            ? err.message
            : "No pudimos obtener la explicación.",
        );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  if (comparisonError)
    return (
      <div className="container section">
        <Failure message={comparisonError} />
        <Link className="text-link" to={`/comparar?opciones=${ids}`}>
          Volver a la comparación
        </Link>
      </div>
    );
  if (!comparison)
    return (
      <div className="container">
        <Loading text="Recuperando tus dos opciones…" />
      </div>
    );
  function points(title: string, items: Point[]) {
    return (
      items.length > 0 && (
        <section className="analysis-result-section">
          <h3>{title}</h3>
          <ul>
            {items.map((item, index) => (
              <li key={index}>
                <span>{item.texto}</span>
                <div className="point-references">
                  {item.naturaleza !== "documentado" && (
                    <small>
                      {
                        {
                          editorial: "Síntesis editorial",
                          preferencia: "Según tus preferencias",
                          limite: "Límite de la información",
                        }[item.naturaleza]
                      }
                    </small>
                  )}
                  {item.fuente_ids.map((id) => (
                    <a key={id} href={`#fuente-ia-${id}`}>
                      Fuente {id}
                    </a>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )
    );
  }
  return (
    <div className="container analysis-page">
      <Link className="back-link" to={`/comparar?opciones=${ids}`}>
        <ArrowLeft size={16} />
        Volver a la comparación
      </Link>
      <div className="page-heading">
        <p className="eyebrow">
          <Sparkles size={15} /> UNA MIRADA CON CONTEXTO
        </p>
        <h1>
          Entiende tus opciones.
          <br />
          Con tus prioridades en mente.
        </h1>
        <p>
          La IA te ayuda a explorar las diferencias. La decisión sigue siendo
          tuya.
        </p>
      </div>
      <div className="analysis-selected">
        {comparison.opciones.map((offer, index) => (
          <div key={offer.oferta_id}>
            <img
              className="illustration"
              src={careerImage(offer)}
              width="72"
              height="72"
              alt=""
            />
            <div>
              <span>OPCIÓN {index === 0 ? "A" : "B"}</span>
              <strong>{offer.carrera_oficial}</strong>
              <small>
                {offer.institucion} · {offer.distrito}
              </small>
            </div>
          </div>
        ))}
      </div>
      <div className="analysis-layout">
        <form
          className="preferences-panel"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="panel-heading">
            <span>01</span>
            <div>
              <h2>¿Qué es importante para ti?</h2>
              <p>Elige hasta tres prioridades.</p>
            </div>
          </div>
          <fieldset className="priority-options" disabled={pending}>
            <legend className="sr-only">Tus prioridades</legend>
            {PRIORITIES.map(([value, label]) => (
              <label
                key={value}
                className={priorities.includes(value) ? "checked" : ""}
              >
                <input
                  type="checkbox"
                  checked={priorities.includes(value)}
                  disabled={
                    !priorities.includes(value) && priorities.length >= 3
                  }
                  onChange={() =>
                    setPriorities((current) =>
                      current.includes(value)
                        ? current.filter((item) => item !== value)
                        : [...current, value],
                    )
                  }
                />
                <span>{label}</span>
                {priorities.includes(value) && <Check size={14} />}
              </label>
            ))}
          </fieldset>
          <div className="preference-selects">
            <label>
              ¿Dónde prefieres estudiar?
              <select
                aria-label="Distrito preferido"
                disabled={pending}
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
              >
                <option value="">No tengo un distrito definido</option>
                {facets.data?.distritos.map((item) => (
                  <option key={item.distrito_id} value={item.distrito_id}>
                    {item.distrito}
                  </option>
                ))}
              </select>
            </label>
            <label>
              ¿Qué modalidad prefieres?
              <select
                aria-label="Modalidad preferida"
                disabled={pending}
                value={modality}
                onChange={(event) => setModality(event.target.value)}
              >
                <option value="">Estoy explorando</option>
                {facets.data?.modalidades
                  .filter((item) => item.codigo_id <= 3)
                  .map((item) => (
                    <option key={item.codigo_id} value={item.codigo_id}>
                      {item.etiqueta}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <label className="interests-label" htmlFor="intereses">
            Cuéntanos un poco más <span>(opcional)</span>
          </label>
          <textarea
            id="intereses"
            disabled={pending}
            value={interests}
            onChange={(event) => setInterests(event.target.value)}
            maxLength={1500}
            rows={4}
            placeholder="Por ejemplo: disfruto resolver problemas con tecnología y quiero estudiar de forma presencial."
          />
          <p className="preferences-help">
            Estas preguntas contextualizan una comparación; no constituyen un
            test vocacional validado. Tus preferencias no se guardan en la base
            de datos y se envían a Gemini al solicitar el análisis.
          </p>
          <button className="button" type="submit" disabled={pending}>
            {pending ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              <Sparkles size={18} />
            )}{" "}
            {pending
              ? "Explorando tus opciones…"
              : "Explorar diferencias con IA"}
          </button>
          {pending && (
            <p role="status" className="processing-note">
              Estamos preparando una explicación con los datos y fuentes de tus
              opciones.
            </p>
          )}
        </form>
        <aside className="analysis-explainer">
          <span className="step-icon">
            <Sparkles size={24} />
          </span>
          <h2>
            Más claridad,
            <br />
            sin promesas imposibles.
          </h2>
          <p>
            La explicación conecta tus prioridades con lo que está documentado.
          </p>
          <ul>
            <li>
              <Check size={16} />
              Diferencias y coincidencias
            </li>
            <li>
              <Check size={16} />
              Ventajas según tus preferencias
            </li>
            <li>
              <Check size={16} />
              Fuentes para seguir investigando
            </li>
            <li>
              <Check size={16} />
              Lo que todavía falta confirmar
            </li>
          </ul>
          <div>
            <MapPin size={17} />
            <p>
              Puede que ambas opciones encajen, o que falte información para
              sugerir una.
            </p>
          </div>
        </aside>
      </div>
      {error && (
        <div className="ai-error">
          <Failure message={error} retry={() => void submit()} />
          <Link className="text-link" to={`/comparar?opciones=${ids}`}>
            Tu comparación básica sigue disponible <ArrowRight size={16} />
          </Link>
        </div>
      )}
      {result && (
        <div className="analysis-output" ref={output} aria-live="polite">
          <div className="panel-heading">
            <span>02</span>
            <div>
              <p className="eyebrow">EXPLICACIÓN GENERADA CON GEMINI</p>
              <h2>Una mirada a tus diferencias.</h2>
            </div>
          </div>
          <div className="result-grid">
            {points(
              "Diferencias principales",
              result.explicacion.diferencias_principales,
            )}
            {points("Lo que tienen en común", result.explicacion.coincidencias)}
            {points(
              "En relación con tus prioridades",
              result.explicacion.relacion_preferencias,
            )}
            {points(
              "Ventajas condicionadas",
              result.explicacion.ventajas_condicionadas,
            )}
          </div>
          <section className="suggestion-panel">
            <Sparkles size={23} />
            <div>
              <h3>
                {result.explicacion.sugerencia.oferta_id
                  ? "Una orientación para seguir explorando"
                  : "Sin una preferencia concluyente"}
              </h3>
              <p>{result.explicacion.sugerencia.motivo}</p>
              <div className="point-references">
                {result.explicacion.sugerencia.fuente_ids.map((id) => (
                  <a href={`#fuente-ia-${id}`} key={id}>
                    Fuente {id}
                  </a>
                ))}
              </div>
            </div>
          </section>
          <section className="analysis-limits">
            <h3>Ten en cuenta</h3>
            <ul>
              {result.explicacion.limites.map((limit, index) => (
                <li key={index}>{limit}</li>
              ))}
            </ul>
          </section>
          {result.contenido.opciones.length > 0 && (
            <details className="lexical-details">
              <summary>Coincidencias de palabras con el catálogo</summary>
              <p>
                El índice de contenido identifica términos compartidos. No es un
                porcentaje de afinidad ni una recomendación vocacional.
              </p>
              {result.contenido.opciones.map((item) => (
                <p key={item.carrera_id}>
                  <strong>
                    {
                      comparison.opciones.find(
                        (offer) => offer.carrera_id === item.carrera_id,
                      )?.carrera_oficial
                    }
                    :{" "}
                  </strong>
                  {item.terminos_compartidos.join(", ") ||
                    "Sin términos compartidos"}
                </p>
              ))}
            </details>
          )}
          <section className="analysis-sources">
            <h3>Fuentes del contexto</h3>
            <div>
              {result.fuentes.map((source) => (
                <a
                  id={`fuente-ia-${source.fuente_id}`}
                  key={source.fuente_id}
                  href={officialUrl(source.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>
                    Fuente {source.fuente_id} · {source.emisor_tipo}
                  </span>
                  <small>{source.url}</small>
                  <ExternalLink size={15} />
                </a>
              ))}
            </div>
          </section>
          <p className="model-note">
            Modelo: {result.modelo}. La validación estructural y de referencias
            no garantiza que cada interpretación sea correcta. Contrasta la
            explicación con las fuentes.
          </p>
        </div>
      )}
    </div>
  );
}

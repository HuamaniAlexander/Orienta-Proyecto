import { readableText, sourceLabel } from "../shared/types/labels";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  LoaderCircle,
  MapPin,
  Lightbulb,
  Laptop,
  Clock,
  Banknote,
  Flag,
  FileText,
  Info,
  MessageSquare,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, useApi } from "../shared/api/client";
import { Failure, Loading } from "../shared/components/Feedback";
import { InstitutionLogo } from "../shared/components/InstitutionLogo";
import { ComparisonSteps } from "../features/comparador/ComparisonSetup";
import { SaveComparison } from "../features/ruta/Progress";
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
  motivo_resumen_catalogo?: string;
}
function catalogSummary(
  comparison: Comparison,
  reason: string,
): AnalysisResult {
  const offers = comparison.opciones;
  const rows = comparison.criterios.filter(
    (row) =>
      ["duracion", "distrito", "modalidad"].includes(row.key) &&
      row.a &&
      row.b &&
      ![row.a, row.b].some((value) => /^consultar/i.test(value)),
  );
  const points = (different: boolean): Point[] =>
    rows
      .filter((row) => row.different === different)
      .map((row) => ({
        texto: different
          ? `${row.title} de ${offers[0].institucion}: ${row.a}. ${offers[1].institucion}: ${row.b}.`
          : `${row.title}: ambas ofertas registran ${row.a}.`,
        naturaleza: "documentado",
        fuente_ids: [],
      }));
  return {
    explicacion: {
      oferta_ids: offers.map((offer) => offer.oferta_id),
      diferencias_principales: points(true),
      coincidencias: points(false),
      relacion_preferencias: [],
      ventajas_condicionadas: [],
      sugerencia: {
        oferta_id: null,
        motivo: "Compara las mallas y los importes publicados antes de elegir.",
        fuente_ids: [],
      },
      limites: [],
    },
    fuentes: [],
    contenido: { estado: "no_disponible", opciones: [] },
    modelo: "",
    motivo_resumen_catalogo: reason,
  };
}

const PRIORITIES = [
  ["enfoque", "Lo que aprenderé", Lightbulb],
  ["ubicacion", "Estudiar cerca", MapPin],
  ["modalidad", "Modalidad", Laptop],
  ["duracion", "Duración", Clock],
  ["costos", "Costos", Banknote],
] as const;
const STEPS = [
  "Tus prioridades",
  "Resumen",
  "Qué significa para ti",
  "Fuentes y próximos pasos",
];

const priorityGuides: Record<
  string,
  {
    title: string;
    checks: string[];
    question: string;
    action: string;
    criterion: string;
  }
> = {
  enfoque: {
    title: "Si te importa lo que aprenderás",
    checks: [
      "Cursos y áreas del plan de estudios",
      "Perfil de egreso",
      "Actividades y proyectos del programa",
    ],
    question: "¿Qué aprenderé y cómo lo pondré en práctica?",
    action: "Revisar programas",
    criterion: "enfoque",
  },
  ubicacion: {
    title: "Si te importa estudiar cerca",
    checks: [
      "Dirección de la sede",
      "Horarios de asistencia",
      "Tiempo de traslado",
    ],
    question: "¿Cómo encaja la asistencia al campus en mi rutina?",
    action: "Revisar sedes",
    criterion: "ubicacion",
  },
  modalidad: {
    title: "Si te importa la modalidad",
    checks: [
      "Sesiones presenciales",
      "Actividades en línea",
      "Requisitos de conexión",
    ],
    question: "¿Qué actividades debo realizar en el campus?",
    action: "Revisar modalidades",
    criterion: "modalidad",
  },
  duracion: {
    title: "Si te importa la duración",
    checks: [
      "Duración publicada",
      "Número de ciclos",
      "Prácticas y requisitos de egreso",
    ],
    question: "¿Qué etapas incluye el plan hasta egresar?",
    action: "Revisar duración",
    criterion: "duracion",
  },
  costos: {
    title: "Si te importan los costos",
    checks: [
      "Conceptos de matrícula",
      "Unidad de cobro",
      "Periodo y categoría del tarifario",
    ],
    question: "¿Cuánto pagaría en mi convocatoria y bajo qué condiciones?",
    action: "Revisar costos",
    criterion: "costos",
  },
};

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
  return <AnalysisContent key={values.join(",")} ids={values.join(",")} />;
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
  const [step, setStep] = useState(0);
  const [summaryTab, setSummaryTab] = useState<"diff" | "same" | "guide">("diff");
  const [meaningTab, setMeaningTab] = useState<"guide" | "analysis">("guide");
  const [pagedIndices, setPagedIndices] = useState<Record<string, number>>({});
  const [submittedPriorities, setSubmittedPriorities] = useState<string[]>([]);
  const lastGeneral = useRef(false);
  const [sourceTarget, setSourceTarget] = useState<string>();
  useEffect(() => {
    if (step === 3 && sourceTarget) {
      document.getElementById(sourceTarget)?.focus();
      setSourceTarget(undefined);
    }
  }, [step, sourceTarget]);
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
  async function submit(general = false) {
    if (busy.current) return;
    busy.current = true;
    lastGeneral.current = general;
    setStep(0);
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
            prioridades: general ? [] : priorities,
            intereses: general ? "" : interests,
            distrito_id: !general && district ? Number(district) : null,
            modalidad_id: !general && modality ? Number(modality) : null,
          },
        }),
        signal: abort.current.signal,
      });
      setResult(response);
      setSubmittedPriorities(general ? [] : priorities);
      setStep(1);
    } catch (err) {
      if (abort.current.signal.aborted) return;
      const message =
        err instanceof Error
          ? err.message
          : "No pudimos obtener la explicación.";
      if (
        comparison &&
        /La respuesta de IA no superó la validación|Gemini no está disponible|La IA devolvió una respuesta incompleta o inválida/.test(
          message,
        )
      ) {
        setResult(
          catalogSummary(
            comparison,
            message.includes("validación")
              ? "La respuesta de Gemini quedó descartada por la validación."
              : "Gemini no pudo generar la explicación en este momento.",
          ),
        );
        setSubmittedPriorities(general ? [] : priorities);
        setStep(1);
      } else {
        setError(message);
      }
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
  const offers = comparison.opciones;
  const compareUrl = `/comparar?opciones=${ids}`;
  const labeledPriorities = PRIORITIES.filter(([id]) =>
    submittedPriorities.includes(id),
  ).map(([, label]) => label);
  const sourceByUrl = new Map(
    (result?.fuentes ?? [])
      .filter((source) => officialUrl(source.url))
      .map((source) => [officialUrl(source.url), source]),
  );
  const groupedUrls = new Set<string>();
  const sourceGroups = offers.map((offer) => ({
    offer,
    links: [
      [offer.ficha_url, "Programa académico"],
      [offer.fuente_oferta_url, `Sede ${offer.distrito}`],
    ].flatMap(([url, label]) => {
      const href = officialUrl(url);
      if (!href || groupedUrls.has(href)) return [];
      groupedUrls.add(href);
      return [{ href, label }];
    }),
  }));
  function shortSourceText(fullLabel: string) {
    const [prefix, rest] = fullLabel.split(": ");
    if (!rest) return fullLabel;
    const parts = rest.split(" · ");
    const inst = parts[1] ?? parts[0] ?? rest;
    const shortInst = inst
      .replace(/^Universidad Tecnológica del Perú$/i, "UTP")
      .replace(/^Universidad Privada del Norte$/i, "UPN")
      .replace(/^Universidad César Vallejo$/i, "UCV")
      .replace(/^Universidad de Ciencias y Humanidades$/i, "UCH")
      .replace(/^Universidad Católica Sedes Sapientiae$/i, "UCSS")
      .replace(/^Universidad Peruana Cayetano Heredia$/i, "Cayetano Heredia")
      .replace(/^Universidad Científica del Sur$/i, "Científica del Sur")
      .replace(/^Universidad Privada Norbert Wiener$/i, "Norbert Wiener")
      .replace(/^Universidad de San Martín de Porres$/i, "USMP")
      .replace(/^Universidad Continental$/i, "Continental")
      .replace(/^Instituto de Educación Superior /i, "IES ")
      .replace(/^Escuela de Educación Superior /i, "EES ");
    return `${prefix} · ${shortInst}`;
  }
  function sourceLink(id: number) {
    const source = result?.fuentes.find((item) => item.fuente_id === id);
    const canonical = source && sourceByUrl.get(officialUrl(source.url));
    if (!canonical) return null;
    const target = `fuente-ia-${canonical.fuente_id}`;
    const full = sourceLabel(source, offers);
    return (
      <button
        type="button"
        key={id}
        className="text-link"
        title={full}
        onClick={() => {
          setStep(3);
          setSourceTarget(target);
        }}
      >
        <FileText size={12} aria-hidden="true" />
        {shortSourceText(full)}
      </button>
    );
  }
  function points(
    title: string,
    items: Point[],
    isSame = false,
    badgePrefix?: string,
    carouselKey?: string,
  ) {
    const labelBase = badgePrefix ?? (isSame ? "Coincidencia" : "Diferencia");
    const activeIndex = carouselKey
      ? Math.min(pagedIndices[carouselKey] ?? 0, Math.max(0, items.length - 1))
      : null;
    const shownItems =
      activeIndex !== null ? [{ item: items[activeIndex], index: activeIndex }] : items.map((item, index) => ({ item, index }));
    return (
      items.length > 0 && (
        <section className="analysis-result-section">
          <div className="analysis-section-head">
            <h3>{title}</h3>
            {carouselKey && items.length > 1 && activeIndex !== null && (
              <div className="analysis-pager" aria-label={`Navegar ${title}`}>
                <button
                  type="button"
                  aria-label="Anterior"
                  disabled={activeIndex === 0}
                  onClick={() =>
                    setPagedIndices((prev) => ({
                      ...prev,
                      [carouselKey]: Math.max(0, activeIndex - 1),
                    }))
                  }
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
                <span>
                  {activeIndex + 1} / {items.length}
                </span>
                <button
                  type="button"
                  aria-label="Siguiente"
                  disabled={activeIndex >= items.length - 1}
                  onClick={() =>
                    setPagedIndices((prev) => ({
                      ...prev,
                      [carouselKey]: Math.min(items.length - 1, activeIndex + 1),
                    }))
                  }
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
          <ul>
            {shownItems.map(({ item, index }) => (
              <li key={index}>
                <span
                  className={isSame ? "point-badge is-same" : "point-badge"}
                >
                  {isSame ? (
                    <Check size={13} aria-hidden="true" />
                  ) : (
                    <Scale size={13} aria-hidden="true" />
                  )}
                  {`${labelBase} ${index + 1}`}
                </span>
                <p className="point-body">
                  {readableText(item.texto, offers, result?.fuentes ?? [])}
                </p>
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
                  {item.fuente_ids.map(sourceLink)}
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
      <nav className="analysis-breadcrumb" aria-label="Ruta de navegación">
        <Link to={compareUrl}>Comparar</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Explicación con IA</span>
      </nav>
      <Link className="back-link" to={compareUrl}>
        <ArrowLeft size={16} /> Volver al comparador
      </Link>
      <div className="page-heading">
        <h1>Entiende tus opciones, paso a paso.</h1>
        <p>Una explicación clara de tus dos alternativas.</p>
      </div>
      <ComparisonSteps current={3} />
      <div className="analysis-selected">
        {offers.map((offer) => (
          <div key={offer.oferta_id}>
            <span className="analysis-selected-logo">
              <InstitutionLogo
                id={offer.institucion_id}
                name={offer.institucion}
              />
            </span>
            <div>
              <strong>{offer.carrera_oficial}</strong>
              <span>{offer.institucion}</span>
              <small>
                <MapPin size={15} aria-hidden="true" /> {offer.distrito}
              </small>
            </div>
          </div>
        ))}
      </div>
      <nav className="analysis-step-nav" aria-label="Pasos de la explicación">
        {STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            disabled={pending || (index > 0 && !result)}
            aria-current={step === index ? "step" : undefined}
            onClick={() => setStep(index)}
          >
            <span aria-hidden="true">{index + 1}</span>
            {label}
          </button>
        ))}
      </nav>
      {step === 0 && (
        <>
          <form
            className="preferences-panel"
            id="analysis-priorities"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <header className="preferences-header">
              <div>
                <h2>¿En qué quieres centrar la explicación?</h2>
                <p>
                  Elige hasta tres prioridades o continúa con una explicación
                  general.
                </p>
              </div>
              <span className="preferences-counter">
                {priorities.length} de 3 seleccionadas
              </span>
            </header>
            <fieldset className="priority-options" disabled={pending}>
              <legend className="sr-only">Tus prioridades</legend>
              {PRIORITIES.map(([value, label, Icon]) => (
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
                  <span className="priority-icon-badge" aria-hidden="true">
                    <Icon size={17} />
                  </span>
                  <span>{label}</span>
                  {priorities.includes(value) && (
                    <Check size={16} aria-hidden="true" />
                  )}
                </label>
              ))}
            </fieldset>
            <section
              className="analysis-context"
              aria-labelledby="context-heading"
            >
              <h3 id="context-heading">
                <SlidersHorizontal size={17} aria-hidden="true" />
                Añadir contexto personal <span>· Opcional</span>
              </h3>
              <div className="preference-selects">
                <label>
                  <span className="field-label-row">
                    <MapPin size={15} aria-hidden="true" /> Distrito de
                    preferencia
                  </span>
                  <select
                    aria-label="Distrito preferido"
                    disabled={pending}
                    value={district}
                    onChange={(event) => setDistrict(event.target.value)}
                  >
                    <option value="">Sin preferencia</option>
                    {facets.data?.distritos.map((item) => (
                      <option key={item.distrito_id} value={item.distrito_id}>
                        {item.distrito}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="field-label-row">
                    <Laptop size={15} aria-hidden="true" /> Modalidad de
                    preferencia
                  </span>
                  <select
                    aria-label="Modalidad preferida"
                    disabled={pending}
                    value={modality}
                    onChange={(event) => setModality(event.target.value)}
                  >
                    <option value="">Sin preferencia</option>
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
                <MessageSquare size={15} aria-hidden="true" /> ¿Qué te gustaría
                entender mejor?
              </label>
              <textarea
                id="intereses"
                disabled={pending}
                value={interests}
                maxLength={1500}
                rows={2}
                onChange={(event) => setInterests(event.target.value)}
                placeholder="Escribe tu duda en una frase"
              />
              <p className="preferences-help">
                <ShieldCheck size={16} aria-hidden="true" /> Al solicitar la
                explicación, el contexto indicado se envía a Gemini. La decisión
                sigue siendo tuya.
              </p>
            </section>
          </form>
          <div className="analysis-actions">
            <Link className="button secondary" to={compareUrl}>
              <ArrowLeft size={17} /> Volver al comparador
            </Link>
            <button
              type="button"
              className="text-link"
              disabled={pending}
              onClick={() => void submit(true)}
            >
              Continuar sin prioridades
            </button>
            <button
              className="button"
              type="submit"
              form="analysis-priorities"
              disabled={pending}
            >
              {pending ? (
                <>
                  <LoaderCircle className="spin" size={17} /> Preparando
                  explicación…
                </>
              ) : (
                <>
                  <Sparkles size={17} aria-hidden="true" /> Explicar con IA{" "}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </div>
        </>
      )}
      {error && (
        <div className="ai-error">
          <Failure
            message={error}
            retry={() => void submit(lastGeneral.current)}
          />
          <Link className="text-link" to={compareUrl}>
            Tu comparación básica sigue disponible <ArrowRight size={16} />
          </Link>
        </div>
      )}
      {result && step === 1 && (
        <section className="analysis-step-panel" aria-live="polite">
          <div className="summary-header-row">
            <h2>
              {result.motivo_resumen_catalogo
                ? "Resumen del catálogo"
                : "Una mirada a tus diferencias."}
            </h2>
            <div
              className="summary-tabs"
              role="tablist"
              aria-label="Secciones del resumen"
            >
              <button
                type="button"
                role="tab"
                aria-selected={summaryTab === "diff"}
                onClick={() => setSummaryTab("diff")}
              >
                Diferencias ({result.explicacion.diferencias_principales.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={summaryTab === "same"}
                onClick={() => setSummaryTab("same")}
              >
                En común ({result.explicacion.coincidencias.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={summaryTab === "guide"}
                onClick={() => setSummaryTab("guide")}
              >
                Orientación
              </button>
            </div>
          </div>
          {result.motivo_resumen_catalogo && (
            <p>
              {result.motivo_resumen_catalogo}{" "}
              <button
                type="button"
                className="text-link"
                onClick={() => void submit(lastGeneral.current)}
              >
                Reintentar con IA
              </button>
            </p>
          )}
          {summaryTab === "diff" && (
            <div className="summary-tab-body">
              {points(
                "Diferencias principales",
                result.explicacion.diferencias_principales,
              )}
            </div>
          )}
          {summaryTab === "same" && (
            <div className="summary-tab-body summary-same">
              {points(
                "Lo que tienen en común",
                result.explicacion.coincidencias,
                true,
              )}
            </div>
          )}
          {summaryTab === "guide" && (
            <div className="summary-tab-body summary-guide-grid">
              <section className="suggestion-panel">
                <h3>
                  <Compass size={17} aria-hidden="true" />
                  {result.explicacion.sugerencia.oferta_id
                    ? "Una orientación para seguir explorando"
                    : "Sin una preferencia concluyente"}
                </h3>
                <p className="point-body">
                  {readableText(
                    result.explicacion.sugerencia.motivo,
                    offers,
                    result.fuentes,
                  )}
                </p>
                <div className="point-references">
                  {result.explicacion.sugerencia.fuente_ids.map(sourceLink)}
                </div>
              </section>
              {result.explicacion.limites.length > 0 && (
                <section className="analysis-limits-card">
                  <h3>
                    <Info size={17} aria-hidden="true" /> Límites de la
                    información
                  </h3>
                  <ul className="analysis-limit-list">
                    {result.explicacion.limites.map((limit, index) => (
                      <li key={index}>
                        {readableText(limit, offers, result.fuentes)}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </section>
      )}
      {result && step === 2 && (
        <section className="analysis-step-panel">
          <div className="analysis-priority-summary">
            <div>
              <p>
                <strong>Tus prioridades</strong> ·{" "}
                {labeledPriorities.join(" · ") || "Explicación general"}
              </p>
              <button className="text-link" onClick={() => setStep(0)}>
                Editar prioridades
              </button>
            </div>
            <div
              className="summary-tabs"
              role="tablist"
              aria-label="Secciones de prioridades"
            >
              <button
                type="button"
                role="tab"
                aria-selected={meaningTab === "guide"}
                onClick={() => setMeaningTab("guide")}
              >
                Guía ({submittedPriorities.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={meaningTab === "analysis"}
                onClick={() => setMeaningTab("analysis")}
              >
                Análisis para ti
              </button>
            </div>
          </div>
          {meaningTab === "guide" && (
            <div className="result-grid analysis-priority-cards">
              {PRIORITIES.filter(([id]) =>
                submittedPriorities.includes(id),
              ).map(([id, , Icon]) => {
                const guide = priorityGuides[id];
                return (
                  <article
                    key={id}
                    className="analysis-result-section priority-guide"
                  >
                    <h3>
                      <Icon size={22} aria-hidden="true" /> {guide.title}
                    </h3>
                    <h4>En qué fijarte</h4>
                    <ul>
                      {guide.checks.map((item) => (
                        <li key={item}>
                          <Check size={16} aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="priority-question">
                      <MessageSquare size={18} aria-hidden="true" />
                      <div>
                        <strong>Pregunta que vale la pena hacer</strong>
                        <p>{guide.question}</p>
                      </div>
                    </div>
                    <Link
                      className="button secondary"
                      to={`${compareUrl}&criterio=${guide.criterion}`}
                    >
                      {guide.action} <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </article>
                );
              })}
              {submittedPriorities.length === 0 && (
                <p className="analysis-empty-note">
                  Elegiste una explicación general. Revisa la pestaña{" "}
                  <strong>Análisis para ti</strong> para ver las conclusiones.
                </p>
              )}
            </div>
          )}
          {meaningTab === "analysis" && (
            <>
              <div className="result-grid">
                {points(
                  "Qué significa para tus prioridades",
                  result.explicacion.relacion_preferencias,
                  false,
                  "Prioridad",
                  "prioridades",
                )}
                {points(
                  "Ventajas condicionadas",
                  result.explicacion.ventajas_condicionadas,
                  true,
                  "Alternativa",
                  "ventajas",
                )}
              </div>
              {!result.explicacion.relacion_preferencias.length &&
                !result.explicacion.ventajas_condicionadas.length && (
                  <p>
                    Revisa las diferencias del resumen y contrástalas con tus
                    condiciones de estudio.
                  </p>
                )}
            </>
          )}
        </section>
      )}
      {result && step === 3 && (
        <div className="analysis-layout analysis-source-layout">
          <section className="analysis-sources analysis-step-panel">
            <h2>
              <FileText size={24} aria-hidden="true" /> Consulta la información
              original.
            </h2>
            <p>Fuentes agrupadas por opción.</p>
            {sourceGroups.map(({ offer, links }) => (
              <article className="analysis-source-row" key={offer.oferta_id}>
                <div className="analysis-source-identity">
                  <span className="analysis-source-logo">
                    <InstitutionLogo
                      id={offer.institucion_id}
                      name={offer.institucion}
                    />
                  </span>
                  <div>
                    <strong>{offer.carrera_oficial}</strong>
                    <p>{offer.institucion}</p>
                  </div>
                </div>
                <div>
                  {links.map(({ href, label }) => (
                    <a
                      id={
                        sourceByUrl.get(href)
                          ? `fuente-ia-${sourceByUrl.get(href)?.fuente_id}`
                          : undefined
                      }
                      href={href}
                      key={href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {label} <ExternalLink size={15} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </article>
            ))}
            {[...sourceByUrl]
              .filter(([href]) => href && !groupedUrls.has(href))
              .map(([href, source]) => (
                <a
                  className="analysis-extra-source"
                  key={href}
                  id={`fuente-ia-${source.fuente_id}`}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {sourceLabel(source, offers)}{" "}
                  <ExternalLink size={15} aria-hidden="true" />
                </a>
              ))}
            <details className="analysis-context">
              <summary>Cómo leer esta explicación</summary>
              <p>
                Gemini organiza la información del catálogo. Contrasta cada
                interpretación con su fuente.
              </p>
            </details>
          </section>
          <aside className="analysis-explainer">
            <h2>
              <Flag size={24} aria-hidden="true" /> Haz que la comparación te
              sirva.
            </h2>
            <div className="analysis-checklist">
              {[
                "Revisar ambos planes de estudio",
                "Comparar las condiciones de matrícula",
                "Anotar una pregunta para cada institución",
              ].map((item) => (
                <label key={item}>
                  <input type="checkbox" /> {item}
                </label>
              ))}
            </div>
            <div className="analysis-explainer-actions">
              <SaveComparison offers={offers} />
              <Link className="button" to={compareUrl}>
                Volver a comparar <ArrowRight size={17} />
              </Link>
              <Link className="button secondary" to="/carreras">
                Cambiar una opción
              </Link>
            </div>
          </aside>
        </div>
      )}
      {result && step > 0 && (
        <div className="analysis-actions">
          <button
            className="button secondary"
            onClick={() => setStep(step - 1)}
          >
            <ArrowLeft size={17} /> {STEPS[step - 1]}
          </button>
          <Link className="text-link" to="/mi-ruta?vista=comparaciones">
            Ver mis comparaciones
          </Link>
          <button
            className="button"
            onClick={() => setStep(step === 3 ? 0 : step + 1)}
          >
            {step === 3 ? "Editar mis prioridades" : STEPS[step + 1]}{" "}
            <ArrowRight size={17} />
          </button>
        </div>
      )}
    </div>
  );
}

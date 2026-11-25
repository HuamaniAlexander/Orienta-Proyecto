import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Laptop,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Scale,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  comparisonKey,
  SaveComparison,
  SaveOffer,
  useProgress,
} from "../features/ruta/Progress";
import { INITIAL } from "../features/ruta/discovery";
import { questions } from "../features/ruta/questions";
import { InstitutionLogo } from "../shared/components/InstitutionLogo";
import { api, useApi } from "../shared/api/client";
import type { Facets } from "../shared/types/catalog";
import "../features/ruta/route.css";
import "../features/ruta/my-route.css";

const criteria = ["Duración", "Enfoque", "Costos", "Ubicación", "Modalidad"];
const criteriaKeys = [
  "duracion",
  "enfoque",
  "costos",
  "ubicacion",
  "modalidad",
];

export function MyRoute() {
  const { progress, persistent } = useProgress();
  const facets = useApi<Facets>("/api/filtros");
  const [params] = useSearchParams();
  const tabs = [
    ["carreras", `Carreras guardadas · ${progress.offers.length}`, Bookmark],
    ["comparaciones", `Comparaciones · ${progress.comparisons.length}`, Scale],
    ["preguntas", `Preguntas · ${progress.questions.length}`, MessageSquare],
    ["preferencias", "Preferencias y datos", SlidersHorizontal],
  ] as const;
  const active =
    tabs.find(([id]) => params.get("vista") === id)?.[0] ?? "carreras";
  return (
    <div className="questionnaire-page">
      <div className="container questionnaire-container my-route">
        <nav
          className="questionnaire-breadcrumb"
          aria-label="Ruta de navegación"
        >
          <Link to="/">Inicio</Link>
          <span>/</span>Mi ruta
        </nav>
        <header className="questionnaire-title my-route-header">
          <div>
            <h1>Mi ruta, a tu ritmo.</h1>
            <p>Retoma tus opciones y organiza tus próximos pasos.</p>
          </div>
          <span className="my-route-badge">
            <Laptop size={21} />
            {persistent
              ? "Guardado en este dispositivo"
              : "Guardado en esta pestaña"}
          </span>
        </header>
        <nav className="my-route-tabs" aria-label="Secciones de Mi ruta">
          {tabs.map(([id, label, Icon]) => (
            <Link
              key={id}
              to={`/mi-ruta?vista=${id}`}
              aria-current={active === id ? "page" : undefined}
            >
              <Icon size={23} aria-hidden="true" /> {label}
            </Link>
          ))}
        </nav>
        {active === "carreras" && (
          <div className="my-route-layout">
            <section className="route-panel route-stack">
              <header className="my-route-header">
                <div>
                  <h2>Carreras que quieres conocer mejor</h2>
                  <p>{progress.offers.length} carreras</p>
                </div>
                <Link className="button secondary" to="/carreras">
                  Explorar más carreras <ArrowRight size={16} />
                </Link>
              </header>
              {!progress.offers.length && (
                <div className="my-route-empty">
                  <Bookmark size={36} strokeWidth={1.5} aria-hidden="true" />
                  <h3>Tu próxima opción empieza con curiosidad.</h3>
                  <p>
                    Todavía no has guardado carreras. Explora el catálogo y
                    guarda las que quieras conocer mejor; aquí podrás retomarlas
                    y anotar tus preguntas.
                  </p>
                  <Link className="button" to="/carreras">
                    Encontrar carreras <ArrowRight size={18} />
                  </Link>
                  <Link className="text-link" to="/descubre">
                    ¿No sabes por dónde empezar? Descubre tus intereses
                  </Link>
                </div>
              )}
              {progress.offers.map((offer) => (
                <article
                  className="my-route-row my-route-offer"
                  key={offer.oferta_id}
                >
                  <div className="my-route-saved-logo">
                    <InstitutionLogo
                      id={
                        offer.institucion_id ??
                        facets.data?.instituciones.find(
                          (item) => item.nombre === offer.institucion,
                        )?.institucion_id ??
                        0
                      }
                      name={offer.institucion}
                    />
                  </div>
                  <div>
                    {offer.area && (
                      <span className="my-route-badge">{offer.area}</span>
                    )}
                    <h3>{offer.carrera_oficial}</h3>
                    <p>
                      {offer.institucion} · {offer.distrito}
                    </p>
                    {progress.questions.filter(
                      (text) =>
                        progress.questionDetails?.[text]?.offerId ===
                        offer.oferta_id,
                    ).length > 0 && <strong>Quiero investigar</strong>}
                    {progress.questions
                      .filter(
                        (text) =>
                          progress.questionDetails?.[text]?.offerId ===
                          offer.oferta_id,
                      )
                      .slice(0, 1)
                      .map((text) => (
                        <p key={text}>{text}</p>
                      ))}
                  </div>
                  <div className="route-stack">
                    <Link
                      className="button secondary"
                      to={`/carreras/${offer.oferta_id}`}
                    >
                      Explorar carrera <ArrowRight size={16} />
                    </Link>
                    <Link
                      className="button secondary"
                      to={`/mi-ruta?vista=preguntas&carrera=${offer.oferta_id}`}
                    >
                      Ver mis preguntas
                    </Link>
                    <SaveOffer offer={offer} />
                  </div>
                </article>
              ))}
            </section>
          </div>
        )}
        {active === "comparaciones" && (
          <div className="my-route-layout">
            <section className="route-panel route-stack">
              <header className="my-route-header">
                <div>
                  <h2>Tus opciones, listas para retomar.</h2>
                  <p>Vuelve al criterio que quieras revisar.</p>
                </div>
                <Link className="button secondary" to="/comparar">
                  Crear comparación <Plus size={17} />
                </Link>
              </header>
              {!progress.comparisons.length && (
                <div className="my-route-empty">
                  <Scale size={36} strokeWidth={1.5} aria-hidden="true" />
                  <h3>Mira tus opciones lado a lado.</h3>
                  <p>
                    Todavía no has guardado comparaciones. Compara dos opciones
                    y pulsa «Guardar comparación» en el resultado para
                    retomarlas aquí.
                  </p>
                  <Link
                    className="button"
                    to={
                      progress.offers.length >= 2
                        ? `/comparar?opciones=${progress.offers
                            .slice(0, 2)
                            .map((offer) => offer.oferta_id)
                            .join(",")}`
                        : "/comparar"
                    }
                  >
                    {progress.offers.length >= 2
                      ? "Comparar mis carreras guardadas"
                      : "Elegir dos opciones"}{" "}
                    <ArrowRight size={18} />
                  </Link>
                </div>
              )}
              {progress.comparisons.map((pair) => {
                const ids = pair.map((offer) => offer.oferta_id).join(",");
                const url = `/comparar?opciones=${ids}`;
                return (
                  <article
                    className="my-route-row route-stack my-route-comparison"
                    key={comparisonKey(pair)}
                  >
                    <span className="my-route-badge">Comparación guardada</span>
                    <div className="my-route-pair">
                      {pair.map((offer) => (
                        <div key={offer.oferta_id}>
                          <div className="my-route-university-logo">
                            <InstitutionLogo
                              id={
                                offer.institucion_id ??
                                facets.data?.instituciones.find(
                                  (item) => item.nombre === offer.institucion,
                                )?.institucion_id ??
                                0
                              }
                              name={offer.institucion}
                            />
                          </div>
                          <div>
                            <strong>{offer.carrera_oficial}</strong>
                            <p>{offer.institucion}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="route-actions">
                      {criteria.map((criterion, index) => (
                        <Link
                          className="my-route-badge"
                          key={criterion}
                          to={`${url}&criterio=${criteriaKeys[index]}`}
                        >
                          {criterion}
                        </Link>
                      ))}
                    </div>
                    <div className="route-actions my-route-comparison-actions">
                      <Link className="button" to={url}>
                        Retomar comparación <ArrowRight size={16} />
                      </Link>
                      <Link
                        className="button secondary"
                        to={`/analisis?opciones=${ids}`}
                      >
                        <Sparkles size={17} aria-hidden="true" />
                        Explicar con IA
                      </Link>
                      <SaveComparison offers={pair} />
                    </div>
                  </article>
                );
              })}
            </section>
          </div>
        )}
        {active === "preguntas" && (
          <RouteQuestions
            key={params.get("carrera") ?? ""}
            career={params.get("carrera") ?? ""}
          />
        )}
        {active === "preferencias" && <RoutePreferences />}
        {active === "carreras" && (
          <Link className="back-link" to="/descubre">
            <ArrowLeft size={16} /> Volver a carreras afines
          </Link>
        )}
      </div>
    </div>
  );
}

function RouteQuestions({ career }: { career: string }) {
  const { progress, update, status } = useProgress();
  const field = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState("");
  const [offerId, setOfferId] = useState(career);
  const [filter, setFilter] = useState("Todas");
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const items = progress.questions.filter(
    (item) =>
      !career || String(progress.questionDetails?.[item]?.offerId) === career,
  );
  const researched = items.filter(
    (item) => progress.questionDetails?.[item]?.researched,
  );
  const filteredItems = items.filter(
    (item) =>
      filter === "Todas" ||
      researched.includes(item) === (filter === "Investigadas"),
  );
  const pageSize = 3;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const visibleItems = filteredItems.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );
  function reset() {
    setEditing("");
    setText("");
    setOfferId(career);
    setError("");
  }
  return (
    <div className="my-route-layout route-questions-layout">
      <AIQuestions career={career} />
      <div className="route-stack">
        <section className="route-panel route-stack">
          <header>
            <h2>Lo que quieres averiguar.</h2>
            <p>Guarda tus dudas y marca las que ya investigaste.</p>
          </header>
          <div className="my-route-header route-question-tools">
            <div className="route-actions">
              {(["Todas", "Pendientes", "Investigadas"] as const).map(
                (name, index) => (
                  <button
                    key={name}
                    type="button"
                    className={`button ${filter === name ? "" : "secondary"}`}
                    aria-pressed={filter === name}
                    onClick={() => {
                      setFilter(name);
                      setPage(0);
                    }}
                  >
                    {name} ·{" "}
                    {
                      [
                        items.length,
                        items.length - researched.length,
                        researched.length,
                      ][index]
                    }
                  </button>
                ),
              )}
            </div>
            <div className="route-questions-top-actions">
              {totalPages > 1 && (
                <div
                  className="route-questions-nav"
                  aria-label="Paginación de preguntas"
                >
                  <button
                    type="button"
                    className="route-questions-arrow"
                    aria-label="Preguntas anteriores"
                    disabled={currentPage === 0}
                    onClick={() => setPage((value) => Math.max(0, value - 1))}
                  >
                    <ChevronLeft size={18} aria-hidden="true" />
                  </button>
                  <span className="route-questions-count">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    type="button"
                    className="route-questions-arrow"
                    aria-label="Siguientes preguntas"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() =>
                      setPage((value) => Math.min(totalPages - 1, value + 1))
                    }
                  >
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                </div>
              )}
              <button
                className="button secondary"
                onClick={() => {
                  reset();
                  field.current?.focus();
                }}
              >
                <Plus size={16} /> Añadir pregunta
              </button>
            </div>
          </div>
          {career && (
            <Link className="text-link" to="/mi-ruta?vista=preguntas">
              Ver todas las carreras
            </Link>
          )}
          {!filteredItems.length && (
            <p>Todavía no hay preguntas en esta vista.</p>
          )}
          {filteredItems.length > 0 && (
            <div className="route-questions-track">
              {visibleItems.map((item) => {
              const detail = progress.questionDetails?.[item];
              const offer = progress.offers.find(
                (entry) => entry.oferta_id === detail?.offerId,
              );
              return (
                <article
                  className={`my-route-row my-route-question ${detail?.researched ? "researched" : ""}`}
                  key={item}
                >
                  <input
                    type="checkbox"
                    aria-label={`Investigada: ${item}`}
                    checked={Boolean(detail?.researched)}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      update((previous) => ({
                        ...previous,
                        questionDetails: {
                          ...previous.questionDetails,
                          [item]: {
                            ...previous.questionDetails?.[item],
                            researched: checked,
                          },
                        },
                      }));
                    }}
                  />
                  <div>
                    {detail?.researched && (
                      <span className="my-route-badge">Investigada</span>
                    )}
                    <strong>{item}</strong>
                    {offer && (
                      <span className="my-route-badge">
                        {offer.carrera_oficial}
                      </span>
                    )}
                  </div>
                  <button
                    className="button secondary"
                    aria-label={`Editar pregunta: ${item}`}
                    onClick={() => {
                      setError("");
                      setEditing(item);
                      setText(item);
                      setOfferId(detail?.offerId ? String(detail.offerId) : "");
                      field.current?.focus();
                    }}
                  >
                    <Pencil size={16} /> Editar
                  </button>
                  <button
                    className="button secondary"
                    aria-label={`Retirar pregunta: ${item}`}
                    onClick={() => {
                      if (
                        update((previous) => {
                          const details = { ...previous.questionDetails };
                          delete details[item];
                          return {
                            ...previous,
                            questions: previous.questions.filter(
                              (entry) => entry !== item,
                            ),
                            questionDetails: details,
                          };
                        }) &&
                        editing === item
                      )
                        reset();
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </article>
              );
            })}
            </div>
          )}
        </section>
        <form
          className="route-panel route-stack route-question-editor"
          onSubmit={(event) => {
            event.preventDefault();
            const question = text.trim();
            if (!question) return;
            if (question !== editing && progress.questions.includes(question)) {
              setError("Esta pregunta ya está guardada.");
              return;
            }
            if (
              update((previous) => {
                const details = { ...previous.questionDetails };
                const researched = editing
                  ? details[editing]?.researched
                  : false;
                if (editing) delete details[editing];
                details[question] = {
                  offerId: offerId ? Number(offerId) : undefined,
                  researched,
                };
                return {
                  ...previous,
                  questions: editing
                    ? previous.questions.map((entry) =>
                        entry === editing ? question : entry,
                      )
                    : [...previous.questions, question],
                  questionDetails: details,
                };
              })
            )
              reset();
          }}
        >
          <h2>
            <Pencil size={21} aria-hidden="true" />
            {editing ? "Edita tu pregunta" : "Añade una pregunta"}
          </h2>
          <label>
            Tu pregunta
            <textarea
              aria-label="Escribe una nueva pregunta"
              placeholder="Escribe lo que quieres averiguar"
              rows={2}
              ref={field}
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={300}
              required
            />
          </label>
          <label>
            Relacionar con una carrera
            <select
              value={offerId}
              onChange={(event) => setOfferId(event.target.value)}
            >
              <option value="">Sin carrera asociada</option>
              {progress.offers.map((offer) => (
                <option key={offer.oferta_id} value={offer.oferta_id}>
                  {offer.carrera_oficial} · {offer.institucion}
                </option>
              ))}
            </select>
          </label>
          <button className="button" disabled={!text.trim()}>
            {editing ? "Guardar cambios" : "Guardar pregunta"}
          </button>
          {editing && (
            <button type="button" className="button secondary" onClick={reset}>
              Cancelar edición
            </button>
          )}
          {(error || status.error) && (
            <p role="alert">{error || status.text}</p>
          )}
          <p>Márcala como investigada cuando encuentres una respuesta útil.</p>
        </form>
      </div>
      <Link
        className="button secondary route-conversation-link"
        to="/mi-ruta/preparar"
      >
        <MessageSquare size={18} aria-hidden="true" />
        Preparar mi conversación
        <ArrowRight size={17} aria-hidden="true" />
      </Link>
    </div>
  );
}

function AIQuestions({ career }: { career: string }) {
  const { progress, update } = useProgress();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);
  const seen = useRef<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);
  async function generate() {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setMessage("");
    try {
      const result = await api<{ questions: string[] }>(
        "/api/orientacion/preparar",
        {
          method: "POST",
          body: JSON.stringify({
            question_count: 3,
            exclude_questions: seen.current.slice(-30),
            offers: progress.offers
              .filter((offer) => !career || String(offer.oferta_id) === career)
              .slice(0, 12)
              .map((offer) =>
                `${offer.carrera_oficial} (${offer.institucion})`.slice(0, 300),
              ),
            questions: progress.questions
              .slice(0, 12)
              .map((text) => text.slice(0, 300)),
            comparisons: progress.comparisons.slice(0, 8).map((pair) =>
              pair
                .map(
                  (offer) => `${offer.carrera_oficial} (${offer.institucion})`,
                )
                .join(" y ")
                .slice(0, 300),
            ),
          }),
          signal: controller.signal,
        },
      );
      if (controller.signal.aborted) return;
      const fresh = [
        ...new Set(result.questions.map((text) => text.trim()).filter(Boolean)),
      ].filter(
        (text) =>
          !progress.questions.includes(text) && !seen.current.includes(text),
      );
      if (fresh.length !== 3)
        throw new Error("Se necesitan tres preguntas nuevas");
      seen.current = [...seen.current, ...fresh].slice(-30);
      setGenerated(true);
      setSuggestions(fresh);
      setMessage(
        fresh.length
          ? "Revisa las propuestas y añade las que te sirvan."
          : "Las propuestas ya están en tus preguntas. Puedes escribir una nueva.",
      );
    } catch {
      if (!controller.signal.aborted)
        setMessage(
          "No pudimos generar preguntas con IA. Inténtalo de nuevo o escribe tu pregunta.",
        );
    } finally {
      if (!controller.signal.aborted) setBusy(false);
      pending.current = null;
    }
  }
  return (
    <section
      className="route-panel route-stack route-ai-questions"
      aria-labelledby="route-ai-title"
    >
      <header>
        <h2 id="route-ai-title">
          <Sparkles size={21} aria-hidden="true" />
          Ideas para tus preguntas
        </h2>
        <p>
          Gemini usa tus carreras, comparaciones y preguntas guardadas para
          proponer nuevas dudas.
        </p>
      </header>
      <button
        className="button"
        onClick={() => void generate()}
        disabled={busy}
      >
        {generated ? (
          <RefreshCw size={18} aria-hidden="true" />
        ) : (
          <Sparkles size={18} aria-hidden="true" />
        )}
        {busy
          ? "Generando preguntas…"
          : generated
            ? "Generar nuevas preguntas"
            : "Generar preguntas con IA"}
      </button>
      <p className="my-route-note">
        Tres propuestas por tanda. Edita y añade las que te sirvan; genera otras
        si quieres explorar nuevas ideas.
      </p>
      {message && <p role="status">{message}</p>}
      <div className="route-ai-proposals">
        {suggestions.map((suggestion, index) => (
          <div className="route-ai-proposal" key={index}>
            <label>
              Pregunta sugerida {index + 1}
              <textarea
                maxLength={300}
                value={suggestion}
                onChange={(event) =>
                  setSuggestions((previous) =>
                    previous.map((text, item) =>
                      item === index ? event.target.value : text,
                    ),
                  )
                }
              />
            </label>
            <button
              className="button secondary"
              disabled={!suggestion.trim()}
              onClick={() => {
                const text = suggestion.trim();
                if (progress.questions.includes(text)) {
                  setMessage("Esta pregunta ya está guardada.");
                  return;
                }
                if (
                  update((previous) => ({
                    ...previous,
                    questions: [...previous.questions, text],
                    questionDetails: {
                      ...previous.questionDetails,
                      [text]: {
                        offerId: career ? Number(career) : undefined,
                        researched: false,
                      },
                    },
                  }))
                ) {
                  setSuggestions((previous) =>
                    previous.filter((_, item) => item !== index),
                  );
                  setMessage("Pregunta añadida a tu ruta.");
                }
              }}
            >
              <Plus size={16} aria-hidden="true" />
              Añadir a mis preguntas
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function RoutePreferences() {
  const { progress, update, clear, persistent, setPersistence, status } =
    useProgress();
  const [value, setValue] = useState(
    progress.explorationPreferences ?? progress.current?.preferences ?? INITIAL,
  );
  const facets = useApi<Facets>("/api/filtros");
  const [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const answered =
    Object.values(progress.current?.answers ?? {}).filter(
      (answer) => answer.length,
    ).length + Number(Boolean(progress.current?.preferences.district));
  return (
    <div className="my-route-layout preferences-layout">
      <section className="route-panel route-stack route-preferences-panel">
        <h2>
          <SlidersHorizontal size={22} aria-hidden="true" />
          Tus preferencias de exploración
        </h2>
        <form
          className="route-preferences-form"
          onChange={() => setSaved(false)}
          onSubmit={(event) => {
            event.preventDefault();
            setSaved(
              update((previous) => ({
                ...previous,
                explorationPreferences: value,
              })),
            );
          }}
        >
          <h3>Condiciones de estudio</h3>
          <label>
            <span>
              <MapPin size={17} aria-hidden="true" />
              Distrito
            </span>
            <select
              value={value.district}
              onChange={(event) =>
                setValue({
                  ...value,
                  district: event.target.value,
                  flexible: Boolean(event.target.value) && value.flexible,
                })
              }
            >
              <option value="">Todos los distritos</option>
              {value.district && !facets.data && (
                <option value={value.district}>Distrito guardado</option>
              )}
              {facets.data?.distritos.map((item) => (
                <option key={item.distrito_id} value={item.distrito_id}>
                  {item.distrito}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>
              <Clock3 size={17} aria-hidden="true" />
              Horario
            </span>
            <select
              value={value.availability}
              onChange={(event) =>
                setValue({ ...value, availability: event.target.value })
              }
            >
              <option value="">Sin preferencia</option>
              {value.availability &&
                !questions[22].choices.includes(value.availability) && (
                  <option>{value.availability}</option>
                )}
              {questions[22].choices.map((label) => (
                <option key={label}>{label}</option>
              ))}
            </select>
          </label>
          <fieldset className="route-actions">
            <legend>
              <GraduationCap size={17} aria-hidden="true" /> Modalidad
            </legend>
            {questions[21].choices.slice(0, 3).map((label, index) => (
              <label key={label}>
                <input
                  type="checkbox"
                  checked={value.modalities.includes(index + 1)}
                  onChange={(event) =>
                    setValue({
                      ...value,
                      modalities: event.target.checked
                        ? [...value.modalities, index + 1]
                        : value.modalities.filter((id) => id !== index + 1),
                    })
                  }
                />{" "}
                {label}
              </label>
            ))}
          </fieldset>
          <label className="route-flexible-choice">
            <input
              type="checkbox"
              checked={value.flexible}
              disabled={!value.district}
              onChange={(event) =>
                setValue({ ...value, flexible: event.target.checked })
              }
            />{" "}
            Considerar otros distritos
          </label>
          <button className="button">
            <Check size={17} aria-hidden="true" />
            Guardar cambios
          </button>
          {saved && <p role="status">Preferencias guardadas.</p>}
        </form>
        <hr />
        <div className="route-summary-row">
          <div className="route-summary-copy">
            <h2>Tus respuestas al cuestionario</h2>
            <p>
              {answered} preguntas respondidas · Los cambios se aplicarán cuando
              solicites alternativas en Descubre.
            </p>
          </div>
          <Link
            className="button secondary"
            to="/descubre/preferencias?revisar=1"
          >
            Revisar mis respuestas <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <section className="route-panel route-stack route-data-panel">
        <h2>
          <ShieldCheck size={22} aria-hidden="true" />
          Tus datos, bajo tu control.
        </h2>
        <p>
          Tu ruta se guarda en este navegador. Si cambias de dispositivo o
          borras los datos del navegador, no aparecerá automáticamente.
        </p>
        <hr />
        <label className="my-route-header">
          <strong>Conservar mi ruta</strong>
          <input
            type="checkbox"
            role="switch"
            checked={persistent}
            onChange={(event) => setPersistence(event.target.checked)}
          />
        </label>
        <p>
          Al desactivar esta opción, tu ruta se conserva solo hasta que cierres
          esta pestaña.
        </p>
        <hr />
        <div className="route-summary-row">
          <div className="route-summary-copy">
            <h3>Eliminar datos guardados</h3>
            <p>
              {progress.offers.length} carreras · {progress.comparisons.length}{" "}
              comparaciones · {progress.questions.length} preguntas
            </p>
          </div>
          {confirm ? (
            <div className="route-stack">
              <strong>¿Quieres borrar tu avance?</strong>
              <div className="route-actions">
                <button
                  className="button secondary"
                  onClick={() => setConfirm(false)}
                >
                  Cancelar
                </button>
                <button
                  className="button danger"
                  onClick={() => {
                    if (clear()) {
                      setConfirm(false);
                      setValue(INITIAL);
                      setSaved(false);
                    }
                  }}
                >
                  Sí, borrar mi avance
                </button>
              </div>
            </div>
          ) : (
            <button className="button danger" onClick={() => setConfirm(true)}>
              <Trash2 size={16} /> Borrar avance de este dispositivo
            </button>
          )}
        </div>
        {status.error && <p role="alert">{status.text}</p>}
        <Link className="button route-data-back" to="/mi-ruta">
          <ArrowLeft size={16} aria-hidden="true" />
          Volver a carreras guardadas
        </Link>
      </section>
    </div>
  );
}

export function ProgressSettings() {
  return (
    <div className="container section">
      <div className="page-heading">
        <h1>Preferencias y datos</h1>
      </div>
      <RoutePreferences />
    </div>
  );
}

import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Building2,
  Check,
  ClipboardList,
  Flag,
  GraduationCap,
  Info,
  MapPin,
  Microscope,
  Pencil,
  Route,
  Search,
  SlidersHorizontal,
  Settings,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { programSources } from "../features/comparador/programSources";
import { discover, INITIAL } from "../features/ruta/discovery";
import {
  SaveOffer,
  useProgress,
  type Preferences,
  type QuestionnaireDraft,
  type Suggestion,
} from "../features/ruta/Progress";
import { api, useApi } from "../shared/api/client";
import { careerImage } from "../shared/components/OfferCard";
import { Failure, Loading } from "../shared/components/Feedback";
import type { Facets } from "../shared/types/catalog";
import { officialUrl } from "./Detail";
import {
  questions,
  sections,
  selectedInterests,
} from "../features/ruta/questions";
import "../features/ruta/questionnaire.css";
import "../features/ruta/discovery-results.css";

function PreferenceSummary({
  value,
  facets,
}: {
  value: Preferences;
  facets?: Facets;
}) {
  const district = facets?.distritos.find(
    (item) => String(item.distrito_id) === value.district,
  );
  return (
    <ul>
      <li>
        Intereses:{" "}
        {[...value.interests, value.extra].filter(Boolean).join(", ") ||
          "Sin indicar"}
      </li>
      <li>
        Distrito:{" "}
        {district?.distrito ??
          (value.district ? "Selección guardada" : "Sin indicar")}
        {value.district && value.flexible
          ? " (considerando otros distritos)"
          : ""}
      </li>
      <li>
        Modalidad:{" "}
        {value.modalities
          .map(
            (id) =>
              facets?.modalidades.find((item) => item.codigo_id === id)
                ?.etiqueta ??
              questions[21].choices[id - 1] ??
              `Modalidad ${id}`,
          )
          .join(", ") || "Sin indicar"}
      </li>
      <li>Disponibilidad: {value.availability || "Sin indicar"}</li>
    </ul>
  );
}

const REVIEW_URL = "/descubre/preferencias?revisar=1";

export function Discover() {
  const { progress } = useProgress();
  if (!progress.current) return <PreferenceForm />;
  return (
    <DiscoveryResults
      key={progress.current.version}
      current={progress.current}
    />
  );
}

function DiscoveryResults({
  current,
}: {
  current: {
    version: number;
    preferences: Preferences;
    suggestions: Suggestion[];
    answers?: QuestionnaireDraft["answers"];
  };
}) {
  const { progress, update } = useProgress();
  const facets = useApi<Facets>("/api/filtros");
  const [value, setValue] = useState(
    progress.explorationPreferences ?? current.preferences,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);
  const interests = [
    ...current.preferences.interests,
    current.preferences.extra,
  ].filter(Boolean);
  const shown = showAll ? current.suggestions : current.suggestions.slice(0, 2);
  const hours = questions[22].choices;
  const modality = value.modalities.join(",");
  async function refresh() {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError("");
    try {
      const suggestions = await discover(value, controller.signal);
      if (controller.signal.aborted) return;
      const answers = current.answers && {
        ...current.answers,
        21: value.modalities
          .filter((id) => id >= 1 && id <= 3)
          .map((id) => id - 1),
        22: hours.flatMap((label, index) =>
          value.availability.split(", ").includes(label) ? [index] : [],
        ),
      };
      if (
        !update((previous) => ({
          ...previous,
          previous: previous.current,
          explorationPreferences: undefined,
          current: {
            version: current.version + 1,
            preferences: value,
            suggestions,
            answers,
          },
        }))
      )
        setError("El navegador no permitió guardar las opciones actualizadas.");
    } catch (err) {
      if (!controller.signal.aborted)
        setError(
          err instanceof Error
            ? err.message
            : "No pudimos actualizar tus opciones.",
        );
    } finally {
      pending.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  return (
    <div className="questionnaire-page">
      <div className="container questionnaire-container">
        <nav
          className="questionnaire-breadcrumb"
          aria-label="Ruta de navegación"
        >
          <Link to="/descubre">Descubre</Link>
          <span aria-hidden="true">/</span> Carreras afines
        </nav>
        <header className="questionnaire-title discovery-results-heading">
          <div>
            <h1>Alternativas para seguir explorando.</h1>
            <p>
              Explora opciones a partir de tus respuestas y el catálogo
              revisado.
            </p>
          </div>
          <Link className="button secondary" to="/descubre/preferencias">
            <Pencil size={17} aria-hidden="true" />
            {progress.questionnaire
              ? "Reanudar cuestionario"
              : "Editar mis respuestas"}
          </Link>
        </header>
        <section
          className="discovery-interest-bar"
          aria-labelledby="discover-interests"
        >
          <div>
            <h2 id="discover-interests">Tu punto de partida</h2>
            <p>Según tus respuestas</p>
          </div>
          {interests.length ? (
            <ul>
              {interests.map((interest) => (
                <li key={interest}>
                  <Search size={21} aria-hidden="true" />
                  {interest}
                </li>
              ))}
            </ul>
          ) : (
            <p>
              Tus sugerencias usan las condiciones que elegiste y la oferta del
              catálogo.
            </p>
          )}
          <div className="discovery-condition-badges">
            {current.preferences.district && (
              <span className="discovery-tag">
                {facets.data?.distritos.find(
                  (item) =>
                    String(item.distrito_id) === current.preferences.district,
                )?.distrito ?? "Distrito guardado"}
              </span>
            )}
            {current.preferences.modalities.map((id) => (
              <span className="discovery-tag" key={id}>
                {questions[21].choices[id - 1] ?? `Modalidad ${id}`}
              </span>
            ))}
            {current.preferences.availability && (
              <span className="discovery-tag">
                {current.preferences.availability}
              </span>
            )}
            <a href="#discovery-conditions">Ajustar condiciones</a>
          </div>
        </section>
        <div className="discovery-results-layout">
          <section
            className="discovery-results-panel"
            aria-labelledby="affine-careers"
            aria-busy={busy}
          >
            <header>
              <div>
                <h2 id="affine-careers">Opciones sugeridas</h2>
                <p>Conoce las razones y revisa la información de origen.</p>
              </div>
              <span>
                {shown.length} {shown.length === 1 ? "opción" : "opciones"}
              </span>
            </header>
            <SuggestionList
              suggestions={shown}
              preferences={current.preferences}
            />
            {current.suggestions.length > 2 && (
              <button
                type="button"
                className="button secondary discovery-show-more"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Mostrar menos opciones" : "Ver más opciones"}
              </button>
            )}
          </section>
          <aside
            className="discovery-results-panel discovery-filters"
            id="discovery-conditions"
          >
            <h2>
              <SlidersHorizontal size={23} aria-hidden="true" /> Ajusta tu
              búsqueda
            </h2>
            <p>Tus condiciones de estudio.</p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void refresh();
              }}
            >
              {facets.error && (
                <Failure message={facets.error} retry={facets.retry} />
              )}
              <label>
                Distrito
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
                  {facets.data?.distritos.map((district) => (
                    <option
                      key={district.distrito_id}
                      value={district.distrito_id}
                    >
                      {district.distrito}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Modalidad
                <select
                  value={modality}
                  onChange={(event) =>
                    setValue({
                      ...value,
                      modalities: event.target.value
                        ? event.target.value.split(",").map(Number)
                        : [],
                    })
                  }
                >
                  <option value="">Todas las modalidades</option>
                  {modality && !/^[123]$/.test(modality) && (
                    <option value={modality}>
                      {value.modalities
                        .map(
                          (id) =>
                            questions[21].choices[id - 1] ?? `Modalidad ${id}`,
                        )
                        .join(" y ")}
                    </option>
                  )}
                  {questions[21].choices.slice(0, 3).map((item, index) => (
                    <option key={item} value={index + 1}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Horario
                <select
                  value={value.availability}
                  onChange={(event) =>
                    setValue({ ...value, availability: event.target.value })
                  }
                >
                  <option value="">Sin preferencia</option>
                  {value.availability &&
                    !hours.includes(value.availability) && (
                      <option value={value.availability}>
                        {value.availability}
                      </option>
                    )}
                  {hours.map((hour) => (
                    <option key={hour}>{hour}</option>
                  ))}
                </select>
              </label>
              <label className="discovery-flexible">
                <input
                  type="checkbox"
                  disabled={!value.district}
                  checked={Boolean(value.district) && value.flexible}
                  onChange={(event) =>
                    setValue({ ...value, flexible: event.target.checked })
                  }
                />{" "}
                Considerar otros distritos
              </label>
              <button className="button" disabled={busy}>
                {busy ? "Buscando alternativas…" : "Solicitar alternativas"}
              </button>
              {error && <Failure message={error} />}
            </form>
            <p className="discovery-schedule-note">
              El horario se guarda como preferencia. Confirma la disponibilidad
              con cada institución.
            </p>
          </aside>
        </div>
        <footer className="discovery-results-footer">
          <Link className="button secondary" to={REVIEW_URL}>
            <ArrowLeft size={17} />
            Volver a mis respuestas
          </Link>
          <Link className="button secondary" to="/mi-ruta">
            <Bookmark size={17} />
            Ver Mi ruta
            <ArrowRight size={17} />
          </Link>
        </footer>
        {progress.previous && (
          <details className="discovery-results-panel">
            <summary>
              Sugerencias anteriores · versión {progress.previous.version}
            </summary>
            <PreferenceSummary
              value={progress.previous.preferences}
              facets={facets.data}
            />
            <SuggestionList
              key={progress.previous.version}
              suggestions={progress.previous.suggestions}
              preferences={progress.previous.preferences}
            />
          </details>
        )}
      </div>
    </div>
  );
}

function SuggestionList({
  suggestions,
  preferences,
}: {
  suggestions: Suggestion[];
  preferences: Preferences;
}) {
  if (!suggestions.length)
    return (
      <p>
        No encontramos coincidencias. Puedes ampliar los filtros y actualizar
        las opciones.
      </p>
    );
  return (
    <div className="discovery-career-grid">
      {suggestions.map(
        ({ offer, reasons, source, area, areaId, relatedInterests }) => (
          <article className="discovery-career-card" key={offer.oferta_id}>
            <img
              src={careerImage({
                carrera_oficial: offer.carrera_oficial,
                area_id: areaId ?? 0,
              })}
              alt=""
              loading="lazy"
            />
            <div className="discovery-career-content">
              {area && <span className="discovery-tag">{area}</span>}
              <h3>{offer.carrera_oficial}</h3>
              <p className="discovery-institution">
                {offer.institucion} · {offer.distrito}
              </p>
              <strong>Por tus intereses</strong>
              <p>
                {relatedInterests?.length
                  ? `La ficha coincide con ${relatedInterests.join(", ")}.`
                  : preferences.extra
                    ? reasons[0]
                    : "Opción disponible para explorar en el catálogo."}
              </p>
              {!!relatedInterests?.length && (
                <ul className="discovery-tags">
                  {relatedInterests.map((interest) => (
                    <li className="discovery-tag" key={interest}>
                      {interest}
                    </li>
                  ))}
                </ul>
              )}
              <details className="discovery-relationship">
                <summary>
                  <Info size={16} aria-hidden="true" /> Ver respuestas
                  relacionadas <ArrowRight size={15} aria-hidden="true" />
                </summary>
                <ul>
                  {reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                {(preferences.interests.length > 0 ||
                  preferences.extra ||
                  preferences.district ||
                  preferences.modalities.length > 0) && (
                  <SuggestionAI
                    offerId={offer.oferta_id}
                    preferences={preferences}
                  />
                )}
              </details>
              <section className="discovery-card-section">
                <h4>Por tus condiciones</h4>
                <p>
                  Oferta en {offer.distrito}
                  {offer.modalidad ? ` · ${offer.modalidad}` : ""}.
                </p>
                {preferences.availability && (
                  <p>
                    Horario preferido: {preferences.availability}. Sujeto a
                    disponibilidad.
                  </p>
                )}
              </section>
              <section className="discovery-card-section">
                <h4>Fuentes para revisar</h4>
                <div className="discovery-career-actions">
                  {officialUrl(source) && (
                    <a
                      className="button secondary"
                      href={officialUrl(source)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Programa oficial ↗
                    </a>
                  )}
                  {programSources[offer.oferta_id]?.curriculum && (
                    <a
                      className="button secondary"
                      href={programSources[offer.oferta_id]?.curriculum}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Malla curricular ↗
                    </a>
                  )}
                  {!officialUrl(source) && (
                    <Link
                      className="text-link"
                      to={`/carreras/${offer.oferta_id}`}
                    >
                      Fuentes de la oferta
                    </Link>
                  )}
                </div>
              </section>
              <div className="discovery-career-actions">
                <Link
                  className="button"
                  to={`/carreras?q=${encodeURIComponent(offer.carrera_oficial)}`}
                >
                  Ver ofertas relacionadas <ArrowRight size={16} />
                </Link>
                <SaveOffer offer={offer} compact />
              </div>
            </div>
          </article>
        ),
      )}
    </div>
  );
}

function SuggestionAI({
  offerId,
  preferences,
}: {
  offerId: number;
  preferences: Preferences;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function explain() {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ explanation: string }>(
        "/api/descubre/explicar",
        {
          method: "POST",
          body: JSON.stringify({
            offer_id: offerId,
            interests: [...preferences.interests, preferences.extra].filter(
              Boolean,
            ),
            district_id: preferences.district
              ? Number(preferences.district)
              : null,
            modality_ids: preferences.modalities,
          }),
        },
      );
      setText(result.explanation);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No pudimos explicar la sugerencia.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="route-stack">
      <summary>Explicar con IA</summary>
      <p>
        Al solicitar la explicación se envían a Gemini tus intereses y
        condiciones seleccionadas.
      </p>
      <button
        className="button secondary"
        disabled={busy}
        onClick={() => void explain()}
      >
        {busy ? "Preparando explicación…" : "Solicitar explicación"}
      </button>
      {error && <Failure message={error} />}
      {text && <p role="status">{text}</p>}
    </details>
  );
}

const sectionIcons = [
  ClipboardList,
  Users,
  Building2,
  Bookmark,
  BookOpen,
  Flag,
  Settings,
];

export function PreferenceForm() {
  const { progress, update } = useProgress();
  const draft = progress.questionnaire;
  const [value, setValue] = useState(
    draft?.preferences ?? progress.current?.preferences ?? INITIAL,
  );
  const [params] = useSearchParams();
  const [step, setStep] = useState(
    params.get("revisar") === "1" && progress.current
      ? questions.length
      : (draft?.step ?? 0),
  );
  const [answers, setAnswers] = useState<QuestionnaireDraft["answers"]>(
    draft?.answers ?? progress.current?.answers ?? {},
  );
  const [saved, setSaved] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef<AbortController | null>(null);
  const facets = useApi<Facets>("/api/filtros");
  const navigate = useNavigate();
  useEffect(() => () => pending.current?.abort(), []);
  function edit(change: Partial<Preferences>) {
    setSaved(false);
    setValue((previous) => ({ ...previous, ...change }));
  }
  async function submit() {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError("");
    const preferences = { ...value, extra: value.extra.trim() };
    try {
      const suggestions = await discover(preferences, controller.signal);
      if (controller.signal.aborted) return;
      if (
        update((previous) => ({
          ...previous,
          previous: previous.current,
          explorationPreferences: undefined,
          questionnaire: undefined,
          current: {
            version: (previous.current?.version ?? 0) + 1,
            preferences,
            suggestions,
            answers,
          },
        }))
      )
        navigate("/descubre");
      else
        setError(
          "El navegador no permitió guardar estas sugerencias. Puedes reintentar.",
        );
    } catch (error) {
      if (!controller.signal.aborted)
        setError(
          error instanceof Error
            ? error.message
            : "No pudimos consultar las sugerencias.",
        );
    } finally {
      pending.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  const total = questions.length;
  const reviewing = step === total;
  const [editingReview, setEditingReview] = useState(false);
  const question = questions[step];
  const section = Math.min(Math.floor(step / 4), sections.length - 1);
  const CurrentIcon =
    step < 4 ? Microscope : step === 21 ? GraduationCap : sectionIcons[section];
  const selected =
    answers[step] ??
    (step === 21
      ? value.modalities.map((id) => id - 1)
      : step === 22
        ? question.choices.flatMap((choice, index) =>
            value.availability.includes(choice) ? [index] : [],
          )
        : []);
  const max = question?.kind !== "multiple" ? 1 : step < 20 ? 2 : Infinity;
  const hasSkip = step < 20 || step === 23;

  function changeStep(next: number) {
    setSaved(false);
    setStep(next);
    const scrollToTitle = reviewing !== (next === total);
    requestAnimationFrame(() => {
      const title = heading.current;
      if (title?.parentElement) title.parentElement.scrollTop = 0;
      title?.focus({ preventScroll: !scrollToTitle });
    });
  }

  function choose(next: number[]) {
    const updated = { ...answers, [step]: next };
    setAnswers(updated);
    setSaved(false);
    if (step < 20) edit({ interests: selectedInterests(updated) });
    if (step === 21)
      edit({
        modalities: next
          .filter((choice) => choice < 3)
          .map((choice) => choice + 1),
      });
    if (step === 22)
      edit({
        availability: next.map((choice) => question.choices[choice]).join(", "),
      });
    if (
      step === 23 &&
      (next.includes(0) || next.includes(3) || selected.includes(0))
    ) {
      edit({ flexible: next.includes(0) });
    }
  }

  return (
    <div className="questionnaire-page">
      <div className="container questionnaire-container">
        <nav
          className="questionnaire-breadcrumb"
          aria-label="Ruta de navegación"
        >
          <Link to="/descubre">Descubre</Link>
          <span aria-hidden="true">/</span> Cuestionario
        </nav>
        <header className="questionnaire-title">
          <h1>Explora lo que te interesa.</h1>
          <p>Responde a tu ritmo. Puedes volver y cambiar tus respuestas.</p>
        </header>
        <div className="questionnaire-layout">
          <form
            className={`questionnaire-card questionnaire-form${reviewing ? "" : " questionnaire-form--questions"}`}
            onSubmit={(event) => {
              event.preventDefault();
              if (reviewing) void submit();
              else {
                if (!(step in answers)) setAnswers({ ...answers, [step]: [] });
                changeStep(editingReview ? total : step + 1);
                setEditingReview(false);
              }
            }}
          >
            <div className="questionnaire-status">
              <div className="questionnaire-position">
                <CurrentIcon aria-hidden="true" />
                <div>
                  <strong>
                    {reviewing
                      ? "Revisión final"
                      : `Pregunta ${step + 1} de ${total}`}
                  </strong>
                  <span>
                    {reviewing ? "Cuestionario completo" : sections[section]}
                  </span>
                </div>
              </div>
              <div className="questionnaire-progress">
                <span aria-hidden="true">
                  {Math.min(step + 1, total)} / {total}
                </span>
                <progress
                  max={total}
                  value={Math.min(step + 1, total)}
                  aria-label="Avance del cuestionario"
                />
              </div>
            </div>
            {reviewing ? (
              <section className="questionnaire-body questionnaire-review">
                <h2 ref={heading} tabIndex={-1}>
                  Resumen de tus respuestas
                </h2>
                <p>
                  Revisa lo que elegiste y cambia cualquier respuesta antes de
                  ver tus sugerencias.
                </p>
                <div className="questionnaire-review-summary">
                  <h3>Preferencias para tus sugerencias</h3>
                  <PreferenceSummary value={value} facets={facets.data} />
                </div>
                <div className="questionnaire-review-sections">
                  {sections.map((name, group) => {
                    const Icon = sectionIcons[group];
                    return (
                      <details key={name}>
                        <summary>
                          <Icon size={19} aria-hidden="true" />
                          <strong>{name}</strong>
                          <span>4 preguntas</span>
                        </summary>
                        <ol start={group * 4 + 1}>
                          {questions
                            .slice(group * 4, group * 4 + 4)
                            .map((item, offset) => {
                              const index = group * 4 + offset;
                              const district = facets.data?.distritos.find(
                                (entry) =>
                                  String(entry.distrito_id) === value.district,
                              )?.distrito;
                              const answer =
                                index === 20
                                  ? value.district
                                    ? `${district ?? "Distrito guardado"}${value.flexible ? " · También considera otros distritos" : ""}`
                                    : "Sin distrito preferido"
                                  : (answers[index] ?? [])
                                      .map((choice) => item.choices[choice])
                                      .join(", ") || "Sin respuesta";
                              return (
                                <li key={item.title}>
                                  <div>
                                    <strong>{item.title}</strong>
                                    <p>{answer}</p>
                                  </div>
                                  <button
                                    type="button"
                                    className="button secondary"
                                    aria-label={`Editar pregunta ${index + 1}`}
                                    disabled={busy}
                                    onClick={() => {
                                      setEditingReview(true);
                                      changeStep(index);
                                    }}
                                  >
                                    Editar
                                  </button>
                                </li>
                              );
                            })}
                        </ol>
                      </details>
                    );
                  })}
                </div>
              </section>
            ) : (
              <section
                className="questionnaire-body"
                aria-labelledby="current-question"
                tabIndex={0}
              >
                <h2 id="current-question" ref={heading} tabIndex={-1}>
                  {question.title}
                </h2>
                <p>
                  {step === 20
                    ? "Indica tu preferencia de ubicación."
                    : step === 23
                      ? "Elige las opciones que considerarías."
                      : question.kind === "scale"
                        ? "Responde según tu interés, no según cuánto sabes ahora."
                        : max === 1
                          ? "Elige una opción."
                          : max === 2
                            ? "Elige hasta dos opciones."
                            : "Puedes elegir una o más opciones."}
                </p>
                {step === 20 ? (
                  <div className="questionnaire-district">
                    {facets.loading && <Loading text="Cargando distritos…" />}
                    {facets.error && (
                      <Failure message={facets.error} retry={facets.retry} />
                    )}
                    <label className="questionnaire-select">
                      <MapPin aria-hidden="true" />
                      <select
                        aria-label="Distrito de preferencia"
                        value={value.district}
                        onChange={(event) =>
                          edit({
                            district: event.target.value,
                            flexible: false,
                          })
                        }
                      >
                        <option value="">Selecciona un distrito</option>
                        {facets.data?.distritos.map((item) => (
                          <option
                            key={item.distrito_id}
                            value={item.distrito_id}
                          >
                            {item.distrito}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={value.flexible}
                        disabled={!value.district}
                        onChange={(event) =>
                          edit({ flexible: event.target.checked })
                        }
                      />{" "}
                      Considerar otros distritos.
                    </label>
                    <label className="questionnaire-choice">
                      <input
                        type="radio"
                        checked={20 in answers && !value.district}
                        onChange={() => {
                          edit({ district: "", flexible: false });
                          choose([]);
                        }}
                      />{" "}
                      No tengo un distrito preferido.
                    </label>
                  </div>
                ) : (
                  <fieldset
                    aria-labelledby="current-question"
                    className={`questionnaire-options ${question.kind === "scale" ? "is-scale" : step >= 21 || (question.kind === "single" && step !== 3) ? "is-list" : ""}`}
                  >
                    {question.choices.map((choice, index) => {
                      const checked = selected.includes(index);
                      return (
                        <label key={choice} className="questionnaire-choice">
                          <input
                            type={max === 1 ? "radio" : "checkbox"}
                            name={`question-${step}`}
                            checked={checked}
                            disabled={
                              !checked && max === 2 && selected.length >= max
                            }
                            onChange={() => {
                              if (step === 21 && index === 3 && !checked)
                                choose([3]);
                              else if (checked)
                                choose(selected.filter((id) => id !== index));
                              else if (max === 1) choose([index]);
                              else
                                choose([
                                  ...selected.filter(
                                    (id) => step !== 21 || id !== 3,
                                  ),
                                  index,
                                ]);
                            }}
                          />
                          {question.kind === "scale" && (
                            <strong>{index + 1}</strong>
                          )}
                          <span>{choice}</span>
                        </label>
                      );
                    })}
                  </fieldset>
                )}
                {hasSkip && (
                  <button
                    type="button"
                    className="text-link questionnaire-skip"
                    aria-pressed={step in answers && selected.length === 0}
                    onClick={() => {
                      choose([]);
                      changeStep(editingReview ? total : step + 1);
                      setEditingReview(false);
                    }}
                  >
                    Aún no lo sé
                  </button>
                )}
              </section>
            )}
            <footer className="questionnaire-footer">
              {!reviewing && <p>Puedes revisar tus respuestas.</p>}
              <div className="questionnaire-actions">
                <button
                  type="button"
                  className="button secondary"
                  disabled={(step === 0 && !editingReview) || busy}
                  onClick={() => {
                    changeStep(editingReview ? total : step - 1);
                    setEditingReview(false);
                  }}
                >
                  <ArrowLeft size={19} />{" "}
                  {reviewing
                    ? "Volver a la última pregunta"
                    : editingReview
                      ? "Volver a la revisión"
                      : "Anterior"}
                </button>
                <div>
                  <button className="button" disabled={busy}>
                    {busy
                      ? "Buscando opciones…"
                      : reviewing
                        ? "Ver sugerencias"
                        : editingReview
                          ? "Guardar y volver a la revisión"
                          : step === total - 1
                            ? "Revisar mis respuestas"
                            : "Siguiente pregunta"}{" "}
                    <ArrowRight size={19} />
                  </button>
                  <button
                    className="text-link"
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setError("");
                      setSaved(
                        update((previous) => ({
                          ...previous,
                          questionnaire: { step, answers, preferences: value },
                        })),
                      );
                    }}
                  >
                    Guardar y continuar después
                  </button>
                </div>
              </div>
              {saved && (
                <p aria-hidden="true">Avance guardado en este navegador.</p>
              )}
              {error && <Failure message={error} />}
            </footer>
          </form>
          <aside
            className="questionnaire-card questionnaire-route"
            aria-labelledby="questionnaire-route-title"
          >
            <h2 id="questionnaire-route-title">
              <Route aria-hidden="true" /> Tu recorrido
            </h2>
            <ol>
              {sections.map((name, index) => {
                const Icon = sectionIcons[index];
                const first = index * 4;
                const complete = questions
                  .slice(first, first + 4)
                  .every((_, offset) => first + offset in answers);
                return (
                  <li
                    key={name}
                    aria-current={
                      !reviewing && index === section ? "step" : undefined
                    }
                  >
                    <Icon aria-hidden="true" />
                    <span>
                      <strong>{name}</strong>
                      <small>4 preguntas</small>
                    </span>
                    {complete && (
                      <Check
                        className="questionnaire-complete"
                        size={16}
                        aria-label="Completado"
                      />
                    )}
                    <span className="questionnaire-range">
                      {first + 1} – {first + 4}
                    </span>
                  </li>
                );
              })}
            </ol>
          </aside>
        </div>
      </div>
    </div>
  );
}

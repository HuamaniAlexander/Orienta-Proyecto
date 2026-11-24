import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  ClipboardList,
  Flag,
  GraduationCap,
  MapPin,
  Microscope,
  Route,
  Settings,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { discover, INITIAL } from "../features/ruta/discovery";
import {
  SaveOffer,
  useProgress,
  type Preferences,
  type QuestionnaireDraft,
  type Suggestion,
} from "../features/ruta/Progress";
import { api, useApi } from "../shared/api/client";
import { Failure, Loading } from "../shared/components/Feedback";
import type { Facets } from "../shared/types/catalog";
import { officialUrl } from "./Detail";
import {
  questions,
  sections,
  selectedInterests,
} from "../features/ruta/questions";
import "../features/ruta/questionnaire.css";

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

export function Discover() {
  const { progress } = useProgress();
  const facets = useApi<Facets>("/api/filtros");
  if (!progress.current) return <PreferenceForm />;
  return (
    <div className="container section">
      <div className="page-heading">
        <h1>Opciones para seguir explorando.</h1>
        <p>
          Sugerencias relacionadas con los intereses y condiciones que
          declaraste.
        </p>
      </div>
      <section className="route-panel">
        <h2>Tus preferencias actuales</h2>
        <PreferenceSummary
          value={progress.current.preferences}
          facets={facets.data}
        />
        <Link className="button secondary" to="/descubre/preferencias">
          {progress.questionnaire
            ? "Reanudar cuestionario"
            : "Editar preferencias"}
        </Link>
        <Link className="text-link" to="/conecta">
          Buscar orientación
        </Link>
      </section>
      {progress.current.preferences.availability && (
        <p className="info-note">
          Confirma los horarios directamente con cada institución. El catálogo
          no permite verificar tu disponibilidad.
        </p>
      )}
      {progress.current.preferences.interests.length === 0 &&
        !progress.current.preferences.extra && (
          <p className="info-note">
            No indicaste intereses. Las sugerencias usan las condiciones que
            elegiste y el catálogo.
          </p>
        )}
      <SuggestionList
        key={progress.current.version}
        suggestions={progress.current.suggestions}
        preferences={progress.current.preferences}
      />
      {progress.previous && (
        <details className="route-panel">
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
      <p className="info-note">
        No encontramos coincidencias con los criterios indicados. Puedes editar
        tus preferencias y volver a consultar.
      </p>
    );
  return (
    <div className="discovery-results">
      {suggestions.map(({ offer, reasons, source }) => (
        <article className="route-panel route-stack" key={offer.oferta_id}>
          <h2>{offer.carrera_oficial}</h2>
          <p>
            {offer.institucion} · {offer.distrito}
          </p>
          <strong>Por qué aparece esta opción</strong>
          <ul>
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          {officialUrl(source) && (
            <a href={officialUrl(source)} target="_blank" rel="noreferrer">
              Consultar ficha oficial
            </a>
          )}
          <Link to={`/carreras/${offer.oferta_id}`}>Ver carrera y fuentes</Link>
          {(preferences.interests.length > 0 ||
            preferences.extra ||
            preferences.district ||
            preferences.modalities.length > 0) && (
            <SuggestionAI offerId={offer.oferta_id} preferences={preferences} />
          )}
          <SaveOffer offer={offer} />
        </article>
      ))}
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
  const [step, setStep] = useState(draft?.step ?? 0);
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

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  discover,
  INITIAL,
  INTERESTS,
  STEPS,
} from "../features/ruta/discovery";
import {
  SaveOffer,
  useProgress,
  type Preferences,
  type Suggestion,
} from "../features/ruta/Progress";
import { api, useApi } from "../shared/api/client";
import { Failure, Loading } from "../shared/components/Feedback";
import type { Facets } from "../shared/types/catalog";
import { officialUrl } from "./Detail";

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
                ?.etiqueta ?? `Modalidad ${id}`,
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
          Editar preferencias
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

export function PreferenceForm() {
  const { progress, update } = useProgress();
  const [value, setValue] = useState(progress.current?.preferences ?? INITIAL);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef<AbortController | null>(null);
  const facets = useApi<Facets>("/api/filtros");
  const navigate = useNavigate();
  useEffect(() => () => pending.current?.abort(), []);
  function edit(change: Partial<Preferences>) {
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
          current: {
            version: (previous.current?.version ?? 0) + 1,
            preferences,
            suggestions,
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
  return (
    <div className="container section">
      <div className="page-heading">
        <h1>
          {progress.current
            ? "Tus preferencias pueden cambiar."
            : "Empieza por lo que te interesa."}
        </h1>
        <p>Responde unas preguntas breves para explorar opciones.</p>
      </div>
      <div className="route-layout">
        <form
          className="route-panel route-stack"
          onSubmit={(event) => {
            event.preventDefault();
            if (step < 2) setStep(step + 1);
            else void submit();
          }}
        >
          <h2>
            {" "}
            Paso {step + 1} de 3 · {STEPS[step]}
          </h2>
          <progress
            max={3}
            value={step + 1}
            aria-label="Avance del cuestionario"
          />
          {step === 0 && (
            <>
              <fieldset className="discovery-options">
                <legend>¿Qué actividades disfrutas más?</legend>
                {INTERESTS.map(({ label }) => (
                  <label key={label}>
                    <input
                      type="checkbox"
                      checked={value.interests.includes(label)}
                      onChange={(event) =>
                        edit({
                          interests: event.target.checked
                            ? [...value.interests, label]
                            : value.interests.filter((item) => item !== label),
                        })
                      }
                    />{" "}
                    {label}
                  </label>
                ))}
              </fieldset>
              <label>
                ¿Hay algo más que te gustaría explorar?
                <input
                  value={value.extra}
                  onChange={(event) => edit({ extra: event.target.value })}
                  maxLength={100}
                />
              </label>
            </>
          )}
          {step === 1 && (
            <>
              {facets.loading && <Loading text="Cargando condiciones…" />}
              {facets.error && (
                <Failure message={facets.error} retry={facets.retry} />
              )}
              <label>
                Dónde te gustaría estudiar
                <select
                  value={value.district}
                  onChange={(event) => edit({ district: event.target.value })}
                >
                  <option value="">Todo Lima Norte</option>
                  {facets.data?.distritos.map((item) => (
                    <option key={item.distrito_id} value={item.distrito_id}>
                      {item.distrito}
                    </option>
                  ))}
                </select>
              </label>
              {value.district && (
                <label>
                  <input
                    type="checkbox"
                    checked={value.flexible}
                    onChange={(event) =>
                      edit({ flexible: event.target.checked })
                    }
                  />{" "}
                  Considerar otros distritos
                </label>
              )}
              <fieldset className="discovery-options">
                <legend>Modalidad</legend>
                {facets.data?.modalidades
                  .filter((item) => item.codigo_id <= 3)
                  .map((item) => (
                    <label key={item.codigo_id}>
                      <input
                        type="checkbox"
                        checked={value.modalities.includes(item.codigo_id)}
                        onChange={(event) =>
                          edit({
                            modalities: event.target.checked
                              ? [...value.modalities, item.codigo_id]
                              : value.modalities.filter(
                                  (id) => id !== item.codigo_id,
                                ),
                          })
                        }
                      />{" "}
                      {item.etiqueta}
                    </label>
                  ))}
              </fieldset>
              <label>
                Disponibilidad
                <select
                  value={value.availability}
                  onChange={(event) =>
                    edit({ availability: event.target.value })
                  }
                >
                  {[
                    "",
                    "Por las mañanas",
                    "Por las tardes",
                    "Por las noches",
                    "Fines de semana",
                    "Horario flexible",
                  ].map((item) => (
                    <option key={item} value={item}>
                      {item || "Sin indicar"}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          {step === 2 && (
            <section>
              <h3>Resumen de tus respuestas</h3>
              <PreferenceSummary value={value} facets={facets.data} />
              <p>
                Estas sugerencias son orientativas. Se guardan en este
                navegador.
              </p>
            </section>
          )}
          <div className="route-actions">
            <button
              type="button"
              className="button secondary"
              disabled={step === 0 || busy}
              onClick={() => setStep(step - 1)}
            >
              Atrás
            </button>
            <button className="button" disabled={busy}>
              {busy
                ? "Buscando opciones…"
                : step < 2
                  ? "Continuar"
                  : "Ver sugerencias"}
            </button>
          </div>
          {error && <Failure message={error} />}
        </form>
        <aside className="route-panel">
          <h2>Tu recorrido</h2>
          <ol>
            {STEPS.map((name, index) => (
              <li key={name} aria-current={step === index ? "step" : undefined}>
                {name}
              </li>
            ))}
          </ol>
          <p>Puedes revisar y cambiar tus respuestas.</p>
        </aside>
      </div>
    </div>
  );
}

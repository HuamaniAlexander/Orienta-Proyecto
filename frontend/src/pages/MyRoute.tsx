import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Laptop,
  MessageSquare,
  Pencil,
  Plus,
  Scale,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  comparisonKey,
  SaveComparison,
  SaveOffer,
  useProgress,
} from "../features/ruta/Progress";
import { INITIAL } from "../features/ruta/discovery";
import { questions } from "../features/ruta/questions";
import { careerImage } from "../shared/components/OfferCard";
import { useApi } from "../shared/api/client";
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
                <p>Todavía no has guardado carreras.</p>
              )}
              {progress.offers.map((offer) => (
                <article
                  className="my-route-row my-route-offer"
                  key={offer.oferta_id}
                >
                  <img
                    src={careerImage({
                      area_id: offer.area_id ?? 0,
                      carrera_oficial: offer.carrera_oficial,
                    })}
                    alt=""
                    loading="lazy"
                  />
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
            <aside className="route-panel route-stack">
              <h2>Tu próximo paso</h2>
              <Link className="my-route-row" to="/descubre">
                <Laptop size={21} /> Conoce las actividades
              </Link>
              <Link className="my-route-row" to="/carreras">
                <Bookmark size={21} /> Revisa dónde estudiar
              </Link>
              <Link className="my-route-row" to="/comparar">
                <Scale size={21} /> Compara dos opciones
              </Link>
              <Link className="button" to="/carreras">
                Explorar instituciones <ArrowRight size={17} />
              </Link>
              <p className="my-route-note">
                Puedes guardar nuevas opciones y retirar las que ya no quieras
                explorar.
              </p>
            </aside>
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
                <Link className="button secondary" to="/carreras">
                  Crear comparación <Plus size={17} />
                </Link>
              </header>
              {!progress.comparisons.length && (
                <p>Todavía no has guardado comparaciones.</p>
              )}
              {progress.comparisons.map((pair) => {
                const ids = pair.map((offer) => offer.oferta_id).join(",");
                const url = `/comparar?opciones=${ids}`;
                return (
                  <article
                    className="my-route-row route-stack"
                    key={comparisonKey(pair)}
                  >
                    <span className="my-route-badge">Comparación guardada</span>
                    <div className="my-route-pair">
                      {pair.map((offer, index) => (
                        <div key={offer.oferta_id}>
                          {index === 1 && <span>vs</span>}
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
                    <div className="route-actions">
                      <Link className="button" to={url}>
                        Retomar comparación <ArrowRight size={16} />
                      </Link>
                      <Link
                        className="text-link"
                        to={`/analisis?opciones=${ids}`}
                      >
                        Explicar con IA
                      </Link>
                      <SaveComparison offers={pair} />
                    </div>
                  </article>
                );
              })}
            </section>
            <aside className="route-panel route-stack">
              <h2>¿Qué quieres revisar?</h2>
              <p className="my-route-row">Lo que aprenderás</p>
              <p className="my-route-row">La experiencia de estudio</p>
              <p className="my-route-row">Tus condiciones para estudiar</p>
              <Link className="button secondary" to="/carreras">
                Explorar carreras <ArrowRight size={16} />
              </Link>
            </aside>
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
  const [error, setError] = useState("");
  const items = progress.questions.filter(
    (item) =>
      !career || String(progress.questionDetails?.[item]?.offerId) === career,
  );
  const researched = items.filter(
    (item) => progress.questionDetails?.[item]?.researched,
  );
  function reset() {
    setEditing("");
    setText("");
    setOfferId(career);
    setError("");
  }
  return (
    <div className="my-route-layout">
      <section className="route-panel route-stack">
        <header>
          <h2>Lo que quieres averiguar.</h2>
          <p>Guarda tus dudas y marca las que ya investigaste.</p>
        </header>
        <div className="my-route-header">
          <div className="route-actions">
            {(["Todas", "Pendientes", "Investigadas"] as const).map(
              (name, index) => (
                <button
                  key={name}
                  type="button"
                  className={`button ${filter === name ? "" : "secondary"}`}
                  aria-pressed={filter === name}
                  onClick={() => setFilter(name)}
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
        {career && (
          <Link className="text-link" to="/mi-ruta?vista=preguntas">
            Ver todas las carreras
          </Link>
        )}
        {!items.length && <p>Todavía no hay preguntas en esta vista.</p>}
        {items
          .filter(
            (item) =>
              filter === "Todas" ||
              researched.includes(item) === (filter === "Investigadas"),
          )
          .map((item) => {
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
      </section>
      <div className="route-stack">
        <form
          className="route-panel route-stack"
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
          <h2>{editing ? "Edita tu pregunta" : "Añade una pregunta"}</h2>
          <label>
            Tu pregunta
            <textarea
              aria-label="Escribe una nueva pregunta"
              placeholder="Escribe lo que quieres averiguar"
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
        <aside className="route-panel route-stack my-route-note">
          <h2>Lleva tus preguntas a una conversación.</h2>
          <Link className="button" to="/mi-ruta/preparar">
            <Sparkles size={18} /> Preparar mi conversación
          </Link>
        </aside>
      </div>
    </div>
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
      <section className="route-panel route-stack">
        <h2>Tus preferencias de exploración</h2>
        <form
          className="route-stack"
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
              {facets.data?.distritos.map((item) => (
                <option key={item.distrito_id} value={item.distrito_id}>
                  {item.distrito}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="route-actions">
            <legend>Modalidad</legend>
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
                !questions[22].choices.includes(value.availability) && (
                  <option>{value.availability}</option>
                )}
              {questions[22].choices.map((label) => (
                <option key={label}>{label}</option>
              ))}
            </select>
          </label>
          <label>
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
          <button className="button">Guardar cambios</button>
          {saved && <p role="status">Preferencias guardadas.</p>}
        </form>
        <hr />
        <h2>Tus respuestas al cuestionario</h2>
        <p>{answered} preguntas respondidas</p>
        <Link
          className="button secondary"
          to="/descubre/preferencias?revisar=1"
        >
          Revisar mis respuestas <ArrowRight size={16} />
        </Link>
        <p>
          Los cambios se aplicarán cuando solicites alternativas en Descubre.
        </p>
      </section>
      <section className="route-panel route-stack">
        <h2>Tus datos, bajo tu control.</h2>
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
        <h3>Eliminar datos guardados</h3>
        <p>
          {progress.offers.length} carreras · {progress.comparisons.length}{" "}
          comparaciones · {progress.questions.length} preguntas
        </p>
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
        {status.error && <p role="alert">{status.text}</p>}
        <Link className="back-link" to="/mi-ruta">
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

import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Building2,
  Check,
  CircleHelp,
  CheckCircle2,
  Clock3,
  Lightbulb,
  Save,
  ShieldCheck,
  Sparkles,
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
  structured = false,
}: {
  value: Preferences;
  facets?: Facets;
  structured?: boolean;
}) {
  const district = facets?.distritos.find(
    (item) => String(item.distrito_id) === value.district,
  );
  if (structured) {
    const entries = [
      {
        label: "Intereses",
        Icon: Lightbulb,
        text:
          [...value.interests, value.extra].filter(Boolean).join(", ") ||
          "Sin indicar",
      },
      {
        label: "Distrito",
        Icon: MapPin,
        text:
          (district?.distrito ??
            (value.district ? "Selección guardada" : "Sin indicar")) +
          (value.district && value.flexible
            ? " (considerando otros distritos)"
            : ""),
      },
      {
        label: "Modalidad",
        Icon: GraduationCap,
        text:
          value.modalities
            .map(
              (id) =>
                facets?.modalidades.find((item) => item.codigo_id === id)
                  ?.etiqueta ??
                questions[21].choices[id - 1] ??
                `Modalidad ${id}`,
            )
            .join(", ") || "Sin indicar",
      },
      {
        label: "Disponibilidad",
        Icon: Clock3,
        text: value.availability || "Sin indicar",
      },
    ];
    return (
      <dl className="questionnaire-preference-facts">
        {entries.map(({ label, Icon, text }) => (
          <div key={label}>
            <dt>
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </dt>
            <dd>{text}</dd>
          </div>
        ))}
      </dl>
    );
  }
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
  const [showPrevious, setShowPrevious] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(() =>
    window.matchMedia("(max-width: 600px)").matches ? 1 : 2,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 600px)");
    const resize = () => {
      setPageSize(media.matches ? 1 : 2);
      setPage(0);
    };
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);
  const activeDiscovery =
    showPrevious && progress.previous ? progress.previous : current;
  const pageCount = Math.ceil(activeDiscovery.suggestions.length / pageSize);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);
  const interests = [
    ...activeDiscovery.preferences.interests,
    activeDiscovery.preferences.extra,
  ].filter(Boolean);
  const shown = activeDiscovery.suggestions.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );
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
            {activeDiscovery.preferences.district && (
              <span className="discovery-tag">
                {facets.data?.distritos.find(
                  (item) =>
                    String(item.distrito_id) ===
                    activeDiscovery.preferences.district,
                )?.distrito ?? "Distrito guardado"}
              </span>
            )}
            {activeDiscovery.preferences.modalities.map((id) => (
              <span className="discovery-tag" key={id}>
                {questions[21].choices[id - 1] ?? `Modalidad ${id}`}
              </span>
            ))}
            {activeDiscovery.preferences.availability && (
              <span className="discovery-tag">
                {activeDiscovery.preferences.availability}
              </span>
            )}
            <a className="button secondary" href="#discovery-conditions">
              <SlidersHorizontal size={16} aria-hidden="true" />
              Ajustar condiciones
            </a>
          </div>
        </section>
        <div className="discovery-results-layout">
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
          <section
            className="discovery-results-panel"
            aria-labelledby="affine-careers"
            aria-busy={busy}
          >
            {progress.previous && (
              <nav
                className="discovery-version-controls"
                aria-label="Versiones de sugerencias"
              >
                <button
                  type="button"
                  className="button secondary"
                  aria-pressed={showPrevious}
                  disabled={showPrevious}
                  onClick={() => {
                    setShowPrevious(true);
                    setPage(0);
                  }}
                >
                  <ArrowLeft size={17} aria-hidden="true" />
                  <span>
                    Sugerencias anteriores · versión {progress.previous.version}
                  </span>
                </button>
                <span className="discovery-version-label">
                  {showPrevious ? "Exploración anterior" : "Exploración actual"}
                </span>
                <button
                  type="button"
                  className="button secondary"
                  aria-pressed={!showPrevious}
                  disabled={!showPrevious}
                  onClick={() => {
                    setShowPrevious(false);
                    setPage(0);
                  }}
                >
                  <span>Sugerencias actuales · versión {current.version}</span>
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </nav>
            )}
            <header>
              <div>
                <h2 id="affine-careers">Opciones sugeridas</h2>
                <p>Conoce las razones y revisa la información de origen.</p>
              </div>
              <nav
                className="discovery-page-controls"
                aria-label="Navegar opciones sugeridas"
              >
                <button
                  type="button"
                  className="button secondary"
                  aria-label="Opciones anteriores"
                  disabled={currentPage === 0}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                </button>
                <span role="status">
                  {activeDiscovery.suggestions.length
                    ? `${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, activeDiscovery.suggestions.length)} de ${activeDiscovery.suggestions.length}`
                    : "0 opciones"}
                </span>
                <button
                  type="button"
                  className="button secondary"
                  aria-label="Ver más opciones"
                  disabled={currentPage >= pageCount - 1}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </nav>
            </header>
            <SuggestionList
              suggestions={shown}
              preferences={activeDiscovery.preferences}
            />
          </section>
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
              {!relatedInterests?.length && (
                <p>
                  {preferences.extra
                    ? reasons[0]
                    : "Opción disponible para explorar en el catálogo."}
                </p>
              )}
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
                  <Info size={16} aria-hidden="true" /> Ver detalles y fuentes
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
              </details>
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
    <details className="discovery-ai">
      <summary><Sparkles size={20} aria-hidden="true" /><span><strong>Explicar con IA</strong><small>Comprende por qué aparece esta opción</small></span></summary>
      <div className="discovery-ai-body" aria-busy={busy}>
      <p className="discovery-ai-notice"><ShieldCheck size={17} aria-hidden="true" /><span>
        Al solicitar la explicación se envían a Gemini tus intereses y
        condiciones seleccionadas.
      </span></p>
      <button
        className="button discovery-ai-request"
        disabled={busy}
        onClick={() => void explain()}
      >
        <Sparkles size={17} aria-hidden="true" />
        {busy ? "Preparando explicación…" : error ? "Reintentar explicación" : text ? "Volver a solicitar explicación" : "Solicitar explicación"}
      </button>
      {error && <p className="discovery-ai-error" role="alert"><CircleHelp size={18} aria-hidden="true" /><span>{error}</span></p>}
      {text && <div className="discovery-ai-response" role="status"><h4><BookOpen size={18} aria-hidden="true" />Sobre esta sugerencia</h4>{text.split(/\n\s*\n|\n/).filter(paragraph => paragraph.trim()).map((paragraph, index) => <p key={index}>{paragraph}</p>)}<small>Revisa las fuentes de la oferta antes de decidir.</small></div>}
      </div>
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
  const reviewedCount = questions.reduce(
    (count, _, index) => count + Number(index in answers),
    0,
  );
  const progressPercent = Math.round((reviewedCount / total) * 100);
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

  function changeStep(next: number, reveal = false) {
    setSaved(false);
    setStep(next);
    const scrollToTitle = reveal || reviewing !== (next === total);
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
    <div className="questionnaire-page questionnaire-experience">
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
          <p>
            No hay respuestas correctas. Elige lo que te da curiosidad; puedes
            cambiarlo después.
          </p>
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
                    {reviewing
                      ? "Tus respuestas, listas para revisar"
                      : `Tramo ${section + 1} de ${sections.length} · ${sections[section]}`}
                  </span>
                </div>
              </div>
              <div className="questionnaire-progress">
                <div className="questionnaire-progress-caption">
                  <span>Tu avance</span>
                  <strong>{progressPercent}%</strong>
                </div>
                <progress
                  className="sr-only"
                  max={total}
                  value={reviewedCount}
                  aria-label="Avance del cuestionario"
                />
                <div
                  className="questionnaire-progress-track"
                  aria-hidden="true"
                >
                  <span
                    className="questionnaire-progress-fill"
                    style={{ transform: `scaleX(${reviewedCount / total})` }}
                  />
                  <span className="questionnaire-progress-ticks">
                    {sections.map((name) => (
                      <i key={name} />
                    ))}
                  </span>
                </div>
                <small>
                  {reviewedCount} de {total} preguntas revisadas
                </small>
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
                  <PreferenceSummary
                    value={value}
                    facets={facets.data}
                    structured
                  />
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
                        <ol start={group * 4 + 1} role="list">
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
                                  <span
                                    className="questionnaire-review-number"
                                    aria-hidden="true"
                                  >
                                    {index + 1}
                                  </span>
                                  <div className="questionnaire-review-answer">
                                    <strong>{item.title}</strong>
                                    <p>
                                      {answer === "Sin respuesta" ? (
                                        <CircleHelp
                                          size={16}
                                          aria-hidden="true"
                                        />
                                      ) : (
                                        <CheckCircle2
                                          size={16}
                                          aria-hidden="true"
                                        />
                                      )}
                                      <span>{answer}</span>
                                    </p>
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
                                    <Pencil size={16} aria-hidden="true" />
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
                key={step}
                className="questionnaire-body questionnaire-question"
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
                      />
                      <span
                        className="questionnaire-choice-indicator"
                        aria-hidden="true"
                      >
                        <Check size={15} />
                      </span>
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
                          <span
                            className="questionnaire-choice-indicator"
                            aria-hidden="true"
                          >
                            <Check size={15} />
                          </span>
                          {question.kind === "scale" && (
                            <strong>{index + 1}</strong>
                          )}
                          <span>{choice}</span>
                        </label>
                      );
                    })}
                  </fieldset>
                )}
                <div className="questionnaire-response-footer">
                  <span className="questionnaire-choice-feedback" role="status">
                    {step === 20
                      ? "Tu ubicación es una preferencia, no un límite."
                      : selected.length
                        ? `${selected.length} ${selected.length === 1 ? "opción seleccionada" : "opciones seleccionadas"}${max === 2 ? " · máximo 2" : ""}`
                        : "Puedes revisar esta pregunta después."}
                  </span>
                  {hasSkip && (
                    <button
                      type="button"
                      className="button secondary questionnaire-skip"
                      aria-pressed={step in answers && selected.length === 0}
                      onClick={() => {
                        choose([]);
                        changeStep(editingReview ? total : step + 1);
                        setEditingReview(false);
                      }}
                    >
                      <CircleHelp size={18} aria-hidden="true" />
                      Aún no lo sé
                    </button>
                  )}
                </div>
              </section>
            )}
            <footer className="questionnaire-footer">
              <div className="questionnaire-footer-note">
                <ShieldCheck size={17} aria-hidden="true" />
                <p>
                  {reviewing
                    ? "Revisa tus respuestas antes de consultar alternativas."
                    : "Tu exploración es tuya. Puedes volver y cambiar cualquier respuesta."}
                </p>
              </div>
              <div className="questionnaire-actions">
                <button
                  type="button"
                  className="button secondary questionnaire-previous"
                  disabled={(step === 0 && !editingReview) || busy}
                  onClick={() => {
                    changeStep(editingReview ? total : step - 1);
                    setEditingReview(false);
                  }}
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                  {reviewing
                    ? "Volver a la última pregunta"
                    : editingReview
                      ? "Volver a la revisión"
                      : "Anterior"}
                </button>
                <button
                  className="button secondary questionnaire-save"
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
                  {saved ? (
                    <Check size={18} aria-hidden="true" />
                  ) : (
                    <Save size={18} aria-hidden="true" />
                  )}
                  <span>Guardar y continuar después</span>
                </button>
                <button className="button questionnaire-next" disabled={busy}>
                  <span>
                    {busy
                      ? "Buscando opciones…"
                      : reviewing
                        ? "Ver sugerencias"
                        : editingReview
                          ? "Guardar y volver a la revisión"
                          : step === total - 1
                            ? "Revisar mis respuestas"
                            : "Siguiente pregunta"}
                  </span>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>
              {saved && (
                <p className="questionnaire-save-feedback" aria-hidden="true">
                  <Check size={16} />
                  Avance guardado en este navegador.
                </p>
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
            <p className="questionnaire-route-intro">
              Seis tramos para conocerte un poco más.
            </p>
            <ol>
              {sections.map((name, index) => {
                const Icon = sectionIcons[index];
                const first = index * 4;
                const visited = questions
                  .slice(first, first + 4)
                  .filter((_, offset) => first + offset in answers).length;
                const complete = visited === 4;
                const active = !reviewing && index === section;
                const available = reviewing || first <= step || visited > 0;
                return (
                  <li
                    key={name}
                    className={
                      complete ? "is-complete" : visited > 0 ? "is-started" : ""
                    }
                  >
                    <button
                      type="button"
                      aria-current={active ? "step" : undefined}
                      disabled={!available || busy}
                      onClick={() => {
                        setEditingReview(reviewing || editingReview);
                        changeStep(first, true);
                      }}
                    >
                      <span className="questionnaire-route-icon">
                        {complete ? (
                          <Check size={20} aria-hidden="true" />
                        ) : (
                          <Icon size={20} aria-hidden="true" />
                        )}
                      </span>
                      <span className="questionnaire-route-copy">
                        <strong>{name}</strong>
                        <small>
                          {complete
                            ? "Tramo revisado"
                            : active
                              ? `${visited} de 4 revisadas · en curso`
                              : visited
                                ? `${visited} de 4 revisadas`
                                : "Por explorar"}
                        </small>
                      </span>
                      <span className="questionnaire-range">
                        {first + 1}–{first + 4}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="questionnaire-route-help">
              <Bookmark size={18} aria-hidden="true" />
              <p>Guarda tu avance para retomar desde este navegador.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

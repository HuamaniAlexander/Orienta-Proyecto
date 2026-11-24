import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  Info,
  MessageSquare,
  Search,
  Sparkles,
  UserRound,
  Video,
} from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useProgress } from "../features/ruta/Progress";
import { api, useApi } from "../shared/api/client";
import { Failure, Loading } from "../shared/components/Feedback";
import { officialUrl } from "./Detail";
import "../features/ruta/connect.css";

interface Advisor {
  id: string;
  name: string;
  focus: string;
  conditions: string;
  response_window: string;
  accepts_text: boolean;
  photo_url?: string | null;
  topics?: string[];
  duration_minutes?: number | null;
  slots: { id: string; starts_at: string }[];
}
interface Receipt {
  id: string;
  status: "recibida" | "confirmada" | "respondida" | "rechazada";
  channel: "zoom" | "texto";
  starts_at: string | null;
  response_window: string;
  response: string | null;
  meeting_url: string | null;
  advisor_name?: string | null;
  advisor_focus?: string | null;
  advisor_photo_url?: string | null;
  guide_shared?: boolean;
}
type Session = Pick<
  Receipt,
  "id" | "channel" | "status" | "starts_at" | "advisor_name" | "advisor_focus"
>;
const sessionsKey = "orienta-sesiones-v1";
const lima = { timeZone: "America/Lima" };
const day = (date: string) =>
  new Intl.DateTimeFormat("sv-SE", { ...lima, dateStyle: "short" }).format(
    new Date(date),
  );
const time = (date: string) =>
  new Intl.DateTimeFormat("es-PE", { ...lima, timeStyle: "short" }).format(
    new Date(date),
  );
const dateLabel = (date: string, dateStyle: "long" | "medium" = "long") =>
  new Intl.DateTimeFormat("es-PE", { ...lima, dateStyle }).format(
    new Date(date),
  );
const monthLabel = (date: string) =>
  new Intl.DateTimeFormat("es-PE", {
    ...lima,
    month: "long",
    year: "numeric",
  }).format(new Date(date));
const searchText = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
const labels: Record<Receipt["status"], string> = {
  recibida: "Solicitud recibida",
  confirmada: "Tu sesión está reservada.",
  respondida: "Pregunta respondida",
  rechazada: "Solicitud rechazada",
};

function savedSessions(): Session[] {
  try {
    const stored = JSON.parse(localStorage.getItem(sessionsKey) ?? "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function rememberSession(receipt: Receipt, advisor: Advisor) {
  const { id, channel, status, starts_at, advisor_name, advisor_focus } =
    receipt;
  const entry = {
    id,
    channel,
    status,
    starts_at,
    advisor_name: advisor_name ?? advisor.name,
    advisor_focus: advisor_focus ?? advisor.focus,
  };
  try {
    localStorage.setItem(
      sessionsKey,
      JSON.stringify([
        entry,
        ...savedSessions().filter((item) => item.id !== id),
      ]),
    );
  } catch {
    // The direct receipt link remains available when browser storage is blocked.
  }
}

function Portrait({ advisor }: { advisor: Advisor }) {
  const [failed, setFailed] = useState(false);
  const source = officialUrl(advisor.photo_url ?? null);
  return (
    <div className="connect-portrait">
      {source && !failed ? (
        <img src={source} alt="" onError={() => setFailed(true)} />
      ) : (
        <UserRound aria-hidden="true" />
      )}
    </div>
  );
}

function Header({
  crumb,
  title,
  description,
  action,
  confirmed,
}: {
  crumb?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  confirmed?: boolean;
}) {
  return (
    <>
      <nav className="questionnaire-breadcrumb" aria-label="Ruta de navegación">
        {crumb ? (
          <>
            <Link to="/conecta">Conecta</Link>
            <span aria-hidden="true">/</span>
            {crumb}
          </>
        ) : (
          <>
            <Link to="/">Inicio</Link>
            <span aria-hidden="true">/</span>Conecta
          </>
        )}
      </nav>
      <header className="questionnaire-title connect-header">
        <div className="connect-heading">
          {confirmed && (
            <CircleCheck
              className="connect-confirmed"
              size={36}
              aria-hidden="true"
            />
          )}
          <div>
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
        </div>
        {action}
      </header>
    </>
  );
}

function saveCalendar(receipt: Receipt) {
  if (!receipt.starts_at) return;
  const stamp = (date: Date) =>
    date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ORIENTA//Conecta//ES",
    "BEGIN:VEVENT",
    `UID:${receipt.id}@orienta`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(new Date(receipt.starts_at))}`,
    "SUMMARY:Sesión de orientación ORIENTA",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob([calendar], { type: "text/calendar;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "sesion-orienta.ics";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const directoryLink = (
  <Link className="button secondary" to="/conecta">
    <ArrowLeft size={17} /> Ver orientadores
  </Link>
);
const sessionsLink = (
  <Link className="button secondary" to="/conecta?mis-sesiones=1">
    <CalendarDays size={17} /> Mis sesiones
  </Link>
);

export function Connect() {
  const [params] = useSearchParams();
  const advisorId = params.get("orientador");
  const sessions = params.has("mis-sesiones");
  const advisors = useApi<Advisor[]>("/api/orientacion/orientadores");
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState("");
  const [availability, setAvailability] = useState("");
  const [filters, setFilters] = useState({
    query: "",
    focus: "",
    availability: "",
  });
  const profiles = advisors.data ?? [];
  const advisor = profiles.find((item) => item.id === advisorId);
  const shown = profiles.filter(
    (item) =>
      [item.name, item.focus].some((label) =>
        searchText(label).includes(searchText(filters.query)),
      ) &&
      (!filters.focus || item.focus === filters.focus) &&
      (filters.availability !== "zoom" || item.slots.length > 0) &&
      (filters.availability !== "texto" || item.accepts_text),
  );
  return (
    <div className="questionnaire-page">
      <div className="container questionnaire-container connect">
        {sessions ? (
          <Sessions />
        ) : advisor ? (
          <AdvisorProfile
            key={advisor.id}
            advisor={advisor}
            reload={advisors.retry}
          />
        ) : (
          <>
            <Header
              title="Conversa con alguien que conoce tu carrera."
              description="Encuentra un orientador, elige un horario y resuelve tus dudas por Zoom."
              action={sessionsLink}
            />
            <ol className="connect-steps" aria-label="Cómo funciona Conecta">
              {(
                [
                  [UserRound, "Elige un orientador"],
                  [CalendarDays, "Solicita un horario"],
                  [Video, "Conversa por Zoom"],
                ] as const
              ).map(([StepIcon, label], index) => {
                return (
                  <li key={label}>
                    <StepIcon size={22} aria-hidden="true" />
                    {label}
                    {index < 2 && (
                      <ArrowRight
                        className="connect-step-arrow"
                        size={19}
                        aria-hidden="true"
                      />
                    )}
                  </li>
                );
              })}
            </ol>
            <form
              className="connect-filters"
              onSubmit={(event) => {
                event.preventDefault();
                setFilters({ query, focus, availability });
              }}
            >
              <label className="connect-search">
                <Search size={20} aria-hidden="true" />
                <input
                  aria-label="Buscar por carrera o nombre"
                  placeholder="Buscar por carrera o nombre"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <select
                aria-label="Carrera"
                value={focus}
                onChange={(event) => setFocus(event.target.value)}
              >
                <option value="">Todas las carreras</option>
                {[...new Set(profiles.map((item) => item.focus))]
                  .sort((a, b) => a.localeCompare(b, "es"))
                  .map((item) => (
                    <option key={item}>{item}</option>
                  ))}
              </select>
              <select
                aria-label="Disponibilidad"
                value={availability}
                onChange={(event) => setAvailability(event.target.value)}
              >
                <option value="">Disponibilidad</option>
                <option value="zoom">Horarios por Zoom</option>
                <option value="texto">Preguntas por escrito</option>
              </select>
              <button className="button">Buscar</button>
            </form>
            <section aria-labelledby="advisor-directory">
              <h2 id="advisor-directory">Encuentra a tu orientador</h2>
              {advisors.loading && <Loading text="Consultando orientadores…" />}
              {advisors.error && (
                <Failure message={advisors.error} retry={advisors.retry} />
              )}
              {advisors.data && (
                <>
                  <p>
                    {shown.length} {shown.length === 1 ? "perfil" : "perfiles"}
                  </p>
                  {!shown.length && (
                    <p className="connect-panel">
                      {profiles.length
                        ? "No encontramos orientadores con esos filtros."
                        : "Por ahora no hay orientadores activos."}
                    </p>
                  )}
                  {advisorId && (
                    <p className="connect-panel">
                      Ese perfil ya no está disponible.
                    </p>
                  )}
                </>
              )}
              <div className="connect-grid">
                {shown.map((item) => (
                  <article className="connect-panel connect-card" key={item.id}>
                    <Portrait advisor={item} />
                    <div className="connect-card-content">
                      <h3>{item.name}</h3>
                      <p className="connect-muted">
                        Orientación · {item.focus}
                      </p>
                      <p>{item.conditions}</p>
                      {!!item.topics?.length && (
                        <ul className="connect-tags">
                          {item.topics.map((topic) => (
                            <li key={topic}>{topic}</li>
                          ))}
                        </ul>
                      )}
                      <p className="connect-card-availability">
                        <CalendarDays size={17} aria-hidden="true" />
                        {item.slots.length
                          ? "Horarios disponibles"
                          : item.accepts_text
                            ? "Preguntas por escrito"
                            : "Sin horarios disponibles"}
                      </p>
                      <Link
                        className="button"
                        to={`/conecta?orientador=${encodeURIComponent(item.id)}`}
                      >
                        Ver perfil y horarios <ArrowRight size={17} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <section className="connect-panel connect-guide">
              <Sparkles size={26} aria-hidden="true" />
              <div>
                <h2>Lleva tus preguntas a la conversación.</h2>
                <p>Prepara un resumen editable desde Mi ruta.</p>
              </div>
              <Link className="button secondary" to="/mi-ruta/preparar">
                Preparar mi conversación <ArrowRight size={17} />
              </Link>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function AdvisorProfile({
  advisor,
  reload,
}: {
  advisor: Advisor;
  reload: () => void;
}) {
  const { progress } = useProgress();
  const navigate = useNavigate();
  const slots = [...advisor.slots].sort(
    (a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at),
  );
  const months = [
    ...new Set(slots.map((slot) => day(slot.starts_at).slice(0, 7))),
  ];
  const [month, setMonth] = useState("");
  const [selectedDay, setDay] = useState("");
  const [slotId, setSlotId] = useState("");
  const [channel, setChannel] = useState<"zoom" | "texto">(
    slots.length || !advisor.accepts_text ? "zoom" : "texto",
  );
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const attempt = useRef<{ payload: string; id: string } | null>(null);
  const activeMonth = months.includes(month) ? month : months[0];
  const monthIndex = months.indexOf(activeMonth);
  const dates = [
    ...new Set(
      slots
        .map((slot) => day(slot.starts_at))
        .filter((entry) => entry.startsWith(activeMonth ?? "")),
    ),
  ];
  const activeDay = dates.includes(selectedDay) ? selectedDay : dates[0];
  const daySlots = slots.filter((slot) => day(slot.starts_at) === activeDay);
  const selectedSlot = daySlots.find((slot) => slot.id === slotId);
  const draft = progress.conversation;
  const guide = [
    draft?.summary,
    ...(draft?.questions.map(({ text }) => text) ?? []),
  ]
    .map((text) => text?.trim())
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 1600);

  async function submit(fields: FormData) {
    const summary = consent && guide ? guide : null;
    const payload = {
      advisor_id: advisor.id,
      channel,
      contact: String(fields.get("contact")).trim(),
      slot_id: channel === "zoom" ? selectedSlot?.id : null,
      question:
        channel === "texto" ? String(fields.get("question")).trim() : null,
      summary,
      consent: Boolean(summary),
    };
    const serialized = JSON.stringify(payload);
    if (attempt.current?.payload !== serialized)
      attempt.current = { payload: serialized, id: crypto.randomUUID() };
    setBusy(true);
    setError("");
    try {
      const receipt = await api<Receipt>("/api/orientacion/solicitudes", {
        method: "POST",
        body: JSON.stringify({ ...payload, request_id: attempt.current.id }),
      });
      rememberSession(receipt, advisor);
      navigate(`/conecta/solicitudes/${receipt.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos enviar tu solicitud.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header
        crumb={advisor.name}
        title="Conoce a tu orientador."
        description="Revisa su perfil y elige cómo conversar."
        action={directoryLink}
      />
      <div className="connect-layout">
        <section className="connect-panel connect-stack">
          <div className="connect-profile">
            <Portrait advisor={advisor} />
            <div>
              <h2>{advisor.name}</h2>
              <p className="connect-muted">Orientación · {advisor.focus}</p>
              <p>{advisor.conditions}</p>
            </div>
          </div>
          {!!advisor.topics?.length && (
            <div className="connect-divider">
              <h3>Podemos conversar sobre</h3>
              <ul className="connect-topics">
                {advisor.topics.map((topic) => (
                  <li key={topic}>
                    <MessageSquare size={18} aria-hidden="true" />
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="connect-divider connect-stack">
            <h3>Lleva tu ruta a la sesión</h3>
            <p>
              Puedes compartir la guía guardada en Mi ruta junto con tu
              solicitud.
            </p>
            <label className="connect-checkbox">
              <input
                type="checkbox"
                checked={consent}
                disabled={!guide || busy}
                onChange={(event) => setConsent(event.target.checked)}
              />
              Incluir mi guía de conversación
            </label>
            {guide ? (
              <details>
                <summary>Revisar el texto que se enviará</summary>
                <pre className="connect-guide-text">{guide}</pre>
              </details>
            ) : (
              <p className="connect-muted">
                Guarda un borrador para adjuntarlo a la solicitud.
              </p>
            )}
            <Link
              className="text-link"
              to="/mi-ruta/preparar"
              target="_blank"
              rel="noopener"
            >
              Revisar mi guía <ArrowRight size={16} />
              <span className="sr-only"> (abre en otra pestaña)</span>
            </Link>
          </div>
        </section>
        <form
          className="connect-panel connect-stack"
          onSubmit={(event) => {
            event.preventDefault();
            if (!busy) void submit(new FormData(event.currentTarget));
          }}
        >
          <div className="connect-header">
            <h2>
              {channel === "zoom" ? "Elige tu horario" : "Envía tu pregunta"}
            </h2>
            {channel === "zoom" && (
              <span className="connect-pill">
                <Video size={17} /> Por Zoom
                {advisor.duration_minutes
                  ? ` · ${advisor.duration_minutes} min`
                  : ""}
              </span>
            )}
          </div>
          {slots.length > 0 && advisor.accepts_text && (
            <label>
              Canal
              <select
                value={channel}
                disabled={busy}
                onChange={(event) =>
                  setChannel(event.target.value === "texto" ? "texto" : "zoom")
                }
              >
                <option value="zoom">Videollamada por Zoom</option>
                <option value="texto">Pregunta por escrito</option>
              </select>
            </label>
          )}
          {channel === "zoom" ? (
            slots.length ? (
              <>
                <div className="connect-month">
                  <button
                    type="button"
                    className="button secondary"
                    aria-label="Mes anterior con horarios"
                    disabled={busy || monthIndex <= 0}
                    onClick={() => {
                      setMonth(months[monthIndex - 1]);
                      setSlotId("");
                    }}
                  >
                    <ChevronLeft size={19} />
                  </button>
                  <strong>{monthLabel(daySlots[0].starts_at)}</strong>
                  <button
                    type="button"
                    className="button secondary"
                    aria-label="Mes siguiente con horarios"
                    disabled={busy || monthIndex >= months.length - 1}
                    onClick={() => {
                      setMonth(months[monthIndex + 1]);
                      setSlotId("");
                    }}
                  >
                    <ChevronRight size={19} />
                  </button>
                </div>
                <div
                  className="connect-choices"
                  aria-label="Fechas disponibles"
                >
                  {dates.map((date) => (
                    <button
                      type="button"
                      className="button secondary"
                      key={date}
                      disabled={busy}
                      aria-pressed={activeDay === date}
                      onClick={() => {
                        setDay(date);
                        setSlotId("");
                      }}
                    >
                      {dateLabel(`${date}T12:00:00-05:00`, "medium")
                        .replace(/ de \d{4}$/, "")
                        .replace(/ \d{4}$/, "")}
                    </button>
                  ))}
                </div>
                <h3>Horarios disponibles</h3>
                <div
                  className="connect-choices"
                  aria-label="Horarios disponibles"
                >
                  {daySlots.map((slot) => (
                    <button
                      type="button"
                      className="button secondary"
                      key={slot.id}
                      disabled={busy}
                      aria-pressed={slotId === slot.id}
                      onClick={() => setSlotId(slot.id)}
                    >
                      {time(slot.starts_at)}
                    </button>
                  ))}
                </div>
                <p className="connect-muted connect-inline">
                  <Clock size={16} /> Hora de Perú · UTC−5
                </p>
                <div className="connect-divider">
                  <h3>Tu sesión</h3>
                  <dl className="connect-details">
                    <dt>Orientador</dt>
                    <dd>{advisor.name}</dd>
                    <dt>Carrera</dt>
                    <dd>{advisor.focus}</dd>
                    {selectedSlot && (
                      <>
                        <dt>Fecha</dt>
                        <dd>{dateLabel(selectedSlot.starts_at)}</dd>
                        <dt>Hora</dt>
                        <dd>{time(selectedSlot.starts_at)}</dd>
                      </>
                    )}
                  </dl>
                </div>
              </>
            ) : (
              <p>No hay horarios disponibles por ahora.</p>
            )
          ) : (
            <label>
              Tu pregunta
              <textarea name="question" required maxLength={1600} rows={4} />
            </label>
          )}
          {(channel === "texto" || slots.length > 0) && (
            <>
              <label>
                Correo de contacto
                <input name="contact" type="email" required maxLength={160} />
              </label>
              <button
                className="button connect-wide"
                disabled={busy || (channel === "zoom" && !selectedSlot)}
              >
                {busy
                  ? "Enviando…"
                  : channel === "zoom"
                    ? "Solicitar reserva"
                    : "Enviar pregunta"}{" "}
                <ArrowRight size={18} />
              </button>
              <p className="connect-muted">
                {channel === "zoom"
                  ? "El acceso a Zoom aparecerá cuando el orientador confirme."
                  : advisor.response_window}
              </p>
            </>
          )}
          {error && <Failure message={error} retry={reload} />}
        </form>
      </div>
    </>
  );
}

function Sessions() {
  const sessions = savedSessions();
  return (
    <>
      <Header
        crumb="Mis sesiones"
        title="Mis sesiones"
        description="Revisa las solicitudes guardadas en este dispositivo."
        action={directoryLink}
      />
      <section className="connect-panel connect-stack">
        {!sessions.length && (
          <p>Aún no tienes solicitudes guardadas en este navegador.</p>
        )}
        {sessions.map((item) => (
          <Link
            key={item.id}
            className="connect-session-row"
            to={`/conecta/solicitudes/${item.id}`}
          >
            <CalendarDays size={21} />
            <span>
              <strong>{item.advisor_name ?? "Solicitud de orientación"}</strong>
              {item.starts_at && (
                <small>
                  {dateLabel(item.starts_at)} · {time(item.starts_at)}
                </small>
              )}
            </span>
            <ArrowRight size={17} />
          </Link>
        ))}
      </section>
    </>
  );
}

export function FollowUp() {
  const { id } = useParams();
  const result = useApi<Receipt>(
    `/api/orientacion/solicitudes/${encodeURIComponent(id ?? "")}`,
  );
  const { progress } = useProgress();
  const stored = savedSessions().find((item) => item.id === id);
  const receipt = result.data;
  const meeting =
    receipt?.status === "confirmada"
      ? officialUrl(receipt.meeting_url)
      : undefined;
  return (
    <div className="questionnaire-page">
      <div className="container questionnaire-container connect">
        <Header
          crumb="Detalle de la solicitud"
          title={
            receipt ? labels[receipt.status] : "Seguimiento de orientación"
          }
          confirmed={receipt?.status === "confirmada"}
          description={
            receipt?.status === "confirmada"
              ? "Ya tienes un espacio para conversar sobre tu carrera."
              : receipt?.status === "recibida"
                ? "El orientador revisará tu solicitud."
                : undefined
          }
          action={sessionsLink}
        />
        {result.loading && <Loading />}
        {result.error && (
          <Failure message={result.error} retry={result.retry} />
        )}
        {receipt && (
          <>
            <div className="connect-layout">
              <section className="connect-panel connect-stack">
                <h2>
                  {receipt.advisor_name || stored?.advisor_name
                    ? `Tu conversación con ${receipt.advisor_name ?? stored?.advisor_name}`
                    : "Tu solicitud de orientación"}
                </h2>
                {officialUrl(receipt.advisor_photo_url ?? null) && (
                  <img
                    className="connect-receipt-photo"
                    src={officialUrl(receipt.advisor_photo_url ?? null)}
                    alt=""
                  />
                )}
                {(receipt.advisor_focus ?? stored?.advisor_focus) && (
                  <p className="connect-pill">
                    {receipt.advisor_focus ?? stored?.advisor_focus}
                  </p>
                )}
                <div className="connect-tags">
                  {receipt.starts_at && (
                    <>
                      <span className="connect-pill">
                        <CalendarDays size={18} />{" "}
                        {dateLabel(receipt.starts_at)}
                      </span>
                      <span className="connect-pill">
                        <Clock size={18} /> {time(receipt.starts_at)} · Hora de
                        Perú
                      </span>
                    </>
                  )}
                  <span className="connect-pill">
                    {receipt.channel === "zoom" ? (
                      <Video size={18} />
                    ) : (
                      <MessageSquare size={18} />
                    )}
                    {receipt.channel === "zoom"
                      ? "Videollamada por Zoom"
                      : "Pregunta por escrito"}
                  </span>
                </div>
                {receipt.channel === "zoom" && (
                  <div className="connect-divider connect-stack">
                    <h3>Acceso a la sesión</h3>
                    {meeting ? (
                      <a
                        className="button connect-wide"
                        href={meeting}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Video size={18} /> Abrir reunión en Zoom{" "}
                        <ArrowRight size={17} />
                      </a>
                    ) : (
                      <p>
                        {receipt.status === "recibida"
                          ? "El enlace a Zoom estará disponible al confirmar la cita."
                          : "Esta solicitud no tiene un enlace de reunión disponible."}
                      </p>
                    )}
                  </div>
                )}
                {receipt.status === "recibida" && (
                  <p>{receipt.response_window}</p>
                )}
                {receipt.response && <p>{receipt.response}</p>}
                <div className="connect-actions">
                  {receipt.status === "confirmada" && receipt.starts_at && (
                    <button
                      className="button secondary"
                      onClick={() => saveCalendar(receipt)}
                    >
                      <CalendarDays size={17} /> Añadir al calendario
                    </button>
                  )}
                  <button className="button secondary" onClick={result.retry}>
                    Actualizar estado
                  </button>
                </div>
              </section>
              <aside className="connect-panel connect-stack">
                <h2>Llega con tus ideas claras.</h2>
                <ul className="connect-topics">
                  {[
                    "Revisa las carreras que guardaste",
                    "Elige las preguntas que quieres conversar",
                    "Comprueba tu cámara y micrófono",
                  ]
                    .slice(0, receipt.channel === "zoom" ? 3 : 2)
                    .map((item) => (
                      <li key={item}>
                        <label className="connect-checkbox">
                          <input type="checkbox" />
                          {item}
                        </label>
                      </li>
                    ))}
                </ul>
                <div className="connect-divider connect-stack">
                  <h3>Tu guía de conversación</h3>
                  {receipt.guide_shared !== undefined && (
                    <span className="connect-pill">
                      {receipt.guide_shared
                        ? "Compartida en la solicitud"
                        : "Aún no compartida"}
                    </span>
                  )}
                  <p>
                    Prepara y edita el resumen antes de decidir si lo compartes.
                  </p>
                  <Link className="button" to="/mi-ruta/preparar">
                    {progress.conversation
                      ? "Revisar guía guardada"
                      : "Preparar mi conversación"}{" "}
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </aside>
            </div>
            <p className="connect-panel connect-inline connect-note">
              <Info size={19} /> El orientador te ayuda a explorar opciones. La
              decisión sigue siendo tuya.
            </p>
          </>
        )}
        <Link className="back-link" to="/conecta">
          <ArrowLeft size={17} /> Volver a Conecta
        </Link>
      </div>
    </div>
  );
}

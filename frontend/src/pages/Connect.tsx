import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useProgress } from "../features/ruta/Progress";
import { api, useApi } from "../shared/api/client";
import { Failure, Loading } from "../shared/components/Feedback";
import { officialUrl } from "./Detail";

interface Advisor {
  id: string;
  name: string;
  focus: string;
  conditions: string;
  response_window: string;
  accepts_text: boolean;
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
}
const formatSlot = (date: string) =>
  new Intl.DateTimeFormat("es-PE", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(date));
const statusText: Record<Receipt["status"], string> = {
  recibida: "Solicitud recibida",
  confirmada: "Cita confirmada",
  respondida: "Pregunta respondida",
  rechazada: "Solicitud rechazada",
};

export function Connect() {
  const advisors = useApi<Advisor[]>("/api/orientacion/orientadores");
  const [selected, setSelected] = useState("");
  const advisor = advisors.data?.find((item) => item.id === selected);
  return (
    <div className="container section">
      <div className="page-heading">
        <h1>Conecta con un orientador.</h1>
        <p>
          Solicita una videollamada por Zoom o envía una pregunta por escrito.
        </p>
      </div>
      {advisors.loading && <Loading text="Consultando orientadores…" />}
      {advisors.error && (
        <Failure message={advisors.error} retry={advisors.retry} />
      )}
      {advisors.data?.length === 0 && (
        <p className="info-note">
          El servicio todavía no tiene orientadores activos. Puedes preparar tu
          conversación aquí.
        </p>
      )}
      <div className="route-layout">
        <section className="route-stack" aria-label="Orientadores disponibles">
          {advisors.data?.map((item) => (
            <article className="route-panel route-stack" key={item.id}>
              <h2>{item.name}</h2>
              <p>{item.focus}</p>
              <p>{item.conditions}</p>
              <p>{item.response_window}</p>
              <p>
                {item.slots.length
                  ? "Videollamada por Zoom"
                  : "Sin horarios para Zoom"}
                {item.accepts_text && " · Preguntas por escrito"}
              </p>
              <button
                className="button secondary"
                onClick={() => setSelected(item.id)}
                disabled={!item.slots.length && !item.accepts_text}
                aria-pressed={item.id === selected}
              >
                Elegir a {item.name}
              </button>
            </article>
          ))}
          {advisor && (
            <ContactForm
              key={advisor.id}
              advisor={advisor}
              reload={() => {
                setSelected("");
                advisors.retry();
              }}
            />
          )}
        </section>
        {!advisor && <PreparationPanel />}
      </div>
    </div>
  );
}

function usePreparation() {
  const { progress } = useProgress();
  const labels = (items: typeof progress.offers) =>
    items.map((offer) => `${offer.carrera_oficial} (${offer.institucion})`);
  const offers = labels(progress.offers).slice(0, 12);
  const comparisons = progress.comparisons
    .slice(0, 8)
    .map((pair) => labels(pair).join(" / "));
  const questions = progress.questions.slice(0, 12);
  const [summary, setSummary] = useState(() =>
    [
      `Carreras: ${offers.join("; ") || "Sin carreras guardadas"}`,
      `Comparaciones: ${comparisons.join("; ") || "Sin comparaciones guardadas"}`,
      `Preguntas: ${questions.join("; ") || "Sin preguntas guardadas"}`,
    ]
      .join("\n")
      .slice(0, 1600),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function generate() {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ questions: string[] }>(
        "/api/orientacion/preparar",
        {
          method: "POST",
          body: JSON.stringify({
            offers: offers.map((text) => text.slice(0, 300)),
            comparisons: comparisons.map((text) => text.slice(0, 300)),
            questions,
          }),
        },
      );
      const draft = `Preguntas sugeridas:\n- ${result.questions.join("\n- ")}`;
      setSummary((previous) =>
        [previous.slice(0, Math.max(0, 1598 - draft.length)), draft]
          .filter(Boolean)
          .join("\n\n"),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No pudimos preparar las preguntas.",
      );
    } finally {
      setBusy(false);
    }
  }
  return { summary, setSummary, busy, error, generate };
}

function PreparationFields({
  preparation,
}: {
  preparation: ReturnType<typeof usePreparation>;
}) {
  return (
    <>
      <p>
        Al usar IA, se enviarán a Gemini las carreras, comparaciones y preguntas
        guardadas que figuran en este borrador.
      </p>
      <button
        type="button"
        className="button secondary"
        disabled={preparation.busy}
        onClick={() => void preparation.generate()}
      >
        {preparation.busy ? "Preparando preguntas…" : "Preparar con IA"}
      </button>
      {preparation.error && <Failure message={preparation.error} />}
      <label>
        Resumen editable para tu conversación
        <textarea
          rows={7}
          value={preparation.summary}
          maxLength={1600}
          disabled={preparation.busy}
          onChange={(event) => preparation.setSummary(event.target.value)}
        />
      </label>
    </>
  );
}

export function PreparationPanel() {
  const preparation = usePreparation();
  return (
    <section className="route-panel route-stack">
      <h2>Prepara tu conversación</h2>
      <PreparationFields preparation={preparation} />
    </section>
  );
}

function ContactForm({
  advisor,
  reload,
}: {
  advisor: Advisor;
  reload: () => void;
}) {
  const preparation = usePreparation();
  const [channel, setChannel] = useState<"zoom" | "texto">(
    advisor.slots.length ? "zoom" : "texto",
  );
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Receipt>();
  const [busy, setBusy] = useState(false);
  const attempt = useRef<{ payload: string; id: string } | null>(null);
  async function submit(fields: FormData) {
    const payload = {
      advisor_id: advisor.id,
      channel,
      contact: String(fields.get("contact")).trim(),
      slot_id: channel === "zoom" ? String(fields.get("slot")) : null,
      question:
        channel === "texto" ? String(fields.get("question")).trim() : null,
      summary: consent ? preparation.summary.trim() : null,
      consent,
    };
    const serialized = JSON.stringify(payload);
    if (attempt.current?.payload !== serialized) {
      attempt.current = { payload: serialized, id: crypto.randomUUID() };
    }
    setBusy(true);
    setError("");
    try {
      setResult(
        await api<Receipt>("/api/orientacion/solicitudes", {
          method: "POST",
          body: JSON.stringify({ ...payload, request_id: attempt.current.id }),
        }),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No pudimos enviar tu solicitud.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (result) return <ReceiptCard receipt={result} />;
  return (
    <form
      className="route-panel route-stack"
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy) void submit(new FormData(event.currentTarget));
      }}
    >
      <h2>Solicitar orientación a {advisor.name}</h2>
      <label>
        Canal
        <select
          value={channel}
          disabled={busy}
          onChange={(event) =>
            setChannel(event.target.value === "zoom" ? "zoom" : "texto")
          }
        >
          {advisor.slots.length > 0 && (
            <option value="zoom">Videollamada por Zoom</option>
          )}
          {advisor.accepts_text && (
            <option value="texto">Pregunta por escrito</option>
          )}
        </select>
      </label>
      {channel === "zoom" ? (
        <label>
          Horario de Lima
          <select name="slot" defaultValue="" required>
            <option value="" disabled>
              Elige un horario
            </option>
            {advisor.slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {formatSlot(slot.starts_at)}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label>
          Tu pregunta
          <textarea name="question" required maxLength={1600} rows={4} />
        </label>
      )}
      <label>
        Correo de contacto
        <input name="contact" type="email" required maxLength={160} />
      </label>
      <details className="route-panel">
        <summary>Revisar un resumen para el orientador</summary>
        <PreparationFields preparation={preparation} />
        <label>
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />
          Autorizo compartir este resumen con {advisor.name} al enviar.
        </label>
      </details>
      <button
        className="button"
        disabled={
          busy || preparation.busy || (consent && !preparation.summary.trim())
        }
      >
        {busy
          ? "Enviando…"
          : channel === "zoom"
            ? "Enviar solicitud de cita"
            : "Enviar pregunta"}
      </button>
      {error && (
        <>
          <Failure message={error} />
          {channel === "zoom" && (
            <button type="button" className="button secondary" onClick={reload}>
              Volver a consultar horarios
            </button>
          )}
        </>
      )}
    </form>
  );
}

function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const meeting = officialUrl(receipt.meeting_url);
  return (
    <section className="route-panel route-stack">
      <h2>{statusText[receipt.status]}</h2>
      <p>Identificador: {receipt.id}</p>
      {receipt.starts_at && (
        <p>{formatSlot(receipt.starts_at)} (hora de Lima)</p>
      )}
      {receipt.status === "recibida" && (
        <>
          <p>{receipt.response_window}</p>
          {receipt.channel === "zoom" && (
            <p>
              El orientador debe confirmar la cita. Guarda el enlace de
              seguimiento.
            </p>
          )}
        </>
      )}
      {receipt.response && <p>{receipt.response}</p>}
      {meeting && (
        <a href={meeting} target="_blank" rel="noreferrer">
          Abrir videollamada en Zoom
        </a>
      )}
      <Link to={`/conecta/solicitudes/${receipt.id}`}>
        Consultar estado de la solicitud
      </Link>
    </section>
  );
}

export function FollowUp() {
  const { id } = useParams();
  const result = useApi<Receipt>(
    `/api/orientacion/solicitudes/${encodeURIComponent(id ?? "")}`,
  );
  return (
    <div className="container section route-stack">
      <h1>Seguimiento de orientación</h1>
      {result.loading && <Loading />}
      {result.error && <Failure message={result.error} retry={result.retry} />}
      {result.data && (
        <>
          <ReceiptCard receipt={result.data} />
          <button className="button secondary" onClick={result.retry}>
            Actualizar estado
          </button>
        </>
      )}
      <Link to="/conecta">Volver a Conecta</Link>
    </div>
  );
}

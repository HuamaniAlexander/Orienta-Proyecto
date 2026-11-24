import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bookmark,
  MessageSquare,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useProgress } from "../features/ruta/Progress";
import { api } from "../shared/api/client";

interface DraftQuestion {
  text: string;
  source: string;
}

export function PrepareConversation() {
  const { progress, update, status } = useProgress();
  const draft = progress.conversation;
  const [offers, setOffers] = useState(
    draft?.offers ??
      progress.offers.slice(0, 12).map((offer) => offer.oferta_id),
  );
  const [selectedQuestions, setSelectedQuestions] = useState(
    draft?.selectedQuestions ?? progress.questions.slice(0, 12),
  );
  const [summary, setSummary] = useState(draft?.summary ?? "");
  const [questions, setQuestions] = useState<DraftQuestion[]>(
    draft?.questions ?? [],
  );
  const [step, setStep] = useState(draft ? 2 : 1);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);

  const selectedOffers = progress.offers.filter((offer) =>
    offers.includes(offer.oferta_id),
  );
  const routeQuestions = progress.questions.filter((question) =>
    selectedQuestions.includes(question),
  );
  const payload = [
    summary.trim(),
    "Preguntas para mi conversación",
    ...questions
      .map(({ text }) => text.trim())
      .filter(Boolean)
      .map((text, index) => `${index + 1}. ${text}`),
  ].join("\n\n");

  async function prepare() {
    if (pending.current || (!selectedOffers.length && !routeQuestions.length))
      return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setMessage("");
    const labels = selectedOffers.map(
      (offer) => `${offer.carrera_oficial} (${offer.institucion})`,
    );
    const localSummary = [
      labels.length ? `Estoy explorando ${labels.join(", ")}.` : "",
      routeQuestions.length
        ? `Quiero conversar sobre estas dudas: ${routeQuestions.join(" ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 1600);
    const selected = routeQuestions.map((text) => ({
      text,
      source: "De tu ruta",
    }));
    try {
      const result = await api<{ questions: string[]; summary?: string }>(
        "/api/orientacion/preparar",
        {
          method: "POST",
          body: JSON.stringify({
            offers: labels.map((label) => label.slice(0, 300)),
            questions: routeQuestions,
            comparisons: [],
          }),
          signal: controller.signal,
        },
      );
      if (controller.signal.aborted) return;
      const suggested = [...new Set(result.questions)].filter(
        (text) => !routeQuestions.includes(text),
      );
      setSummary(result.summary?.trim() || localSummary);
      setQuestions([
        ...selected,
        ...suggested.map((text) => ({ text, source: "Sugerida por IA" })),
      ]);
    } catch {
      if (controller.signal.aborted) return;
      setSummary(localSummary);
      setQuestions(selected);
      setMessage(
        "La IA no está disponible. Puedes editar el borrador preparado con tu ruta.",
      );
    } finally {
      pending.current = null;
      if (!controller.signal.aborted) {
        setBusy(false);
        setStep(2);
      }
    }
  }

  function move(index: number, next: number) {
    const items = [...questions];
    [items[index], items[next]] = [items[next], items[index]];
    setQuestions(items);
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(payload);
      setMessage("Guía copiada. Puedes pegarla donde decidas compartirla.");
    } catch {
      setMessage(
        "No pudimos copiar la guía. Puedes seleccionar y copiar el texto de la vista previa.",
      );
    }
  }

  return (
    <div className="questionnaire-page">
      <div className="container questionnaire-container my-route">
        <nav
          className="questionnaire-breadcrumb"
          aria-label="Ruta de navegación"
        >
          <Link to="/">Inicio</Link>
          <span>/</span>
          <Link to="/mi-ruta">Mi ruta</Link>
          <span>/</span>Preparar conversación
        </nav>
        <header className="questionnaire-title my-route-header">
          <div>
            <h1>Prepara tu conversación.</h1>
            <p>Organiza tus ideas y revisa lo que quieres compartir.</p>
          </div>
          <span className="my-route-badge">Borrador editable</span>
        </header>
        <ol
          className="my-route-tabs conversation-steps"
          aria-label="Pasos de preparación"
        >
          {[
            "Elige qué incluir",
            "Revisa y edita",
            "Comparte cuando decidas",
          ].map((label, index) => (
            <li
              key={label}
              aria-current={step === index + 1 ? "step" : undefined}
            >
              {index + 1}. {label}
            </li>
          ))}
        </ol>
        <div className="my-route-layout conversation-layout">
          <aside className="route-panel route-stack">
            <h2>Desde tu ruta</h2>
            <p>Selecciona qué quieres incluir.</p>
            <fieldset className="route-stack" disabled={busy}>
              <legend>
                <Bookmark size={17} /> Carreras guardadas
              </legend>
              {progress.offers.map((offer) => (
                <label key={offer.oferta_id}>
                  <input
                    type="checkbox"
                    checked={offers.includes(offer.oferta_id)}
                    disabled={
                      !offers.includes(offer.oferta_id) &&
                      selectedOffers.length >= 12
                    }
                    onChange={(event) => {
                      setStep(1);
                      setOffers(
                        event.target.checked
                          ? [...offers, offer.oferta_id]
                          : offers.filter((id) => id !== offer.oferta_id),
                      );
                    }}
                  />{" "}
                  {offer.carrera_oficial} · {offer.institucion}
                </label>
              ))}
              {!progress.offers.length && (
                <p>Todavía no tienes carreras guardadas.</p>
              )}
            </fieldset>
            <fieldset className="route-stack" disabled={busy}>
              <legend>
                <MessageSquare size={17} /> Preguntas guardadas
              </legend>
              {progress.questions.map((text) => (
                <label key={text}>
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(text)}
                    disabled={
                      !selectedQuestions.includes(text) &&
                      routeQuestions.length >= 12
                    }
                    onChange={(event) => {
                      setStep(1);
                      setSelectedQuestions(
                        event.target.checked
                          ? [...selectedQuestions, text]
                          : selectedQuestions.filter((item) => item !== text),
                      );
                    }}
                  />{" "}
                  {text}
                </label>
              ))}
              {!progress.questions.length && (
                <p>Todavía no tienes preguntas guardadas.</p>
              )}
            </fieldset>
            <p>
              {selectedOffers.length} carreras y {routeQuestions.length}{" "}
              preguntas seleccionadas
            </p>
            <p>
              Al pulsar Preparar con IA, Gemini recibe las carreras y preguntas
              que selecciones.
            </p>
            <button
              className="button secondary"
              disabled={
                busy || (!selectedOffers.length && !routeQuestions.length)
              }
              onClick={() => void prepare()}
            >
              <Sparkles size={18} /> {busy ? "Preparando…" : "Preparar con IA"}
            </button>
            {summary && step === 1 && (
              <button className="button secondary" onClick={() => setStep(2)}>
                Volver al borrador actual
              </button>
            )}
          </aside>
          <section className="route-panel route-stack" aria-busy={busy}>
            {step === 3 ? (
              <>
                <h2>Revisa lo que vas a compartir</h2>
                <pre className="conversation-preview">{payload}</pre>
                <div className="route-actions">
                  <button
                    className="button secondary"
                    onClick={() => {
                      setMessage("");
                      setStep(2);
                    }}
                  >
                    Volver a editar
                  </button>
                  <button className="button" onClick={() => void copyDraft()}>
                    Copiar guía
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>Tu guía para conversar</h2>
                <p>Puedes editar el resumen y cada pregunta.</p>
                {step === 1 && !summary && !questions.length ? (
                  <p className="my-route-note">
                    Selecciona lo que quieras incluir y prepara tu guía.
                  </p>
                ) : (
                  <>
                    <label>
                      Resumen de mi ruta
                      <textarea
                        rows={5}
                        value={summary}
                        maxLength={1600}
                        onChange={(event) => setSummary(event.target.value)}
                      />
                    </label>
                    <div className="my-route-header">
                      <h3>Preguntas para mi conversación</h3>
                      <button
                        className="button secondary"
                        onClick={() =>
                          setQuestions([
                            ...questions,
                            { text: "", source: "Añadida por ti" },
                          ])
                        }
                      >
                        <Plus size={16} /> Añadir pregunta
                      </button>
                    </div>
                    <ol className="conversation-questions">
                      {questions.map((question, index) => (
                        <li className="my-route-row" key={index}>
                          <input
                            aria-label={`Pregunta ${index + 1}`}
                            value={question.text}
                            maxLength={300}
                            onChange={(event) =>
                              setQuestions(
                                questions.map((item, pos) =>
                                  pos === index
                                    ? { ...item, text: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                          <span className="my-route-badge">
                            {question.source}
                          </span>
                          <div className="route-actions">
                            <button
                              className="button secondary"
                              aria-label={`Subir pregunta ${index + 1}`}
                              disabled={index === 0}
                              onClick={() => move(index, index - 1)}
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              className="button secondary"
                              aria-label={`Bajar pregunta ${index + 1}`}
                              disabled={index === questions.length - 1}
                              onClick={() => move(index, index + 1)}
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              className="button secondary"
                              aria-label={`Quitar pregunta ${index + 1}`}
                              onClick={() =>
                                setQuestions(
                                  questions.filter(
                                    (_, position) => position !== index,
                                  ),
                                )
                              }
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <div className="my-route-header">
                      <button
                        className="button secondary"
                        disabled={busy}
                        onClick={() => {
                          if (
                            update((previous) => ({
                              ...previous,
                              conversation: {
                                summary,
                                questions,
                                offers,
                                selectedQuestions,
                              },
                            }))
                          )
                            setMessage("Borrador guardado.");
                        }}
                      >
                        Guardar borrador
                      </button>
                      <button
                        className="button"
                        disabled={
                          busy ||
                          step === 1 ||
                          (!summary.trim() &&
                            !questions.some(({ text }) => text.trim()))
                        }
                        onClick={() => {
                          setMessage("");
                          setStep(3);
                        }}
                      >
                        Revisar antes de compartir <ArrowRight size={17} />
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
            {(message || status.error) && (
              <p role="status">{status.error ? status.text : message}</p>
            )}
            <p>Nada se comparte automáticamente.</p>
          </section>
        </div>
        <Link className="back-link" to="/mi-ruta?vista=preguntas">
          <ArrowLeft size={16} /> Volver a Mi ruta
        </Link>
      </div>
    </div>
  );
}

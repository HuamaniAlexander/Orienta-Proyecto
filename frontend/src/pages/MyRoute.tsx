import { useState } from "react";
import { Link } from "react-router-dom";
import {
  comparisonKey,
  SaveComparison,
  SaveOffer,
  useProgress,
} from "../features/ruta/Progress";
import "../features/ruta/route.css";

export function MyRoute() {
  const { progress, update, status } = useProgress();
  const [question, setQuestion] = useState("");
  return (
    <div className="container section">
      <div className="page-heading">
        <h1>Tu ruta, a tu ritmo.</h1>
        <p>
          Retoma las opciones, comparaciones y preguntas guardadas en este
          navegador.
        </p>
      </div>
      <nav className="route-actions" aria-label="Mi ruta">
        <a href="#guardadas">Carreras</a>
        <a href="#comparaciones">Comparaciones</a>
        <a href="#preguntas">Preguntas</a>
        <Link to="/mi-ruta/avance">Gestionar avance</Link>
      </nav>
      <div className="route-layout">
        <div className="route-stack">
          <section id="guardadas" className="route-panel">
            <h2>Carreras en Mi ruta</h2>
            {progress.offers.length === 0 && (
              <p>Todavía no has guardado carreras.</p>
            )}
            {progress.offers.map((offer) => (
              <article className="route-item" key={offer.oferta_id}>
                <div>
                  <Link to={`/carreras/${offer.oferta_id}`}>
                    {offer.carrera_oficial}
                  </Link>
                  <p>
                    {offer.institucion} · {offer.distrito}
                  </p>
                </div>
                <SaveOffer offer={offer} />
              </article>
            ))}
          </section>
          <section id="comparaciones" className="route-panel">
            <h2>Comparaciones en Mi ruta</h2>
            {progress.comparisons.length === 0 && (
              <p>Todavía no has guardado comparaciones.</p>
            )}
            {progress.comparisons.map((pair) => (
              <article className="route-item" key={comparisonKey(pair)}>
                <Link
                  to={`/comparar?opciones=${pair.map((offer) => offer.oferta_id).join(",")}`}
                >
                  {pair
                    .map(
                      (offer) =>
                        `${offer.carrera_oficial} · ${offer.institucion}`,
                    )
                    .join(" / ")}
                </Link>
                <SaveComparison offers={pair} />
              </article>
            ))}
          </section>
          <Link className="button" to="/carreras">
            Seguir explorando
          </Link>
          <Link className="button secondary" to="/conecta">
            Preparar una conversación
          </Link>
        </div>
        <section id="preguntas" className="route-panel">
          <h2>Tus preguntas</h2>
          {progress.questions.map((item) => (
            <div className="route-item" key={item}>
              <span>{item}</span>
              <button
                className="button secondary"
                aria-label={`Retirar pregunta: ${item}`}
                onClick={() =>
                  update((previous) => ({
                    ...previous,
                    questions: previous.questions.filter(
                      (text) => text !== item,
                    ),
                  }))
                }
              >
                Retirar
              </button>
            </div>
          ))}
          <form
            className="route-stack"
            onSubmit={(event) => {
              event.preventDefault();
              const text = question.trim();
              if (!text) return;
              if (
                update((previous) => ({
                  ...previous,
                  questions: [...new Set([...previous.questions, text])],
                }))
              )
                setQuestion("");
            }}
          >
            <label>
              Escribe una nueva pregunta
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={300}
                required
              />
            </label>
            <button className="button" disabled={!question.trim()}>
              Guardar pregunta
            </button>
            {status.error && <p>{status.text}</p>}
          </form>
        </section>
      </div>
    </div>
  );
}

export function ProgressSettings() {
  const { progress, clear, status } = useProgress();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="container section">
      <div className="page-heading">
        <h1>Tú controlas lo que guardas.</h1>
        <p>Revisa dónde está tu información y decide qué conservar.</p>
      </div>
      <section className="route-panel route-stack">
        <h2>Avance en este dispositivo</h2>
        <p>Las personas que usan este navegador pueden ver el avance local.</p>
        <ul className="route-actions">
          <li>{progress.offers.length} carreras</li>
          <li>{progress.comparisons.length} comparaciones</li>
          <li>{progress.questions.length} preguntas</li>
        </ul>
        <p>
          Al borrar el avance también se eliminan tus preferencias y sugerencias
          guardadas.
        </p>
        {confirm ? (
          <div className="route-actions">
            <strong>¿Quieres borrar tu avance?</strong>
            <button
              className="button secondary"
              onClick={() => setConfirm(false)}
            >
              Cancelar
            </button>
            <button
              className="button danger"
              onClick={() => {
                if (clear()) setConfirm(false);
              }}
            >
              Sí, borrar mi avance
            </button>
          </div>
        ) : (
          <button className="button secondary" onClick={() => setConfirm(true)}>
            Borrar avance de este dispositivo
          </button>
        )}
        <p role="status">{status.text}</p>
      </section>
      <Link className="back-link" to="/mi-ruta">
        Volver a Mi ruta
      </Link>
    </div>
  );
}

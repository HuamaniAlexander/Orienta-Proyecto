import {
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  GraduationCap,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Compass,
  Scale,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../shared/api/client";
import { Failure } from "../shared/components/Feedback";
import "../features/colegios/schools.css";

type Period = 1 | 3 | 6 | 12;
type Cupos = 100 | 200 | 500 | 1000;

const PERIODS: { value: Period; label: string; discount?: string }[] = [
  { value: 1, label: "1 mes" },
  { value: 3, label: "3 meses", discount: "-10%" },
  { value: 6, label: "6 meses", discount: "-15%" },
  { value: 12, label: "12 meses", discount: "-25%" },
];

const TIERS: {
  cupos: Cupos;
  label: string;
  prices: Record<Period, number>;
}[] = [
  {
    cupos: 100,
    label: "Hasta 100 cupos",
    prices: { 1: 200, 3: 540, 6: 1020, 12: 1800 },
  },
  {
    cupos: 200,
    label: "Hasta 200 cupos",
    prices: { 1: 300, 3: 810, 6: 1530, 12: 2700 },
  },
  {
    cupos: 500,
    label: "Hasta 500 cupos",
    prices: { 1: 450, 3: 1215, 6: 2295, 12: 4050 },
  },
  {
    cupos: 1000,
    label: "Hasta 1 000 cupos",
    prices: { 1: 650, 3: 1755, 6: 3315, 12: 5850 },
  },
];

interface SchoolReceipt {
  id: string;
  school_name: string;
  tier_cupos: number;
  period_months: number;
  total_pen: number;
  monthly_equivalent_pen: number;
  per_student_pen: number;
  discount_percent: number;
  status: string;
}

const formatPen = (amount: number) =>
  `S/ ${amount.toLocaleString("es-PE", { maximumFractionDigits: 2 })}`;

export function Schools() {
  const [view, setView] = useState<"plans" | "request">("plans");
  const [period, setPeriod] = useState<Period>(12);
  const [selectedCupos, setSelectedCupos] = useState<Cupos>(100);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<SchoolReceipt | null>(null);

  async function handleSubmit(form: FormData) {
    setBusy(true);
    setError("");
    try {
      const result = await api<SchoolReceipt>("/api/colegios/solicitudes", {
        method: "POST",
        body: JSON.stringify({
          school_name: String(form.get("school_name") ?? "").trim(),
          district: String(form.get("district") ?? "").trim(),
          contact_name: String(form.get("contact_name") ?? "").trim(),
          contact_email: String(form.get("contact_email") ?? "").trim(),
          contact_phone: String(form.get("contact_phone") ?? "").trim() || null,
          tier_cupos: selectedCupos,
          period_months: period,
          notes: String(form.get("notes") ?? "").trim() || null,
        }),
      });
      setReceipt(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos registrar la solicitud. Intenta nuevamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  const activeTier =
    TIERS.find((item) => item.cupos === selectedCupos) ?? TIERS[0];
  const activeTotal = activeTier.prices[period];

  return (
    <div className="container schools-page">
      <section className="schools-hero">
        <div className="schools-hero-copy">
          <h1>
            Una decisión importante.
            <br />
            <span>Un colegio que acompaña.</span>
          </h1>
          <p>
            Acerca la orientación vocacional a tus estudiantes de secundaria.
            Carreras, intereses y conversaciones en una misma experiencia.
          </p>
          <div className="schools-hero-notes">
            <span>
              <Building2 size={16} aria-hidden="true" /> Para colegios de Lima
            </span>
            <span>
              <Users size={16} aria-hidden="true" /> De 100 a 1 000 cupos
            </span>
          </div>
        </div>
        <div className="schools-hero-image illustration">
          <img
            src="/images/estudiantes.webp"
            alt="Estudiantes explorando sus opciones académicas"
            width="1100"
            height="733"
          />
        </div>
      </section>

      <div
        className="schools-workspace-nav"
        aria-label="Configurar plan institucional"
      >
        <div
          className="schools-view-switch"
          role="group"
          aria-label="Secciones de planes"
        >
          <button
            type="button"
            aria-pressed={view === "plans"}
            onClick={() => setView("plans")}
          >
            <Scale size={17} aria-hidden="true" /> Planes y tarifas
          </button>
          <button
            type="button"
            aria-pressed={view === "request"}
            onClick={() => setView("request")}
          >
            <Building2 size={17} aria-hidden="true" /> Solicitar plan
          </button>
        </div>
        <span className="schools-nav-note">
          <ShieldCheck size={16} aria-hidden="true" /> Solicitud sin cobro en
          línea
        </span>
      </div>

      <div hidden={view !== "plans"}>
        <section className="schools-pricing" aria-labelledby="planes-colegios">
          <div className="schools-section-heading">
            <div>
              <h2 id="planes-colegios">Elige el alcance de tu colegio.</h2>
              <p>
                La misma experiencia en todos los planes. Tú eliges los cupos y
                el periodo.
              </p>
            </div>
            <span className="schools-currency">Tarifas en soles · PEN</span>
          </div>

          <div
            className="schools-period-bar"
            role="group"
            aria-label="Periodo de contratación"
          >
            {PERIODS.map((item) => (
              <button
                key={item.value}
                type="button"
                className="schools-period-btn"
                aria-pressed={period === item.value}
                onClick={() => setPeriod(item.value)}
              >
                {item.label}
                {item.discount && (
                  <span className="schools-discount-tag">{item.discount}</span>
                )}
              </button>
            ))}
          </div>

          <div className="schools-grid">
            {TIERS.map((tier) => {
              const total = tier.prices[period];
              const monthlyRef = total / period;
              const perStudent = total / tier.cupos;
              const isSelected = selectedCupos === tier.cupos;
              return (
                <article
                  key={tier.cupos}
                  className={`schools-tier${isSelected ? " featured" : ""}`}
                >
                  <div className="schools-tier-top">
                    <GraduationCap size={22} aria-hidden="true" />
                    <span>
                      {isSelected ? (
                        <>
                          <Check size={13} aria-hidden="true" /> Seleccionado
                        </>
                      ) : (
                        "Plan institucional"
                      )}
                    </span>
                  </div>
                  <h3>{tier.label}</h3>
                  <div className="schools-price" aria-live="polite">
                    {formatPen(total)}
                    <small>
                      Total por {period} {period === 1 ? "mes" : "meses"}
                    </small>
                  </div>
                  <dl className="schools-tier-numbers">
                    <div>
                      <dt>Equivalente mensual</dt>
                      <dd>{formatPen(monthlyRef)}</dd>
                    </div>
                    <div>
                      <dt>Por cupo en el periodo</dt>
                      <dd>{formatPen(perStudent)}</dd>
                    </div>
                  </dl>
                  <p className="schools-tier-saving">
                    {period > 1 ? (
                      <>
                        <CheckCircle2 size={15} aria-hidden="true" /> Ahorras{" "}
                        {formatPen(tier.prices[1] * period - total)}
                      </>
                    ) : (
                      <>
                        <CalendarDays size={15} aria-hidden="true" /> Periodo de
                        un mes
                      </>
                    )}
                  </p>
                  <button
                    type="button"
                    className={isSelected ? "button" : "button secondary"}
                    onClick={() => {
                      setSelectedCupos(tier.cupos);
                      setView("request");
                    }}
                  >
                    {isSelected
                      ? "Continuar con este plan"
                      : "Elegir este plan"}{" "}
                    <ArrowRight size={16} />
                  </button>
                </article>
              );
            })}
          </div>

          <div
            className="schools-included"
            aria-label="Incluido en todos los planes"
          >
            <strong>En todos los planes</strong>
            <span>
              <Scale size={17} aria-hidden="true" /> Catálogo y comparador
            </span>
            <span>
              <Sparkles size={17} aria-hidden="true" /> Test de 24 preguntas
            </span>
            <span>
              <Video size={17} aria-hidden="true" /> Conecta por Zoom
            </span>
            <span>
              <CheckCircle2 size={17} aria-hidden="true" /> Alta y soporte
              institucional
            </span>
          </div>
          <details className="schools-table-wrap">
            <summary>
              Comparar todos los periodos{" "}
              <ChevronDown size={17} aria-hidden="true" />
            </summary>
            <div className="schools-table-scroll">
              <table className="schools-table">
                <thead>
                  <tr>
                    <th>Cupos por colegio</th>
                    <th>1 mes</th>
                    <th>3 meses (-10%)</th>
                    <th>6 meses (-15%)</th>
                    <th>12 meses (-25%)</th>
                  </tr>
                </thead>
                <tbody>
                  {TIERS.map((tier) => (
                    <tr key={tier.cupos}>
                      <td>
                        <strong>{tier.label}</strong>
                      </td>
                      <td>{formatPen(tier.prices[1])}</td>
                      <td>{formatPen(tier.prices[3])}</td>
                      <td>{formatPen(tier.prices[6])}</td>
                      <td>
                        <strong>{formatPen(tier.prices[12])}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>
      </div>

      <section
        id="solicitar-plan"
        hidden={view !== "request"}
        className="schools-form-section"
        aria-labelledby="solicitud-colegio-titulo"
      >
        <div className="schools-section-heading">
          <div>
            <h2 id="solicitud-colegio-titulo">
              <Building2
                size={22}
                style={{ verticalAlign: "middle", marginRight: 8 }}
                aria-hidden="true"
              />
              Conversemos sobre tu colegio.
            </h2>
            <p>
              Completa tus datos para solicitar la activación institucional.
            </p>
          </div>
          <button
            type="button"
            className="button secondary"
            onClick={() => setView("plans")}
          >
            <ArrowLeft size={16} aria-hidden="true" /> Cambiar plan
          </button>
        </div>
        <div
          className="schools-order-summary"
          aria-label="Resumen del plan elegido"
        >
          <span>
            <Users size={18} aria-hidden="true" />
            <strong>{activeTier.label}</strong>
          </span>
          <span>
            <CalendarDays size={18} aria-hidden="true" />
            {period} {period === 1 ? "mes" : "meses"}
          </span>
          <span>
            Total del periodo <strong>{formatPen(activeTotal)}</strong>
          </span>
          <small>
            {formatPen(activeTotal / activeTier.cupos)} por cupo en el periodo
          </small>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!busy) void handleSubmit(new FormData(event.currentTarget));
          }}
        >
          <div className="schools-form-grid">
            <label>
              Nombre de la institución educativa
              <input
                name="school_name"
                required
                maxLength={160}
                autoComplete="organization"
                placeholder="Nombre de tu colegio"
              />
            </label>
            <label>
              Distrito
              <input
                name="district"
                required
                maxLength={100}
                placeholder="Ej. Los Olivos"
              />
            </label>
            <label>
              Nombre de la persona de contacto
              <input
                name="contact_name"
                required
                maxLength={120}
                autoComplete="name"
                placeholder="Nombre y apellido"
              />
            </label>
            <label>
              Correo institucional o de contacto
              <input
                name="contact_email"
                type="email"
                maxLength={160}
                autoComplete="email"
                required
                placeholder="coordinacion@colegio.edu.pe"
              />
            </label>
            <label>
              Teléfono / WhatsApp (opcional)
              <input
                name="contact_phone"
                type="tel"
                autoComplete="tel"
                maxLength={30}
                placeholder="999 999 999"
              />
            </label>
            <label>
              Cupos requeridos
              <select
                value={selectedCupos}
                onChange={(e) =>
                  setSelectedCupos(Number(e.target.value) as Cupos)
                }
              >
                {TIERS.map((tier) => (
                  <option key={tier.cupos} value={tier.cupos}>
                    {tier.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="schools-notes">
            Comentarios o grados que participarán (opcional)
            <textarea
              name="notes"
              rows={3}
              placeholder="Ej. 4.° y 5.° de secundaria, inicio en abril."
              maxLength={1000}
            />
          </label>
          <div className="schools-submit-row">
            <p>
              <ShieldCheck size={16} aria-hidden="true" /> Enviar la solicitud
              no realiza ningún cobro.
            </p>
            <button className="button" disabled={busy}>
              {busy
                ? "Registrando solicitud…"
                : "Solicitar activación institucional"}{" "}
              <ArrowRight size={17} />
            </button>
          </div>
        </form>

        {error && <Failure message={error} />}

        {receipt && (
          <div className="schools-receipt" role="status">
            <h3>
              <CheckCircle2 size={22} aria-hidden="true" /> Solicitud
              institucional registrada
            </h3>
            <p>
              Código de seguimiento: <strong>{receipt.id}</strong>
            </p>
            <p>
              <strong>{receipt.school_name}</strong> · Hasta{" "}
              {receipt.tier_cupos} cupos · {receipt.period_months}{" "}
              {receipt.period_months === 1 ? "mes" : "meses"} · Total:{" "}
              <strong>{formatPen(receipt.total_pen)}</strong> (
              {formatPen(receipt.per_student_pen)} por estudiante).
            </p>
            <p>
              Nuestro equipo se pondrá en contacto con el correo registrado para
              coordinar el alta de los cupos y la capacitación inicial.
            </p>
          </div>
        )}
      </section>

      <div className="schools-catalog-link">
        <Link className="text-link" to="/carreras">
          <Compass size={17} aria-hidden="true" /> Explorar el catálogo de
          carreras <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

import {
  ArrowRight,
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
  featured?: boolean;
  prices: Record<Period, number>;
}[] = [
  {
    cupos: 100,
    label: "Hasta 100 cupos",
    featured: true,
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
        <p className="eyebrow">ORIENTA AS A SERVICE · PARA COLEGIOS</p>
        <h1>
          Orientación vocacional completa para tus estudiantes de secundaria.
        </h1>
        <p>
          Licencia institucional por cupos y periodo para colegios de Lima Norte
          y Lima Metropolitana. Integra catálogo verificable, test vocacional
          con inteligencia artificial y sesiones en vivo con orientadores por
          Zoom.
        </p>
      </section>

      <section
        className="schools-pillars"
        aria-label="Módulos incluidos en la suscripción escolar"
      >
        <article className="schools-pillar">
          <Scale size={26} aria-hidden="true" />
          <h2>1. Compara carreras reales</h2>
          <p>
            Más de 400 ofertas universitarias y técnicas de Lima Norte con
            duración, costos referenciales, modalidades y explicación de
            diferencias con IA.
          </p>
        </article>
        <article className="schools-pillar">
          <Sparkles size={26} aria-hidden="true" />
          <h2>2. Descubre con test de 24 preguntas</h2>
          <p>
            Cuestionario vocacional interactivo que recomienda carreras afines
            con razones claras y guarda el avance de cada estudiante en Mi ruta.
          </p>
        </article>
        <article className="schools-pillar">
          <Video size={26} aria-hidden="true" />
          <h2>3. Conecta por Zoom</h2>
          <p>
            Reserva de sesiones 1 a 1 con orientadores por carrera, enlace de
            Zoom generado al confirmar y guía de preguntas preparada con IA.
          </p>
        </article>
      </section>

      <section aria-labelledby="planes-colegios">
        <h2 id="planes-colegios">
          Tarifas institucionales por periodo y cupos
        </h2>
        <p>
          Cada importe corresponde al total del periodo indicado. Descuentos de{" "}
          <strong>10%</strong> a 3 meses, <strong>15%</strong> a 6 meses y{" "}
          <strong>25%</strong> a 12 meses frente a la tarifa mensual.
        </p>

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
                className={`schools-tier${tier.featured || isSelected ? " featured" : ""}`}
              >
                {tier.featured && (
                  <span className="schools-tier-badge">Escenario base</span>
                )}
                <h3>{tier.label}</h3>
                <div className="schools-price">
                  {formatPen(total)}
                  <small>
                    Total por {period} {period === 1 ? "mes" : "meses"} ·{" "}
                    {formatPen(monthlyRef)}/mes referencial
                  </small>
                </div>
                <ul className="schools-tier-meta">
                  <li>
                    <Users size={16} aria-hidden="true" />{" "}
                    {formatPen(perStudent)} por estudiante en el periodo
                  </li>
                  <li>
                    <CheckCircle2 size={16} aria-hidden="true" /> Acceso a
                    Compara, Descubre y Conecta (Zoom)
                  </li>
                  <li>
                    <CheckCircle2 size={16} aria-hidden="true" /> Acompañamiento
                    de alta y soporte institucional
                  </li>
                </ul>
                <button
                  type="button"
                  className={isSelected ? "button" : "button secondary"}
                  onClick={() => {
                    setSelectedCupos(tier.cupos);
                    document
                      .getElementById("solicitar-plan")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {isSelected ? "Plan seleccionado" : "Elegir este plan"}{" "}
                  <ArrowRight size={16} />
                </button>
              </article>
            );
          })}
        </div>

        <div className="schools-table-wrap">
          <h3>Cuadro comparativo completo (Soles)</h3>
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
      </section>

      <section
        id="solicitar-plan"
        className="schools-form-section"
        aria-labelledby="solicitud-colegio-titulo"
      >
        <h2 id="solicitud-colegio-titulo">
          <Building2
            size={22}
            style={{ verticalAlign: "middle", marginRight: 8 }}
            aria-hidden="true"
          />
          Solicita la activación para tu colegio
        </h2>
        <p>
          Plan seleccionado: <strong>{activeTier.label}</strong> por{" "}
          <strong>
            {period} {period === 1 ? "mes" : "meses"}
          </strong>{" "}
          — Total: <strong>{formatPen(activeTotal)}</strong> (
          {formatPen(activeTotal / activeTier.cupos)} por estudiante).
        </p>

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
                placeholder="Ej. I.E.P. Santa Rosa de Lima Norte"
              />
            </label>
            <label>
              Distrito
              <input
                name="district"
                required
                placeholder="Ej. Los Olivos / Independencia / Comas"
              />
            </label>
            <label>
              Nombre de la persona de contacto
              <input
                name="contact_name"
                required
                placeholder="Ej. Director(a) o Coordinador(a) TOE"
              />
            </label>
            <label>
              Correo institucional o de contacto
              <input
                name="contact_email"
                type="email"
                required
                placeholder="coordinacion@colegio.edu.pe"
              />
            </label>
            <label>
              Teléfono / WhatsApp (opcional)
              <input name="contact_phone" placeholder="999 999 999" />
            </label>
            <label>
              Cupos requeridos
              <select
                value={selectedCupos}
                onChange={(e) => setSelectedCupos(Number(e.target.value) as Cupos)}
              >
                {TIERS.map((tier) => (
                  <option key={tier.cupos} value={tier.cupos}>
                    {tier.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 600 }}>
            Comentarios o grados que participarán (opcional)
            <textarea
              name="notes"
              rows={3}
              placeholder="Ej. 4.° y 5.° de secundaria, inicio en abril."
              style={{
                padding: "0.7rem 0.85rem",
                border: "1.5px solid var(--line, #cbd5e1)",
                borderRadius: 10,
                font: "inherit",
                marginBottom: "1rem",
              }}
            />
          </label>
          <button className="button" disabled={busy}>
            {busy ? "Registrando solicitud…" : "Solicitar activación institucional"}{" "}
            <ArrowRight size={17} />
          </button>
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

      <div style={{ marginTop: "2rem" }}>
        <Link className="text-link" to="/carreras">
          <Compass size={17} aria-hidden="true" /> Explorar el catálogo de
          carreras <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Clock,
  ExternalLink,
  Info,
  Laptop,
  Landmark,
  Lightbulb,
  MapPin,
  Target,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Comparison } from "../../pages/Compare";
import { officialUrl } from "../../pages/Detail";
import { useApi } from "../../shared/api/client";
import { InstitutionLogo } from "../../shared/components/InstitutionLogo";
import type { Offer, OfferDetail } from "../../shared/types/catalog";
import { programSources, utpCostSource } from "./programSources";

const criteria = [
  {
    label: "Duración",
    title: "Duración y recorrido",
    description: "Selecciona un año para explorar el plan publicado.",
    icon: Clock,
    note: "Cursos seleccionados de las mallas oficiales. Confirma el plan que aplica a tu convocatoria.",
  },
  {
    label: "Enfoque",
    title: "Enfoque de la carrera",
    description: "Compara los temas y el tipo de retos de cada opción.",
    icon: Target,
    note: "Síntesis editorial. Los retos son ejemplos ilustrativos.",
  },
  {
    label: "Costos",
    title: "Costos de estudio",
    description: "Conoce los principales conceptos de pago de cada carrera.",
    icon: Banknote,
    note: "Tarifas de referencia. Confirma el periodo, la categoría y la unidad de cobro.",
  },
  {
    label: "Ubicación",
    title: "Ubicación y acceso",
    description: "Conoce la sede seleccionada y su entorno.",
    icon: MapPin,
    note: "Los mapas usan la dirección documentada de cada sede.",
  },
  {
    label: "Modalidad",
    title: "Modalidad y experiencia",
    description: "Compara cómo se desarrollan las clases en cada opción.",
    icon: Laptop,
    note: "Confirma la modalidad y sus condiciones para tu convocatoria.",
  },
];

const years = ["1.er año", "2.º año", "3.er año", "4.º año", "5.º año"];

function SourceLink({
  url,
  children,
}: {
  url?: string | null;
  children: string;
}) {
  const href = officialUrl(url ?? null);
  if (!href) return null;
  return (
    <a
      className="text-link criterion-source"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children} <ExternalLink size={14} aria-hidden="true" />
    </a>
  );
}

function OfferLogo({ offer }: { offer: Offer }) {
  return (
    <span className="criterion-logo">
      <InstitutionLogo id={offer.institucion_id} name={offer.institucion} />
    </span>
  );
}

function Duration({ offer, year }: { offer: Offer; year: number }) {
  const plan = programSources[offer.oferta_id];
  const courses = plan?.years[year];
  return (
    <article className="duration-criterion" aria-label={offer.institucion}>
      <div className="duration-value">
        <strong>
          {offer.duracion_valor != null
            ? `${offer.duracion_valor} ${offer.duracion_unidad}`
            : plan
              ? `${plan.years.length * 2} ciclos`
              : "Duración por confirmar"}
        </strong>
        <p>{plan?.planLabel ?? "Duración publicada"}</p>
      </div>
      <div className="duration-course-card">
        <div className="duration-course-content">
          <Laptop size={31} aria-hidden="true" />
          <div>
            <h3>
              {courses
                ? `${years[year]} · Ciclos ${year * 2 + 1} y ${year * 2 + 2}`
                : "Plan de estudios"}
            </h3>
            {courses ? (
              <ul>
                {courses.map((course) => (
                  <li key={course}>{course}</li>
                ))}
              </ul>
            ) : (
              <p>
                Consulta el detalle de cursos en la ficha oficial del programa.
              </p>
            )}
          </div>
        </div>
        <SourceLink url={plan?.curriculum ?? offer.ficha_url}>
          {plan ? "Ver malla curricular" : "Ver ficha oficial"}
        </SourceLink>
      </div>
    </article>
  );
}

function Focus({ offer }: { offer: Offer }) {
  const plan = programSources[offer.oferta_id];
  return (
    <article className="focus-criterion" aria-label={offer.institucion}>
      <p className="criterion-kicker">Qué aprenderías</p>
      <div className="focus-title">
        <Lightbulb size={34} aria-hidden="true" />
        <div>
          <h3>{plan?.focus ?? offer.area}</h3>
          <p>
            {offer.enfoque_editorial ||
              "Consulta el enfoque con la institución."}
          </p>
        </div>
      </div>
      {plan && (
        <ul className="focus-topics">
          {plan.topics.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ul>
      )}
      <div className="focus-example">
        <h4>{plan ? "Un reto que podrías abordar" : "Ámbitos de estudio"}</h4>
        <p>
          {plan?.example ??
            (offer.ambitos_editoriales || "Por confirmar con la institución.")}
        </p>
      </div>
      <SourceLink url={plan?.curriculum ?? offer.ficha_url}>
        {plan ? "Ver malla curricular" : "Ver ficha oficial"}
      </SourceLink>
    </article>
  );
}

const money = new Intl.NumberFormat("en-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function CostAmounts({ fee, tuition }: { fee: number; tuition: number }) {
  return (
    <dl className="cost-values">
      <div>
        <dt>Matrícula</dt>
        <dd>S/ {money.format(fee)}</dd>
      </div>
      <div>
        <dt>Enseñanza</dt>
        <dd>S/ {money.format(tuition)}</dd>
      </div>
    </dl>
  );
}

function PublishedCosts({ offer }: { offer: Offer }) {
  const detail = useApi<OfferDetail>(`/api/ofertas/${offer.oferta_id}`);
  const [category, setCategory] = useState("");
  const tariffs = detail.data?.tarifas ?? [];
  const tariff =
    tariffs.find((row) => row.categoria === category) ?? tariffs[0];
  const source = detail.data?.fuentes.find(
    (row) => row.fuente_id === tariff?.fuente_id,
  );
  if (!tariff)
    return (
      <>
        <h3>Costos publicados</h3>
        <p>
          {offer.consulta_costos ?? "Consulta los importes con la institución."}
        </p>
        {detail.error && (
          <button type="button" className="text-link" onClick={detail.retry}>
            Reintentar consulta del tarifario
          </button>
        )}
        <SourceLink url={offer.ficha_url ?? offer.fuente_oferta_url}>
          Ver ficha oficial
        </SourceLink>
      </>
    );
  return (
    <>
      <CostAmounts
        fee={tariff.matricula_pen}
        tuition={tariff.tarifa_por_credito_pen}
      />
      <p>Tarifa por crédito</p>
      <ul>
        <li>{tariff.creditos_matriculados} créditos de referencia</li>
        <li>Semestre {tariff.periodo}</li>
      </ul>
      <label className="cost-category">
        Categoría de referencia
        <select
          value={tariff.categoria}
          onChange={(event) => setCategory(event.target.value)}
        >
          {tariffs.map((row) => (
            <option key={row.categoria} value={row.categoria}>
              {row.categoria}
            </option>
          ))}
        </select>
      </label>
      <SourceLink url={source?.url}>Ver tarifario publicado</SourceLink>
    </>
  );
}

function Cost({ offer }: { offer: Offer }) {
  return (
    <article className="cost-criterion" aria-label={offer.institucion}>
      <OfferLogo offer={offer} />
      <div>
        {offer.oferta_id === 9 ? (
          <>
            <CostAmounts fee={398} tuition={815} />
            <p>Por cuota · 5 cuotas</p>
            <ul>
              <li>16–22 horas lectivas · Ingreso desde agosto de 2018</li>
              <li>Lima Norte · Marzo 2026</li>
            </ul>
            <SourceLink url={utpCostSource}>Ver tarifario UTP</SourceLink>
          </>
        ) : (
          <PublishedCosts offer={offer} />
        )}
      </div>
    </article>
  );
}

function Location({ offer, index }: { offer: Offer; index: number }) {
  const address = offer.direccion?.trim();
  const query = [
    address || `${offer.institucion} ${offer.sede}`,
    offer.distrito,
    "Lima, Perú",
  ].join(", ");
  const params = new URLSearchParams({ q: query, output: "embed" });
  const external = new URLSearchParams({ api: "1", query });
  const letter = index === 0 ? "A" : "B";
  return (
    <article className="criterion-location" aria-label={offer.institucion}>
      <p>{offer.sede} · Sede seleccionada</p>
      <h3>
        <MapPin size={21} aria-hidden="true" /> {offer.distrito}
      </h3>
      <div className="criterion-map">
        {address ? (
          <>
            <span className="map-letter illustration" aria-hidden="true">
              {letter}
            </span>
            <iframe
              className="illustration"
              title={`Mapa de ${offer.institucion} · ${offer.sede}`}
              src={`https://maps.google.com/maps?${params}`}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </>
        ) : (
          <p>Dirección pendiente de confirmación.</p>
        )}
      </div>
      <div className="criterion-location-footer">
        <div>
          <strong>
            {letter} · {offer.sede}
          </strong>
          {address && <p>{address}</p>}
        </div>
        <SourceLink url={`https://www.google.com/maps/search/?${external}`}>
          {address ? "Abrir ubicación" : "Buscar la sede en el mapa"}
        </SourceLink>
      </div>
    </article>
  );
}

function Modality({ offer }: { offer: Offer }) {
  const name = offer.modalidad;
  const known = /^(Presencial|Semipresencial|Virtual|A distancia)$/i.test(name);
  const onsite = /^presencial$/i.test(name);
  const mixed = /^semipresencial$/i.test(name);
  const Icon = onsite ? Landmark : Laptop;
  const topics = onsite
    ? ["Sesiones en el campus", "Traslado a la sede", "Horarios de clases"]
    : mixed
      ? [
          "Sesiones en el campus",
          "Actividades en línea",
          "Organización del tiempo",
        ]
      : [
          "Actividades en línea",
          "Requisitos de conexión",
          "Horarios y evaluaciones",
        ];
  return (
    <article className="modality-criterion" aria-label={offer.institucion}>
      <div className="modality-heading">
        <Icon size={33} aria-hidden="true" />
        <div>
          <p className="criterion-kicker">Modalidad de la oferta</p>
          <h3>{known ? name : "Por confirmar"}</h3>
          <p>
            {known
              ? onsite
                ? "Clases y actividades en el campus."
                : mixed
                  ? "Combina actividades presenciales y en línea."
                  : "Clases y actividades a distancia."
              : name}
          </p>
        </div>
      </div>
      <h4>Qué revisar</h4>
      <ul>
        {(known
          ? topics
          : ["Formato de las clases", "Horarios", "Requisitos de la sede"]
        ).map((topic) => (
          <li key={topic}>{topic}</li>
        ))}
      </ul>
      <SourceLink url={offer.ficha_url}>Ver modalidad del programa</SourceLink>
    </article>
  );
}

export function CriteriaGuide({
  comparison,
  ids,
  showFull,
}: {
  comparison: Comparison;
  ids: string;
  showFull: () => void;
}) {
  const [step, setStep] = useState(0);
  const [year, setYear] = useState(0);
  const current = criteria[step];
  const Icon = current.icon;
  const previous = criteria[step - 1]?.label;
  const next = criteria[step + 1]?.label;
  const showYears =
    step === 0 &&
    comparison.opciones.some((offer) => programSources[offer.oferta_id]);
  const analysis = `/analisis?opciones=${ids}`;
  return (
    <>
      <nav className="criteria-nav" aria-label="Criterios de comparación">
        {criteria.map(({ icon: ItemIcon, label }, index) => (
          <button
            type="button"
            key={label}
            aria-pressed={step === index}
            onClick={() => setStep(index)}
          >
            <ItemIcon size={20} aria-hidden="true" /> {label}
          </button>
        ))}
      </nav>
      <section className="criteria-guide" aria-label="Criterios de comparación">
        <header className="criteria-heading">
          <button
            type="button"
            className="criterion-step"
            disabled={!previous}
            onClick={() => setStep(step - 1)}
          >
            <ArrowLeft size={21} aria-hidden="true" />
            <span>
              {previous ? "Anterior" : "Inicio"}
              {previous && <strong>{previous}</strong>}
            </span>
          </button>
          <div className="criteria-title" aria-live="polite">
            <Icon size={27} aria-hidden="true" />
            <div>
              <h2>{current.title}</h2>
              <p>
                {step === 0 && !showYears
                  ? "Compara la duración publicada de cada programa."
                  : current.description}
              </p>
            </div>
            <span>
              {step + 1} de {criteria.length}
            </span>
          </div>
          <button
            type="button"
            className="criterion-step next"
            disabled={!next}
            onClick={() => setStep(step + 1)}
          >
            <span>
              Siguiente<strong>{next ?? "Final"}</strong>
            </span>
            <ArrowRight size={21} aria-hidden="true" />
          </button>
        </header>
        {showYears && (
          <div
            className="criterion-years"
            role="group"
            aria-label="Año del plan de estudios"
          >
            {years.map((label, index) => (
              <button
                key={label}
                type="button"
                aria-pressed={year === index}
                onClick={() => setYear(index)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="criteria-offers" data-criterion={step}>
          {comparison.opciones.map((offer, index) => {
            switch (step) {
              case 0:
                return (
                  <Duration key={offer.oferta_id} offer={offer} year={year} />
                );
              case 1:
                return <Focus key={offer.oferta_id} offer={offer} />;
              case 2:
                return <Cost key={offer.oferta_id} offer={offer} />;
              case 3:
                return (
                  <Location key={offer.oferta_id} offer={offer} index={index} />
                );
              default:
                return <Modality key={offer.oferta_id} offer={offer} />;
            }
          })}
        </div>
        <p className="criteria-note">
          <Info size={16} aria-hidden="true" />{" "}
          {step === 0 && comparison.diferencia_duracion
            ? `${comparison.diferencia_duracion} `
            : ""}
          {step === 0 && !showYears
            ? "Consulta el recorrido en las fichas oficiales."
            : current.note}
        </p>
        <div className="criteria-actions">
          <button
            type="button"
            className="button secondary"
            disabled={!previous}
            onClick={() => setStep(step - 1)}
          >
            <ArrowLeft size={17} aria-hidden="true" />{" "}
            {previous ? `Anterior: ${previous}` : "Anterior"}
          </button>
          <div className="criteria-links">
            <a
              className="text-link"
              href="#comparacion-completa"
              onClick={showFull}
            >
              Ver comparación completa
            </a>
            {next ? (
              <Link className="text-link" to={analysis}>
                Explicar con IA
              </Link>
            ) : (
              <button
                type="button"
                className="text-link"
                onClick={() => setStep(0)}
              >
                Volver a Duración
              </button>
            )}
          </div>
          {next ? (
            <button
              type="button"
              className="button"
              onClick={() => setStep(step + 1)}
            >
              Siguiente: {next} <ArrowRight size={17} aria-hidden="true" />
            </button>
          ) : (
            <Link className="button" to={analysis}>
              Explicar con IA <ArrowRight size={17} aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>
    </>
  );
}

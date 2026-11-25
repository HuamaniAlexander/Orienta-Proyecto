import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FileCheck2,
  Info,
  Laptop,
  Landmark,
  Lightbulb,
  MapPin,
  Target,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
    note: "Montos publicados por las instituciones. Revisa el periodo y la unidad de cobro.",
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
  {
    label: "Ámbitos",
    title: "Ámbitos de actividad",
    description: "Explora dónde se aplica cada carrera y su clasificación.",
    icon: BookOpen,
    note: "Síntesis editorial basada en el área y perfil profesional.",
  },
  {
    label: "Institución",
    title: "Institución y nivel",
    description: "Compara el tipo de institución, gestión y grado formativo.",
    icon: Landmark,
    note: "Datos institucionales y de licenciamiento registrados en el catálogo.",
  },
  {
    label: "Fuentes",
    title: "Fuentes y verificación",
    description: "Revisa el respaldo oficial, periodo y fecha de consulta.",
    icon: FileCheck2,
    note: "Cada dato conserva su fuente oficial y fecha de verificación.",
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
  const dbYears = offer.plan_estudio?.plan_anual;
  const courses = plan?.years[year] ?? dbYears?.[year];
  const hasPlan = Boolean(plan || dbYears?.length);
  return (
    <article className="duration-criterion" aria-label={offer.institucion}>
      <div className="duration-value">
        <strong>
          {offer.duracion_valor != null
            ? `${offer.duracion_valor} ${offer.duracion_unidad}`
            : hasPlan
              ? `${(plan?.years.length ?? dbYears?.length ?? 5) * 2} ciclos`
              : "Plan de estudios"}
        </strong>
        <p>
          {plan?.planLabel ??
            (offer.duracion_valor != null ? "Duración publicada" : offer.nivel)}
        </p>
      </div>
      <div className="duration-course-card">
        <div className="duration-course-content">
          <Laptop size={31} aria-hidden="true" />
          <div>
            <h3>
              {courses
                ? `${years[year]} · Ciclos ${year * 2 + 1} y ${year * 2 + 2}`
                : dbYears?.length
                  ? `Plan de ${dbYears.length} años`
                  : "Plan de estudios"}
            </h3>
            {courses ? (
              <ul>
                {courses.map((course) => (
                  <li key={course}>{course}</li>
                ))}
              </ul>
            ) : (
              <p>{offer.enfoque_editorial || offer.carrera_oficial}</p>
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
  const dbTopics = offer.plan_estudio?.temas;
  const dbChallenge = offer.plan_estudio?.ejemplo_reto;
  const topics = (plan?.topics ?? dbTopics ?? [offer.area, offer.nivel]).filter(
    Boolean,
  );
  const challenge = plan?.example ?? dbChallenge;
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
      <ul className="focus-topics">
        {topics.map((topic) => (
          <li key={topic}>{topic}</li>
        ))}
      </ul>
      <div className="focus-example">
        <h4>
          {challenge ? "Un reto que podrías abordar" : "Ámbitos de estudio"}
        </h4>
        <p>
          {challenge ??
            (offer.ambitos_editoriales || offer.enfoque_editorial)}
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
        <h3>Matrícula y enseñanza</h3>
        <p>
          {detail.loading
            ? "Cargando tarifario…"
            : "Importes sin publicación verificada."}
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
        <li>Tarifario para {tariff.creditos_matriculados} créditos</li>
        <li>Semestre {tariff.periodo}</li>
      </ul>
      <label className="cost-category">
        Categoría del tarifario
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

const tariffSources: Partial<Record<number, string>> = {
  1: utpCostSource,
  2: "https://www.upn.edu.pe/transparencia/pensiones-tarifas",
  4: "https://www.gob.pe/institucion/pronabec/normas-legales/7806685-698-2026-minedu-vmgi-pronabec-oaf",
  21: "https://drive.google.com/file/d/1CEZXOFj77P8wm3bYnubLtLJTH5unBEIP/view",
  22: "https://www.cientifica.edu.pe/wp-content/uploads/2026/04/Categorias-2026-01-fv.pdf",
};

function Cost({ offer }: { offer: Offer }) {
  const lines = offer.consulta_costos?.split("\n") ?? [];
  const enrollment =
    /^(Matrícula(?: regular| de ingresante| semestral referencial| referencial)?|Prematrícula): (S\/ .+)$/.exec(
      lines[0] ?? "",
    );
  const tuition =
    /^(Enseñanza(?: referencial)?): (S\/ .+|Importe base no publicado)$/.exec(
      lines[1] ?? "",
    );
  const publicFree = /^Enseñanza gratuita/.exec(lines[0] ?? "");
  const sourceLine = lines.find((line) => /^Fuente:\s*https?:\/\//i.test(line));
  const inlineSourceUrl = sourceLine?.replace(/^Fuente:\s*/i, "").trim();
  const bullets = lines
    .slice(2)
    .filter((line) => !/^Fuente:\s*https?:\/\//i.test(line));
  const costLink =
    inlineSourceUrl ?? tariffSources[offer.institucion_id] ?? offer.ficha_url;

  return (
    <article className="cost-criterion" aria-label={offer.institucion}>
      <OfferLogo offer={offer} />
      <div>
        {enrollment && tuition ? (
          <>
            <dl className="cost-values">
              <div>
                <dt>{enrollment[1]}</dt>
                <dd>{enrollment[2]}</dd>
              </div>
              <div>
                <dt>{tuition[1]}</dt>
                <dd
                  className={
                    tuition[2].startsWith("S/")
                      ? undefined
                      : "cost-publication-status"
                  }
                >
                  {tuition[2]}
                </dd>
              </div>
            </dl>
            <ul>
              {bullets.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <SourceLink url={costLink}>
              {offer.institucion_id === 4
                ? "Ver resolución de Pronabec"
                : "Ver tarifario publicado"}
            </SourceLink>
          </>
        ) : publicFree ? (
          <>
            <dl className="cost-values">
              <div>
                <dt>Enseñanza</dt>
                <dd>Gratuita (pública)</dd>
              </div>
              {lines[1] && (
                <div>
                  <dt>Matrícula</dt>
                  <dd>{lines[1].replace(/^Matrícula[^:]*:\s*/i, "")}</dd>
                </div>
              )}
            </dl>
            <ul>
              {bullets.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <SourceLink url={costLink}>Ver ficha oficial</SourceLink>
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
  const flexible = /^presencial y semipresencial$/i.test(name);
  const known =
    flexible || /^(Presencial|Semipresencial|Virtual|A distancia)$/i.test(name);
  const onsite = /^presencial$/i.test(name);
  const mixed = flexible || /^semipresencial$/i.test(name);
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
          <h3>{known ? name : "Modalidad sin publicación verificada"}</h3>
          <p>
            {known
              ? flexible
                ? "La sede ofrece un plan presencial y otro semipresencial."
                : onsite
                  ? "Clases y actividades en el campus."
                  : mixed
                    ? "Combina actividades presenciales y en línea."
                    : "Clases y actividades a distancia."
              : null}
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

function Scopes({ offer }: { offer: Offer }) {
  return (
    <article className="focus-criterion" aria-label={offer.institucion}>
      <p className="criterion-kicker">Campo y aplicación</p>
      <div className="focus-title">
        <BookOpen size={30} aria-hidden="true" />
        <div>
          <h3>{offer.area}</h3>
          <p>{offer.ambitos_editoriales || offer.enfoque_editorial}</p>
        </div>
      </div>
      <div className="focus-example">
        <h4>Criterio de clasificación</h4>
        <p>{offer.criterio_clasificacion || offer.nivel}</p>
      </div>
      <SourceLink url={offer.ficha_url}>Ver ficha oficial</SourceLink>
    </article>
  );
}

function InstitutionDetails({ offer }: { offer: Offer }) {
  return (
    <article className="focus-criterion" aria-label={offer.institucion}>
      <p className="criterion-kicker">{offer.institucion}</p>
      <div className="focus-title">
        <Landmark size={30} aria-hidden="true" />
        <div>
          <h3>{offer.tipo}</h3>
          <p>
            Gestión {offer.gestion.toLowerCase()} · {offer.nivel}
          </p>
        </div>
      </div>
      <ul className="focus-topics">
        <li>{offer.gestion}</li>
        <li>{offer.nivel}</li>
        <li>Sede {offer.sede}</li>
      </ul>
      <div className="focus-example">
        <h4>Carrera oficial</h4>
        <p>{offer.carrera_oficial}</p>
      </div>
      <SourceLink url={offer.ficha_url}>Ver ficha oficial</SourceLink>
    </article>
  );
}

function SourcesCard({ offer }: { offer: Offer }) {
  return (
    <article className="focus-criterion" aria-label={offer.institucion}>
      <p className="criterion-kicker">Trazabilidad</p>
      <div className="focus-title">
        <FileCheck2 size={30} aria-hidden="true" />
        <div>
          <h3>{offer.institucion}</h3>
          <p>Consulta verificada: {offer.fecha_consulta}</p>
        </div>
      </div>
      <ul className="focus-topics">
        {offer.periodo_fuente && <li>Periodo: {offer.periodo_fuente}</li>}
        <li>Sede: {offer.sede}</li>
      </ul>
      {offer.evidencia_sede && (
        <div className="focus-example">
          <h4>Evidencia de sede</h4>
          <p>{offer.evidencia_sede}</p>
        </div>
      )}
      <SourceLink url={offer.ficha_url ?? offer.fuente_oferta_url}>
        Abrir fuente oficial
      </SourceLink>
    </article>
  );
}

export function CriteriaGuide({
  comparison,
  ids,
}: {
  comparison: Comparison;
  ids: string;
}) {
  const [params] = useSearchParams();
  const activeByName = [
    "duracion",
    "enfoque",
    "costos",
    "ubicacion",
    "modalidad",
    "ambitos",
    "institucion",
    "fuentes",
  ];
  const [step, setStep] = useState(() =>
    Math.max(0, activeByName.indexOf(params.get("criterio") ?? "")),
  );
  const [year, setYear] = useState(0);
  const navRef = useRef<HTMLElement>(null);
  const current = criteria[step];
  const Icon = current.icon;
  const previous = criteria[step - 1]?.label;
  const next = criteria[step + 1]?.label;
  const showYears =
    step === 0 &&
    comparison.opciones.some(
      (offer) =>
        programSources[offer.oferta_id] ||
        Boolean(offer.plan_estudio?.plan_anual?.length),
    );
  const analysis = `/analisis?opciones=${ids}`;

  function selectStep(nextStep: number) {
    setStep(nextStep);
    const button = navRef.current?.children[nextStep] as HTMLElement | undefined;
    button?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function scrollNav(direction: -1 | 1) {
    navRef.current?.scrollBy({ left: direction * 260, behavior: "smooth" });
  }

  return (
    <>
      <div className="criteria-nav-bar">
        <button
          type="button"
          className="criteria-nav-arrow"
          aria-label="Categorías anteriores"
          onClick={() => scrollNav(-1)}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <nav
          ref={navRef}
          className="criteria-nav"
          aria-label="Criterios de comparación"
        >
          {criteria.map(({ icon: ItemIcon, label }, index) => (
            <button
              type="button"
              key={label}
              aria-pressed={step === index}
              onClick={() => selectStep(index)}
            >
              <ItemIcon size={20} aria-hidden="true" /> {label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className="criteria-nav-arrow"
          aria-label="Más categorías"
          onClick={() => scrollNav(1)}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
      <section className="criteria-guide" aria-label="Criterios de comparación">
        <header className="criteria-heading">
          <button
            type="button"
            className="criterion-step"
            disabled={!previous}
            onClick={() => selectStep(step - 1)}
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
            onClick={() => selectStep(step + 1)}
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
              case 4:
                return <Modality key={offer.oferta_id} offer={offer} />;
              case 5:
                return <Scopes key={offer.oferta_id} offer={offer} />;
              case 6:
                return (
                  <InstitutionDetails key={offer.oferta_id} offer={offer} />
                );
              default:
                return <SourcesCard key={offer.oferta_id} offer={offer} />;
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
            onClick={() => selectStep(step - 1)}
          >
            <ArrowLeft size={17} aria-hidden="true" />{" "}
            {previous ? `Anterior: ${previous}` : "Anterior"}
          </button>
          <div className="criteria-links">
            {next ? (
              <Link className="text-link" to={analysis}>
                Explicar con IA
              </Link>
            ) : (
              <button
                type="button"
                className="text-link"
                onClick={() => selectStep(0)}
              >
                Volver a Duración
              </button>
            )}
          </div>
          {next ? (
            <button
              type="button"
              className="button"
              onClick={() => selectStep(step + 1)}
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

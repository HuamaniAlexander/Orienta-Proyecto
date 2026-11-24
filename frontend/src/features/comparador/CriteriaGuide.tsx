import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Coins,
  ExternalLink,
  Laptop,
  Lightbulb,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Comparison } from "../../pages/Compare";
import { officialUrl } from "../../pages/Detail";
import { Institution } from "../../shared/components/OfferCard";
import type { Offer } from "../../shared/types/catalog";

const criteria = [
  {
    label: "Duración",
    title: "Duración y recorrido",
    description: "Compara la duración publicada de cada carrera.",
    icon: Clock,
    keys: ["duracion"],
  },
  {
    label: "Enfoque",
    title: "Enfoque de la carrera",
    description: "Revisa los temas y ámbitos de cada opción.",
    icon: Lightbulb,
    keys: ["enfoque_editorial", "ambitos_editoriales"],
  },
  {
    label: "Costos",
    title: "Costos de estudio",
    description: "Revisa los importes y condiciones publicados.",
    icon: Coins,
    keys: ["costos"],
  },
  {
    label: "Ubicación",
    title: "Ubicación y acceso",
    description: "Consulta las direcciones documentadas de las sedes.",
    icon: MapPin,
    keys: [],
  },
  {
    label: "Modalidad",
    title: "Modalidad de estudio",
    description: "Compara cómo se ofrecen las clases en cada opción.",
    icon: Laptop,
    keys: ["modalidad"],
  },
];

function Location({ offer }: { offer: Offer }) {
  const address = offer.direccion?.trim();
  const query = [
    address || `${offer.institucion} ${offer.sede}`,
    offer.distrito,
    "Lima, Perú",
  ].join(", ");
  const params = new URLSearchParams({ q: query, output: "embed" });
  const external = new URLSearchParams({ api: "1", query });
  return (
    <div className="criterion-location">
      <strong>{offer.sede}</strong>
      <p>
        {address || "Dirección pendiente de confirmación."} · {offer.distrito}
      </p>
      {address && (
        <iframe
          className="illustration"
          title={`Mapa de ${offer.institucion} · ${offer.sede}`}
          src={`https://maps.google.com/maps?${params}`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )}
      <a
        className="text-link"
        href={`https://www.google.com/maps/search/?${external}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {address ? "Abrir ubicación" : "Buscar la sede en el mapa"}{" "}
        <ExternalLink size={15} aria-hidden="true" />
      </a>
    </div>
  );
}

export function CriteriaGuide({
  comparison,
  ids,
}: {
  comparison: Comparison;
  ids: string;
}) {
  const [step, setStep] = useState(0);
  const current = criteria[step];
  const Icon = current.icon;
  const rows = current.keys.flatMap((key) =>
    comparison.criterios.filter((row) => row.key === key),
  );
  const explanation = `/analisis?opciones=${ids}`;
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
        <div className="criteria-heading" aria-live="polite">
          <Icon size={26} aria-hidden="true" />
          <div>
            <h2>{current.title}</h2>
            <p>{current.description}</p>
          </div>
          <span>
            {step + 1} de {criteria.length}
          </span>
        </div>
        <div className="criteria-offers">
          {comparison.opciones.map((offer, index) => {
            const source = officialUrl(
              (step === 2 ? offer.fuente_oferta_url : offer.ficha_url) ??
                offer.ficha_url,
            );
            return (
              <article key={offer.oferta_id} className="criterion-offer">
                <Institution offer={offer} />
                {step === 3 ? (
                  <Location offer={offer} />
                ) : (
                  <>
                    <dl>
                      {rows.map((row) => (
                        <div key={row.key}>
                          <dt>{row.title}</dt>
                          <dd>
                            {(index === 0 ? row.a : row.b) ??
                              "Consulta este dato con la institución"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {source && (
                      <a
                        className="text-link"
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {step === 2
                          ? "Ver fuente publicada"
                          : "Ver ficha oficial"}{" "}
                        <ExternalLink size={15} aria-hidden="true" />
                      </a>
                    )}
                  </>
                )}
              </article>
            );
          })}
        </div>
        {step === 0 && comparison.diferencia_duracion && (
          <p className="criteria-note">{comparison.diferencia_duracion}</p>
        )}
        {step === 1 && (
          <p className="criteria-note">
            Síntesis editorial de ORIENTA. Consulta la ficha oficial para
            revisar el plan de estudios.
          </p>
        )}
        {step === 2 && (
          <p className="criteria-note">
            Confirma el periodo y la unidad de cobro antes de comparar importes.
          </p>
        )}
        <div className="criteria-actions">
          <button
            type="button"
            className="button secondary"
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
          >
            <ArrowLeft size={17} aria-hidden="true" />{" "}
            {step > 0 ? `Anterior: ${criteria[step - 1].label}` : "Anterior"}
          </button>
          <Link
            className={step === criteria.length - 1 ? "button" : "text-link"}
            to={explanation}
          >
            <Sparkles size={17} aria-hidden="true" /> Explicar con IA
          </Link>
          {step < criteria.length - 1 && (
            <button
              type="button"
              className="button"
              onClick={() => setStep(step + 1)}
            >
              Siguiente: {criteria[step + 1].label}{" "}
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          )}
        </div>
      </section>
    </>
  );
}

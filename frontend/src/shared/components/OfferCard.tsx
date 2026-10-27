import { ArrowRight, BookOpen, MapPin, Monitor } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { duration, type Offer } from "../types/catalog";

const AREA_IMAGES = [
  "tecnologia",
  "ingenieria",
  "negocios",
  "salud",
  "derecho",
  "educacion",
  "creatividad",
  "turismo",
  "ambiente",
  "humanidades",
];
export function careerImage(offer: Offer) {
  const name = offer.carrera_oficial
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  if (/contab|tribut|auditor/.test(name)) return "/images/contabilidad.webp";
  if (
    offer.area_id === 1 &&
    !/software|programacion|desarrollo/.test(name) &&
    /sistemas|redes|ciberseguridad/.test(name)
  )
    return "/images/redes.webp";
  return `/images/${AREA_IMAGES[offer.area_id - 1] ?? "estudiantes"}.webp`;
}

export function Institution({ offer }: { offer: Offer }) {
  const [failed, setFailed] = useState(false);
  const initials = offer.institucion
    .replace(/\([^)]*\)/g, "")
    .split(/\s+/)
    .filter((w) => !["de", "del", "la", "el", "y"].includes(w.toLowerCase()))
    .map((w) => w[0])
    .slice(0, 4)
    .join("");
  return (
    <div className="institution">
      {failed ? (
        <span className="institution-initials" aria-hidden="true">
          {initials}
        </span>
      ) : (
        <img
          width="32"
          height="32"
          src={`/images/institucion-${offer.institucion_id}.webp${[4, 7].includes(offer.institucion_id) ? "?v=20261026" : ""}`}
          alt=""
          onError={() => setFailed(true)}
        />
      )}
      <span>{offer.institucion}</span>
    </div>
  );
}

export function OfferCard({
  offer,
  action,
}: {
  offer: Offer;
  action?: React.ReactNode;
}) {
  const location = useLocation();
  return (
    <article className="offer-card" data-testid="offer-card">
      <div className="offer-banner illustration">
        <img
          src={careerImage(offer)}
          alt=""
          loading="lazy"
          width="640"
          height="400"
        />
        <span className="area-badge">{offer.area}</span>
      </div>
      <div className="offer-body">
        <span className="type-badge">{offer.tipo}</span>
        <h3>
          <Link
            to={`/carreras/${offer.oferta_id}`}
            state={{ from: location.pathname + location.search }}
          >
            {offer.carrera_oficial}
          </Link>
        </h3>
        <Institution offer={offer} />
        <div className="offer-facts">
          <span>
            <MapPin size={14} />
            {offer.distrito}
          </span>
          <span>
            <Monitor size={14} />
            {offer.modalidad}
          </span>
          <span>
            <BookOpen size={14} />
            {duration(offer)}
          </span>
        </div>
        <div className="offer-actions">
          <Link
            className="text-link"
            to={`/carreras/${offer.oferta_id}`}
            state={{ from: location.pathname + location.search }}
          >
            Ver detalles <ArrowRight size={16} />
          </Link>
          {action}
        </div>
      </div>
    </article>
  );
}

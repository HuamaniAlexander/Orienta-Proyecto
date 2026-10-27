import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Facets } from "../../shared/types/catalog";
import logos from "../../../public/images/instituciones-horizontal/procedencia.json";

const horizontal: Record<string, { archivo: string; fondo?: string }> = logos;

function InstitutionLogo({ id, name }: { id: number; name: string }) {
  const [failed, setFailed] = useState(false);
  const official = horizontal[id]?.archivo;
  return (
    <>
      {!failed && (
        <img
          src={official ?? `/images/institucion-${id}.webp`}
          className={
            horizontal[id]?.fondo === "oscuro"
              ? "institution-logo-dark"
              : undefined
          }
          alt=""
          loading="lazy"
          width={official ? 210 : 40}
          height={official ? 64 : 40}
          onError={() => setFailed(true)}
        />
      )}
      <span className={official && !failed ? "sr-only" : "institution-name"}>
        {name}
      </span>
    </>
  );
}

export function InstitutionCarousel({
  institutions,
}: {
  institutions: Facets["instituciones"];
}) {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const update = () =>
      setEdges({
        start: element.scrollLeft <= 2,
        end:
          element.scrollLeft + element.clientWidth >= element.scrollWidth - 2,
      });
    const resize = new ResizeObserver(update);
    resize.observe(element);
    element.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      resize.disconnect();
      element.removeEventListener("scroll", update);
    };
  }, [institutions]);
  function scroll(direction: number) {
    const element = track.current;
    if (element)
      element.scrollBy({
        left: direction * element.clientWidth * 0.85,
        behavior:
          matchMedia("(prefers-reduced-motion: reduce)").matches ||
          document.documentElement.dataset.lite === "true"
            ? "auto"
            : "smooth",
      });
  }
  const ordered = [...institutions].sort(
    (a, b) => a.institucion_id - b.institucion_id,
  );
  return (
    <section
      className="institutions-section"
      aria-labelledby="institutions-heading"
    >
      <div className="container">
        <div className="institutions-heading">
          <div>
            <h2 id="institutions-heading">
              Universidades e institutos para explorar.
            </h2>
            <p>
              Conoce las carreras de las {institutions.length} instituciones de
              nuestro catálogo.
            </p>
          </div>
          <Link className="text-link" to="/carreras">
            Ver catálogo <ChevronRight size={16} />
          </Link>
        </div>
        <div className="institution-carousel">
          <button
            className="carousel-arrow"
            aria-label="Instituciones anteriores"
            aria-controls="institution-track"
            disabled={edges.start}
            onClick={() => scroll(-1)}
          >
            <ChevronLeft size={21} />
          </button>
          <ul id="institution-track" className="institution-track" ref={track}>
            {ordered.map((institution) => (
              <li key={institution.institucion_id}>
                <Link
                  to={`/carreras?institucion_id=${institution.institucion_id}`}
                  aria-label={`Explorar carreras en ${institution.nombre}`}
                >
                  <InstitutionLogo
                    id={institution.institucion_id}
                    name={institution.nombre}
                  />
                </Link>
              </li>
            ))}
          </ul>
          <button
            className="carousel-arrow"
            aria-label="Más instituciones"
            aria-controls="institution-track"
            disabled={edges.end}
            onClick={() => scroll(1)}
          >
            <ChevronRight size={21} />
          </button>
        </div>
      </div>
    </section>
  );
}

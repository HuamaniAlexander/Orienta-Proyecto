import {
  ArrowRight,
  BookOpen,
  Building2,
  ChevronRight,
  GraduationCap,
  MapPin,
  Scale,
  Search,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApi } from "../shared/api/client";
import type { Facets } from "../shared/types/catalog";
import { AnimatedCount } from "../features/inicio/AnimatedCount";
import { InstitutionCarousel } from "../features/inicio/InstitutionCarousel";
import "../features/inicio/home.css";

export function Home() {
  const navigate = useNavigate();
  const { data } = useApi<Facets>("/api/filtros");
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">TU PRÓXIMO PASO</p>
            <h1>
              Descubre qué estudiar.
              <br />
              Compara dónde hacerlo.
            </h1>
            <p className="hero-description">
              Carreras e instituciones de Lima Norte, en un solo lugar.
            </p>
          </div>
          <div className="hero-art illustration">
            <div className="hero-photo">
              <img
                src="/images/estudiantes.webp"
                width="1100"
                height="733"
                fetchPriority="high"
                alt="Ilustración de jóvenes estudiantes conversando en un campus"
              />
            </div>
          </div>
        </div>
      </section>
      <div className="container home-search-wrap">
        <form
          className="home-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            const params = new URLSearchParams();
            const fields = new FormData(event.currentTarget);
            for (const key of ["q", "distrito_id"]) {
              const value = String(fields.get(key) ?? "").trim();
              if (value) params.set(key, value);
            }
            navigate({ pathname: "/carreras", search: params.toString() });
          }}
        >
          <label htmlFor="home-career">¿Qué carrera te interesa?</label>
          <div>
            <input
              id="home-career"
              name="q"
              type="search"
              maxLength={120}
              placeholder="Ej. Ingeniería de Sistemas"
            />
            <select name="distrito_id" aria-label="Distrito">
              <option value="">Todo Lima Norte</option>
              {data?.distritos.map((district) => (
                <option key={district.distrito_id} value={district.distrito_id}>
                  {district.distrito}
                </option>
              ))}
            </select>
            <button className="button">
              Explorar carreras <ArrowRight size={19} />
            </button>
          </div>
          <p>Después podrás elegir dos opciones y compararlas.</p>
        </form>
      </div>
      {data && <InstitutionCarousel institutions={data.instituciones} />}
      <section className="section container" id="como-funciona">
        <div className="section-heading centered">
          <p className="eyebrow">UN CAMINO MÁS SIMPLE</p>
          <h2>Tu próxima decisión, paso a paso.</h2>
          <p>No necesitas tener todas las respuestas para empezar.</p>
        </div>
        <div className="steps-grid">
          {[
            {
              icon: Search,
              title: "Explora",
              text: "Encuentra carreras y filtra por distrito, institución o modalidad.",
              number: "01",
            },
            {
              icon: Scale,
              title: "Compara",
              text: "Pon dos opciones lado a lado y descubre qué cambia entre ellas.",
              number: "02",
            },
            {
              icon: Sparkles,
              title: "Comprende",
              text: "Explora las diferencias con IA según lo que es importante para ti.",
              number: "03",
            },
          ].map(({ icon: Icon, ...item }) => (
            <article className="step-card" key={item.number}>
              <div className="step-top">
                <span className="step-icon">
                  <Icon size={25} />
                </span>
                <span className="step-number">{item.number}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="stats-section" aria-label="El catálogo en cifras">
        <div className="container stats-grid">
          {[
            {
              value: data?.resumen.carreras,
              label: "carreras por descubrir",
              icon: GraduationCap,
            },
            {
              value: data?.resumen.ofertas,
              label: "opciones académicas",
              icon: BookOpen,
            },
            {
              value: data?.resumen.instituciones,
              label: "instituciones en el catálogo",
              icon: Building2,
            },
            {
              value: data?.resumen.distritos,
              label: "distritos de Lima Norte",
              icon: MapPin,
            },
          ].map(({ icon: Icon, ...item }) => (
            <div className="stat" key={item.label}>
              <span className="stat-icon" aria-hidden="true">
                <Icon size={21} />
              </span>
              <div>
                <strong>
                  <AnimatedCount value={item.value} />
                </strong>
                <span>{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="areas-section">
        <div className="container section">
          <div className="section-heading row-heading">
            <div>
              <p className="eyebrow">HAY MÁS DE UN CAMINO</p>
              <h2>¿Qué te gustaría explorar?</h2>
              <p>Empieza por un área que despierte tu curiosidad.</p>
            </div>
            <Link className="text-link" to="/carreras">
              Ver todas las carreras <ArrowRight size={18} />
            </Link>
          </div>
          <div className="area-grid">
            {[
              {
                id: 1,
                name: "Tecnología e informática",
                text: "Ideas que se convierten en soluciones.",
                icon: "⌘",
              },
              {
                id: 2,
                name: "Ingeniería y producción",
                text: "Diseña, construye y transforma.",
                icon: "⚙",
              },
              {
                id: 3,
                name: "Negocios y gestión",
                text: "Haz que las ideas crezcan.",
                icon: "↗",
              },
              {
                id: 4,
                name: "Salud y bienestar",
                text: "Conecta tu futuro con el cuidado.",
                icon: "+",
              },
            ].map((area) => (
              <Link
                className="area-tile"
                key={area.id}
                to={`/carreras?area_id=${area.id}`}
              >
                <span className="area-symbol" aria-hidden="true">
                  {area.icon}
                </span>
                <div>
                  <h3>{area.name}</h3>
                  <p>{area.text}</p>
                </div>
                <ChevronRight size={20} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="container section">
        <div className="clarity-banner">
          <span className="clarity-icon">
            <GraduationCap size={35} />
          </span>
          <div>
            <p className="eyebrow">TU DECISIÓN, CON CONTEXTO</p>
            <h2>El primer paso es conocer tus opciones.</h2>
            <p>
              <MapPin size={16} /> Universidades e institutos de Lima Norte, en
              un solo lugar.
            </p>
          </div>
          <Link className="button" to="/carreras">
            Empezar a explorar <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}

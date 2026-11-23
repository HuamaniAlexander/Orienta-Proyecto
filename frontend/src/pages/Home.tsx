import {
  ArrowRight,
  BookOpen,
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  Cpu,
  Cross,
  Settings,
  SquareCheck,
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

const steps = [
  { icon: Search, label: "Explora opciones" },
  { icon: SquareCheck, label: "Selecciona dos" },
  { icon: Scale, label: "Compara" },
  { icon: Sparkles, label: "Comprende con IA" },
];

const areas = [
  { id: 1, label: "Tecnología", image: "tecnologia", icon: Cpu },
  { id: 2, label: "Ingeniería", image: "ingenieria", icon: Settings },
  { id: 3, label: "Negocios", image: "negocios", icon: ChartNoAxesCombined },
  { id: 4, label: "Salud", image: "salud", icon: Cross },
];

export function Home() {
  const navigate = useNavigate();
  const { data } = useApi<Facets>("/api/filtros");
  return (
    <>
      <section className="hero home-hero">
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
                alt=""
              />
            </div>
          </div>
        </div>
      </section>
      <div className="home-intro-controls">
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
            <div className="home-search-fields">
              <div className="home-field">
                <Search size={24} aria-hidden="true" />
                <input
                  id="home-career"
                  name="q"
                  type="search"
                  maxLength={120}
                  placeholder="Ej. Ingeniería de Sistemas"
                />
              </div>
              <div className="home-field home-district">
                <MapPin size={24} aria-hidden="true" />
                <select name="distrito_id" aria-label="Distrito">
                  <option value="">Todo Lima Norte</option>
                  {data?.distritos.map((district) => (
                    <option
                      key={district.distrito_id}
                      value={district.distrito_id}
                    >
                      {district.distrito}
                    </option>
                  ))}
                </select>
                <ChevronDown size={20} aria-hidden="true" />
              </div>
              <button className="button home-search-button">
                Explorar carreras <ArrowRight size={28} aria-hidden="true" />
              </button>
            </div>
            <p>Después podrás elegir dos opciones y compararlas.</p>
          </form>
        </div>
        <ol
          className="container home-steps"
          id="como-funciona"
          aria-label="Cómo funciona"
        >
          {steps.map(({ icon: Icon, label }, index) => (
            <li key={label}>
              <Icon size={26} aria-hidden="true" />
              <span>{label}</span>
              {index < steps.length - 1 && (
                <ArrowRight
                  className="home-step-arrow"
                  size={20}
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
      </div>
      <section className="container home-areas">
        <div className="home-areas-heading">
          <h2>Un punto de partida para cada interés.</h2>
          <Link className="text-link" to="/carreras">
            Ver todas las carreras <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className="home-area-grid">
          {areas.map(({ id, label, image, icon: Icon }) => (
            <Link className="home-area" key={id} to={`/carreras?area_id=${id}`}>
              <img
                className="illustration"
                src={`/images/${image}.webp`}
                alt=""
                width="320"
                height="180"
              />
              <span>
                <Icon size={27} aria-hidden="true" /> {label}
              </span>
            </Link>
          ))}
        </div>
        <aside className="home-compare" aria-label="Comparador">
          <Scale size={33} aria-hidden="true" />
          <p>¿Entre dos opciones? Mira sus diferencias lado a lado.</p>
          <Link className="text-link" to="/comparar">
            Conoce el comparador <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </aside>
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
      {data && <InstitutionCarousel institutions={data.instituciones} />}
    </>
  );
}

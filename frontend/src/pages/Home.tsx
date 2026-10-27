import {
  ArrowRight,
  Check,
  ChevronRight,
  GraduationCap,
  MapPin,
  Scale,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useApi } from "../shared/api/client";
import type { Facets } from "../shared/types/catalog";
export function Home() {
  const { data } = useApi<Facets>("/api/filtros");
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="dot" /> TU FUTURO, CON MÁS CLARIDAD
            </p>
            <h1>
              Compara carreras.
              <br />
              <span>
                Elige con
                <br className="desktop-break" /> información.
              </span>
            </h1>
            <p className="hero-description">
              Descubre opciones de estudio en Lima Norte y entiende sus
              diferencias. Da el siguiente paso con más confianza.
            </p>
            <div className="hero-buttons">
              <Link className="button" to="/carreras">
                Explorar carreras <ArrowRight size={19} />
              </Link>
              <a className="button secondary" href="#como-funciona">
                Cómo funciona
              </a>
            </div>
            <div className="hero-trust">
              <span>
                <Check size={17} /> Sin registro
              </span>
              <span>
                <ShieldCheck size={17} /> Fuentes documentadas
              </span>
              <span>
                <Smartphone size={17} /> Desde tu celular
              </span>
            </div>
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
            <div className="floating-card compare-preview">
              <span className="mini-icon">
                <Scale size={20} />
              </span>
              <div>
                <strong>Dos opciones. Más claridad.</strong>
                <small>Encuentra las diferencias que importan.</small>
              </div>
              <Check className="check-round" size={21} />
            </div>
            <div className="floating-card ai-preview">
              <Sparkles size={22} />
              <div>
                <strong>Comprende tus opciones</strong>
                <small>Con ayuda de la IA</small>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="stats-section">
        <div className="container stats-grid">
          {[
            { value: data?.resumen.carreras, label: "carreras por descubrir" },
            { value: data?.resumen.ofertas, label: "opciones académicas" },
            {
              value: data?.resumen.instituciones,
              label: "instituciones en el catálogo",
            },
            {
              value: data?.resumen.distritos,
              label: "distritos de Lima Norte",
            },
          ].map((item) => (
            <div className="stat" key={item.label}>
              <strong>{item.value ?? "—"}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>
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

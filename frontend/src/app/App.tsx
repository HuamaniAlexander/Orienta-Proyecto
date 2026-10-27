import { ArrowRight, Compass, Leaf, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { Home } from "../pages/Home";
function ScrollReset() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash)
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ behavior: "smooth" });
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
export function NotFound() {
  return (
    <section className="container not-found">
      <Compass size={48} />
      <p className="eyebrow">VOLVAMOS AL CAMINO</p>
      <h1>Esta página no está en el mapa.</h1>
      <p>
        El enlace puede haber cambiado. Explora las opciones desde el inicio.
      </p>
      <Link className="button" to="/">
        Volver al inicio <ArrowRight size={18} />
      </Link>
    </section>
  );
}
export function App() {
  const [menu, setMenu] = useState(false);
  const [lite, setLite] = useState(() => {
    try {
      return localStorage.getItem("orienta-lite") === "true";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    document.documentElement.dataset.lite = String(lite);
    try {
      localStorage.setItem("orienta-lite", String(lite));
    } catch {
      /* Optional preference. */
    }
  }, [lite]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <ScrollReset />
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" aria-label="ORIENTA, inicio" className="brand">
            <img
              src="/images/logo-orienta.webp"
              width="200"
              height="67"
              alt="ORIENTA"
            />
          </Link>
          <nav
            className={menu ? "main-nav open" : "main-nav"}
            aria-label="Navegación principal"
          >
            <NavLink to="/" end onClick={() => setMenu(false)}>
              Inicio
            </NavLink>
            <NavLink to="/carreras" onClick={() => setMenu(false)}>
              Carreras
            </NavLink>
            <NavLink to="/comparar" onClick={() => setMenu(false)}>
              Comparar
            </NavLink>
          </nav>
          <div className="header-actions">
            <button
              className="lite-button"
              aria-label="Modo ligero"
              aria-pressed={lite}
              onClick={() => setLite((value) => !value)}
            >
              <Leaf size={16} />
              <span>Modo ligero</span>
            </button>
            <Link className="button header-cta" to="/carreras">
              Explorar carreras <ArrowRight size={16} />
            </Link>
            <button
              className="menu-button"
              aria-expanded={menu}
              aria-label={menu ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setMenu((value) => !value)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main id="contenido">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="container footer-top">
          <Link to="/" className="brand">
            <img
              src="/images/logo-orienta.webp"
              width="170"
              height="57"
              alt="ORIENTA"
            />
          </Link>
          <p>
            Más información. Más claridad.
            <br />
            Tu próxima decisión empieza contigo.
          </p>
          <div>
            <Link to="/carreras">Explorar carreras</Link>
            <Link to="/#como-funciona">Cómo funciona</Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>ORIENTA · Lima Norte</span>
          <span>La información orienta. Tú eliges tu camino.</span>
        </div>
      </footer>
    </>
  );
}

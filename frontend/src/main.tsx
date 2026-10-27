import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main>
      <p className="eyebrow">ORIENTA · Desarrollo</p>
      <h1>Un punto de partida para tu futuro.</h1>
      <p>Estamos preparando el catálogo de opciones académicas de Lima Norte.</p>
      <p>La aplicación está en construcción.</p>
    </main>
  </StrictMode>,
);

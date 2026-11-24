import { ArrowRight, Check, Columns2, Plus, Scale, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { Institution } from "../../shared/components/OfferCard";
import type { Offer } from "../../shared/types/catalog";

interface Selection {
  items: Offer[];
  toggle: (offer: Offer) => void;
  remove: (id: number) => void;
  replaceAll: (offers: Offer[]) => void;
}
const Context = createContext<Selection | null>(null);
function restore(): Offer[] {
  try {
    const value: unknown = JSON.parse(
      sessionStorage.getItem("orienta-selection") ?? "[]",
    );
    return Array.isArray(value)
      ? value
          .filter(
            (item) =>
              item &&
              Number.isSafeInteger(item.oferta_id) &&
              item.oferta_id > 0 &&
              typeof item.carrera_oficial === "string" &&
              typeof item.institucion === "string",
          )
          .slice(0, 2)
      : [];
  } catch {
    return [];
  }
}
export function SelectionProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Offer[]>(restore);
  const [message, setMessage] = useState("");
  useEffect(() => {
    try {
      sessionStorage.setItem("orienta-selection", JSON.stringify(items));
    } catch {
      /* Storage optional. */
    }
    document.body.dataset.selectedItems = String(items.length);
  }, [items]);
  const remove = (id: number) => {
    setItems((current) => current.filter((item) => item.oferta_id !== id));
    setMessage("Opción quitada del comparador.");
  };
  const toggle = (offer: Offer) => {
    if (items.some((item) => item.oferta_id === offer.oferta_id)) {
      remove(offer.oferta_id);
      return;
    }
    if (items.length >= 2) {
      setMessage("Ya elegiste dos opciones. Quita una para cambiarla.");
      return;
    }
    setItems([...items, offer]);
    setMessage(`${offer.carrera_oficial} agregada al comparador.`);
  };
  const replaceAll = useCallback(
    (offers: Offer[]) =>
      setItems(
        [
          ...new Map(offers.map((offer) => [offer.oferta_id, offer])).values(),
        ].slice(0, 2),
      ),
    [],
  );
  return (
    <Context.Provider value={{ items, toggle, remove, replaceAll }}>
      {children}
      <div className="sr-only" role="status" aria-live="polite">
        {message}
      </div>
    </Context.Provider>
  );
}
export function useSelection() {
  const context = useContext(Context);
  if (!context) throw new Error("SelectionProvider missing");
  return context;
}
export function SelectButton({ offer }: { offer: Offer }) {
  const { items, toggle } = useSelection();
  const selected = items.some((item) => item.oferta_id === offer.oferta_id);
  return (
    <button
      className={selected ? "select-button selected" : "select-button"}
      aria-pressed={selected}
      disabled={!selected && items.length >= 2}
      onClick={() => toggle(offer)}
    >
      {selected ? <Check size={14} /> : <Plus size={14} />}{" "}
      {selected ? "Añadida a comparación" : "Añadir a comparación"}
    </button>
  );
}
export function SelectionTray({ embedded = false }: { embedded?: boolean }) {
  const { items, remove } = useSelection();
  const location = useLocation();
  if (
    !embedded &&
    (!location.pathname.startsWith("/carreras") || !items.length)
  )
    return null;
  const comparisonUrl = `/comparar?opciones=${items.map((item) => item.oferta_id).join(",")}`;
  if (embedded) {
    return (
      <aside className="catalog-selection" aria-label="Opciones seleccionadas">
        <header className="catalog-selection-heading">
          <Columns2 size={31} aria-hidden="true" />
          <div>
            <h2>Compara 2 carreras</h2>
            <p>Tus opciones, lado a lado.</p>
          </div>
        </header>
        <div className="catalog-selection-body">
          <p className="catalog-selection-count">
            {items.length} de 2 opciones seleccionadas
          </p>
          <ol className="catalog-selection-list">
            {[0, 1].map((index) => {
              const offer = items[index];
              return (
                <li key={index}>
                  <span className="catalog-selection-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  {offer ? (
                    <>
                      <div className="catalog-selection-offer">
                        <strong>{offer.carrera_oficial}</strong>
                        <Institution offer={offer} />
                      </div>
                      <button
                        onClick={() => remove(offer.oferta_id)}
                        aria-label={`Quitar ${offer.carrera_oficial} de ${offer.institucion}`}
                      >
                        <X size={17} aria-hidden="true" />
                      </button>
                    </>
                  ) : (
                    <span>Elige una opción del catálogo</span>
                  )}
                </li>
              );
            })}
          </ol>
          <div className="catalog-selection-action">
            {items.length === 2 ? (
              <Link className="button" to={comparisonUrl}>
                Comparar ahora <ArrowRight size={21} aria-hidden="true" />
              </Link>
            ) : (
              <button className="button" disabled>
                Comparar ahora
              </button>
            )}
            <p>Verás duración, enfoque, costos, ubicación y modalidad.</p>
          </div>
        </div>
      </aside>
    );
  }
  const className = `selection-tray${location.pathname === "/carreras" ? " catalog-tray" : ""}`;
  return (
    <aside className={className} aria-label="Opciones seleccionadas">
      <div className="container tray-content">
        <div className="tray-title">
          <Scale size={25} />
          <div>
            <strong>{items.length} de 2 opciones</strong>
            <small>Tu próxima comparación</small>
          </div>
        </div>
        <div className="tray-items">
          {items.map((offer) => (
            <div key={offer.oferta_id}>
              <span>
                <strong>{offer.carrera_oficial}</strong>
                <small>{offer.institucion}</small>
              </span>
              <button
                onClick={() => remove(offer.oferta_id)}
                aria-label={`Quitar ${offer.carrera_oficial} de ${offer.institucion}`}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        {items.length === 2 ? (
          <Link className="button" to={comparisonUrl}>
            Comparar opciones
          </Link>
        ) : (
          <span className="tray-prompt">
            <Plus size={14} aria-hidden="true" />{" "}
            {items.length
              ? "Elige una segunda opción"
              : "Añade dos opciones del catálogo"}
          </span>
        )}
      </div>
    </aside>
  );
}

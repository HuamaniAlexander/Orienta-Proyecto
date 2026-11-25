import { ArrowRight, Check, Plus, Scale, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { Link, useLocation } from "react-router-dom";
import type { Offer } from "../../shared/types/catalog";
import { InstitutionMark } from "../../shared/components/InstitutionLogo";

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
export function SelectionTray() {
  const { items, remove } = useSelection();
  const location = useLocation();
  const tray = useRef<HTMLElement>(null);
  const visible = location.pathname.startsWith("/carreras");
  useEffect(() => {
    if (!visible || !tray.current) return;
    const element = tray.current;
    const updateHeight = () =>
      document.documentElement.style.setProperty(
        "--selection-tray-height",
        `${element.offsetHeight}px`,
      );
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    updateHeight();
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--selection-tray-height");
    };
  }, [visible]);
  if (!visible) return null;
  const comparisonUrl = `/comparar?opciones=${items.map((item) => item.oferta_id).join(",")}`;
  return (
    <aside
      ref={tray}
      className="selection-tray catalog-tray"
      aria-label="Opciones seleccionadas"
    >
      <div className="container tray-content">
        <div className="tray-title">
          <Scale size={26} aria-hidden="true" />
          <div>
            <strong>Compara 2 carreras</strong>
            <small role="status">
              {items.length} de 2 opciones seleccionadas
            </small>
          </div>
        </div>
        <div className="tray-items">
          {[0, 1].map((index) => {
            const offer = items[index];
            return (
              <div
                key={index}
                className={offer ? "tray-choice" : "tray-choice is-empty"}
                data-option={index + 1}
              >
                {!offer && (
                  <span className="tray-choice-number" aria-hidden="true">
                    {index + 1}
                  </span>
                )}
                {offer ? (
                  <>
                    <span className="tray-logo-ring">
                      <InstitutionMark
                        id={offer.institucion_id}
                        name={offer.institucion}
                      />
                      <span className="tray-logo-number" aria-hidden="true">
                        {index + 1}
                      </span>
                    </span>
                    <span
                      className="tray-choice-copy"
                      title={`${offer.carrera_oficial} · ${offer.institucion} · ${offer.sede} · ${offer.distrito}`}
                    >
                      <strong className="tray-choice-name">
                        {offer.carrera_oficial}
                      </strong>
                      <small className="tray-choice-institution">
                        {offer.institucion}
                      </small>
                      <small className="tray-choice-location">
                        {offer.sede || offer.distrito}
                        {offer.sede && offer.sede !== offer.distrito
                          ? ` · ${offer.distrito}`
                          : ""}
                      </small>
                    </span>
                    <button
                      onClick={() => remove(offer.oferta_id)}
                      aria-label={`Quitar ${offer.carrera_oficial} de ${offer.institucion}`}
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <span>
                    <strong>
                      {index === 0 ? "Primera opción" : "Segunda opción"}
                    </strong>
                    <small>Elige una carrera del catálogo</small>
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {items.length === 2 ? (
          <Link className="button" to={comparisonUrl}>
            Comparar ahora <ArrowRight size={18} aria-hidden="true" />
          </Link>
        ) : (
          <button className="button" disabled>
            Comparar ahora <ArrowRight size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </aside>
  );
}

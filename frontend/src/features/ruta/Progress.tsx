import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Offer } from "../../shared/types/catalog";

export type SavedOffer = Pick<
  Offer,
  "oferta_id" | "carrera_oficial" | "institucion" | "distrito"
>;
export interface Preferences {
  interests: string[];
  extra: string;
  district: string;
  flexible: boolean;
  modalities: number[];
  availability: string;
}
export interface Suggestion {
  offer: SavedOffer;
  reasons: string[];
  source: string | null;
}
interface Discovery {
  version: number;
  preferences: Preferences;
  suggestions: Suggestion[];
  answers?: QuestionnaireDraft["answers"];
}
export interface QuestionnaireDraft {
  step: number;
  answers: Record<number, number[]>;
  preferences: Preferences;
}
interface Progress {
  offers: SavedOffer[];
  comparisons: SavedOffer[][];
  questions: string[];
  current?: Discovery;
  previous?: Discovery;
  questionnaire?: QuestionnaireDraft;
}
const STORAGE = "orienta-progress-v1";
const empty = (): Progress => ({ offers: [], comparisons: [], questions: [] });
const Context = createContext<{
  progress: Progress;
  update: (change: (previous: Progress) => Progress) => boolean;
  clear: () => boolean;
  status: { text: string; error: boolean };
} | null>(null);

function read(): Progress {
  const serialized = localStorage.getItem(STORAGE);
  if (!serialized) return empty();
  const stored = JSON.parse(serialized) as Progress | null;
  if (
    !stored ||
    !Array.isArray(stored.offers) ||
    !Array.isArray(stored.comparisons) ||
    !Array.isArray(stored.questions)
  )
    return empty();
  return stored;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(() => {
    try {
      return read();
    } catch {
      return empty();
    }
  });
  const [status, setStatus] = useState({ text: "", error: false });
  useEffect(() => {
    function sync(event: StorageEvent) {
      if (
        event.storageArea !== localStorage ||
        (event.key !== STORAGE && event.key !== null)
      )
        return;
      try {
        setProgress(read());
      } catch {
        setProgress(empty());
      }
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function commit(change?: (previous: Progress) => Progress) {
    try {
      const next = change ? change(read()) : empty();
      if (change) localStorage.setItem(STORAGE, JSON.stringify(next));
      else localStorage.removeItem(STORAGE);
      setProgress(next);
      setStatus({
        text: change
          ? "Avance guardado en este navegador."
          : "Avance eliminado de este navegador.",
        error: false,
      });
      return true;
    } catch {
      setStatus({
        text: "No pudimos actualizar el avance en este navegador.",
        error: true,
      });
      return false;
    }
  }
  return (
    <Context.Provider
      value={{ progress, update: commit, clear: () => commit(), status }}
    >
      {children}
      <p
        className={status.error ? "container info-note" : "sr-only"}
        role={status.error ? "alert" : "status"}
      >
        {status.text}
      </p>
    </Context.Provider>
  );
}

export function useProgress() {
  const context = useContext(Context);
  if (!context) throw new Error("ProgressProvider missing");
  return context;
}

export function savedOffer({
  oferta_id,
  carrera_oficial,
  institucion,
  distrito,
}: SavedOffer): SavedOffer {
  return { oferta_id, carrera_oficial, institucion, distrito };
}
export const comparisonKey = (offers: SavedOffer[]) =>
  offers
    .map((offer) => offer.oferta_id)
    .sort((a, b) => a - b)
    .join(",");

export function SaveOffer({ offer }: { offer: SavedOffer }) {
  const { progress, update } = useProgress();
  const isSaved = progress.offers.some(
    (item) => item.oferta_id === offer.oferta_id,
  );
  return (
    <button
      className="button secondary"
      aria-pressed={isSaved}
      onClick={() =>
        update((previous) => {
          const remaining = previous.offers.filter(
            (item) => item.oferta_id !== offer.oferta_id,
          );
          return {
            ...previous,
            offers: isSaved ? remaining : [...remaining, savedOffer(offer)],
          };
        })
      }
    >
      {isSaved ? "Retirar de Mi ruta" : "Guardar en Mi ruta"}
    </button>
  );
}

export function SaveComparison({ offers }: { offers: SavedOffer[] }) {
  const { progress, update } = useProgress();
  const key = comparisonKey(offers);
  const isSaved = progress.comparisons.some(
    (pair) => comparisonKey(pair) === key,
  );
  return (
    <button
      className="button secondary"
      aria-pressed={isSaved}
      onClick={() =>
        update((previous) => {
          const remaining = previous.comparisons.filter(
            (pair) => comparisonKey(pair) !== key,
          );
          return {
            ...previous,
            comparisons: isSaved
              ? remaining
              : [...remaining, offers.map(savedOffer)],
          };
        })
      }
    >
      {isSaved ? "Retirar comparación" : "Guardar comparación"}
    </button>
  );
}

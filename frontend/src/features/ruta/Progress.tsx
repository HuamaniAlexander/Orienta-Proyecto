import { Bookmark } from "lucide-react";
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
> &
  Partial<Pick<Offer, "area_id" | "area" | "modalidad" | "institucion_id">>;
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
  area?: string;
  areaId?: number;
  relatedInterests?: string[];
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
  questionDetails?: Record<string, { offerId?: number; researched?: boolean }>;
  explorationPreferences?: Preferences;
  conversation?: {
    summary: string;
    questions: { text: string; source: string }[];
    offers: number[];
    selectedQuestions: string[];
  };
  current?: Discovery;
  previous?: Discovery;
  questionnaire?: QuestionnaireDraft;
}
const STORAGE = "orienta-progress-v1";
const SESSION_MODE = "orienta-session-only";
const storage = () =>
  sessionStorage.getItem(SESSION_MODE) ? sessionStorage : localStorage;
const empty = (): Progress => ({ offers: [], comparisons: [], questions: [] });
const Context = createContext<{
  progress: Progress;
  update: (change: (previous: Progress) => Progress) => boolean;
  clear: () => boolean;
  persistent: boolean;
  setPersistence: (enabled: boolean) => void;
  status: { text: string; error: boolean };
} | null>(null);

function read(): Progress {
  const serialized = storage().getItem(STORAGE);
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
  const [persistent, setPersistent] = useState(() => {
    try {
      return storage() === localStorage;
    } catch {
      return true;
    }
  });
  function setPersistence(enabled: boolean) {
    if (enabled === persistent) return;
    try {
      const target = enabled ? localStorage : sessionStorage;
      target.setItem(STORAGE, JSON.stringify(read()));
      if (enabled) {
        sessionStorage.removeItem(SESSION_MODE);
        sessionStorage.removeItem(STORAGE);
      } else {
        sessionStorage.setItem(SESSION_MODE, "1");
        localStorage.removeItem(STORAGE);
      }
      setPersistent(enabled);
    } catch {
      setStatus({
        text: "No pudimos cambiar cómo se guarda tu ruta.",
        error: true,
      });
    }
  }
  function commit(change?: (previous: Progress) => Progress) {
    try {
      const next = change ? change(read()) : empty();
      if (change) storage().setItem(STORAGE, JSON.stringify(next));
      else storage().removeItem(STORAGE);
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
      value={{
        progress,
        update: commit,
        clear: () => commit(),
        status,
        persistent,
        setPersistence,
      }}
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
  institucion_id,
  distrito,
  area,
  area_id,
  modalidad,
}: SavedOffer): SavedOffer {
  return {
    oferta_id,
    carrera_oficial,
    institucion,
    institucion_id,
    distrito,
    area,
    area_id,
    modalidad,
  };
}
export const comparisonKey = (offers: SavedOffer[]) =>
  offers
    .map((offer) => offer.oferta_id)
    .sort((a, b) => a - b)
    .join(",");

export function SaveOffer({
  offer,
  compact = false,
  iconOnly = false,
}: {
  offer: SavedOffer;
  compact?: boolean;
  iconOnly?: boolean;
}) {
  const { progress, update } = useProgress();
  const isSaved = progress.offers.some(
    (item) => item.oferta_id === offer.oferta_id,
  );
  return (
    <button
      className={
        iconOnly
          ? "save-offer-icon save-toggle"
          : "button secondary save-toggle"
      }
      aria-pressed={isSaved}
      aria-label={isSaved ? "Retirar de Mi ruta" : "Guardar en Mi ruta"}
      title={isSaved ? "Guardada en Mi ruta" : "Guardar en Mi ruta"}
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
      <Bookmark
        size={iconOnly ? 21 : 16}
        fill={isSaved ? "currentColor" : "none"}
        aria-hidden="true"
      />
      {!iconOnly &&
        (compact
          ? isSaved
            ? "Retirar"
            : "Guardar"
          : isSaved
            ? "Retirar de Mi ruta"
            : "Guardar en Mi ruta")}
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
      className="button secondary save-toggle"
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
      <Bookmark
        size={18}
        fill={isSaved ? "currentColor" : "none"}
        aria-hidden="true"
      />
      {isSaved ? "Retirar comparación" : "Guardar comparación"}
    </button>
  );
}

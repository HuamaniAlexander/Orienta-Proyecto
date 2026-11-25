import { useId, useRef, useState, type InputHTMLAttributes } from "react";
import type { Facets } from "../types/catalog";
import "../styles/search-input.css";

export const normalizeSearch = (value: string) =>
  value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("es").trim();

export function catalogSuggestions(facets?: Facets): string[] {
  return facets
    ? [
        ...new Set([
          ...facets.carreras.map((item) => item.nombre_catalogado),
          ...facets.instituciones.map((item) => item.nombre),
        ]),
      ].sort((a, b) => a.localeCompare(b, "es"))
    : [];
}

interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  suggestions: string[];
  onValueChange?: (value: string) => void;
  onChoose?: (value: string) => void;
  submitOnChoose?: boolean;
}

export function SearchInput({
  suggestions,
  onValueChange,
  onChoose,
  submitOnChoose = false,
  value,
  defaultValue,
  className = "",
  onFocus,
  onBlur,
  onKeyDown,
  ...props
}: SearchInputProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [local, setLocal] = useState(String(defaultValue ?? ""));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const text = String(value ?? local);
  const normalized = normalizeSearch(text);
  const matches =
    normalized.length >= 2
      ? suggestions
          .filter((label) =>
            normalized
              .split(/\s+/)
              .every((word) => normalizeSearch(label).includes(word)),
          )
          .sort(
            (a, b) =>
              Number(normalizeSearch(b).startsWith(normalized)) -
              Number(normalizeSearch(a).startsWith(normalized)),
          )
          .slice(0, 7)
      : [];
  const expanded = open && matches.length > 0;
  function choose(label: string) {
    setLocal(label);
    onValueChange?.(label);
    setOpen(false);
    setActive(-1);
    onChoose?.(label);
    if (submitOnChoose)
      requestAnimationFrame(() => input.current?.form?.requestSubmit());
  }
  return (
    <div className={`search-autocomplete ${className}`}>
      <input
        {...props}
        ref={input}
        type="search"
        role="combobox"
        autoComplete="off"
        value={text}
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded ? `${id}-suggestions` : undefined}
        aria-activedescendant={
          expanded && active >= 0 ? `${id}-suggestion-${active}` : undefined
        }
        onChange={(event) => {
          setLocal(event.target.value);
          onValueChange?.(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={(event) => {
          setOpen(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setOpen(false);
          setActive(-1);
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          if (
            (event.key === "ArrowDown" || event.key === "ArrowUp") &&
            matches.length
          ) {
            event.preventDefault();
            setOpen(true);
            setActive((previous) =>
              event.key === "ArrowDown"
                ? (previous + 1) % matches.length
                : previous <= 0
                  ? matches.length - 1
                  : previous - 1,
            );
          } else if (event.key === "Enter" && expanded && active >= 0) {
            event.preventDefault();
            choose(matches[active]);
          } else if (event.key === "Escape" && expanded) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
            setActive(-1);
          } else if (event.key === "Enter") setOpen(false);
          onKeyDown?.(event);
        }}
      />
      {expanded && (
        <ul
          id={`${id}-suggestions`}
          role="listbox"
          aria-label="Sugerencias de búsqueda"
          className="search-suggestions"
        >
          {matches.map((label, index) => (
            <li
              key={label}
              id={`${id}-suggestion-${index}`}
              role="option"
              aria-selected={active === index}
              onPointerDown={(event) => event.preventDefault()}
              onPointerMove={() => setActive(index)}
              onClick={() => choose(label)}
            >
              {label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

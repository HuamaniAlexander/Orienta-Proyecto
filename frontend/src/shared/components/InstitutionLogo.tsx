import { useState } from "react";
import logos from "../../../public/images/instituciones-horizontal/procedencia.json";

const horizontal: Record<string, { archivo: string; fondo?: string }> = logos;

export function InstitutionMark({ id, name }: { id: number; name: string }) {
  const src =
    id > 0
      ? `/images/institucion-${id}.webp${[4, 7, 8, 18, 19].includes(id) ? "?v=20261026" : ""}`
      : null;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !src || failedSrc === src;
  const initials = name
    .split(/\s+/)
    .filter(
      (word) => !["de", "del", "la", "el", "y"].includes(word.toLowerCase()),
    )
    .map((word) => word[0])
    .slice(0, 3)
    .join("");
  return (
    <span className="institution-mark" role="img" aria-label={name}>
      {failed ? (
        <span aria-hidden="true">{initials}</span>
      ) : (
        <img
          src={src}
          width="36"
          height="36"
          alt=""
          onError={() => setFailedSrc(src)}
        />
      )}
    </span>
  );
}

export function InstitutionLogo({ id, name }: { id: number; name: string }) {
  const official = id > 0 ? horizontal[id]?.archivo : undefined;
  const src = id > 0 ? (official ?? `/images/institucion-${id}.webp`) : null;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !src || failedSrc === src;
  return (
    <>
      {!failed && (
        <img
          src={src}
          className={
            horizontal[id]?.fondo === "oscuro"
              ? "institution-logo-dark"
              : undefined
          }
          alt=""
          loading="lazy"
          width={official ? 210 : 40}
          height={official ? 64 : 40}
          onError={() => setFailedSrc(src)}
        />
      )}
      <span className={official && !failed ? "sr-only" : "institution-name"}>
        {name}
      </span>
    </>
  );
}

import { useState } from "react";
import logos from "../../../public/images/instituciones-horizontal/procedencia.json";

const horizontal: Record<string, { archivo: string; fondo?: string }> = logos;

export function InstitutionLogo({ id, name }: { id: number; name: string }) {
  const [failed, setFailed] = useState(false);
  const official = horizontal[id]?.archivo;
  return (
    <>
      {!failed && (
        <img
          src={official ?? `/images/institucion-${id}.webp`}
          className={
            horizontal[id]?.fondo === "oscuro"
              ? "institution-logo-dark"
              : undefined
          }
          alt=""
          loading="lazy"
          width={official ? 210 : 40}
          height={official ? 64 : 40}
          onError={() => setFailed(true)}
        />
      )}
      <span className={official && !failed ? "sr-only" : "institution-name"}>
        {name}
      </span>
    </>
  );
}

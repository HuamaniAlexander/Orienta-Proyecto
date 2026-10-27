import type { Offer, Source } from "./catalog";

export function offerLabel(offer: Offer) {
  return `${offer.carrera_oficial} · ${offer.institucion} · ${offer.sede}`;
}

export function sourceLabel(source: Source | undefined, offers: Offer[]) {
  if (!source) return "Documento de referencia";
  const related = offers.filter((offer) =>
    [offer.fuente_ficha_id, offer.fuente_oferta_id].includes(source.fuente_id),
  );
  if (related.length) {
    const program = related.some(
      (offer) => offer.fuente_ficha_id === source.fuente_id,
    );
    return `${program ? "Programa" : "Sede"}: ${[...new Set(related.map(offerLabel))].join(" / ")}`;
  }
  try {
    return `${source.emisor_tipo} · ${new URL(source.url).hostname}`;
  } catch {
    return `Documento de ${source.emisor_tipo}`;
  }
}

export function readableText(text: string, offers: Offer[], sources: Source[]) {
  return text
    .replace(/\bopci[oó]n\s+([AB])\b/gi, (match, letter: string) => {
      const offer = offers[letter.toUpperCase() === "A" ? 0 : 1];
      return offer ? offerLabel(offer) : match;
    })
    .replace(/\boferta\s*#?\s*(\d+)\b/gi, (match, id: string) => {
      const offer = offers.find((item) => item.oferta_id === Number(id));
      return offer ? offerLabel(offer) : match;
    })
    .replace(/\bfuente\s*#?\s*(\d+)\b/gi, (match, id: string) => {
      const source = sources.find((item) => item.fuente_id === Number(id));
      return source ? sourceLabel(source, offers) : match;
    });
}

export interface Offer {
  oferta_id: number;
  carrera_id: number;
  institucion_id: number;
  sede_id: number;
  carrera_oficial: string;
  institucion: string;
  tipo: string;
  distrito: string;
  modalidad: string;
  area: string;
  sede: string;
  nivel: string;
  gestion: string;
  enfoque_editorial: string;
  ambitos_editoriales: string;
  criterio_clasificacion: string;
  direccion: string | null;
  duracion_valor: number | null;
  duracion_unidad: string | null;
  consulta_costos: string | null;
  ficha_url: string | null;
  fuente_oferta_url: string | null;
  periodo_fuente: string | null;
  fecha_consulta: string;
  fuente_oferta_id: number;
  fuente_ficha_id: number;
  tipo_id: number;
  area_id: number;
  modalidad_id: number;
  distrito_id: number;
  evidencia_sede: string | null;
}
export interface CatalogPage {
  items: Offer[];
  total: number;
  page: number;
  page_size: number;
}
export interface Facets {
  carreras: { carrera_id: number; nombre_catalogado: string }[];
  instituciones: { institucion_id: number; nombre: string }[];
  distritos: { distrito_id: number; distrito: string }[];
  areas: { area_id: number; nombre_area: string }[];
  modalidades: { codigo_id: number; etiqueta: string }[];
  tipos: { codigo_id: number; etiqueta: string }[];
  resumen: {
    ofertas: number;
    carreras: number;
    instituciones: number;
    distritos: number;
  };
}
export interface Source {
  fuente_id: number;
  emisor_tipo: string;
  url: string;
  fecha_o_periodo_fuente: string;
  fecha_consulta: string;
}
export interface OfferDetail {
  oferta: Offer;
  fuentes: Source[];
  tarifas: {
    categoria: string;
    creditos_matriculados: number;
    tarifa_por_credito_pen: number;
    matricula_pen: number;
    periodo: string;
    aplicacion: string;
    fuente_id: number;
  }[];
}
export function duration(offer: Offer) {
  return offer.duracion_valor == null
    ? "Consulta la duración"
    : `${offer.duracion_valor} ${offer.duracion_unidad}`;
}

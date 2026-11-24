interface ProgramSource {
  curriculum: string;
  planLabel: string;
  years: string[][];
  focus: string;
  topics: string[];
  example: string;
}

const upnAdministration: ProgramSource = {
  curriculum:
    "https://www.upn.edu.pe/hubfs/brochure/ug-administracion.pdf?hsLang=es-pe",
  planLabel: "Plan de Administración de UPN",
  years: [
    [
      "Administración Contemporánea",
      "Gestión del Marketing Global",
      "Contabilidad y Análisis Financiero",
    ],
    [
      "Economía General para los Negocios",
      "Costos Empresariales y Presupuestos",
      "Gestión por Procesos y Automatización",
    ],
    [
      "Ciencia de Datos y Visualización",
      "Gestión Estratégica Corporativa",
      "Marco Legal Empresarial",
    ],
    [
      "Control y Auditoría Administrativa",
      "Estrategias Empresariales",
      "Formulación y Evaluación de Proyectos de Inversión",
    ],
    [
      "Gestión de Proyectos y Metodologías Ágiles",
      "Innovación y Transformación Digital en las Organizaciones",
      "Trabajo de Investigación",
    ],
  ],
  focus: "Administración, finanzas y operaciones",
  topics: ["Gestión", "Finanzas", "Operaciones"],
  example:
    "Organizar los recursos y procesos de un negocio para mejorar su operación.",
};

export const programSources: Partial<Record<number, ProgramSource>> = {
  33: upnAdministration,
  66: upnAdministration,
  128: {
    curriculum:
      "https://www.uch.edu.pe/facultades/ciencias-contables-economicas-y-financieras/administracion",
    planLabel: "Malla publicada por UCH",
    years: [
      [
        "Habilidades lectoras y comunicativas",
        "Habilidades digitales e inteligencia artificial",
        "Inteligencia Emocional",
      ],
      ["Macroeconomía", "Experiencias Creativas", "Contabilidad Empresarial"],
      [
        "Estadística y Probabilidades",
        "Gestión Pública",
        "Análisis de datos para la Investigación",
      ],
      [
        "Prácticas Preprofesionales I",
        "Prácticas Preprofesionales II",
        "Trabajo de Investigación II",
      ],
      [
        "People Analytics & Employee Experience",
        "Planeamiento Estratégico del Talento Humano",
        "Gestión Comercial y de Ventas",
      ],
    ],
    focus: "Gestión de organizaciones y personas",
    topics: ["Gestión pública", "Talento humano", "Análisis de datos"],
    example: "Proponer una mejora de gestión usando datos de una organización.",
  },
  9: {
    curriculum:
      "https://www.utp.edu.pe/sites/default/files/mallas/MALLA_Ingenieria_de_Sistemas_e_Informatica_3.pdf",
    planLabel: "Malla oficial · 10 ciclos",
    years: [
      [
        "Principios de Algoritmos",
        "Matemática Discreta",
        "Introducción a las TIC",
      ],
      [
        "Taller de Programación",
        "Programación Orientada a Objetos",
        "Base de Datos",
      ],
      [
        "Sistemas Operativos",
        "Análisis y Diseño de Sistemas de Información",
        "Gestión de Proyectos",
      ],
      [
        "Desarrollo Web Integrado",
        "Seguridad Informática",
        "Inteligencia de Negocios",
      ],
      ["Planeamiento Estratégico de TI"],
    ],
    focus: "Sistemas de información y desarrollo",
    topics: ["Diseño de sistemas", "Procesos", "Gestión de proyectos"],
    example:
      "Mejorar un proceso de una organización mediante un sistema de información.",
  },
  148: {
    curriculum:
      "https://www.ucss.edu.pe/images/fi/malla-curricular-ingenieria-de-sistemas-fi-ucss.pdf",
    planLabel: "Malla 2024 · 10 ciclos",
    years: [
      [
        "Fundamentos de Sistemas de Información y Ciencias de la Computación",
        "Algoritmos y Estructuras de Datos",
        "Física I",
      ],
      [
        "Programación Orientada a Objetos",
        "Programación de Computadoras I",
        "Base de Datos I",
      ],
      ["Ingeniería de Software I", "Sistemas Operativos", "Base de Datos II"],
      [
        "Gestión de Proyectos de TI",
        "Big Data",
        "Diseño y Gestión de Arquitectura Empresarial",
      ],
      [
        "Gerencia de Informática y Dirección Estratégica",
        "Gobierno de TI y Gobernanza de Datos",
      ],
    ],
    focus: "Software y gestión tecnológica",
    topics: ["Programación", "Datos", "Gestión de TI"],
    example:
      "Diseñar una solución digital para organizar datos y facilitar una operación.",
  },
};

export const utpCostSource =
  "https://www.utp.edu.pe/sites/default/files/2026-03/DPA-GU0697-Guia-del-Estudiante-Lima%20Norte-Pregrado-Marzo-2026.pdf";

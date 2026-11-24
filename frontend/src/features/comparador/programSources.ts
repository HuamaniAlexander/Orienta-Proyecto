interface ProgramSource {
  curriculum: string;
  planLabel: string;
  years: string[][];
  focus: string;
  topics: string[];
  example: string;
}

export const programSources: Partial<Record<number, ProgramSource>> = {
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

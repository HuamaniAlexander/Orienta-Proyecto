import { INTERESTS } from "./discovery";

export const sections = [
  "Actividades e intereses",
  "Situaciones de elección",
  "Entornos de trabajo",
  "Formas de aprender",
  "Motivaciones",
  "Condiciones de estudio",
];

interface Question {
  title: string;
  choices: string[];
  kind: "multiple" | "single" | "scale";
  interests?: (number | null)[];
}

const question = (
  title: string,
  choices: string[],
  kind: Question["kind"] = "multiple",
  interests?: Question["interests"],
): Question => ({ title, choices, kind, interests });

const scale = ["Nada", "Poco", "Algo", "Bastante", "Mucho"];
export const questions = [
  question(
    "¿Qué actividades te gustaría probar en tu tiempo libre?",
    [
      "Construir o reparar objetos",
      "Investigar cómo funcionan las cosas",
      "Crear imágenes, historias o diseños",
      "Ayudar a otras personas",
      "Organizar una actividad o un negocio",
      "Crear soluciones con tecnología",
    ],
    "multiple",
    [0, 5, 4, 3, 2, 1],
  ),
  question(
    "¿Qué temas te daría curiosidad conocer más a fondo?",
    [
      "Salud y bienestar",
      "Ciencia y naturaleza",
      "Arte y comunicación",
      "Negocios y organizaciones",
      "Tecnología y sistemas",
      "Construcción y producción",
    ],
    "multiple",
    [3, 5, 4, 2, 1, 0],
  ),
  question(
    "¿Qué tanto te gustaría investigar por qué ocurre un problema y buscar una explicación?",
    scale,
    "scale",
    [null, null, null, 5, 5],
  ),
  question(
    "¿Qué proyecto te gustaría explorar primero?",
    [
      "Construir un objeto útil",
      "Investigar una pregunta sobre la naturaleza",
      "Crear una pieza visual o una historia",
      "Organizar una actividad de apoyo a personas",
      "Planificar un pequeño emprendimiento",
      "Diseñar una aplicación o una solución digital",
    ],
    "single",
    [0, 5, 4, 3, 2, 1],
  ),
  question(
    "Tu colegio prepara una feria. ¿Qué te gustaría hacer?",
    [
      "Diseñar los afiches y la presentación",
      "Investigar un tema para explicarlo",
      "Organizar los recursos y el presupuesto",
      "Recibir y orientar a los visitantes",
      "Construir una maqueta o una demostración",
      "Crear el registro o la difusión digital",
    ],
    "multiple",
    [4, 5, 2, 3, 0, 1],
  ),
  question(
    "Un grupo necesita resolver un problema. ¿Cómo te gustaría contribuir?",
    [
      "Escuchar y comprender a las personas",
      "Revisar datos y buscar causas",
      "Proponer ideas visuales o creativas",
      "Organizar tareas y acuerdos",
      "Probar una solución con materiales",
      "Diseñar una herramienta tecnológica",
    ],
    "multiple",
    [3, 5, 4, 2, 0, 1],
  ),
  question(
    "Tu comunidad quiere mejorar un parque. ¿En qué te gustaría participar?",
    [
      "Diseñar cómo se verá el espacio",
      "Investigar qué necesita la comunidad",
      "Planificar recursos y presupuesto",
      "Coordinar y escuchar a los vecinos",
      "Construir o reparar elementos del parque",
      "Crear una herramienta digital para organizar el proyecto",
    ],
    "multiple",
    [4, 5, 2, 3, 0, 1],
  ),
  question(
    "Una persona inicia un pequeño negocio. ¿En qué te gustaría apoyarla?",
    [
      "Diseñar la identidad y la comunicación",
      "Investigar a sus posibles clientes",
      "Organizar costos, tareas y recursos",
      "Orientar y atender a las personas",
      "Mejorar cómo se elabora el producto",
      "Crear un catálogo o una herramienta digital",
    ],
    "multiple",
    [4, 5, 2, 3, 0, 1],
  ),
  question(
    "¿Qué entornos te gustaría conocer mediante una experiencia práctica?",
    [
      "Un taller o una planta de producción",
      "Un laboratorio o un espacio de investigación",
      "Un estudio creativo o de comunicación",
      "Un centro de atención a personas",
      "Una oficina de gestión o de negocios",
      "Un equipo de desarrollo tecnológico",
    ],
    "multiple",
    [0, 5, 4, 3, 2, 1],
  ),
  question(
    "¿Cómo te gustaría colaborar en un proyecto?",
    [
      "Trabajar de forma autónoma y compartir avances",
      "Trabajar con un equipo pequeño de manera continua",
      "Coordinar tareas entre varias personas",
      "Combinar trabajo individual y colaboración",
      "Todavía quiero explorar distintas formas de trabajar",
    ],
    "single",
  ),
  question(
    "¿Qué ritmo de actividades te gustaría experimentar?",
    [
      "Tareas organizadas con pasos claros",
      "Actividades variadas que cambian con frecuencia",
      "Un proyecto que pueda desarrollar a fondo",
      "Una combinación de tareas planificadas y situaciones nuevas",
    ],
    "single",
  ),
  question(
    "¿Con qué te gustaría trabajar más de cerca?",
    [
      "Personas y sus necesidades",
      "Datos y explicaciones",
      "Imágenes, textos e ideas",
      "Recursos y decisiones de una organización",
      "Materiales, herramientas y objetos",
      "Programas, dispositivos y sistemas",
    ],
    "multiple",
    [3, 5, 4, 2, 0, 1],
  ),
  question(
    "Cuando empiezas un tema nuevo, ¿qué te gustaría hacer primero?",
    [
      "Probar una actividad práctica",
      "Leer o escuchar una explicación inicial",
      "Observar cómo lo hace otra persona",
      "Conversar y hacer preguntas",
      "Combinar varias formas de acercarme al tema",
    ],
    "single",
  ),
  question(
    "Si un tema despierta tu curiosidad, ¿cómo te gustaría profundizar?",
    [
      "Investigar y contrastar información",
      "Experimentar y observar resultados",
      "Crear algo que use lo aprendido",
      "Explicarlo o discutirlo con otras personas",
      "Relacionarlo con un problema cotidiano",
      "Participar en un proyecto guiado",
    ],
  ),
  question("En un proyecto de aprendizaje, ¿qué parte te gustaría explorar?", [
    "Plantear preguntas y buscar información",
    "Proponer ideas y diseñar alternativas",
    "Organizar el plan y los recursos",
    "Construir o poner a prueba una solución",
    "Presentar y comunicar los resultados",
    "Revisar qué podría mejorarse",
  ]),
  question(
    "¿Qué combinación de actividades te gustaría encontrar al estudiar?",
    [
      "Más actividades prácticas y aplicación",
      "Más lectura, análisis y discusión",
      "Más creación y desarrollo de proyectos",
      "Una combinación equilibrada",
      "Quiero conocer distintas formas antes de decidir",
    ],
    "single",
  ),
  question(
    "¿Qué te gustaría aportar con tu trabajo en el futuro?",
    [
      "Mejorar el bienestar de las personas",
      "Comprender problemas y producir conocimiento",
      "Crear propuestas culturales o comunicativas",
      "Organizar iniciativas y generar oportunidades",
      "Construir o mejorar productos y espacios",
      "Desarrollar soluciones tecnológicas",
    ],
    "multiple",
    [3, 5, 4, 2, 0, 1],
  ),
  question(
    "¿Qué te haría sentir satisfacción al terminar un proyecto?",
    [
      "Haber ayudado a alguien",
      "Haber comprendido algo nuevo",
      "Haber creado una propuesta original",
      "Haber organizado bien al equipo y los recursos",
      "Haber construido algo que funciona",
      "Haber resuelto un problema con tecnología",
    ],
    "multiple",
    [3, 5, 4, 2, 0, 1],
  ),
  question(
    "¿Qué retos te gustaría aprender a afrontar?",
    [
      "Comprender situaciones de otras personas",
      "Investigar problemas sin una respuesta evidente",
      "Comunicar una idea de forma original",
      "Tomar decisiones y organizar recursos",
      "Mejorar el funcionamiento de un objeto o proceso",
      "Crear o adaptar una solución digital",
    ],
    "multiple",
    [3, 5, 4, 2, 0, 1],
  ),
  question("¿Qué te motivaría a seguir explorando una carrera?", [
    "Conocer las actividades que realizaría",
    "Comprender los problemas que podría abordar",
    "Ver proyectos de estudiantes y profesionales",
    "Conocer cómo contribuye a otras personas",
    "Entender su relación con mis intereses",
    "Probar una experiencia relacionada con esa carrera",
  ]),
  question("¿En qué distrito te gustaría estudiar?", []),
  question("¿Qué modalidades de estudio considerarías?", [
    "Presencial",
    "Semipresencial",
    "Virtual",
    "Quiero conocer las opciones antes de elegir",
  ]),
  question("¿En qué horarios podrías estudiar?", [
    "Por las mañanas",
    "Por las tardes",
    "Por las noches",
    "Los fines de semana",
    "Mi disponibilidad puede cambiar",
  ]),
  question("¿Qué condiciones podrías ajustar para explorar más alternativas?", [
    "Considerar otros distritos",
    "Considerar otra modalidad",
    "Reorganizar parte de mi horario",
    "Mantener mis condiciones actuales",
    "Quiero revisar mis condiciones antes de decidir",
  ]),
];

export function selectedInterests(answers: Record<number, number[]>) {
  const scores = INTERESTS.map(() => 0);
  questions.forEach(({ interests }, index) => {
    for (const choice of answers[index] ?? []) {
      const interest = interests?.[choice];
      if (interest != null) scores[interest]++;
    }
  });
  const highest = Math.max(...scores);
  return INTERESTS.filter(
    (_, index) => scores[index] === highest && highest > 0,
  ).map(({ label }) => label);
}

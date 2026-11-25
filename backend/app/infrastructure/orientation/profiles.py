from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from app.application.orientation import Advisor, Slot


def default_advisors() -> list[Advisor]:
    tomorrow = datetime.now(ZoneInfo("America/Lima")).replace(
        hour=0, minute=0, second=0, microsecond=0,
    ) + timedelta(days=1)

    catalog = [
        (
            "ana-torres",
            "Ana Torres",
            "Ingeniería de Sistemas y Tecnología",
            "/images/orientadores/ana.jpg",
            "Sesión individual de 30 minutos por Zoom para revisar mallas, proyectos universitarios y salida laboral en tecnología.",
            [
                "Proyectos y vida universitaria en tecnología",
                "Diferencias entre Ingeniería de Sistemas, Software y Computación",
                "Campo laboral y primeros pasos en programación",
            ],
            (10, 11, 16, 17),
        ),
        (
            "luis-mendoza",
            "Luis Mendoza",
            "Administración, Contabilidad y Negocios",
            "/images/orientadores/luis.jpg",
            "Sesión individual de 30 minutos por Zoom enfocada en gestión empresarial, finanzas, marketing y emprendimiento.",
            [
                "Gestión de proyectos y áreas de trabajo",
                "Diferencias entre formación técnica y universitaria en negocios",
                "Emprendimiento y desarrollo profesional",
            ],
            (9, 11, 15, 18),
        ),
        (
            "valeria-rojas",
            "Valeria Rojas",
            "Psicología y Ciencias de la Salud",
            "/images/orientadores/valeria.jpg",
            "Sesión individual de 30 minutos por Zoom para orientar sobre vocación, prácticas clínicas y formación en salud.",
            [
                "Áreas de especialización en Psicología y Salud",
                "Prácticas preprofesionales e internado",
                "Organización del estudio y carga académica",
            ],
            (10, 12, 16, 18),
        ),
        (
            "carlos-paredes",
            "Carlos Paredes",
            "Derecho y Comunicaciones",
            "/images/orientadores/carlos.jpg",
            "Sesión individual de 30 minutos por Zoom para resolver dudas sobre ramas del Derecho, medios digitales y comunicación.",
            [
                "Especialidades en Derecho y gestión pública",
                "Comunicación audiovisual, periodismo y medios digitales",
                "Habilidades clave y campo laboral en Lima Norte",
            ],
            (9, 14, 17, 19),
        ),
        (
            "sofia-quispe",
            "Sofía Quispe",
            "Ingeniería Industrial, Civil y Arquitectura",
            "/images/orientadores/sofia.jpg",
            "Sesión individual de 30 minutos por Zoom sobre diseño, obras, procesos productivos y logística.",
            [
                "Diferencias entre Ingeniería Industrial, Civil y Arquitectura",
                "Laboratorios, talleres y herramientas de diseño",
                "Proyección laboral en industria y construcción",
            ],
            (10, 15, 17, 18),
        ),
    ]

    return [
        Advisor(
            id=identifier,
            name=name,
            focus=focus,
            conditions=conditions,
            response_window="Respuesta por escrito en menos de 24 horas hábiles.",
            photo_url=photo_url,
            topics=topics,
            duration_minutes=30,
            active=True,
            accepts_text=True,
            slots=[
                Slot(
                    id=f"{(tomorrow + timedelta(days=offset)).date()}-{hour:02d}",
                    starts_at=tomorrow + timedelta(days=offset, hours=hour),
                )
                for offset in range(6)
                for hour in hours
            ],
        )
        for identifier, name, focus, photo_url, conditions, topics, hours in catalog
    ]

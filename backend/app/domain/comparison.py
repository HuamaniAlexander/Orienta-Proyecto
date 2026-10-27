from dataclasses import dataclass

from app.domain.catalog import AcademicOffer


class InvalidComparison(Exception):
    pass


@dataclass(frozen=True)
class ComparisonRow:
    key: str
    title: str
    a: str | None
    b: str | None
    different: bool
    editorial: bool = False


@dataclass(frozen=True)
class Comparison:
    opciones: list[AcademicOffer]
    criterios: list[ComparisonRow]
    misma_carrera: bool
    explicacion: str
    diferencia_duracion: str | None
    pendientes: list[str]


def compare_offers(a: AcademicOffer, b: AcademicOffer) -> Comparison:
    if a.oferta_id == b.oferta_id:
        raise InvalidComparison("Elige dos opciones académicas diferentes.")
    rows = []
    for key, title, editorial in [
        ("carrera_oficial", "Carrera", False),
        ("enfoque_editorial", "Enfoque de estudio", True),
        ("ambitos_editoriales", "Ámbitos de actividad", True),
        ("modalidad", "Modalidad", False),
        ("distrito", "Distrito", False),
        ("institucion", "Institución", False),
        ("tipo", "Tipo de institución", False),
        ("sede", "Sede", False),
        ("nivel", "Nivel formativo", False),
        ("gestion", "Gestión", False),
    ]:
        left, right = getattr(a, key), getattr(b, key)
        rows.append(ComparisonRow(key, title, left, right, left != right, editorial))
    def duration(offer: AcademicOffer) -> str | None:
        return None if offer.duracion_valor is None else f"{offer.duracion_valor:g} {offer.duracion_unidad}"
    rows.insert(3, ComparisonRow("duracion", "Duración publicada", duration(a), duration(b), duration(a) != duration(b)))
    rows.insert(4, ComparisonRow("costos", "Costo de enseñanza", a.consulta_costos, b.consulta_costos, a.consulta_costos != b.consulta_costos))
    delta = None
    if a.duracion_valor is not None and b.duracion_valor is not None and a.duracion_unidad == b.duracion_unidad:
        difference = abs(a.duracion_valor - b.duracion_valor)
        delta = f"Diferencia: {difference:g} {a.duracion_unidad}." if difference else "Las duraciones publicadas coinciden."
    same = a.carrera_id == b.carrera_id
    return Comparison(
        [a, b], rows, same,
        "Comparas dos ofertas de la misma carrera: revisa institución, distrito, modalidad y duración."
        if same else "Comparas carreras distintas: empieza por su enfoque y luego revisa cómo se ofrece cada una.",
        delta,
        ["Requisitos de admisión", "Malla curricular", "Perfil de egreso", "Prácticas",
         "Acreditaciones", "Convenios", "Horarios", "Bolsa laboral y empleabilidad"],
    )

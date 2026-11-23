"""Manage assigned requests from the service host."""
import argparse
import json
import sys
from uuid import UUID

from app.infrastructure.orientation.store import OrientationStore
from app.infrastructure.settings import Settings


def main() -> None:
    parser = argparse.ArgumentParser(description="Gestionar solicitudes de ORIENTA")
    parser.add_argument("advisor_id")
    parser.add_argument("--request", type=UUID)
    parser.add_argument("--status", choices=["confirmada", "respondida", "rechazada"])
    args = parser.parse_args()
    settings = Settings()
    if not settings.orientation_db_path or not settings.orientation_profiles_path:
        parser.error("Configura las rutas de Conecta.")
    store = OrientationStore(settings.orientation_db_path, settings.orientation_profiles_path)
    if not args.request and not args.status:
        print(json.dumps(store.inbox(args.advisor_id), ensure_ascii=False, indent=2))
        return
    if not args.request or not args.status:
        parser.error("Indica --request y --status.")
    message = sys.stdin.read(1601).strip() if not sys.stdin.isatty() else ""
    if len(message) > 1600:
        parser.error("El mensaje supera los 1600 caracteres.")
    try:
        if not store.resolve(args.advisor_id, args.request, args.status, message or None):
            parser.error("No hay una solicitud recibida para ese orientador y canal.")
    except ValueError as error:
        parser.error(str(error))


if __name__ == "__main__":
    main()

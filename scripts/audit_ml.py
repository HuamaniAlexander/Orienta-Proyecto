"""Inspect an ORIENTA archive without loading executable model objects."""

import argparse
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile


def audit(archive: Path, excel: Path) -> dict[str, object]:
    with ZipFile(archive) as package:
        names = package.namelist()
        if len(names) != len(set(names)):
            raise ValueError("Duplicate archive entries")
        if any(item.file_size > 50_000_000 for item in package.infolist()):
            raise ValueError("Archive entry exceeds review size limit")
        manifest = json.loads(package.read("sha256_archivos.json"))
        for name, expected in manifest.items():
            if hashlib.sha256(package.read(name)).hexdigest() != expected:
                raise ValueError(f"Invalid SHA-256: {name}")
        metadata = json.loads(package.read("metadatos.json"))
        if hashlib.sha256(excel.read_bytes()).hexdigest() != metadata["excel_sha256"]:
            raise ValueError("Excel does not match training dataset")
        metrics = json.loads(package.read("metricas.json"))
        return {
            "verified_files": len(manifest),
            "excel_matches": True,
            "metadata": metadata,
            "model_metrics": metrics["modelo"],
            "baseline_metrics": metrics["referencia_mayoritaria"],
        }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("excel", type=Path)
    arguments = parser.parse_args()
    print(json.dumps(audit(arguments.archive, arguments.excel), ensure_ascii=True, indent=2))

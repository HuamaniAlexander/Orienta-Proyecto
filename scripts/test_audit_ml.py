import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

from audit_ml import audit


class AuditTests(unittest.TestCase):
    def test_rejects_corrupted_model_without_loading_it(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            archive = Path(directory) / "models.zip"
            with ZipFile(archive, "w") as package:
                package.writestr("model.joblib", b"corrupted")
                package.writestr(
                    "sha256_archivos.json",
                    json.dumps({"model.joblib": hashlib.sha256(b"original").hexdigest()}),
                )
            with self.assertRaisesRegex(ValueError, "Invalid SHA-256"):
                audit(archive, Path(directory) / "unused.xlsx")

    def test_rejects_different_excel(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            archive = Path(directory) / "models.zip"
            excel = Path(directory) / "data.xlsx"
            excel.write_bytes(b"different dataset")
            with ZipFile(archive, "w") as package:
                package.writestr("sha256_archivos.json", "{}")
                package.writestr(
                    "metadatos.json", json.dumps({"excel_sha256": "wrong"})
                )
            with self.assertRaisesRegex(ValueError, "Excel does not match"):
                audit(archive, excel)


if __name__ == "__main__":
    unittest.main()

from typing import Any, Protocol


class ContentAnalyzer(Protocol):
    metadata: dict[str, Any]

    def classify(self, name: str) -> dict[str, Any]: ...

    def compare(self, first_id: int, second_id: int, interests: str) -> dict[str, Any]: ...

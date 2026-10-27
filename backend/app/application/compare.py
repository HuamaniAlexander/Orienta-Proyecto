import asyncio

from app.application.ports import CatalogRepository
from app.domain.comparison import Comparison, InvalidComparison, compare_offers


class Compare:
    def __init__(self, repository: CatalogRepository):
        self.repository = repository

    async def execute(self, first_id: int, second_id: int) -> Comparison:
        if first_id == second_id:
            raise InvalidComparison("Elige dos opciones académicas diferentes.")
        first, second = await asyncio.gather(self.repository.get(first_id), self.repository.get(second_id))
        return compare_offers(first, second)

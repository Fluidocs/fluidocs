from typing import Protocol


class ProvedorEmbeddings(Protocol):
    async def async_embed(
        self, 
        data: str | list[str]
    ) -> list[float]:
        ...
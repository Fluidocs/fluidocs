from typing import Protocol


class ProvedorEmbeddings(Protocol):
    async def gerar_consulta(
        self, 
        data: str
    ) -> list[float]:
        ...
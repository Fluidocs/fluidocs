from ollama import AsyncClient, Client
from typing import List

class ServicoEmbeddings:
    def __init__(self, client: AsyncClient, model: str):
        self._client = client
        self._model = model


    async def async_embed(
        self, 
        data: str | List[str]
    ) -> List[float]:
        response = await self._client.embed(
            model=self._model,
            input=data
        )

        return response.embeddings[0]


    def embed(
        self,
        client: Client,
        data: str | List[str]
    ) -> List[float]:
        response = client.embed(
            model=self._model,
            input=data
        )

        return response.embeddings[0]

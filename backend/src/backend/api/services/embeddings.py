from typing import cast, overload

from ollama import AsyncClient, Client


class ServicoEmbeddings:
    def __init__(self, client: AsyncClient | Client, model: str):
        self._client = client
        self._model = model

    @overload
    async def async_embed(self, data: str) -> list[float]: ...

    @overload
    async def async_embed(self, data: list[str]) -> list[list[float]]: ...

    async def async_embed(
        self,
        data: str | list[str],
    ) -> list[float] | list[list[float]]:
        client = cast(AsyncClient, self._client)
        response = await client.embed(
            model=self._model,
            input=data,
        )

        embeddings = [list(embedding) for embedding in response.embeddings]
        return embeddings[0] if isinstance(data, str) else embeddings

    @overload
    def embed(self, data: str) -> list[float]: ...

    @overload
    def embed(self, data: list[str]) -> list[list[float]]: ...

    def embed(
        self,
        data: str | list[str],
    ) -> list[float] | list[list[float]]:
        client = cast(Client, self._client)
        response = client.embed(
            model=self._model,
            input=data,
        )

        embeddings = [list(embedding) for embedding in response.embeddings]
        return embeddings[0] if isinstance(data, str) else embeddings

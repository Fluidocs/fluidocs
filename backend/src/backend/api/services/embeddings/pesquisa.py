from ollama import AsyncClient

class ProvedorEmbeddingsPesquisa:
    _INSTRUCTION = (
        'Given a user search query in Portuguese, '
        'retrieve passages from documents that best answer it.'
    )

    def __init__(self, cliente: AsyncClient, modelo: str):
        self._cliente: AsyncClient = cliente
        self._modelo: str = modelo


    async def gerar_consulta(
        self,
        pesquisa: str,
    ) -> list[float]:
        query = (
            f'Instruct: {self._INSTRUCTION}\n'
            f'Query: {pesquisa}'
        )
        
        response = await self._cliente.embed(
            model=self._modelo,
            input=query
        )

        return response.embeddings[0] 

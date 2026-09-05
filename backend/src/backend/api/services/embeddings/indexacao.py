from ollama import Client

class ProvedorEmbeddingsIndexacao:
    def __init__(self, cliente: Client, modelo: str):
        self._cliente: Client = cliente
        self._modelo: str = modelo

    def gerar_embeddings(
        self,
        text: str | list[str]
    ) -> list[float] | list[list[float]]:
        response = self._cliente.embed(
            model=self._modelo,
            input=text
        )

        return response.embeddings

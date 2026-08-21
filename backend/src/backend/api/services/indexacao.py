from elasticsearch import AsyncElasticsearch

class ServicoIndexacao:
    def __init__(
        self, 
        cliente: AsyncElasticsearch, 
        nome_indice: str, 
    ):
        self._client = cliente
        self.nome_indice = nome_indice

    # [TODO] Implementar indexação de arquivos
    # - 1. Extrair conteúdo
    # - 2. Gerar Embeddings
    # - 3. Bulk Index (elasticsearch)
    def indexar():
        pass

    # [TODO] Implementar indexação em lote 
    def indexar_em_lote():
        pass
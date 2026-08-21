from .base_strategy import BasePesquisaStrategy
from ..contexto import ContextoPesquisa, ConfiguracaoPesquisaHibrida
from ..provedor_embeddings import ProvedorEmbeddings
from ..formatacao.tipos import ResultadoPesquisa

class PesquisaHibrida(BasePesquisaStrategy):
    def __init__(
        self,
        contexto: ContextoPesquisa,
        embeddings: ProvedorEmbeddings,
        configuracao: ConfiguracaoPesquisaHibrida
    ):
        super().__init__(contexto)

        self._embeddings = embeddings
        self._config = configuracao


    async def pesquisar(
        self,
        pesquisa: str,
        pagina: int = 1,
        tamanho: int = 10
    ) -> ResultadoPesquisa:
        offset = (pagina - 1) * tamanho
        qtd_vizinhos = offset + tamanho

        vetor_pesquisa = await self._embeddings.async_embed(pesquisa)

        response = await self._context.client.search(
            index=self._context.nome_indice,
            from_=offset,
            size=tamanho,
            query={
                "bool": {
                    "minimum_should_match": 1,
                    "should": [
                        {
                            "match": {
                                "conteudo": {
                                    "query": pesquisa,
                                    "fuzziness": "AUTO",
                                    "boost": self._config.boost_literal,
                                }
                            }
                        }
                    ],
                }
            },
            knn={
                "field": "embeddings",
                "query_vector": vetor_pesquisa,
                "k": qtd_vizinhos,
                "num_candidates": max(
                    qtd_vizinhos,
                    self._config.numero_candidatos
                ),
                "boost": self._config.boost_vetorial
            },
            collapse=self._collapse(),
            aggs=self._aggregate(),
        )

        return self._formatar_resultado(
            response,
            pagina,
            tamanho
        )

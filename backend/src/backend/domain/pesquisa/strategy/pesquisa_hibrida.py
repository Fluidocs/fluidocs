from .base_strategy import BasePesquisaStrategy
from ..contexto import ContextoPesquisa, ConfiguracaoPesquisaHibrida
from ..provedor_embeddings import ProvedorEmbeddings
from ..formatacao.tipos import ResultadoPesquisa
from typing import Any

class PesquisaHibrida(BasePesquisaStrategy):
    _K_VETORIAL_MINIMO = 100
    _FATOR_VIZINHOS_POR_RESULTADO = 10
    _FATOR_NUMERO_CANDIDATOS = 3
    _LIMITE_KNN = 10_000
    _SATURACAO_BM25 = 8.0

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

        params: dict[str, Any] = {
            'index': self._context.nome_indice,
            'from_': offset,
            'size': tamanho,
            'collapse': self._collapse(),
            'aggs': self._aggregate()
        }

        if self._config.boost_literal > 0:
            params['query'] = ( self._construir_busca_literal(pesquisa) )

        if self._config.boost_vetorial > 0:
            vetor_pesquisa = await self._embeddings.async_embed(pesquisa)

            params['knn'] = self._construir_busca_vetorial(vetor_pesquisa, offset, tamanho)

        response = await self._context.client.search(**params)

        return self._formatar_resultado(
            response,
            pagina,
            tamanho
        )


    def _construir_busca_literal(
        self, 
        pesquisa: str
    ) -> dict[str, Any]:
        return {
            'function_score': {
                'query': {
                    'match': {
                        'conteudo': {
                            'query': pesquisa,
                            'fuzziness': 'AUTO'
                        }
                    }
                },
                'script_score': {
                    'script': {
                        'source': '''
                            double score = _score;
                            return params.boost * (score / (score + params.saturacao))
                        ''',
                        'params': {
                            'boost': self._config.boost_literal,
                            'saturacao': self._SATURACAO_BM25
                        }
                    }
                },
                'boost_mode': 'replace'
            }
        }


    def _construir_busca_vetorial(
        self,
        vetor: list[float],
        offset: int,
        tamanho: int
    ) -> dict[str, Any]:
        qtd_resultados = offset + tamanho
        k_vetorial = max(self._K_VETORIAL_MINIMO, qtd_resultados * self._FATOR_VIZINHOS_POR_RESULTADO)
        k_vetorial = min(k_vetorial, self._LIMITE_KNN)
        numero_candidatos = max(k_vetorial, k_vetorial * self._FATOR_NUMERO_CANDIDATOS)
        numero_candidatos = min(numero_candidatos, self._LIMITE_KNN)
        
        return {
            'field': 'embeddings',
            'query_vector': vetor,
            'k': k_vetorial,
            'num_candidates': numero_candidatos,
            'boost': self._config.boost_vetorial
        }

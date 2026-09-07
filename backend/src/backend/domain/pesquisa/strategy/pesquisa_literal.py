from .base_strategy import BasePesquisaStrategy
from ..formatacao.tipos import ResultadoPesquisa


class PesquisaLiteral(BasePesquisaStrategy):
    _SATURACAO_BM25 = 8.0

    async def pesquisar(
        self,
        pesquisa: str,
        pagina: int = 1,
        tamanho: int = 10
    ) -> ResultadoPesquisa:
        offset = (pagina - 1) * tamanho
        
        response = await self._context.client.search(
            index=self._context.nome_indice,
            from_=offset,
            size=tamanho,
            query={
                'function_score': {
                    'query': self._aplicar_filtro_fontes_dados({
                        'match': {
                            'conteudo': {
                                'query': pesquisa,
                                'fuzziness': 'AUTO',
                                'prefix_length': 1
                            }
                        }
                    }),
                    'script_score': {
                        'script': {
                            'source': '''
                                double score = _score;
                                return score / (score + params.saturacao);
                            ''',
                            'params': {
                                'saturacao': self._SATURACAO_BM25
                            }
                        }
                    },
                    'boost_mode': 'replace'
                }
            },
            collapse=self._collapse(),
            aggs=self._aggregate(),
        )

        return self._formatar_resultado(
            response,
            pagina,
            tamanho
        )

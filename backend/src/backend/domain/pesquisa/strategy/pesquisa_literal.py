from .base_strategy import BasePesquisaStrategy
from ..formatacao.tipos import ResultadoPesquisa


class PesquisaLiteral(BasePesquisaStrategy):
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
                'bool': {
                    'must': [
                        {
                            'match': {
                                'conteudo': {
                                    'query': pesquisa,
                                    'fuzziness': 'AUTO',
                                    'prefix_length': 1,
                                    'boost': 1.0
                                }
                            }
                        }
                    ]
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
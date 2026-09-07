from abc import ABC, abstractmethod

from ..contexto import ContextoPesquisa
from ..formatacao.tipos import ResultadoPesquisa
from ..formatacao.formatador_resultados import FormatadorResultados

class BasePesquisaStrategy(ABC):
    def __init__(self, contexto: ContextoPesquisa):
        self._context = contexto


    def _collapse(self) -> dict:
        return {
            "field": "documento_id",
            "inner_hits": {
                "name": "best_scores",
                "size": 5,
                "sort": [
                    {"_score": "desc"}
                ],
            },
        }


    def _aggregate(self) -> dict:
        return {
            "total_documentos_unicos": {
                "cardinality": {
                    "field": "documento_id"
                }
            }
        }

    def _filtro_fontes_dados(self) -> dict | None:
        if not self._context.fonte_dados_ids:
            return None

        return {
            'terms': {
                'fonte_dados_id': list(self._context.fonte_dados_ids),
            }
        }

    def _aplicar_filtro_fontes_dados(self, query: dict) -> dict:
        filtro = self._filtro_fontes_dados()
        if filtro is None:
            return query

        return {
            'bool': {
                'must': [query],
                'filter': [filtro],
            }
        }

    def _formatar_resultado(
        self,
        resposta: dict,
        pagina: int,
        tamanho: int,
    ) -> ResultadoPesquisa:
        return FormatadorResultados.formatar(
            resposta=resposta,
            pagina=pagina,
            tamanho=tamanho,
        )
    
    @abstractmethod
    async def pesquisar(
        self,
        pesquisa: str,
        pagina: int = 1,
        tamanho: int = 10
    ) -> ResultadoPesquisa:
        raise NotImplementedError

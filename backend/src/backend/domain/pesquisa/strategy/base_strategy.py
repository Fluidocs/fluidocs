from abc import ABC, abstractmethod

from ..contexto import ContextoPesquisa
from ..formatacao.tipos import ResultadoPesquisa
from ..formatacao.formatador_resultados import FormatadorResultados

class BasePesquisaStrategy(ABC):
    def __init__(self, contexto: ContextoPesquisa):
        self._context = contexto


    def _collapse(self) -> dict:
        return {
            "field": "nome_documento",
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
                    "field": "nome_documento"
                }
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

import math
from typing import Any

from .tipos import (
    DocumentoPesquisa,
    PaginacaoPesquisa,
    ResultadoPesquisa,
    TrechoPesquisa,
)


class FormatadorResultados:
    @classmethod
    def formatar(
        cls,
        resposta: dict[str, Any],
        pagina: int,
        tamanho: int,
    ) -> ResultadoPesquisa:
        hits = resposta["hits"]["hits"]
        total = resposta["aggregations"][
            "total_documentos_unicos"
        ]["value"]

        return ResultadoPesquisa(
            documentos=[
                cls._formatar_documento(hit)
                for hit in hits
            ],
            paginacao=cls._criar_paginacao(
                total=total,
                pagina=pagina,
                tamanho=tamanho,
            ),
        )

    @classmethod
    def _formatar_documento(
        cls,
        hit: dict[str, Any],
    ) -> DocumentoPesquisa:
        source = hit["_source"]

        inner_hits = (
            hit.get("inner_hits", {})
            .get("best_scores", {})
            .get("hits", {})
            .get("hits", [])
        )

        return DocumentoPesquisa(
            fonte_dados_id=source["fonte_dados_id"],
            documento_id=source["documento_id"],
            nome_documento=source["nome_documento"],
            pontuacao=hit.get("_score") or 0.0,
            trechos=[
                cls._formatar_trecho(inner_hit)
                for inner_hit in inner_hits
            ],
        )

    @staticmethod
    def _formatar_trecho(
        hit: dict[str, Any],
    ) -> TrechoPesquisa:
        source = hit["_source"]

        return TrechoPesquisa(
            id_trecho=source.get("id_trecho"),
            conteudo=source.get("conteudo"),
            pontuacao=hit.get("_score") or 0.0,
        )

    @staticmethod
    def _criar_paginacao(
        total: int,
        pagina: int,
        tamanho: int,
    ) -> PaginacaoPesquisa:
        return PaginacaoPesquisa(
            total=total,
            pagina=pagina,
            por_pagina=tamanho,
            paginas=math.ceil(total / tamanho) if total else 0,
        )

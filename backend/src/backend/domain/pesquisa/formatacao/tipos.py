from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class TrechoPesquisa:
    id_trecho: int | None
    conteudo: str | None
    pontuacao: float


@dataclass(frozen=True, slots=True)
class DocumentoPesquisa:
    fonte_dados_id: int
    documento_id: str
    nome_documento: str
    pontuacao: float
    trechos: list[TrechoPesquisa]


@dataclass(frozen=True, slots=True)
class PaginacaoPesquisa:
    total: int
    pagina: int
    por_pagina: int
    paginas: int


@dataclass(frozen=True, slots=True)
class ResultadoPesquisa:
    documentos: list[DocumentoPesquisa]
    paginacao: PaginacaoPesquisa

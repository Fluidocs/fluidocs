from dataclasses import dataclass
from elasticsearch import AsyncElasticsearch
from math import isclose

@dataclass(frozen=True, slots=True)
class ContextoPesquisa:
    client: AsyncElasticsearch
    nome_indice: str
    fonte_dados_ids: tuple[int, ...] = ()


@dataclass(frozen=True, slots=True)
class ConfiguracaoPesquisaHibrida:
    boost_literal: float = 0.4
    boost_vetorial: float = 0.6

    def __post_init__(self) -> None:
        if not 0 <= self.boost_literal <= 1:
            raise ValueError(
                "boost_literal deve estar entre 0 e 1."
            )

        if not 0 <= self.boost_vetorial <= 1:
            raise ValueError(
                "boost_vetorial deve estar entre 0 e 1."
            )

        if not isclose(
            self.boost_literal + self.boost_vetorial,
            1.0,
            abs_tol=1e-6,
        ):
            raise ValueError(
                "A soma dos boosts deve ser igual a 1."
            )

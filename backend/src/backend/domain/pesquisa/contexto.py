from dataclasses import dataclass
from elasticsearch import AsyncElasticsearch


@dataclass(frozen=True, slots=True)
class ContextoPesquisa:
    client: AsyncElasticsearch
    nome_indice: str


@dataclass(frozen=True, slots=True)
class ConfiguracaoPesquisaHibrida:
    boost_literal: float = 0.2
    boost_vetorial: float = 2.5
    numero_candidatos: int = 100
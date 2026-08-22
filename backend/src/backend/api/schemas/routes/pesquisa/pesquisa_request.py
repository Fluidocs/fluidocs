from pydantic import BaseModel, Field
from fastapi import Query

from backend.domain.pesquisa.tipos import TipoPesquisa  


class ConfiguracaoHibridaRequest(BaseModel):
    boost_literal: float = Field(default=0.2, ge=0)
    boost_vetorial: float = Field(default=2.5, ge=0)
    numero_candidatos: int = Field(default=100, ge=1, le=10_000)


class PesquisaRequest(BaseModel):
    nome_indice: str = Field(examples=['documentos'], min_length=3)
    q: str = Field(min_length=1)
    tipo_pesquisa: TipoPesquisa = TipoPesquisa.HIBRIDA
    pagina: int = Field(default=1, ge=1)
    tamanho: int = Field(default=10, ge=1, le=100)
    configuracao_hibrida: ConfiguracaoHibridaRequest = Field(
        default_factory=ConfiguracaoHibridaRequest
    )
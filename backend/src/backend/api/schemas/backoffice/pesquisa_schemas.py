from pydantic import BaseModel, Field, field_validator, model_validator
from math import isclose
from typing import Annotated

from backend.domain.pesquisa.tipos import TipoPesquisa  


FonteDadosId = Annotated[int, Field(gt=0)]


class ConfiguracaoHibridaRequest(BaseModel):
    boost_literal: float = Field(
        default=0.4, 
        ge=0,
        le=1,
        description=(
            'Peso percentual da pesquisa literal, entre 0 e 1.'
        )
    )
    boost_vetorial: float = Field(
        default=0.6, 
        ge=0,
        le=1,
        description=(
            'Peso percentual da pesquisa vetorial, entre 0 e 1.'
        )
    )

    @model_validator(mode='after')
    def validar_soma(
        self
    ) -> 'ConfiguracaoHibridaRequest':
        if not isclose(
            self.boost_literal + self.boost_vetorial,
            1.0,
            abs_tol=1e-6
        ):
            raise ValueError('boost_literal + boost vetorial deve ser igual a 1.')

        return self


class PesquisaRequest(BaseModel):
    q: str = Field(min_length=1)
    fonte_dados_ids: list[FonteDadosId] = Field(
        default_factory=list,
        description=(
            'Lista de fontes de dados. Quando omitida, '
            'pesquisa em todas as fontes do usuário.'
        ),
    )
    tipo_pesquisa: TipoPesquisa = TipoPesquisa.HIBRIDA
    pagina: int = Field(default=1, ge=1)
    tamanho: int = Field(default=10, ge=1, le=100)
    configuracao_hibrida: ConfiguracaoHibridaRequest = Field(
        default_factory=ConfiguracaoHibridaRequest
    )

    @field_validator('fonte_dados_ids')
    @classmethod
    def normalizar_fonte_dados_ids(cls, valor: list[int]) -> list[int]:
        return list(dict.fromkeys(valor))


class TrechoPesquisaResponse(BaseModel):
    id_trecho: int | None
    conteudo: str | None
    pontuacao: float


class DocumentoPesquisaResponse(BaseModel):
    fonte_dados_id: int
    documento_id: str
    nome_documento: str
    pontuacao: float
    trechos: list[TrechoPesquisaResponse]

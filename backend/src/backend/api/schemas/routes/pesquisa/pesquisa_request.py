from pydantic import BaseModel, Field, model_validator
from math import isclose

from backend.domain.pesquisa.tipos import TipoPesquisa  


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
    nome_indice: str = Field(examples=['documentos'], min_length=3)
    q: str = Field(min_length=1)
    tipo_pesquisa: TipoPesquisa = TipoPesquisa.HIBRIDA
    pagina: int = Field(default=1, ge=1)
    tamanho: int = Field(default=10, ge=1, le=100)
    configuracao_hibrida: ConfiguracaoHibridaRequest = Field(
        default_factory=ConfiguracaoHibridaRequest
    )
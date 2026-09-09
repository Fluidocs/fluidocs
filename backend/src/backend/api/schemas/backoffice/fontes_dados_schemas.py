from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional


class FonteDadosCreateRequest(BaseModel):
    nome: str = Field(
        examples=['Documentos RH'],
        max_length=100
    )
    descricao: Optional[str] = Field(
        examples=['Organizar contratos, regras de comportamento, comunicados, etc...'],
        max_length=250
    )


class FonteDadosUpdateRequest(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None


class FonteDadosResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    descricao: str
    data_criacao: datetime
    data_atualizacao: datetime
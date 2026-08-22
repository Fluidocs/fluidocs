from pydantic import BaseModel, Field
from typing import Generic, TypeVar, Optional
from datetime import datetime
from uuid import UUID, uuid4    

T = TypeVar('T')

class MetaSchema(BaseModel):
    data_requisicao: datetime = Field(default_factory=datetime.now)
    tempo_execucao: Optional[float] = Field(examples=[0.09544], default=None)
    id_requisicao: UUID = Field(default_factory=uuid4)

class PaginacaoSchema(BaseModel):
    total: int
    pagina: int
    por_pagina: int
    paginas: int

class BaseResponse(BaseModel, Generic[T]):
    meta: MetaSchema = Field(default_factory=MetaSchema)
    dados: T
    paginacao: Optional[PaginacaoSchema] = None

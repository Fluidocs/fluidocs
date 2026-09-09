from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CredencialIntegracaoCreate(BaseModel):
    access_token: str
    refresh_token: str
    data_expiracao: datetime = Field(examples=["2027-01-01T12:33:00"])
    organizacao_id: Optional[int] = Field(examples=[1, 2, 23, 234, 2234])
    integracao_id: Optional[int] = Field(examples=[1, 2, 23, 234, 2234])


class CredencialIntegracaoUpdate(BaseModel):
    organizacao_id: Optional[int] = Field(default=None, examples=[1, 2, 23, 234, 2234])
    integracao_id: Optional[int] = Field(default=None, examples=[1, 2, 23, 234, 2234])
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    data_expiracao: Optional[datetime] = Field(default=None, examples=["2027-01-01T12:33:00"])


class CredencialIntegracaoResponse(BaseModel):
    id: int = Field(examples=[1, 2, 23, 234, 2234])
    organizacao_id: Optional[int] = Field(examples=[1, 2, 23, 234, 2234])
    integracao_id: Optional[int] = Field(examples=[1, 2, 23, 234, 2234])
    access_token: str
    refresh_token: str
    data_expiracao: Optional[datetime] = Field(default=None, examples=["2027-01-01T12:33:00"])

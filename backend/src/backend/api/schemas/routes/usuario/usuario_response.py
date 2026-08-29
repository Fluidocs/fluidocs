from datetime import datetime

from pydantic import BaseModel, EmailStr


class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: EmailStr
    foto_perfil: str | None
    data_criacao: datetime
    data_atualizacao: datetime

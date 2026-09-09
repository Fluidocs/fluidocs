from pydantic import BaseModel, EmailStr
from typing import Optional

class OrganizacaoCreate(BaseModel):
    nome: str
    cnpj: Optional[str] = None
    email: EmailStr
    senha: str
    logo: Optional[str] = None

class OrganizacaoResponse(BaseModel):
    id: int
    nome: str
    cnpj: Optional[str] = None
    email: str
    logo: Optional[str] = None

class OrganizacaoUpdate(BaseModel):
    nome: Optional[str] = None
    cnpj: Optional[str] = None
    email: Optional[EmailStr] = None
    senha: Optional[str] = None
    logo: Optional[str] = None
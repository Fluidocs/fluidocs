from pydantic import BaseModel, Field
from typing import Optional

class RepositorioResponse(BaseModel):
    id: int = Field(examples=[1, 2, 23, 234, 22341])
    descricao: str = Field(examples=['Arquivos RH', 'Documentação Desenvolvimento'])
    url_integracao: Optional[str] = Field(None, examples=['https://drive.google.com'])
    
    organizacao_id: Optional[int] = Field(None, examples=[1, 2, 23, 234, 22341])
    grupo_acesso_id: Optional[int] = None  # -> Integração Response 
    repositorio_integracao_id: Optional[int] = Field(None, examples=[1, 2, 23, 234, 22341]) # -> Integração Response
    credencial_integracao_id: Optional[int] = Field(None, examples=[1, 2, 23, 234, 22341]) # -> Integração Response 

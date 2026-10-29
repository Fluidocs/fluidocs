from datetime import datetime
from typing import Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator

from backend.api.schemas.backoffice.pesquisa_schemas import FonteDadosId


class TrechoContexto(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id_trecho: int | str | None = Field(default=None, validation_alias=AliasChoices("id_trecho", "id"))
    id_repositorio: str | None = None
    documento_id: str | None = None
    fonte_dados_id: int | None = None
    nome_documento: str | None = Field(default=None, validation_alias=AliasChoices("nome_documento", "documento"))
    pontuacao: float | None = None
    conteudo: str = Field(min_length=1)


class DocumentoContexto(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nome_documento: str | None = None
    id_repositorio: str | None = None
    fonte_dados_id: int | None = None
    pontuacao: float | None = None
    trechos: list[TrechoContexto] = Field(default_factory=list)


class MensagemHistorico(BaseModel):
    papel: Literal['user', 'assistant'] = Field(validation_alias=AliasChoices("papel", "role"))
    conteudo: str = Field(validation_alias=AliasChoices("conteudo", "content"), min_length=1)


class AnexoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mensagem_id: int
    nome: str = Field(min_length=1, max_length=255)
    extensao: str = Field(min_length=1, max_length=4)
    trecho: str | None = None

    @field_validator('nome', 'extensao')
    @classmethod
    def validar_texto(cls, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise ValueError('O texto nao pode conter apenas espacos.')
        return valor


class ConversaRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    conversa_id: int | None = Field(default=None, gt=0)
    fonte_dados_ids: list[FonteDadosId] = Field(
        min_length=1,
        description='Selecione ao menos uma fonte de dados ativa do usuario para pesquisar os documentos.',
    )

    pergunta: str = Field(
        validation_alias=AliasChoices("pergunta", "conteudo", "question"),
        min_length=1,
        description="Pergunta do usuario a ser respondida pelo agente.",
    )

    @field_validator('pergunta')
    @classmethod
    def validar_texto(cls, valor: str | None) -> str | None:
        if valor is not None:
            valor = valor.strip()
            if not valor:
                raise ValueError('O texto nao pode conter apenas espacos.')
        return valor


class ContextoConversa(ConversaRequest):
    """Contexto interno obtido da pesquisa e das mensagens persistidas."""

    historico: list[MensagemHistorico] = Field(default_factory=list)
    trechos: list[TrechoContexto] = Field(default_factory=list)
    documentos: list[DocumentoContexto] = Field(default_factory=list)


class AtualizarConversaRequest(BaseModel):
    titulo: str = Field(min_length=1, max_length=255)

    @field_validator('titulo')
    @classmethod
    def validar_titulo(cls, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise ValueError('O titulo nao pode conter apenas espacos.')
        return valor


class ConversaResponse(BaseModel):
    resposta: str
    trechos_anexos: list[TrechoContexto] = Field(default_factory=list, exclude=True)


class ResponderConversaResponse(ConversaResponse):
    conversa_id: int
    anexos: list[AnexoResponse] = Field(default_factory=list)


class MensagemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conteudo: str
    papel: Literal['U', 'A']
    data_envio: datetime
    conversa_id: int
    anexos: list[AnexoResponse] = Field(default_factory=list)


class ConversaResumoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str
    data_criacao: datetime
    data_ultima_interacao: datetime


class ConversaDetalheResponse(ConversaResumoResponse):
    mensagens: list[MensagemResponse]

from time import perf_counter

from fastapi import APIRouter, Depends, Query, status

from backend.api.dependencies.chave_api import obter_usuario_por_chave_api
from backend.api.dependencies.conversa import obter_servico_conversa
from backend.api.models.usuario import Usuario
from backend.api.schemas.backoffice.conversa_schemas import (
    ConversaDetalheResponse,
    ConversaRequest,
    ConversaResumoResponse,
    ResponderConversaResponse,
    AtualizarConversaRequest,
)
from backend.api.schemas.base_response import BaseResponse, MetaSchema, PaginacaoSchema
from backend.api.services.conversa import ServicoConversa

conversa_router = APIRouter(tags=['conversa'])


@conversa_router.post(
    '/conversas/perguntar',
    status_code=status.HTTP_200_OK,
    response_model=BaseResponse[ResponderConversaResponse],
    description='Exige ao menos uma fonte de dados ativa do usuario e pesquisa somente nessas fontes para responder com os trechos mais relevantes. Sem conversa_id, cria a conversa com a pergunta como titulo.',
)
async def conversar(
    dados: ConversaRequest,
    usuario: Usuario = Depends(obter_usuario_por_chave_api),
    servico: ServicoConversa = Depends(obter_servico_conversa),
) -> BaseResponse[ResponderConversaResponse]:
    inicio = perf_counter()
    resposta = await servico.responder(usuario, dados)
    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio), dados=resposta,
    )


@conversa_router.post(
    '/conversas', status_code=status.HTTP_201_CREATED,
    response_model=BaseResponse[ConversaResumoResponse],
    description='Cria uma conversa sem titulo e sem mensagens.',
)
async def criar_conversa(
    usuario: Usuario = Depends(obter_usuario_por_chave_api),
    servico: ServicoConversa = Depends(obter_servico_conversa),
) -> BaseResponse[ConversaResumoResponse]:
    inicio = perf_counter()
    conversa = await servico.criar(usuario.id)
    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=ConversaResumoResponse.model_validate(conversa),
    )


@conversa_router.patch('/conversas/{conversa_id}', response_model=BaseResponse[ConversaResumoResponse])
async def renomear_conversa(
    conversa_id: int,
    dados: AtualizarConversaRequest,
    usuario: Usuario = Depends(obter_usuario_por_chave_api),
    servico: ServicoConversa = Depends(obter_servico_conversa),
) -> BaseResponse[ConversaResumoResponse]:
    inicio = perf_counter()
    conversa = await servico.renomear(conversa_id, usuario.id, dados.titulo)
    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=ConversaResumoResponse.model_validate(conversa),
    )


@conversa_router.delete('/conversas/{conversa_id}', response_model=BaseResponse[ConversaResumoResponse])
async def deletar_conversa(
    conversa_id: int,
    usuario: Usuario = Depends(obter_usuario_por_chave_api),
    servico: ServicoConversa = Depends(obter_servico_conversa),
) -> BaseResponse[ConversaResumoResponse]:
    inicio = perf_counter()
    conversa = await servico.deletar(conversa_id, usuario.id)
    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=ConversaResumoResponse.model_validate(conversa),
    )


@conversa_router.get('/conversas', response_model=BaseResponse[list[ConversaResumoResponse]])
async def listar_conversas(
    pagina: int = Query(default=1, ge=1),
    por_pagina: int = Query(default=20, ge=1, le=100),
    usuario: Usuario = Depends(obter_usuario_por_chave_api),
    servico: ServicoConversa = Depends(obter_servico_conversa),
) -> BaseResponse[list[ConversaResumoResponse]]:
    inicio = perf_counter()
    conversas, total = await servico.listar(usuario.id, pagina, por_pagina)
    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=conversas,
        paginacao=PaginacaoSchema(
            total=total, pagina=pagina, por_pagina=por_pagina,
            paginas=(total + por_pagina - 1) // por_pagina,
        ),
    )


@conversa_router.get('/conversas/{conversa_id}', response_model=BaseResponse[ConversaDetalheResponse])
async def obter_conversa(
    conversa_id: int,
    usuario: Usuario = Depends(obter_usuario_por_chave_api),
    servico: ServicoConversa = Depends(obter_servico_conversa),
) -> BaseResponse[ConversaDetalheResponse]:
    inicio = perf_counter()
    conversa = await servico.detalhar(conversa_id, usuario.id)
    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=conversa,
    )

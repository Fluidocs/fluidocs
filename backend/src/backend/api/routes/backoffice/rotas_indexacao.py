from time import perf_counter
from typing import Annotated

from fastapi import APIRouter, Form, Depends, status

from backend.api.dependencies.auth import obter_usuario_autenticado
from backend.api.dependencies.indexacao import obter_servico_submissao_indexacao
from backend.api.models.usuario import Usuario
from backend.api.schemas.base_response import BaseResponse, MetaSchema
from backend.api.schemas.backoffice.indexacao_schemas import (
    IndexacaoRequest,
    IndexacaoLoteRequest,
    IndexacaoResponse,
    IndexacaoLoteResponse,
)
from backend.api.services.indexacao.submissao_indexacao import (
    ServicoSubmissaoIndexacao,
)


indexacao_router = APIRouter(tags=['Indexação'])

@indexacao_router.post(
    path='/',
    status_code=status.HTTP_201_CREATED,
    response_model=BaseResponse[IndexacaoResponse],
    description='Encaminha um arquivo para indexação em background.',
)
async def indexar_arquivo(
    dados: Annotated[
        IndexacaoRequest,
        Form(media_type='multipart/form-data')
    ],
    usuario: Usuario = Depends(obter_usuario_autenticado),
    servico: ServicoSubmissaoIndexacao = Depends(obter_servico_submissao_indexacao),
) -> BaseResponse[IndexacaoResponse]:
    inicio = perf_counter()
    id_processamento, nome_arquivo, documento_id = (
        await servico.enfileirar_arquivo(
            dados.arquivo,
            usuario.id,
            dados.fonte_dados_id,
        )
    )

    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=IndexacaoResponse(
            id_processamento=id_processamento,
            nome_arquivo=nome_arquivo,
            fonte_dados_id=dados.fonte_dados_id,
            documento_id=documento_id,
        ),
    )


@indexacao_router.post(
    path='/lote-zip',
    status_code=status.HTTP_201_CREATED,
    response_model=BaseResponse[IndexacaoLoteResponse],
    description=(
        'Encaminha um ZIP para processamento; cada documento vira um job separado.'
    ),
)
async def indexar_lote_zip(
    dados: Annotated[
        IndexacaoLoteRequest,
        Form(media_type='multipart/form-data')
    ],
    servico: Annotated[
        ServicoSubmissaoIndexacao,
        Depends(obter_servico_submissao_indexacao),
    ],
    usuario: Usuario = Depends(obter_usuario_autenticado),
) -> BaseResponse[IndexacaoLoteResponse]:
    inicio = perf_counter()
    id_processamento, nome_arquivo, quantidade = (
        await servico.enfileirar_lote_zip(
            dados.arquivo_zip,
            usuario.id,
            dados.fonte_dados_id,
        )
    )

    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=IndexacaoLoteResponse(
            id_processamento=id_processamento,
            nome_arquivo=nome_arquivo,
            fonte_dados_id=dados.fonte_dados_id,
            quantidade_arquivos=quantidade,
        ),
    )

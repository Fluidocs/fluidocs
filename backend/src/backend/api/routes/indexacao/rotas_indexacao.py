from time import perf_counter
from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, UploadFile, status

from backend.api.helpers.indexacao import obter_servico_submissao_indexacao
from backend.api.schemas.routes.base_response import BaseResponse, MetaSchema
from backend.api.schemas.routes.indexacao import (
    IndexacaoLoteResponse,
    IndexacaoResponse,
)
from backend.api.services.indexacao.submissao_indexacao import (
    ServicoSubmissaoIndexacao,
)
from backend.domain.indices.mapping.tipo_mapping import TipoMapping

indexacao_router = APIRouter(tags=['indexacao'])

@indexacao_router.post(
    path='/',
    status_code=status.HTTP_201_CREATED,
    response_model=BaseResponse[IndexacaoResponse],
    description='Encaminha um arquivo para indexação em background.',
)
async def indexar_arquivo(
    arquivo: Annotated[
        UploadFile,
        File(description='Arquivo PDF, JPEG, PNG ou TXT.'),
    ],
    nome_indice: Annotated[
        str,
        Query(min_length=3, description='Nome do índice de destino.'),
    ],
    servico: Annotated[
        ServicoSubmissaoIndexacao,
        Depends(obter_servico_submissao_indexacao),
    ],
    tipo_mapping: Annotated[
        TipoMapping,
        Query(description='Tipo do mapping do índice de destino.'),
    ] = TipoMapping.DOCUMENTOS,
) -> BaseResponse[IndexacaoResponse]:
    inicio = perf_counter()
    id_processamento, nome_arquivo = await servico.enfileirar_arquivo(
        arquivo,
        nome_indice,
        tipo_mapping,
    )

    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=IndexacaoResponse(
            id_processamento=id_processamento,
            nome_arquivo=nome_arquivo,
            nome_indice=nome_indice,
            tipo_mapping=tipo_mapping,
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
    arquivo_zip: Annotated[
        UploadFile,
        File(description='Arquivo ZIP contendo documentos suportados.'),
    ],
    nome_indice: Annotated[
        str,
        Query(min_length=3, description='Nome do índice de destino.'),
    ],
    servico: Annotated[
        ServicoSubmissaoIndexacao,
        Depends(obter_servico_submissao_indexacao),
    ],
    tipo_mapping: Annotated[
        TipoMapping,
        Query(description='Tipo do mapping do índice de destino.'),
    ] = TipoMapping.DOCUMENTOS,
) -> BaseResponse[IndexacaoLoteResponse]:
    inicio = perf_counter()
    id_processamento, nome_arquivo, quantidade = (
        await servico.enfileirar_lote_zip(
            arquivo_zip,
            nome_indice,
            tipo_mapping,
        )
    )

    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=IndexacaoLoteResponse(
            id_processamento=id_processamento,
            nome_arquivo=nome_arquivo,
            nome_indice=nome_indice,
            tipo_mapping=tipo_mapping,
            quantidade_arquivos=quantidade,
        ),
    )

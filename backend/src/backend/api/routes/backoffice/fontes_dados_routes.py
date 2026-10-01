from fastapi import APIRouter, HTTPException, Depends, Path, status
from time import perf_counter
from uuid import UUID

from backend.api.schemas.base_response import BaseResponse
from backend.api.schemas.backoffice.fontes_dados_schemas import (
    FonteDadosCreateRequest, 
    FonteDadosUpdateRequest,
    FonteDadosResponse
)
from backend.api.schemas.backoffice.documentos_schemas import (
    DocumentosFonteResponse,
    DocumentoDetalheResponse,
)
from backend.api.models.usuario import Usuario
from backend.api.services.fontes_dados import ServicoFontesDeDados
from backend.api.services.documentos import ServicoDocumentos
from backend.api.dependencies.fontes_dados import (
    obter_servico_fontes_de_dados,
    obter_servico_documentos
)
from backend.api.dependencies.auth import obter_usuario_autenticado


fontes_dados_router = APIRouter(
    prefix='/fontes-dados',
    tags=['Fontes de Dados']
)


@fontes_dados_router.get(
    '/',
    status_code=status.HTTP_200_OK
)
async def listar_fontes(
    servico_fontes: ServicoFontesDeDados = Depends(obter_servico_fontes_de_dados),
    usuario_autenticado: Usuario = Depends(obter_usuario_autenticado)
) -> BaseResponse[list[FonteDadosResponse]]:
    inicio = perf_counter()
    fontes_de_dados = await servico_fontes.listar_fontes(usuario_autenticado.id)
   
    return BaseResponse(
        meta={'tempo_execucao': inicio - perf_counter()},
        dados=[
            FonteDadosResponse.model_validate(fonte) for fonte in fontes_de_dados
        ]   
    )


@fontes_dados_router.post(
    '/',
    status_code=status.HTTP_201_CREATED
)
async def criar_fonte(
    dados: FonteDadosCreateRequest,
    servico_fontes: ServicoFontesDeDados = Depends(obter_servico_fontes_de_dados),
    usuario_autenticado: Usuario = Depends(obter_usuario_autenticado)
) -> BaseResponse[FonteDadosResponse]:
    inicio = perf_counter()
    fonte_dados = await servico_fontes.criar(dados, usuario_autenticado.id)

    return BaseResponse(
        meta={'tempo_execucao': perf_counter() - inicio},
        dados=FonteDadosResponse.model_validate(fonte_dados)
    )


@fontes_dados_router.get(
    '/{id}',
    status_code=status.HTTP_200_OK
)
async def obter_fonte(
    id: int,
    servico_fontes: ServicoFontesDeDados = Depends(obter_servico_fontes_de_dados),
    usuario_autenticado: Usuario = Depends(obter_usuario_autenticado)
) -> BaseResponse[FonteDadosResponse]:
    inicio = perf_counter()
    fonte_dados = await servico_fontes.obter(id, usuario_autenticado.id)

    return BaseResponse(
        meta={'tempo_execucao': perf_counter() - inicio},
        dados=FonteDadosResponse.model_validate(fonte_dados)
    )


@fontes_dados_router.patch(
    '/{id}',
    status_code=status.HTTP_200_OK
)
async def atualizar_fonte(
    id: int,
    dados: FonteDadosUpdateRequest,
    servico_fontes: ServicoFontesDeDados = Depends(obter_servico_fontes_de_dados),
    usuario_autenticado: Usuario = Depends(obter_usuario_autenticado)
) -> BaseResponse[FonteDadosResponse]:
    inicio = perf_counter()

    campos_update = dados.model_dump(exclude_unset=True)
    if not campos_update:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail='Dados para a atualização não podem estar em branco.'
        )

    fonte_dados = await servico_fontes.atualizar(
        id,
        usuario_autenticado.id,
        campos_update
    )

    return BaseResponse(
        meta={'tempo_execucao': perf_counter() - inicio},
        dados=FonteDadosResponse.model_validate(fonte_dados)
    )


@fontes_dados_router.delete(
    '/{id}',
    status_code=status.HTTP_202_ACCEPTED
)
async def deletar_fonte(
    id: int,
    servico_fontes: ServicoFontesDeDados = Depends(obter_servico_fontes_de_dados),
    usuario_autenticado: Usuario = Depends(obter_usuario_autenticado)
) -> BaseResponse[FonteDadosResponse]:
    inicio = perf_counter()
    fonte_dados = await servico_fontes.deletar(id, usuario_autenticado.id)

    return BaseResponse(
        meta={'tempo_execucao': perf_counter() - inicio},
        dados=FonteDadosResponse.model_validate(fonte_dados)
    )


@fontes_dados_router.get(
    '/{id}/documentos',
    status_code=status.HTTP_200_OK,
    description='Lista os documentos indexados vinculados a uma fonte de dados.'
)
async def listar_documentos(
    id: int = Path(gt=0),
    servico_documentos: ServicoDocumentos = Depends(obter_servico_documentos),
    usuario_autenticado: Usuario = Depends(obter_usuario_autenticado)
) -> BaseResponse[DocumentosFonteResponse]:
    inicio = perf_counter()
    documentos = await servico_documentos.listar_documentos(
        usuario_autenticado.id,
        id
    )

    return BaseResponse(
        meta={'tempo_execucao': perf_counter() - inicio},
        dados=DocumentosFonteResponse(documentos=documentos)
    )


@fontes_dados_router.get(
    '/{id}/documentos/{documento_id}',
    status_code=status.HTTP_200_OK,
    description=(
        'Retorna os dados de um documento indexado e seus trechos, '
        'ordenados pelo ID do trecho.'
    )
)
async def obter_documento(
    documento_id: UUID,
    id: int = Path(gt=0),
    servico_documentos: ServicoDocumentos = Depends(obter_servico_documentos),
    usuario_autenticado: Usuario = Depends(obter_usuario_autenticado)
) -> BaseResponse[DocumentoDetalheResponse]:
    inicio = perf_counter()
    documento = await servico_documentos.obter_documento(
        usuario_autenticado.id,
        id,
        str(documento_id)
    )

    return BaseResponse(
        meta={'tempo_execucao': perf_counter() - inicio},
        dados=documento
    )

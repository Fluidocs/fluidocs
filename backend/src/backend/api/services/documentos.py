from typing import Any

from elasticsearch import AsyncElasticsearch, ConflictError, NotFoundError
from fastapi import HTTPException, status

from backend.api.helpers.exceptions.elasticsearch import (
    tratar_indisponibilidade_elasticsearch,
)
from backend.api.services.fontes_dados import ServicoFontesDeDados
from backend.api.schemas.backoffice.documentos_schemas import (
    DocumentoResumoResponse,
    DocumentoDetalheResponse,
    DocumentoDesindexadoResponse,
    TrechoDocumentoResponse,
)
from backend.domain.indices.nome_indice import gerar_nome_indice


class ServicoDocumentos:
    TAMANHO_LOTE = 1000

    def __init__(
        self,
        client: AsyncElasticsearch,
        servico_fontes: ServicoFontesDeDados
    ):
        self._client = client
        self._servico_fontes = servico_fontes


    @tratar_indisponibilidade_elasticsearch
    async def listar_documentos(
        self,
        usuario_id: int,
        fonte_dados_id: int
    ) -> list[DocumentoResumoResponse]:
        await self._servico_fontes.validar_existencia([fonte_dados_id], usuario_id)
        nome_indice = gerar_nome_indice(usuario_id)

        documentos: list[DocumentoResumoResponse] = []
        after_key: dict[str, Any] | None = None

        while True:
            composite: dict[str, Any] = {
                'size': self.TAMANHO_LOTE,
                'sources': [
                    {'documento_id': {'terms': {'field': 'documento_id'}}},
                    {'nome_documento': {'terms': {'field': 'nome_documento'}}},
                    {'tipo_documento': {
                        'terms': {'field': 'tipo_documento', 'missing_bucket': True}
                    }},
                ]
            }
            if after_key:
                composite['after'] = after_key

            try:
                resposta = await self._client.search(
                    index=nome_indice,
                    size=0,
                    query={'term': {'fonte_dados_id': fonte_dados_id}},
                    aggs={'documentos': {'composite': composite}}
                )
            except NotFoundError:
                return []

            agregacao = resposta['aggregations']['documentos']
            documentos.extend(
                DocumentoResumoResponse(
                    uuid=bucket['key']['documento_id'],
                    nome_documento=bucket['key']['nome_documento'],
                    tipo_arquivo=bucket['key']['tipo_documento'],
                )
                for bucket in agregacao['buckets']
            )

            after_key = agregacao.get('after_key')
            if not after_key or len(agregacao['buckets']) < self.TAMANHO_LOTE:
                break

        return sorted(documentos, key=lambda documento: documento.nome_documento)


    @tratar_indisponibilidade_elasticsearch
    async def obter_documento(
        self,
        usuario_id: int,
        fonte_dados_id: int,
        documento_id: str
    ) -> DocumentoDetalheResponse:
        await self._servico_fontes.validar_existencia([fonte_dados_id], usuario_id)
        nome_indice = gerar_nome_indice(usuario_id)

        documento: DocumentoDetalheResponse | None = None
        search_after: list[Any] | None = None

        while True:
            parametros: dict[str, Any] = {}
            if search_after:
                parametros['search_after'] = search_after

            try:
                resposta = await self._client.search(
                    index=nome_indice,
                    size=self.TAMANHO_LOTE,
                    query={
                        'bool': {
                            'filter': [
                                {'term': {'fonte_dados_id': fonte_dados_id}},
                                {'term': {'documento_id': documento_id}},
                            ]
                        }
                    },
                    sort=[{'id_trecho': 'asc'}],
                    source_excludes=['embeddings'],
                    **parametros
                )
            except NotFoundError:
                break

            lote = resposta['hits']['hits']
            if lote and documento is None:
                primeiro = lote[0]['_source']
                documento = DocumentoDetalheResponse(
                    uuid=primeiro['documento_id'],
                    fonte_dados_id=primeiro['fonte_dados_id'],
                    nome_documento=primeiro['nome_documento'],
                    tipo_arquivo=primeiro.get('tipo_documento'),
                    trechos=[],
                )

            if documento is not None:
                documento.trechos.extend(
                    TrechoDocumentoResponse(
                        id_trecho=hit['_source']['id_trecho'],
                        conteudo=hit['_source']['conteudo'],
                    )
                    for hit in lote
                )

            if len(lote) < self.TAMANHO_LOTE:
                break
            search_after = lote[-1]['sort']

        if documento is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Documento {documento_id} não encontrado.'
            )

        return documento


    @tratar_indisponibilidade_elasticsearch
    async def desindexar_documento(
        self,
        usuario_id: int,
        fonte_dados_id: int,
        documento_id: str,
    ) -> DocumentoDesindexadoResponse:
        await self._servico_fontes.validar_existencia([fonte_dados_id], usuario_id)
        nome_indice = gerar_nome_indice(usuario_id)
        filtro = {
            'bool': {
                'filter': [
                    {'term': {'fonte_dados_id': fonte_dados_id}},
                    {'term': {'documento_id': documento_id}},
                ]
            }
        }
        nao_encontrado = HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Documento {documento_id} não encontrado.',
        )
        exclusao_incompleta = HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Não foi possível concluir a exclusão do documento {documento_id}.',
        )

        try:
            # Inclui na consulta os trechos indexados desde o último refresh.
            atualizacao = await self._client.indices.refresh(index=nome_indice)
            if atualizacao.get('_shards', {}).get('failed', 0):
                raise exclusao_incompleta

            resposta = await self._client.search(
                index=nome_indice,
                query=filtro,
                size=1,
                source_includes=['tipo_documento'],
                track_total_hits=False,
                allow_partial_search_results=False,
            )
            if resposta.get('timed_out') or resposta.get('_shards', {}).get('failed', 0):
                raise exclusao_incompleta

            hits = resposta['hits']['hits']
            if not hits:
                raise nao_encontrado
            tipo_documento = hits[0]['_source'].get('tipo_documento')

            resultado = await self._client.delete_by_query(
                index=nome_indice,
                query=filtro,
                refresh=True,
                conflicts='abort',
            )
        except NotFoundError as erro:
            raise nao_encontrado from erro
        except ConflictError as erro:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    'O documento foi alterado durante a exclusão. '
                    'Tente novamente.'
                ),
            ) from erro

        if (
            resultado.get('failures')
            or resultado.get('timed_out')
            or resultado.get('version_conflicts', 0)
        ):
            raise exclusao_incompleta

        quantidade_trechos = resultado['deleted']
        if quantidade_trechos == 0:
            raise nao_encontrado

        return DocumentoDesindexadoResponse(
            id=documento_id,
            tipo_documento=tipo_documento,
            quantidade_trechos=quantidade_trechos,
        )

from collections.abc import Collection

from fastapi import HTTPException, status

from .indice import ServicoIndice
from backend.api.models.fonte_de_dados import (
    StatusFonte,
    FonteDeDados,
)
from backend.api.schemas.backoffice.fontes_dados_schemas import (
    FonteDadosCreateRequest,
)

class ServicoFontesDeDados:
    def __init__(self, servico_indices: ServicoIndice):
        self._servico_indices = servico_indices
        

    async def listar_fontes(
        self, 
        usuario_id: int
    ) -> list[FonteDeDados]:
        return await FonteDeDados.filter(
            usuario_id=usuario_id,
            status=StatusFonte.ATIVA,
        )


    async def validar_existencia(
        self,
        fonte_ids: Collection[int],
        usuario_id: int,
    ) -> None:
        ids_solicitados = set(fonte_ids)

        if not ids_solicitados:
            return

        ids_encontrados = set(
            await FonteDeDados.filter(
                id__in=ids_solicitados,
                usuario_id=usuario_id,
                status=StatusFonte.ATIVA,
            ).values_list('id', flat=True)
        )

        ids_ausentes = sorted(ids_solicitados - ids_encontrados)

        if ids_ausentes:
            ids_formatados = ', '.join(map(str, ids_ausentes))
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Fontes de dados {ids_formatados} não encontradas.',
            )


    async def criar(
        self, 
        dados: FonteDadosCreateRequest,
        usuario_id: int
    ) -> FonteDeDados:
        return await FonteDeDados.create(
            nome=dados.nome,
            descricao=dados.descricao,
            usuario_id=usuario_id
        )


    async def obter(
        self, 
        fonte_id: int, 
        usuario_id: int
    ) -> FonteDeDados:
        fonte_dados = await FonteDeDados.get_or_none(
            id=fonte_id,
            usuario_id=usuario_id,
            status=StatusFonte.ATIVA,
        )

        if fonte_dados is None: 
            raise self.not_found_error(fonte_id)
        
        return fonte_dados


    async def atualizar(
        self,
        fonte_id: int,
        usuario_id: int,
        dados_update: dict,
    ) -> FonteDeDados:
        fonte_dados = await self.obter(fonte_id, usuario_id)

        fonte_dados.update_from_dict(dados_update)
        await fonte_dados.save()

        return fonte_dados


    async def deletar(
        self, 
        fonte_id: int, 
        usuario_id: int
    ) -> FonteDeDados:
        fonte_dados = await FonteDeDados.get_or_none(
            id=fonte_id,
            usuario_id=usuario_id,
        )

        if fonte_dados is None:
            raise self.not_found_error(fonte_id)

        if fonte_dados.status != StatusFonte.DELETANDO:
            fonte_dados.status = StatusFonte.DELETANDO
            await fonte_dados.save()

        await self._servico_indices.remover_documentos_da_fonte(
            usuario_id,
            fonte_id,
        )
        await fonte_dados.delete()

        return fonte_dados


    @staticmethod
    def not_found_error(id: int) -> HTTPException:
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Fonte de dados com ID {id} não encontrada.'
        )

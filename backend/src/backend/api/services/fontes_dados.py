from fastapi import HTTPException, status
from backend.api.models.fonte_de_dados import FonteDeDados
from backend.api.schemas.backoffice.fontes_dados_schemas import FonteDadosCreateRequest, FonteDadosUpdateRequest

class ServicoFontesDeDados:
    async def listar_fontes(
        self, 
        usuario_id: int
    ) -> list[FonteDeDados]:
        return await FonteDeDados.filter(
            usuario_id=usuario_id
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
            usuario_id=usuario_id
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
        fonte_dados = await self.obter(fonte_id, usuario_id)
        await fonte_dados.delete()

        return fonte_dados


    @staticmethod
    def not_found_error(id: int) -> HTTPException:
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Fonte de dados com ID {id} não encontrada.'
        )

from fastapi import HTTPException, status

from backend.api.core.auth.gerador_chave_api import GeradorChaveAPI
from backend.api.models.chave_api import ChaveAPI
from backend.api.models.usuario import Usuario
from backend.api.schemas.backoffice.chave_api_schemas import (
    AtualizarChaveAPIRequest,
    CriarChaveAPIRequest,
)
from backend.config.configuracoes import config


class ServicoChaveAPI:
    def __init__(
        self,
        gerador_chave_api: GeradorChaveAPI,
    ) -> None:
        self.gerador_chave_api = gerador_chave_api

    async def criar(
        self,
        usuario: Usuario,
        dados: CriarChaveAPIRequest,
    ) -> tuple[ChaveAPI, str]:
        await self._validar_limite_chaves_usuario(usuario)
        token = await self._gerar_token_unico()
        chave_api = await ChaveAPI.create(
            token=self.gerador_chave_api.gerar_hash_token(token),
            nome=dados.nome,
            descricao=dados.descricao,
            usuario=usuario,
        )

        return chave_api, token

    async def listar(
        self,
        usuario: Usuario,
    ) -> list[ChaveAPI]:
        return await ChaveAPI.filter(usuario_id=usuario.id).order_by('id')

    async def obter(
        self,
        usuario: Usuario,
        chave_api_id: int,
    ) -> ChaveAPI:
        chave_api = await ChaveAPI.get_or_none(
            id=chave_api_id,
            usuario_id=usuario.id,
        )
        if not chave_api:
            raise self._chave_api_nao_encontrada()

        return chave_api

    async def atualizar(
        self,
        usuario: Usuario,
        chave_api_id: int,
        dados: AtualizarChaveAPIRequest,
    ) -> ChaveAPI:
        chave_api = await self.obter(usuario, chave_api_id)
        dados_atualizacao = dados.model_dump(exclude_unset=True)

        if 'nome' in dados_atualizacao and dados.nome is not None:
            chave_api.nome = dados.nome

        if 'descricao' in dados_atualizacao:
            chave_api.descricao = dados.descricao

        await chave_api.save()
        return chave_api

    async def deletar(
        self,
        usuario: Usuario,
        chave_api_id: int,
    ) -> ChaveAPI:
        chave_api = await self.obter(usuario, chave_api_id)
        await chave_api.delete()

        return chave_api

    async def _gerar_token_unico(self) -> str:
        for _ in range(10):
            token = self.gerador_chave_api.gerar_token()
            token_hash = self.gerador_chave_api.gerar_hash_token(token)
            if not await ChaveAPI.exists(token=token_hash):
                return token

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Nao foi possivel gerar uma chave de API unica.',
        )

    async def _validar_limite_chaves_usuario(self, usuario: Usuario) -> None:
        total_chaves = await ChaveAPI.filter(usuario_id=usuario.id).count()
        if total_chaves >= config.limite_chaves_api_por_usuario:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='Limite de chaves de API atingido.',
            )

    @staticmethod
    def _chave_api_nao_encontrada() -> HTTPException:
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Chave de API nao encontrada.',
        )

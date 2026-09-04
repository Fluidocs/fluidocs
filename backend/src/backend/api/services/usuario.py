from fastapi import HTTPException, status

from backend.api.helpers.auth import normalizar_email
from backend.api.models.usuario import Usuario
from backend.api.schemas.backoffice.usuario_schemas import (
    AtualizarUsuarioRequest,
    CriarUsuarioRequest,
)
from backend.api.core.auth.gerador_hash import GeradorHash


class ServicoUsuario:
    def __init__(
        self,
        *,
        gerador_hash: GeradorHash,
    ) -> None:
        self.gerador_hash = gerador_hash

    async def criar(
        self,
        dados: CriarUsuarioRequest,
    ) -> Usuario:
        email = normalizar_email(dados.email)
        await self._validar_email_disponivel(email)

        return await Usuario.create(
            nome=dados.nome,
            email=email,
            senha=self.gerador_hash.gerar_hash_senha(dados.senha),
            foto_perfil=dados.foto_perfil,
        )

    async def obter(
        self,
        usuario_id: int,
    ) -> Usuario:
        usuario = await Usuario.get_or_none(id=usuario_id)
        if not usuario:
            raise self._usuario_nao_encontrado()

        return usuario

    async def atualizar(
        self,
        usuario_id: int,
        dados: AtualizarUsuarioRequest,
    ) -> Usuario:
        usuario = await self.obter(usuario_id)
        dados_atualizacao = dados.model_dump(exclude_unset=True)

        if 'email' in dados_atualizacao and dados.email:
            email = normalizar_email(dados.email)
            await self._validar_email_disponivel(email, usuario_id=usuario.id)
            usuario.email = email

        if 'nome' in dados_atualizacao and dados.nome is not None:
            usuario.nome = dados.nome

        if 'senha' in dados_atualizacao and dados.senha is not None:
            usuario.senha = self.gerador_hash.gerar_hash_senha(dados.senha)

        if 'foto_perfil' in dados_atualizacao:
            usuario.foto_perfil = dados.foto_perfil

        await usuario.save()
        return usuario

    async def deletar(
        self,
        usuario_id: int,
    ) -> None:
        usuario = await self.obter(usuario_id)
        await usuario.delete()

    async def _validar_email_disponivel(
        self,
        email: str,
        usuario_id: int | None = None,
    ) -> None:
        usuario = await Usuario.get_or_none(email=email)
        if usuario and usuario.id != usuario_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='Ja existe um usuario cadastrado com este e-mail.',
            )

    @staticmethod
    def _usuario_nao_encontrado() -> HTTPException:
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Usuario nao encontrado.',
        )

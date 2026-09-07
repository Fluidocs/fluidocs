from fastapi import HTTPException, status

from backend.api.helpers.auth import normalizar_email
from backend.api.models.usuario import Usuario
from backend.api.schemas.backoffice.usuario_schemas import (
    AtualizarUsuarioRequest,
    CriarUsuarioRequest,
)
from backend.api.core.auth.gerador_hash import GeradorHash
from .indice import ServicoIndice

class ServicoUsuario:
    def __init__(
        self,
        gerador_hash: GeradorHash,
        servico_indice: ServicoIndice
    ) -> None:
        self.gerador_hash = gerador_hash
        self._servico_indice = servico_indice

    async def criar(
        self,
        dados: CriarUsuarioRequest,
    ) -> Usuario:
        email = normalizar_email(dados.email)
        await self._validar_email_disponivel(email)

        usuario = await Usuario.create(
            nome=dados.nome,
            email=email,
            senha=self.gerador_hash.gerar_hash_senha(dados.senha),
        )

        try:
            await self._servico_indice.garantir_indice(usuario.id)
        except Exception:
            await usuario.delete()
            raise

        return usuario

    async def atualizar(
        self,
        usuario: Usuario,
        dados: AtualizarUsuarioRequest,
    ) -> Usuario:
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
        usuario: Usuario,
    ) -> Usuario:
        await self._servico_indice.remover_indice(usuario.id)
        await usuario.delete()

        return usuario

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

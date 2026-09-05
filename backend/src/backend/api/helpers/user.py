from fastapi import HTTPException, status

from backend.api.models.usuario import Usuario
from backend.api.schemas.backoffice.usuario_schemas import UsuarioResponse


def montar_usuario_response(usuario: Usuario) -> UsuarioResponse:
    return UsuarioResponse(
        id=usuario.id,
        nome=usuario.nome,
        email=usuario.email,
        foto_perfil=usuario.foto_perfil,
        data_criacao=usuario.data_criacao,
        data_atualizacao=usuario.data_atualizacao,
    )


def validar_acesso_ao_proprio_usuario(
    usuario_id: int,
    usuario_autenticado: Usuario,
) -> None:
    if usuario_autenticado.id != usuario_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Usuario autenticado nao pode acessar outro usuario.',
        )
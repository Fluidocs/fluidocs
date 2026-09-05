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
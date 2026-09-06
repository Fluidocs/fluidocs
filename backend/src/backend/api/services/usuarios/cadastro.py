from ..indice import ServicoIndice
from ..usuario import ServicoUsuario

from backend.api.models.usuario import Usuario
from backend.api.schemas.backoffice.usuario_schemas import CriarUsuarioRequest

class ServicoCadastroUsuario:
    def __init__(
        self,
        servico_indice: ServicoIndice,
        servico_usuario: ServicoUsuario
    ):
        self._servico_usuario = servico_usuario
        self._servico_indice = servico_indice


    async def cadastrar(
        self,
        dados: CriarUsuarioRequest
    ) -> Usuario:
        usuario = await self._servico_usuario.criar(dados=dados)

        try:
            await self._servico_indice.garantir_indice(usuario.id)
        except Exception:
            await self._servico_usuario.deletar(usuario)
            raise

        return usuario

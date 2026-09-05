from fastapi import Depends

from backend.api.dependencies.auth import obter_gerador_hash
from backend.api.core.auth.gerador_hash import GeradorHash
from backend.api.services.usuario import ServicoUsuario


def obter_servico_usuario(
    gerador_hash: GeradorHash = Depends(obter_gerador_hash),
) -> ServicoUsuario:
    return ServicoUsuario(gerador_hash=gerador_hash)

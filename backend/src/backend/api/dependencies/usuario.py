from fastapi import Depends

from backend.api.dependencies.auth import obter_gerador_hash
from backend.api.dependencies.indices import obter_servico_indices
from backend.api.core.auth.gerador_hash import GeradorHash
from backend.api.services.usuario import ServicoUsuario
from backend.api.services.indice import ServicoIndice


def obter_servico_usuario(
    gerador_hash: GeradorHash = Depends(obter_gerador_hash),
    servico_indice: ServicoIndice = Depends(obter_servico_indices)
) -> ServicoUsuario:
    return ServicoUsuario(
        gerador_hash=gerador_hash,
        servico_indice=servico_indice
    )

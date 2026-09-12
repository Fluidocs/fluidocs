from fastapi import Depends

from backend.api.core.auth.gerador_chave_api import GeradorChaveAPI
from backend.api.services.chave_api import ServicoChaveAPI
from backend.config.configuracoes import config


def obter_gerador_chave_api() -> GeradorChaveAPI:
    return GeradorChaveAPI(
        secret=config.secret_key,
    )

def obter_servico_chave_api(
    gerador_chave_api: GeradorChaveAPI = Depends(obter_gerador_chave_api),
) -> ServicoChaveAPI:
    return ServicoChaveAPI(
        gerador_chave_api=gerador_chave_api,
    )
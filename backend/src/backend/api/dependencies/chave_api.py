from fastapi import Depends, HTTPException
from fastapi.security import APIKeyHeader

from backend.api.core.auth.gerador_chave_api import GeradorChaveAPI
from backend.api.services.chave_api import ServicoChaveAPI
from backend.config.configuracoes import config
from backend.api.models.usuario import Usuario
from backend.api.models.fonte_de_dados import FonteDeDados, StatusFonte


chave_api_header = APIKeyHeader(name='X-API-Key', auto_error=False)


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


async def obter_usuario_por_chave_api(
    token: str | None = Depends(chave_api_header),
    servico: ServicoChaveAPI = Depends(obter_servico_chave_api),
) -> Usuario:
    if not token:
        raise HTTPException(
            status_code=401, detail='Informe a chave de API no header X-API-Key.',
            headers={'WWW-Authenticate': 'APIKey'},
        )
    usuario = await servico.autenticar(token)
    if not await FonteDeDados.filter(usuario_id=usuario.id, status=StatusFonte.ATIVA).exists():
        raise HTTPException(status_code=403, detail='Cadastre uma fonte de dados ativa para acessar pesquisa e conversa.')
    return usuario

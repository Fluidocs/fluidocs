import re
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from backend.config.configuracoes import config


def obter_nome_seguro(nome_arquivo: str | None) -> str:
    if not nome_arquivo:
        return ''

    nome_base = Path(nome_arquivo.replace('\\', '/')).name.strip()
    return re.sub(r'[^\w.()-]', '_', nome_base)


def obter_extensao(nome_arquivo: str) -> str:
    return Path(nome_arquivo).suffix.lower().lstrip('.')


def gerar_caminho_temporario(nome_arquivo: str) -> Path:
    pasta_temporaria = Path(config.temp_docs_path)
    pasta_temporaria.mkdir(parents=True, exist_ok=True)
    return pasta_temporaria / f'{uuid4().hex}_{nome_arquivo}'


async def armazenar_upload_temporario(
    arquivo: UploadFile,
    nome_arquivo: str,
) -> tuple[Path, int]:
    caminho = gerar_caminho_temporario(nome_arquivo)
    tamanho = 0

    try:
        with caminho.open('xb') as destino:
            while bloco := await arquivo.read(config.tamanho_bloco_upload):
                destino.write(bloco)
                tamanho += len(bloco)
    except Exception:
        caminho.unlink(missing_ok=True)
        raise
    finally:
        await arquivo.close()

    return caminho, tamanho

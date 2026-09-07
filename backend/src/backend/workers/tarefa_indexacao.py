import logging
from pathlib import Path
from shutil import copyfileobj
from zipfile import BadZipFile, ZipFile, ZipInfo

from elasticsearch import Elasticsearch
from ollama import Client

from backend.api.helpers.arquivos import (
    gerar_caminho_temporario,
    obter_nome_seguro,
)
from backend.api.services.embeddings.indexacao import ProvedorEmbeddingsIndexacao
from backend.api.services.indexacao.indexacao import ServicoIndexacao
from backend.config.configuracoes import config
from backend.domain.indices.identificador_documento import gerar_documento_id
from backend.domain.indices.nome_indice import gerar_nome_indice
from backend.workers.app_celery import (
    NOME_TAREFA_PROCESSAR_ARQUIVO,
    NOME_TAREFA_PROCESSAR_LOTE_ZIP,
    app_celery,
)


logger = logging.getLogger(__name__)


def _indexar_documento(
    caminho: Path,
    nome_arquivo: str,
    usuario_id: int,
    fonte_dados_id: int,
    documento_id: str,
) -> int:
    nome_indice = gerar_nome_indice(usuario_id)

    try:
        with (
            Elasticsearch(config.elastic_url) as cliente_es,
            Client(host=config.embeddings_indexacao_host) as cliente_ollama
        ):
            provedor_embeddings = ProvedorEmbeddingsIndexacao(
                cliente=cliente_ollama,
                modelo=config.embeddings_model
            )

            servico = ServicoIndexacao(
                cliente=cliente_es,
                embeddings=provedor_embeddings,
                usuario_id=usuario_id,
            )

            return servico.indexar(
                caminho_arquivo=str(caminho),
                nome_arquivo=nome_arquivo,
                fonte_dados_id=fonte_dados_id,
                documento_id=documento_id,
            )
    except Exception:
        print(f'Falha ao indexar {nome_arquivo} no índice {nome_indice}')
        raise

@app_celery.task(name=NOME_TAREFA_PROCESSAR_ARQUIVO)
def tarefa_processar_e_indexar(
    caminho_temporario: str,
    nome_original: str,
    usuario_id: int,
    fonte_dados_id: int,
    documento_id: str,
) -> dict:
    """Executa extração, embeddings e bulk de um documento."""
    caminho = Path(caminho_temporario)
    nome_indice = gerar_nome_indice(usuario_id)

    try:
        logger.info(
            'Iniciando indexação de %s no índice %s',
            nome_original,
            nome_indice,
        )

        quantidade = _indexar_documento(
            caminho,
            nome_original,
            usuario_id,
            fonte_dados_id,
            documento_id,
        )

        logger.info(
            'Indexação de %s concluída com %s trechos',
            nome_original,
            quantidade,
        )
        return {
            'nome_arquivo': nome_original,
            'nome_indice': nome_indice,
            'fonte_dados_id': fonte_dados_id,
            'documento_id': documento_id,
            'trechos_indexados': quantidade,
            'status': 'completed',
        }
    finally:
        caminho.unlink(missing_ok=True)
        logger.info('Arquivo temporário removido: %s', caminho)


@app_celery.task(name=NOME_TAREFA_PROCESSAR_LOTE_ZIP)
def tarefa_processar_lote_zip(
    caminho_zip: str,
    nome_zip: str,
    usuario_id: int,
    fonte_dados_id: int,
) -> dict:
    """Extrai o ZIP e cria um job independente para cada documento."""
    caminho = Path(caminho_zip)
    nome_indice = gerar_nome_indice(usuario_id)

    try:
        ids_processamento = _enfileirar_documentos_zip(
            caminho,
            usuario_id,
            fonte_dados_id,
        )

        logger.info(
            'Lote %s processado: %s jobs criados para o índice %s',
            nome_zip,
            len(ids_processamento),
            nome_indice,
        )
        return {
            'nome_arquivo': nome_zip,
            'nome_indice': nome_indice,
            'fonte_dados_id': fonte_dados_id,
            'quantidade_arquivos': len(ids_processamento),
            'ids_processamento': ids_processamento,
            'status': 'completed',
        }
    except BadZipFile:
        logger.exception('Arquivo ZIP inválido ou corrompido: %s', caminho)
        raise
    finally:
        caminho.unlink(missing_ok=True)
        logger.info('Arquivo ZIP temporário removido: %s', caminho)


def _enfileirar_documentos_zip(
    caminho_zip: Path,
    usuario_id: int,
    fonte_dados_id: int,
) -> list[str]:
    ids_processamento: list[str] = []

    with ZipFile(caminho_zip) as arquivo_zip:
        for arquivo in arquivo_zip.infolist():
            if arquivo.is_dir():
                continue

            id_processamento = _enfileirar_documento_zip(
                arquivo_zip,
                arquivo,
                usuario_id,
                fonte_dados_id,
            )
            ids_processamento.append(id_processamento)

    return ids_processamento


def _enfileirar_documento_zip(
    arquivo_zip: ZipFile,
    arquivo: ZipInfo,
    usuario_id: int,
    fonte_dados_id: int,
) -> str:
    nome_arquivo = obter_nome_seguro(arquivo.filename)
    caminho_documento = gerar_caminho_temporario(nome_arquivo)

    try:
        with (
            arquivo_zip.open(arquivo) as origem,
            caminho_documento.open('xb') as destino,
        ):
            copyfileobj(origem, destino)

        tarefa = tarefa_processar_e_indexar.delay(
            str(caminho_documento),
            nome_arquivo,
            usuario_id,
            fonte_dados_id,
            gerar_documento_id(),
        )
    except Exception:
        caminho_documento.unlink(missing_ok=True)
        raise

    return tarefa.id

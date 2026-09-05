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
from backend.workers.app_celery import (
    NOME_TAREFA_PROCESSAR_ARQUIVO,
    NOME_TAREFA_PROCESSAR_LOTE_ZIP,
    app_celery,
)


logger = logging.getLogger(__name__)


def _indexar_documento(
    caminho: Path,
    nome_arquivo: str,
    nome_indice: str,
    tipo_mapping: str,
) -> int:
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
                nome_indice=nome_indice,
            )

            return servico.indexar(
                caminho_arquivo=str(caminho),
                nome_arquivo=nome_arquivo,
                tipo_mapping=tipo_mapping,
            )
    except Exception:
        print(f'Falha ao indexar {nome_arquivo} no índice {nome_indice}')
        raise

@app_celery.task(name=NOME_TAREFA_PROCESSAR_ARQUIVO)
def tarefa_processar_e_indexar(
    caminho_temporario: str,
    nome_original: str,
    nome_indice: str,
    tipo_mapping: str,
) -> dict:
    """Executa extração, embeddings e bulk de um documento."""
    caminho = Path(caminho_temporario)

    try:
        logger.info(
            'Iniciando indexação de %s no índice %s',
            nome_original,
            nome_indice,
        )

        quantidade = _indexar_documento(
            caminho,
            nome_original,
            nome_indice,
            tipo_mapping,
        )

        logger.info(
            'Indexação de %s concluída com %s trechos',
            nome_original,
            quantidade,
        )
        return {
            'nome_arquivo': nome_original,
            'nome_indice': nome_indice,
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
    nome_indice: str,
    tipo_mapping: str,
) -> dict:
    """Extrai o ZIP e cria um job independente para cada documento."""
    caminho = Path(caminho_zip)

    try:
        ids_processamento = _enfileirar_documentos_zip(
            caminho,
            nome_indice,
            tipo_mapping,
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
    nome_indice: str,
    tipo_mapping: str,
) -> list[str]:
    ids_processamento: list[str] = []

    with ZipFile(caminho_zip) as arquivo_zip:
        for arquivo in arquivo_zip.infolist():
            if arquivo.is_dir():
                continue

            id_processamento = _enfileirar_documento_zip(
                arquivo_zip,
                arquivo,
                nome_indice,
                tipo_mapping,
            )
            ids_processamento.append(id_processamento)

    return ids_processamento


def _enfileirar_documento_zip(
    arquivo_zip: ZipFile,
    arquivo: ZipInfo,
    nome_indice: str,
    tipo_mapping: str,
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
            nome_indice,
            tipo_mapping,
        )
    except Exception:
        caminho_documento.unlink(missing_ok=True)
        raise

    return tarefa.id

import logging
from pathlib import Path
from shutil import copyfileobj
from zipfile import BadZipFile, ZipFile

from elasticsearch import Elasticsearch
from ollama import Client

from backend.api.helpers.indexacao import (
    FORMATOS_DOCUMENTO_SUPORTADOS,
    gerar_caminho_temporario,
    obter_extensao,
    obter_nome_seguro,
)
from backend.api.services.embeddings import ServicoEmbeddings
from backend.api.services.indexacao import ServicoIndexacao
from backend.config.configuracoes import config
from backend.workers.app_celery import app_celery


logger = logging.getLogger(__name__)


@app_celery.task(name='indexacao.processar_arquivo')
def tarefa_processar_e_indexar(
    caminho_temporario: str,
    nome_original: str,
    nome_indice: str,
    tipo_mapping: str,
) -> dict:
    """Executa extração, embeddings e bulk de um documento."""
    caminho = Path(caminho_temporario)
    cliente_es: Elasticsearch | None = None
    cliente_ollama: Client | None = None

    try:
        cliente_es = Elasticsearch(config.elastic_url)
        cliente_ollama = Client(host=config.ollama_host)
        logger.info(
            'Iniciando indexação de %s no índice %s',
            nome_original,
            nome_indice,
        )
        servico_embeddings = ServicoEmbeddings(
            client=cliente_ollama,
            model=config.embeddings_model,
        )
        servico_indexacao = ServicoIndexacao(
            cliente=cliente_es,
            embeddings=servico_embeddings,
            nome_indice=nome_indice,
        )
        quantidade = servico_indexacao.indexar(
            caminho_arquivo=str(caminho),
            nome_arquivo=nome_original,
            tipo_mapping=tipo_mapping,
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
        try:
            if cliente_es is not None:
                cliente_es.close()
            fechar_ollama = getattr(cliente_ollama, 'close', None)
            if callable(fechar_ollama):
                fechar_ollama()
        finally:
            caminho.unlink(missing_ok=True)
            logger.info('Arquivo temporário removido: %s', caminho)


@app_celery.task(name='indexacao.processar_lote_zip')
def tarefa_processar_lote_zip(
    caminho_zip: str,
    nome_zip: str,
    nome_indice: str,
    tipo_mapping: str,
) -> dict:
    """Extrai o ZIP e cria um job independente para cada documento."""
    caminho = Path(caminho_zip)
    ids_processamento: list[str] = []

    try:
        with ZipFile(caminho) as arquivo_zip:
            for info in arquivo_zip.infolist():
                if info.is_dir():
                    continue

                nome_arquivo = obter_nome_seguro(info.filename)
                extensao = obter_extensao(nome_arquivo)
                if extensao not in FORMATOS_DOCUMENTO_SUPORTADOS:
                    raise ValueError(
                        f'Formato não suportado dentro do ZIP: {nome_arquivo}'
                    )

                caminho_documento = gerar_caminho_temporario(nome_arquivo)
                try:
                    with (
                        arquivo_zip.open(info) as origem,
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

                ids_processamento.append(tarefa.id)

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

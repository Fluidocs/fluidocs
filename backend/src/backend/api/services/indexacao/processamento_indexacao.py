import asyncio
import logging
from pathlib import Path
from shutil import copyfileobj
from zipfile import BadZipFile, ZipFile, ZipInfo

from elasticsearch import Elasticsearch, NotFoundError
from ollama import Client
from tortoise.context import TortoiseContext

from backend.api.helpers.arquivos import (
    gerar_caminho_temporario,
    obter_nome_seguro,
)
from backend.api.models.fonte_de_dados import (
    StatusFonte,
    FonteDeDados,
)
from backend.api.services.embeddings.indexacao import ProvedorEmbeddingsIndexacao
from backend.api.services.indexacao.indexacao import ServicoIndexacao
from backend.config.configuracoes import config
from backend.db.conexao import TORTOISE_CONFIG
from backend.domain.indices.identificador_documento import gerar_documento_id
from backend.domain.indices.nome_indice import gerar_nome_indice
from backend.workers.app_celery import (
    NOME_TAREFA_PROCESSAR_ARQUIVO,
    app_celery,
)


logger = logging.getLogger(__name__)


class ServicoProcessamentoIndexacao:
    def processar_arquivo(
        self,
        caminho_temporario: str,
        nome_original: str,
        usuario_id: int,
        fonte_dados_id: int,
        documento_id: str,
    ) -> dict:
        caminho = Path(caminho_temporario)

        try:
            return asyncio.run(
                self._processar_arquivo(
                    caminho,
                    nome_original,
                    usuario_id,
                    fonte_dados_id,
                    documento_id,
                )
            )
        finally:
            caminho.unlink(missing_ok=True)
            logger.info('Arquivo temporário removido: %s', caminho)

    def processar_lote_zip(
        self,
        caminho_zip: str,
        nome_zip: str,
        usuario_id: int,
        fonte_dados_id: int,
    ) -> dict:
        caminho = Path(caminho_zip)

        try:
            return asyncio.run(
                self._processar_lote_zip(
                    caminho,
                    nome_zip,
                    usuario_id,
                    fonte_dados_id,
                )
            )
        except BadZipFile:
            logger.exception('Arquivo ZIP inválido ou corrompido: %s', caminho)
            raise
        finally:
            caminho.unlink(missing_ok=True)
            logger.info('Arquivo ZIP temporário removido: %s', caminho)

    async def _processar_arquivo(
        self,
        caminho: Path,
        nome_original: str,
        usuario_id: int,
        fonte_dados_id: int,
        documento_id: str,
    ) -> dict:
        nome_indice = gerar_nome_indice(usuario_id)

        async with TortoiseContext() as contexto:
            await contexto.init(config=TORTOISE_CONFIG)

            if not await self._fonte_esta_ativa(
                usuario_id,
                fonte_dados_id,
            ):
                return self._descartar_processamento(
                    nome_original,
                    nome_indice,
                    usuario_id,
                    fonte_dados_id,
                    documento_id,
                )

            logger.info(
                'Iniciando indexação de %s no índice %s',
                nome_original,
                nome_indice,
            )
            quantidade = self._indexar_documento(
                caminho,
                nome_original,
                usuario_id,
                fonte_dados_id,
                documento_id,
            )

            if not await self._fonte_esta_ativa(
                usuario_id,
                fonte_dados_id,
            ):
                return self._descartar_processamento(
                    nome_original,
                    nome_indice,
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

    async def _processar_lote_zip(
        self,
        caminho: Path,
        nome_zip: str,
        usuario_id: int,
        fonte_dados_id: int,
    ) -> dict:
        nome_indice = gerar_nome_indice(usuario_id)

        async with TortoiseContext() as contexto:
            await contexto.init(config=TORTOISE_CONFIG)

            if not await self._fonte_esta_ativa(
                usuario_id,
                fonte_dados_id,
            ):
                return self._descartar_processamento(
                    nome_zip,
                    nome_indice,
                    usuario_id,
                    fonte_dados_id,
                )

            ids_processamento = self._enfileirar_documentos_zip(
                caminho,
                usuario_id,
                fonte_dados_id,
            )

            if not await self._fonte_esta_ativa(
                usuario_id,
                fonte_dados_id,
            ):
                resultado = self._descartar_processamento(
                    nome_zip,
                    nome_indice,
                    usuario_id,
                    fonte_dados_id,
                )
                resultado['ids_processamento'] = ids_processamento
                return resultado

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

    @staticmethod
    async def _fonte_esta_ativa(
        usuario_id: int,
        fonte_dados_id: int,
    ) -> bool:
        return await FonteDeDados.filter(
            id=fonte_dados_id,
            usuario_id=usuario_id,
            status=StatusFonte.ATIVA,
        ).exists()

    def _descartar_processamento(
        self,
        nome_arquivo: str,
        nome_indice: str,
        usuario_id: int,
        fonte_dados_id: int,
        documento_id: str | None = None,
    ) -> dict:
        trechos_removidos = self._remover_documentos_da_fonte(
            usuario_id,
            fonte_dados_id,
        )
        logger.info(
            'Processamento de %s descartado: fonte %s inexistente ou em exclusão',
            nome_arquivo,
            fonte_dados_id,
        )

        resultado = {
            'nome_arquivo': nome_arquivo,
            'nome_indice': nome_indice,
            'fonte_dados_id': fonte_dados_id,
            'trechos_removidos': trechos_removidos,
            'status': 'discarded',
            'motivo': 'Fonte de dados inexistente ou em exclusão.',
        }

        if documento_id is not None:
            resultado['documento_id'] = documento_id
            resultado['trechos_indexados'] = 0

        return resultado

    @staticmethod
    def _remover_documentos_da_fonte(
        usuario_id: int,
        fonte_dados_id: int,
    ) -> int:
        nome_indice = gerar_nome_indice(usuario_id)

        try:
            with Elasticsearch(config.elastic_url) as cliente:
                cliente.indices.refresh(index=nome_indice)
                resultado = cliente.delete_by_query(
                    index=nome_indice,
                    query={
                        'term': {
                            'fonte_dados_id': fonte_dados_id,
                        }
                    },
                    refresh=True,
                )
        except NotFoundError:
            return 0

        falhas = resultado.get('failures', [])
        if falhas:
            raise RuntimeError(
                'Não foi possível remover todos os documentos da fonte '
                f'{fonte_dados_id}.'
            )

        return resultado.get('deleted', 0)

    @staticmethod
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
                Client(host=config.embeddings_indexacao_host) as cliente_ollama,
            ):
                provedor_embeddings = ProvedorEmbeddingsIndexacao(
                    cliente=cliente_ollama,
                    modelo=config.embeddings_model,
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
            logger.exception(
                'Falha ao indexar %s no índice %s',
                nome_arquivo,
                nome_indice,
            )
            raise

    @classmethod
    def _enfileirar_documentos_zip(
        cls,
        caminho_zip: Path,
        usuario_id: int,
        fonte_dados_id: int,
    ) -> list[str]:
        ids_processamento: list[str] = []

        with ZipFile(caminho_zip) as arquivo_zip:
            for arquivo in arquivo_zip.infolist():
                if arquivo.is_dir():
                    continue

                id_processamento = cls._enfileirar_documento_zip(
                    arquivo_zip,
                    arquivo,
                    usuario_id,
                    fonte_dados_id,
                )
                ids_processamento.append(id_processamento)

        return ids_processamento

    @staticmethod
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

            tarefa = app_celery.send_task(
                NOME_TAREFA_PROCESSAR_ARQUIVO,
                args=(
                    str(caminho_documento),
                    nome_arquivo,
                    usuario_id,
                    fonte_dados_id,
                    gerar_documento_id(),
                ),
            )
        except Exception:
            caminho_documento.unlink(missing_ok=True)
            raise

        return tarefa.id

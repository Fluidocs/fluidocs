import asyncio
from pathlib import Path
from zipfile import BadZipFile, ZipFile, ZipInfo

from elasticsearch import AsyncElasticsearch
from fastapi import UploadFile

from backend.api.helpers.arquivos import (
    armazenar_upload_temporario,
    obter_extensao,
    obter_nome_seguro,
)
from backend.api.helpers.exceptions.elasticsearch import (
    tratar_indisponibilidade_elasticsearch,
)
from backend.domain.extracao.tipos import FormatoArquivo
from backend.domain.indices.exceptions import IndiceNaoEncontradoError
from backend.domain.indices.indexacao.exceptions import (
    ArquivoIndexacaoInvalidoError,
)
from backend.domain.indices.mapping.tipo_mapping import TipoMapping
from backend.workers.app_celery import (
    NOME_TAREFA_PROCESSAR_ARQUIVO,
    NOME_TAREFA_PROCESSAR_LOTE_ZIP,
    app_celery,
)


class ServicoSubmissaoIndexacao:
    def __init__(self, cliente: AsyncElasticsearch):
        self._cliente = cliente

    async def enfileirar_arquivo(
        self,
        arquivo: UploadFile,
        nome_indice: str,
        tipo_mapping: TipoMapping,
    ) -> tuple[str, str]:
        nome_arquivo = obter_nome_seguro(arquivo.filename)
        self._validar_nome_e_extensao(nome_arquivo)
        await self._validar_indice(nome_indice)
        caminho, tamanho = await armazenar_upload_temporario(
            arquivo,
            nome_arquivo,
        )

        try:
            self._validar_arquivo_nao_vazio(
                tamanho,
                'O arquivo enviado está vazio.',
            )
            id_processamento = self._enfileirar_tarefa(
                NOME_TAREFA_PROCESSAR_ARQUIVO,
                str(caminho),
                nome_arquivo,
                nome_indice,
                tipo_mapping.value,
            )
        except Exception:
            caminho.unlink(missing_ok=True)
            raise

        return id_processamento, nome_arquivo

    async def enfileirar_lote_zip(
        self,
        arquivo: UploadFile,
        nome_indice: str,
        tipo_mapping: TipoMapping,
    ) -> tuple[str, str, int]:
        nome_arquivo = obter_nome_seguro(arquivo.filename)
        self._validar_nome_zip(nome_arquivo)
        await self._validar_indice(nome_indice)
        caminho, tamanho = await armazenar_upload_temporario(
            arquivo,
            nome_arquivo,
        )

        try:
            self._validar_arquivo_nao_vazio(
                tamanho,
                'O arquivo ZIP enviado está vazio.',
            )
            quantidade = await asyncio.to_thread(
                self._validar_lote_zip,
                caminho,
            )
            id_processamento = self._enfileirar_tarefa(
                NOME_TAREFA_PROCESSAR_LOTE_ZIP,
                str(caminho),
                nome_arquivo,
                nome_indice,
                tipo_mapping.value,
            )
        except Exception:
            caminho.unlink(missing_ok=True)
            raise

        return id_processamento, nome_arquivo, quantidade

    @tratar_indisponibilidade_elasticsearch
    async def _validar_indice(self, nome_indice: str) -> None:
        indice_existe = await self._cliente.indices.exists(index=nome_indice)
        if not indice_existe:
            raise IndiceNaoEncontradoError(nome_indice)

    @staticmethod
    def _validar_arquivo_nao_vazio(tamanho: int, mensagem: str) -> None:
        if tamanho == 0:
            raise ArquivoIndexacaoInvalidoError(mensagem)

    @staticmethod
    def _enfileirar_tarefa(nome_tarefa: str, *argumentos: str) -> str:
        return app_celery.send_task(nome_tarefa, args=argumentos).id

    @staticmethod
    def _validar_nome_zip(nome_arquivo: str) -> None:
        if obter_extensao(nome_arquivo) != 'zip':
            raise ArquivoIndexacaoInvalidoError(
                'O lote enviado deve possuir extensão .zip.'
            )

    @staticmethod
    def _validar_nome_e_extensao(nome_arquivo: str) -> None:
        if not nome_arquivo:
            raise ArquivoIndexacaoInvalidoError(
                'O arquivo enviado deve possuir um nome.'
            )

        try:
            FormatoArquivo(obter_extensao(nome_arquivo))
        except ValueError as erro:
            formatos = ', '.join(
                sorted(formato.value for formato in FormatoArquivo)
            )
            raise ArquivoIndexacaoInvalidoError(
                f'Formato não suportado. Formatos permitidos: {formatos}.'
            ) from erro

    @classmethod
    def _validar_lote_zip(cls, caminho: Path) -> int:
        try:
            with ZipFile(caminho) as arquivo_zip:
                arquivos = cls._obter_arquivos(arquivo_zip)
                cls._validar_arquivos(arquivos)
                cls._validar_integridade(arquivo_zip)
                return len(arquivos)
        except BadZipFile as erro:
            raise ArquivoIndexacaoInvalidoError(
                'O arquivo ZIP é inválido ou está corrompido.'
            ) from erro

    @staticmethod
    def _obter_arquivos(arquivo_zip: ZipFile) -> list[ZipInfo]:
        arquivos = [info for info in arquivo_zip.infolist() if not info.is_dir()]
        if not arquivos:
            raise ArquivoIndexacaoInvalidoError(
                'O arquivo ZIP não contém documentos.'
            )
        return arquivos

    @classmethod
    def _validar_arquivos(cls, arquivos: list[ZipInfo]) -> None:
        for arquivo in arquivos:
            cls._validar_nome_e_extensao(obter_nome_seguro(arquivo.filename))
            if arquivo.flag_bits & 0x1:
                raise ArquivoIndexacaoInvalidoError(
                    'Arquivos ZIP protegidos por senha não são suportados.'
                )

    @staticmethod
    def _validar_integridade(arquivo_zip: ZipFile) -> None:
        arquivo_corrompido = arquivo_zip.testzip()
        if arquivo_corrompido:
            raise ArquivoIndexacaoInvalidoError(
                f'Arquivo corrompido dentro do ZIP: {arquivo_corrompido}.'
            )

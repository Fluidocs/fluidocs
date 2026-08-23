import asyncio
from pathlib import Path
from zipfile import BadZipFile, ZipFile

from fastapi import UploadFile

from backend.api.helpers.indexacao import (
    FORMATOS_DOCUMENTO_SUPORTADOS,
    armazenar_upload_temporario,
    obter_extensao,
    obter_nome_seguro,
)
from backend.domain.indices.indexacao.exceptions import (
    ArquivoIndexacaoInvalidoError,
)
from backend.domain.indices.mapping.tipo_mapping import TipoMapping
from backend.workers.tarefa_indexacao import (
    tarefa_processar_e_indexar,
    tarefa_processar_lote_zip,
)


class ServicoSubmissaoIndexacao:
    async def enfileirar_arquivo(
        self,
        arquivo: UploadFile,
        nome_indice: str,
        tipo_mapping: TipoMapping,
    ) -> tuple[str, str]:
        nome_arquivo = obter_nome_seguro(arquivo.filename)
        self._validar_nome_e_extensao(nome_arquivo)
        caminho, tamanho = await armazenar_upload_temporario(
            arquivo,
            nome_arquivo,
        )

        if tamanho == 0:
            caminho.unlink(missing_ok=True)
            raise ArquivoIndexacaoInvalidoError(
                'O arquivo enviado está vazio.'
            )

        try:
            tarefa = tarefa_processar_e_indexar.delay(
                str(caminho),
                nome_arquivo,
                nome_indice,
                tipo_mapping.value,
            )
        except Exception:
            caminho.unlink(missing_ok=True)
            raise

        return tarefa.id, nome_arquivo

    async def enfileirar_lote_zip(
        self,
        arquivo: UploadFile,
        nome_indice: str,
        tipo_mapping: TipoMapping,
    ) -> tuple[str, str, int]:
        nome_arquivo = obter_nome_seguro(arquivo.filename)
        if obter_extensao(nome_arquivo) != 'zip':
            raise ArquivoIndexacaoInvalidoError(
                'O lote enviado deve possuir extensão .zip.'
            )

        caminho, tamanho = await armazenar_upload_temporario(
            arquivo,
            nome_arquivo,
        )

        try:
            if tamanho == 0:
                raise ArquivoIndexacaoInvalidoError(
                    'O arquivo ZIP enviado está vazio.'
                )

            quantidade = await asyncio.to_thread(
                self._validar_lote_zip,
                caminho,
            )
            tarefa = tarefa_processar_lote_zip.delay(
                str(caminho),
                nome_arquivo,
                nome_indice,
                tipo_mapping.value,
            )
        except Exception:
            caminho.unlink(missing_ok=True)
            raise

        return tarefa.id, nome_arquivo, quantidade

    @staticmethod
    def _validar_nome_e_extensao(nome_arquivo: str) -> None:
        if not nome_arquivo:
            raise ArquivoIndexacaoInvalidoError(
                'O arquivo enviado deve possuir um nome.'
            )

        extensao = obter_extensao(nome_arquivo)
        if extensao not in FORMATOS_DOCUMENTO_SUPORTADOS:
            formatos = ', '.join(sorted(FORMATOS_DOCUMENTO_SUPORTADOS))
            raise ArquivoIndexacaoInvalidoError(
                f'Formato não suportado. Formatos permitidos: {formatos}.'
            )

    @classmethod
    def _validar_lote_zip(cls, caminho: Path) -> int:
        try:
            with ZipFile(caminho) as arquivo_zip:
                arquivos = [
                    info
                    for info in arquivo_zip.infolist()
                    if not info.is_dir()
                ]

                if not arquivos:
                    raise ArquivoIndexacaoInvalidoError(
                        'O arquivo ZIP não contém documentos.'
                    )

                for info in arquivos:
                    nome = obter_nome_seguro(info.filename)
                    cls._validar_nome_e_extensao(nome)
                    if info.flag_bits & 0x1:
                        raise ArquivoIndexacaoInvalidoError(
                            'Arquivos ZIP protegidos por senha não são suportados.'
                        )

                arquivo_corrompido = arquivo_zip.testzip()
                if arquivo_corrompido:
                    raise ArquivoIndexacaoInvalidoError(
                        f'Arquivo corrompido dentro do ZIP: {arquivo_corrompido}.'
                    )

                return len(arquivos)
        except BadZipFile as erro:
            raise ArquivoIndexacaoInvalidoError(
                'O arquivo ZIP é inválido ou está corrompido.'
            ) from erro

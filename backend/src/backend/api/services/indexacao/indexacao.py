from collections.abc import Iterable, Sequence
from pathlib import Path
from typing import Any

from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk

from backend.api.services.embeddings import ServicoEmbeddings
from backend.config.configuracoes import config
from backend.domain.extracao.divisor_texto import DivisorTexto
from backend.domain.extracao.extracao_factory import FactoryExtracao
from backend.domain.extracao.tipos import FormatoArquivo
from backend.domain.indices.indexacao import IndexacaoFactory
from backend.domain.indices.indexacao.strategy import IndexacaoBase
from backend.domain.indices.mapping.tipo_mapping import TipoMapping


class ServicoIndexacao:
    def __init__(
        self,
        cliente: Elasticsearch,
        embeddings: ServicoEmbeddings,
        nome_indice: str,
    ):
        self._cliente = cliente
        self._embeddings = embeddings
        self._nome_indice = nome_indice

    def indexar(
        self,
        caminho_arquivo: str,
        nome_arquivo: str,
        tipo_mapping: TipoMapping | str = TipoMapping.DOCUMENTOS,
    ) -> int:
        trechos, formato = self._extrair_e_dividir(
            caminho_arquivo,
            nome_arquivo,
        )
        strategy = IndexacaoFactory.get(tipo_mapping)

        return self._indexar_trechos(
            strategy,
            trechos,
            nome_arquivo,
            formato,
        )

    @staticmethod
    def _extrair_e_dividir(
        caminho_arquivo: str,
        nome_arquivo: str,
    ) -> tuple[list[str], FormatoArquivo]:
        formato = FormatoArquivo(Path(nome_arquivo).suffix.lower().lstrip('.'))
        extrator = FactoryExtracao.create(formato)
        conteudo = extrator.extrair_conteudo(caminho_arquivo)
        trechos = DivisorTexto.dividir(
            conteudo,
            tamanho=config.tamanho_trecho,
            sobreposicao=config.sobreposicao_trecho,
        )

        return trechos, formato

    def _indexar_trechos(
        self,
        strategy: IndexacaoBase,
        trechos: Sequence[str],
        nome_arquivo: str,
        formato: FormatoArquivo,
    ) -> int:
        quantidade = 0

        for inicio, lote in self._iterar_lotes(
            trechos,
            config.tamanho_lote_indexacao,
        ):
            self._indexar_lote(
                strategy,
                lote,
                inicio,
                nome_arquivo,
                formato,
            )
            quantidade += len(lote)

        return quantidade

    def _indexar_lote(
        self,
        strategy: IndexacaoBase,
        trechos: list[str],
        inicio: int,
        nome_arquivo: str,
        formato: FormatoArquivo,
    ) -> None:
        embeddings = self._embeddings.embed(trechos)
        acoes = strategy.construir_acoes(
            nome_indice=self._nome_indice,
            nome_arquivo=nome_arquivo,
            tipo_arquivo=formato.value,
            trechos=trechos,
            embeddings=embeddings,
            inicio_trecho=inicio,
        )
        self._indexar_em_lote(acoes)

    def _indexar_em_lote(
        self,
        documentos: Iterable[dict[str, Any]],
    ) -> None:
        bulk(self._cliente, documentos)

    @staticmethod
    def _iterar_lotes(
        itens: Sequence[str],
        tamanho_lote: int,
    ) -> Iterable[tuple[int, list[str]]]:
        if tamanho_lote <= 0:
            raise ValueError('O tamanho do lote deve ser maior que zero.')

        for inicio in range(0, len(itens), tamanho_lote):
            yield inicio, list(itens[inicio:inicio + tamanho_lote])

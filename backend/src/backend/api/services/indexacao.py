import asyncio
from collections.abc import Iterable, Sequence
from pathlib import Path
from typing import Any, cast

from elasticsearch import AsyncElasticsearch, Elasticsearch
from elasticsearch.helpers import async_bulk, bulk

from backend.api.services.embeddings import ServicoEmbeddings
from backend.config.configuracoes import config
from backend.domain.extracao.extracao_factory import FactoryExtracao
from backend.domain.extracao.servico_trechos import ServicoTrechos
from backend.domain.indices.exceptions import IndiceNaoEncontradoError
from backend.domain.indices.indexacao import IndexacaoFactory
from backend.domain.indices.mapping.tipo_mapping import TipoMapping


class ServicoIndexacao:
    def __init__(
        self,
        cliente: AsyncElasticsearch | Elasticsearch,
        embeddings: ServicoEmbeddings,
        nome_indice: str,
    ):
        self._cliente = cliente
        self._embeddings = embeddings
        self.nome_indice = nome_indice


    def indexar(
        self,
        caminho_arquivo: str,
        nome_arquivo: str,
        tipo_mapping: TipoMapping | str = TipoMapping.DOCUMENTOS,
    ) -> int:
        """Versão síncrona do fluxo, utilizada pelo worker Celery."""
        cliente = cast(Elasticsearch, self._cliente)

        if not cliente.indices.exists(index=self.nome_indice):
            raise IndiceNaoEncontradoError(self.nome_indice)

        trechos, tipo_arquivo = self._extrair_e_dividir(
            caminho_arquivo,
            nome_arquivo,
        )
        strategy = IndexacaoFactory.get(tipo_mapping)
        quantidade = 0

        for inicio, lote in self._iterar_lotes(
            trechos,
            config.tamanho_lote_indexacao,
        ):
            embeddings = self._embeddings.embed(lote)
            acoes = strategy.construir_acoes(
                nome_indice=self.nome_indice,
                nome_arquivo=nome_arquivo,
                tipo_arquivo=tipo_arquivo,
                trechos=lote,
                embeddings=embeddings,
                inicio_trecho=inicio,
            )
            self.indexar_em_lote_sync(acoes)
            quantidade += len(lote)

        return quantidade

    async def indexar_em_lote(
        self,
        documentos: Iterable[dict[str, Any]],
    ) -> None:
        cliente = cast(AsyncElasticsearch, self._cliente)
        await async_bulk(cliente, documentos)

    def indexar_em_lote_sync(
        self,
        documentos: Iterable[dict[str, Any]],
    ) -> None:
        cliente = cast(Elasticsearch, self._cliente)
        bulk(cliente, documentos)

    @staticmethod
    def _extrair_e_dividir(
        caminho_arquivo: str,
        nome_arquivo: str,
    ) -> tuple[list[str], str]:
        tipo_arquivo = Path(nome_arquivo).suffix.lower().lstrip('.')
        extrator = FactoryExtracao.create(tipo_arquivo)
        conteudo_extraido = extrator.extrair_conteudo(caminho_arquivo)
        conteudo = ServicoIndexacao._normalizar_conteudo(conteudo_extraido)

        return (
            ServicoTrechos.dividir(
                conteudo,
                tamanho=config.tamanho_trecho,
                sobreposicao=config.sobreposicao_trecho,
            ),
            tipo_arquivo,
        )

    @staticmethod
    def _normalizar_conteudo(conteudo: str | list[dict]) -> str:
        if isinstance(conteudo, str):
            return conteudo

        partes: list[str] = []
        for item in conteudo:
            if isinstance(item, dict):
                partes.extend(str(valor) for valor in item.values())
            else:
                partes.append(str(item))

        return '\n'.join(partes)

    @staticmethod
    def _iterar_lotes(
        itens: Sequence[str],
        tamanho_lote: int,
    ) -> Iterable[tuple[int, list[str]]]:
        if tamanho_lote <= 0:
            raise ValueError('O tamanho do lote deve ser maior que zero.')

        for inicio in range(0, len(itens), tamanho_lote):
            yield inicio, list(itens[inicio:inicio + tamanho_lote])

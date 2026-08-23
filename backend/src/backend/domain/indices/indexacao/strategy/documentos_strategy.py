from collections.abc import Iterable, Sequence
from typing import Any

from .base_strategy import IndexacaoBase


class DocumentosIndexacaoStrategy(IndexacaoBase):
    def construir_acoes(
        self,
        *,
        nome_indice: str,
        nome_arquivo: str,
        tipo_arquivo: str,
        trechos: Sequence[str],
        embeddings: Sequence[Sequence[float]],
        inicio_trecho: int = 0,
    ) -> Iterable[dict[str, Any]]:
        if len(trechos) != len(embeddings):
            raise ValueError(
                'A quantidade de trechos deve ser igual à quantidade de embeddings.'
            )

        for indice, (conteudo, embedding) in enumerate(zip(trechos, embeddings)):
            yield {
                '_index': nome_indice,
                '_source': {
                    'nome_documento': nome_arquivo,
                    'tipo_documento': tipo_arquivo,
                    'conteudo': conteudo,
                    'id_trecho': inicio_trecho + indice,
                    'embeddings': list(embedding),
                },
            }

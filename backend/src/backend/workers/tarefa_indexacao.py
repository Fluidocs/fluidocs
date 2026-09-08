from backend.api.services.indexacao.processamento_indexacao import (
    ServicoProcessamentoIndexacao,
)
from backend.workers.app_celery import (
    NOME_TAREFA_PROCESSAR_ARQUIVO,
    NOME_TAREFA_PROCESSAR_LOTE_ZIP,
    app_celery,
)


servico_processamento = ServicoProcessamentoIndexacao()


@app_celery.task(name=NOME_TAREFA_PROCESSAR_ARQUIVO)
def tarefa_processar_e_indexar(
    caminho_temporario: str,
    nome_original: str,
    usuario_id: int,
    fonte_dados_id: int,
    documento_id: str,
) -> dict:
    return servico_processamento.processar_arquivo(
        caminho_temporario,
        nome_original,
        usuario_id,
        fonte_dados_id,
        documento_id,
    )


@app_celery.task(name=NOME_TAREFA_PROCESSAR_LOTE_ZIP)
def tarefa_processar_lote_zip(
    caminho_zip: str,
    nome_zip: str,
    usuario_id: int,
    fonte_dados_id: int,
) -> dict:
    return servico_processamento.processar_lote_zip(
        caminho_zip,
        nome_zip,
        usuario_id,
        fonte_dados_id,
    )

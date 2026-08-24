from celery import Celery

from backend.config.configuracoes import config


NOME_TAREFA_PROCESSAR_ARQUIVO = 'indexacao.processar_arquivo'
NOME_TAREFA_PROCESSAR_LOTE_ZIP = 'indexacao.processar_lote_zip'

app_celery = Celery(
    'tarefas',
    broker=config.redis_url,
    backend=config.redis_url,
    include=[
        'backend.workers.tarefa_indexacao',
    ],
)

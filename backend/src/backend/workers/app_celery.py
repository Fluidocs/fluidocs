from celery import Celery
from backend.config.configuracoes import config

app_celery = Celery(
    'tarefas',
    broker=config.redis_url,
    backend=config.redis_url,
    include=[
        'backend.workers.tarefa_indexacao'
    ]
)

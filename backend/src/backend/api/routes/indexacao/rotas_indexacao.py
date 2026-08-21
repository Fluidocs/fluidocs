from fastapi import APIRouter
from backend.api.helpers.embeddings import ServicoEmbeddings

indexacao_router = APIRouter(tags=['indexacao'])

# [TODO] Implementar indexação
# - o cara manda o tipo de index (pensando naquela ideia do documentos e dump sql)
# - strategy escolhe o metodo
@indexacao_router.post(
    path='/'
)
def indexar_arquivo():
    pass
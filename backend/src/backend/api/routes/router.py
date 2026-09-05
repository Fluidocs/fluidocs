from fastapi import APIRouter

from .auth_routes import auth_router
from .indices.rotas_indices import indices_router
from .indexacao.rotas_indexacao import indexacao_router
from .pesquisa.pesquisa_routes import pesquisa_router
from .backoffice.usuario_routes import usuario_router

def build_router() -> APIRouter:
    router = APIRouter()

    router.include_router(
        auth_router,
        prefix='/auth'
    )
    router.include_router(
        usuario_router,
        prefix=''
    )
    router.include_router(
        indices_router,
        prefix='/indices'
    )
    router.include_router(
        indexacao_router,
        prefix='/indexar'
    )
    router.include_router(
        pesquisa_router,
        prefix='/indices'
    )

    return router

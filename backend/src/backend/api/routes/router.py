from fastapi import APIRouter

from backend.api.routes.indexacao.rotas_indices import indices_router

def build_router() -> APIRouter:
    router = APIRouter()

    router.include_router(
        indices_router,
        prefix='/indices'
    )

    return router

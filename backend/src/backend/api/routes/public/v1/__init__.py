from fastapi import APIRouter

from .pesquisa_routes import pesquisa_router
from .conversa_routes import conversa_router
from .fontes_dados_router import fontes_router

v1_router = APIRouter(
    prefix='/v1',
    tags=['Pública']
)

v1_router.include_router(fontes_router)
v1_router.include_router(pesquisa_router)
v1_router.include_router(conversa_router)
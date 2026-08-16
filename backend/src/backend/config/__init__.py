from fastapi import FastAPI
from contextlib import asynccontextmanager
from elasticsearch import AsyncElasticsearch

from .configuracoes import config
from backend.api.schemas.routes.base_response import BaseResponse
from backend.api.schemas.routes.health_response import HealthResponse
from backend.api.routes.router import build_router
from backend.api.handlers import registrar_exception_handlers

@asynccontextmanager
async def lifespan(app: FastAPI):
    main_es_client = AsyncElasticsearch(config.elastic_url)
    app.state.elasticsearch = main_es_client

    # [TODO] Modelo de Embeddings

    # [TODO] Adicionar aerich (conexão com o banco)

    yield

    await main_es_client.close()

def inicializar_app() -> FastAPI:
    app = FastAPI(
        debug=config.debug,
        title="Fluidocs API",
        description=(
            "Middleware inteligente, focado em busca lexical, semântica ou híbrida sobre os seus dados."
        ),
        version='1.0',
        lifespan=lifespan
    )

    registrar_exception_handlers(app)

    @app.get("/health", response_model=BaseResponse[HealthResponse])
    async def health():
        return {
            'dados': { 'status_code': 200 }
        }

    app.include_router(
        build_router(),
        prefix='/api'
    )

    return app

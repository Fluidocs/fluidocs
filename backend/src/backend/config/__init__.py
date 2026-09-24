from contextlib import asynccontextmanager

from elasticsearch import AsyncElasticsearch
from fastapi import FastAPI
from ollama import AsyncClient
from tortoise import Tortoise

from backend.api.handlers import registrar_exception_handlers
from backend.api.routes.router import build_router
from backend.api.schemas.base_response import BaseResponse
from backend.api.schemas.health_response import HealthResponse
from backend.db.conexao import TORTOISE_CONFIG

from .configuracoes import config


@asynccontextmanager
async def lifespan(app: FastAPI):
    main_es_client = AsyncElasticsearch(config.elastic_url)
    app.state.elasticsearch = main_es_client

    ai_models_client = AsyncClient(config.ollama_chat_host)
    app.state.ollama = ai_models_client

    embeddings_client = AsyncClient(config.embeddings_pesquisa_host)
    app.state.embeddings = embeddings_client

    await Tortoise.init(
        config=TORTOISE_CONFIG,
        _enable_global_fallback=True,
    )
    # await Tortoise.generate_schemas(safe=True)

    yield

    await Tortoise.close_connections()
    await main_es_client.close()
    await ai_models_client.close()
    await embeddings_client.close()


def inicializar_app() -> FastAPI:
    app = FastAPI(
        debug=config.debug,
        title="Fluidocs API",
        description=(
            "Middleware inteligente, focado em busca lexical, semantica ou hibrida sobre os seus dados."
        ),
        version='1.0',
        lifespan=lifespan,
    )

    registrar_exception_handlers(app)

    @app.get("/health", response_model=BaseResponse[HealthResponse])
    async def health():
        return {
            'dados': {'status_code': 200}
        }

    app.include_router(
        build_router(),
        prefix='/api',
    )

    return app

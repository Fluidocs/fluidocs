from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Configuracoes(BaseSettings):
    # ** APP **
    debug: bool = False
    server_host: str = '0.0.0.0'
    server_port: int = 8000
    temp_docs_path: str = '/tmp/docs'
    tamanho_bloco_upload: int = 1024
    tamanho_trecho: int = 1000
    sobreposicao_trecho: int = 100
    tamanho_lote_indexacao: int = 32
    celery_worker_concurrency: int = 1

    #** POSTGRESQL **
    nome_bd: str = ''
    usuario_bd: str = ''
    senha_bd: str = ''
    porta_bd: int = 5432
    host_bd: str = ''

    # ** AUTENTICACAO **
    jwt_secret: str
    jwt_algorithm: str = 'HS256'
    jwt_access_token_expire_minutes: int = 20

    # ** ELASTICSEARCH **
    elastic_url: str = 'http://elasticsearch:9200'

    # ** OLLAMA **
    ollama_host: str = 'http://ollama:11434'
    embeddings_model: str = 'qwen3-embedding:0.6b'
    embeddings_dims: int = 1024

    # ** REDIS **
    redis_url: str = 'redis://redis:6379'

    # ** AMBIENTE **
    @field_validator('debug', mode='before')
    @classmethod
    def normalizar_debug(cls, value: object) -> object:
        if isinstance(value, str):
            valor = value.strip().lower()
            if valor in {"1", "true", "yes", "on", "debug", "development", "dev"}:
                return True
            if valor in {"0", "false", "no", "off", "release", "production", "prod"}:
                return False
        return value

    model_config = SettingsConfigDict(
            env_file='.env',
            env_file_encoding='utf-8',
            extra='ignore'
        )

config = Configuracoes()

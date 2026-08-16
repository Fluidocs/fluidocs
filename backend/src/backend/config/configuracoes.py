from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Configuracoes(BaseSettings):
    # ** APP **
    debug: bool = False
    server_host: str = '0.0.0.0'
    server_port: int = 8000

    # [TODO] Adicionar configurações de conexão com o banco local do middleware

    # ** ELASTICSEARCH **
    elastic_url: str = 'http://elasticsearch:9200'

    # ** HUGGING_FACE **
    hf_token: str
    hf_model: str = 'intfloat/multilingual-e5-base'
    hf_dimensionamento: int = 768

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
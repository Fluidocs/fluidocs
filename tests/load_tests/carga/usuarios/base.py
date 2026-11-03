"""Autenticação e cliente HTTP compartilhados pelos cenários."""

import logging

from locust import HttpUser, between
from locust.exception import StopUser

from carga.eventos import LOGIN


TIMEOUT_CONEXAO_S = 5
logger = logging.getLogger(__name__)


class FluidocsUser(HttpUser):
    abstract = True
    requer_autenticacao = True
    requer_chave_api = False
    requer_fontes = False
    wait_time = between(1, 3)

    @classmethod
    def validar_configuracao(cls, configuracao):
        if cls.requer_autenticacao and not (
            configuracao.token or (configuracao.email and configuracao.senha)
        ):
            raise ValueError(f"{cls.__name__}: informe --token ou --email e --password.")
        if cls.requer_chave_api and not configuracao.chave_api:
            raise ValueError(f"{cls.__name__}: informe --api-key (FLUIDOCS_LOAD_API_KEY).")
        if cls.requer_fontes and not configuracao.fontes:
            raise ValueError(f"{cls.__name__}: informe ao menos um ID positivo em --source-ids.")

    def on_start(self):
        self.configuracao = self.environment.fluidocs_configuracao
        if self.configuracao is None:
            raise StopUser()
        try:
            self.validar_configuracao(self.configuracao)
        except ValueError as erro:
            logger.error("Configuração inválida: %s", erro)
            self.environment.fluidocs_falha_preparacao = True
            raise StopUser() from None
        self.autenticar()

    def _opcoes_request(self):
        return {
            "catch_response": True,
            "allow_redirects": False,
            "timeout": (TIMEOUT_CONEXAO_S, self.configuracao.timeout),
        }

    def autenticar(self):
        token = self.configuracao.token
        if self.requer_autenticacao and not token:
            with self.client.post(
                self.configuracao.prefixo + "/auth/login", name=LOGIN,
                data={"username": self.configuracao.email, "password": self.configuracao.senha},
                **self._opcoes_request(),
            ) as resposta:
                token = None
                if resposta.status_code == 200:
                    try:
                        dados = resposta.json()
                        token = dados.get("access_token") if isinstance(dados, dict) else None
                    except ValueError:
                        pass
                if not isinstance(token, str) or not token.strip():
                    resposta.failure(f"Login inválido ou sem access_token (HTTP {resposta.status_code}).")
                    self.environment.fluidocs_falha_preparacao = True
                    raise StopUser()
        if self.requer_autenticacao:
            self.client.headers.update({"Authorization": f"Bearer {token}"})
        if self.requer_chave_api:
            self.client.headers.update({"X-API-Key": self.configuracao.chave_api})

    def requisitar(self, metodo, caminho, *, validar, nome=None, **kwargs):
        with self.client.request(
            metodo, self.configuracao.prefixo + caminho,
            name=nome or f"{metodo} {caminho}", **self._opcoes_request(), **kwargs,
        ) as resposta:
            if resposta.status_code != 200:
                return resposta.failure(f"HTTP {resposta.status_code}; esperado 200.")
            try:
                corpo = resposta.json()
            except ValueError:
                return resposta.failure("Resposta sem JSON válido.")
            if not isinstance(corpo, dict) or "dados" not in corpo:
                return resposta.failure("Resposta sem envelope 'dados'.")
            if erro := validar(corpo["dados"]):
                resposta.failure(erro)

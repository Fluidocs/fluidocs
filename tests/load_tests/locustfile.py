"""Carga HTTP com cenários separados e limites opcionais por operação."""

import json
import logging
import math
import random
from dataclasses import dataclass, field
from pathlib import Path

import gevent
from locust import HttpUser, between, events, task
from locust import stats as locust_stats
from locust.exception import StopUser
from locust.runners import WorkerRunner


PERCENTIS = [0.50, 0.90, 0.95, 0.99]
locust_stats.PERCENTILES_TO_REPORT = PERCENTIS
locust_stats.PERCENTILES_TO_STATISTICS = PERCENTIS
locust_stats.PERCENTILES_TO_CHART = PERCENTIS
LOGIN = "[preparacao] POST /auth/login"
logger = logging.getLogger(__name__)


@events.init_command_line_parser.add_listener
def adicionar_argumentos(parser):
    parser.add_argument(
        "--scenario", choices=["saude", "painel", "literal", "hibrida", "conversa"],
        default="painel", env_var="FLUIDOCS_LOAD_SCENARIO",
        help="Operação medida; conversa cria uma nova conversa a cada pergunta.",
    )
    for argumento, sufixo, ajuda in [
        ("email", "EMAIL", "E-mail de uma conta de teste existente."),
        ("password", "PASSWORD", "Senha da conta de teste."),
        ("token", "TOKEN", "JWT existente; tem precedência sobre e-mail/senha."),
        ("source-ids", "SOURCE_IDS", "IDs de fontes próprias, separados por vírgula."),
        ("queries-file", "QUERIES_FILE", "Arquivo JSON com uma lista de consultas."),
        ("api-prefix", "API_PREFIX", "Prefixo de um proxy que remova esse caminho; vazio na API e no Vite atuais."),
    ]:
        parser.add_argument(
            f"--{argumento}", default="", env_var=f"FLUIDOCS_LOAD_{sufixo}",
            is_secret=argumento in {"password", "token"}, help=ajuda,
        )
    parser.add_argument(
        "--query", default="Como solicitar férias?", env_var="FLUIDOCS_LOAD_QUERY",
        help="Consulta usada quando --queries-file não é informado.",
    )
    parser.add_argument(
        "--request-timeout", type=float, default=120,
        env_var="FLUIDOCS_LOAD_REQUEST_TIMEOUT", help="Timeout de leitura em segundos.",
    )
    for percentil in (95, 99):
        parser.add_argument(
            f"--p{percentil}-limit-ms", type=float, default=None,
            env_var=f"FLUIDOCS_LOAD_P{percentil}_LIMIT_MS",
            help=f"Falha se alguma operação medida ultrapassar este p{percentil}, em ms.",
        )


@dataclass(frozen=True)
class Configuracao:
    cenario: str
    email: str
    senha: str = field(repr=False)
    token: str = field(repr=False)
    fontes: tuple[int, ...]
    consultas: tuple[str, ...]
    prefixo: str
    timeout: float
    limites: tuple[tuple[float, float], ...]

    @classmethod
    def das_opcoes(cls, opcoes):
        cenario = opcoes.scenario
        email = opcoes.email.strip()
        token = opcoes.token.strip()
        if cenario != "saude" and not (token or (email and opcoes.password)):
            raise ValueError("Informe --token ou --email e --password para este cenário.")

        fontes = ()
        consultas = ()
        if cenario in {"literal", "hibrida", "conversa"}:
            try:
                fontes = tuple(dict.fromkeys(int(item.strip()) for item in opcoes.source_ids.split(",")))
            except ValueError:
                raise ValueError("--source-ids deve conter inteiros positivos separados por vírgula.") from None
            if not fontes or any(fonte <= 0 for fonte in fontes):
                raise ValueError("Informe ao menos um ID positivo em --source-ids.")

            consultas = [opcoes.query]
            if opcoes.queries_file:
                try:
                    consultas = json.loads(Path(opcoes.queries_file).read_text(encoding="utf-8"))
                except (OSError, UnicodeError, ValueError):
                    raise ValueError("Não foi possível ler --queries-file como JSON UTF-8.") from None
            if (
                not isinstance(consultas, list) or not consultas
                or any(not isinstance(q, str) or not q.strip() or len(q) > 2000 for q in consultas)
            ):
                raise ValueError("As consultas devem ser uma lista não vazia de textos com 1 a 2000 caracteres.")
            consultas = tuple(q.strip() for q in consultas)

        timeout = float(opcoes.request_timeout)
        if not math.isfinite(timeout) or timeout <= 0:
            raise ValueError("--request-timeout deve ser positivo e finito.")
        limites = []
        for percentil in (95, 99):
            limite = getattr(opcoes, f"p{percentil}_limit_ms")
            if limite is not None:
                limite = float(limite)
                if not math.isfinite(limite) or limite <= 0:
                    raise ValueError(f"--p{percentil}-limit-ms deve ser positivo e finito.")
                limites.append((percentil / 100, limite))
        prefixo = opcoes.api_prefix.strip().rstrip("/")
        if prefixo and (not prefixo.startswith("/") or prefixo.startswith("//") or "?" in prefixo or "#" in prefixo):
            raise ValueError("--api-prefix deve ser um caminho como /api, sem query ou fragmento.")
        return cls(cenario, email, opcoes.password, token, fontes, consultas, prefixo, timeout, tuple(limites))


@events.test_start.add_listener
def configurar_execucao(environment, **kwargs):
    environment.fluidocs_configuracao = None
    environment.fluidocs_falha_preparacao = False
    try:
        environment.fluidocs_configuracao = Configuracao.das_opcoes(environment.parsed_options)
    except ValueError as erro:
        logger.error("Configuração inválida: %s", erro)
        environment.process_exit_code = 2
        gevent.spawn(environment.runner.quit)


@events.quitting.add_listener
def verificar_resultado(environment, **kwargs):
    if isinstance(environment.runner, WorkerRunner):
        return
    configuracao = getattr(environment, "fluidocs_configuracao", None)
    if configuracao is None:
        environment.process_exit_code = environment.process_exit_code or 2
        return
    operacoes = [
        entrada for entrada in environment.stats.entries.values()
        if entrada.name != LOGIN and entrada.num_requests > 0
    ]
    if not operacoes or getattr(environment, "fluidocs_falha_preparacao", False):
        logger.error("Execução sem amostras do cenário ou com falha na preparação.")
        environment.process_exit_code = environment.process_exit_code or 1
    if environment.stats.total.num_failures:
        environment.process_exit_code = environment.process_exit_code or 1
    for entrada in operacoes:
        for percentil, limite in configuracao.limites:
            observado = entrada.get_response_time_percentile(percentil)
            if observado is not None and observado > limite:
                logger.error(
                    "%s: p%d = %.0f ms, limite = %.0f ms.",
                    entrada.name, percentil * 100, observado, limite,
                )
                environment.process_exit_code = environment.process_exit_code or 1


class FluidocsUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        self.configuracao = self.environment.fluidocs_configuracao
        if self.configuracao is None:
            raise StopUser()
        if self.configuracao.cenario == "saude":
            return
        if self.configuracao.token:
            token = self.configuracao.token
        else:
            with self.client.post(
                self.configuracao.prefixo + "/auth/login", name=LOGIN,
                data={"username": self.configuracao.email, "password": self.configuracao.senha},
                catch_response=True, allow_redirects=False,
                timeout=(5, self.configuracao.timeout),
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
        self.client.headers.update({"Authorization": f"Bearer {token}"})

    def requisitar(self, metodo, caminho, *, nome=None, formato=list, **kwargs):
        with self.client.request(
            metodo, self.configuracao.prefixo + caminho,
            name=nome or f"{metodo} {caminho}", catch_response=True,
            allow_redirects=False, timeout=(5, self.configuracao.timeout), **kwargs,
        ) as resposta:
            if resposta.status_code != 200:
                resposta.failure(f"HTTP {resposta.status_code}; esperado 200.")
                return
            try:
                corpo = resposta.json()
            except ValueError:
                resposta.failure("Resposta sem JSON válido.")
                return
            dados = corpo.get("dados") if isinstance(corpo, dict) else None
            if not isinstance(dados, formato):
                resposta.failure("Resposta sem dados no formato esperado.")
            elif caminho == "/health" and dados.get("status_code") != 200:
                resposta.failure("Health sem status_code 200.")
            elif caminho == "/conversas/perguntar" and (
                not isinstance(dados.get("id"), int) or not isinstance(dados.get("mensagens"), list)
            ):
                resposta.failure("Conversa sem id ou mensagens.")

    @task
    def executar_cenario(self):
        cenario = self.configuracao.cenario
        if cenario == "saude":
            self.requisitar("GET", "/health", formato=dict)
        elif cenario == "painel":
            self.requisitar("GET", random.choice(("/fontes-dados/", "/conversas")))
        else:
            consulta = random.choice(self.configuracao.consultas)
            fontes = list(self.configuracao.fontes)
            if cenario == "conversa":
                self.requisitar(
                    "POST", "/conversas/perguntar", formato=dict,
                    json={"pergunta": consulta, "fonte_dados_ids": fontes},
                )
            else:
                self.requisitar(
                    "POST", "/pesquisar", nome=f"POST /pesquisar [{cenario}]",
                    json={
                        "q": consulta, "fonte_dados_ids": fontes, "tipo_pesquisa": cenario,
                        "pagina": 1, "tamanho": 10,
                    },
                )

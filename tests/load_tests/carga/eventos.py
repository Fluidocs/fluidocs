"""Ciclo de vida, percentis e resultado local ou distribuído da carga."""

import logging

import gevent
from locust import events
from locust import stats as locust_stats
from locust.runners import WorkerRunner

from carga.config import Configuracao, adicionar_argumentos


PERCENTIS = [0.50, 0.90, 0.95, 0.99]
# O relatório padrão não inclui p90; alinhe CSV, estatísticas e gráficos.
locust_stats.PERCENTILES_TO_REPORT = PERCENTIS
locust_stats.PERCENTILES_TO_STATISTICS = PERCENTIS
locust_stats.PERCENTILES_TO_CHART = PERCENTIS
LOGIN = "[preparacao] POST /auth/login"
logger = logging.getLogger(__name__)
events.init_command_line_parser.add_listener(adicionar_argumentos)


@events.init.add_listener
def registrar_preparacao_distribuida(environment, **kwargs):
    # O reset de estatísticas não pode apagar uma falha de login na preparação.
    @environment.events.report_to_master.add_listener
    def relatar_preparacao(client_id, data, **kwargs):
        data["fluidocs_falha_preparacao"] = getattr(environment, "fluidocs_falha_preparacao", False)

    @environment.events.worker_report.add_listener
    def receber_preparacao(client_id, data, **kwargs):
        if data.get("fluidocs_falha_preparacao"):
            environment.fluidocs_falha_preparacao = True


@events.test_start.add_listener
def configurar_execucao(environment, **kwargs):
    environment.fluidocs_configuracao = None
    environment.fluidocs_falha_preparacao = False
    try:
        configuracao = Configuracao.das_opcoes(environment.parsed_options)
        # Workers podem carregar classes que o master não selecionou para a carga.
        if not isinstance(environment.runner, WorkerRunner):
            for usuario in environment.user_classes:
                usuario.validar_configuracao(configuracao)
        environment.fluidocs_configuracao = configuracao
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
            observado = entrada.get_response_time_percentile(percentil / 100)
            if observado is not None and observado > limite:
                logger.error(
                    "%s: p%d = %.0f ms, limite = %.0f ms.",
                    entrada.name, percentil, observado, limite,
                )
                environment.process_exit_code = environment.process_exit_code or 1

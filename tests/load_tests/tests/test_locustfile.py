"""Valida o gerador contra HTTP local; não mede desempenho do Fluidocs."""

# Importe Locust antes dos clientes HTTP para aplicar o monkey patch do gevent.
from locust.env import Environment
from locust.exception import StopUser

import csv
import json
import os
import socket
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch
from urllib.parse import parse_qs

from gevent.pywsgi import WSGIServer

from carga.config import Configuracao
from carga.eventos import (
    LOGIN, configurar_execucao, registrar_preparacao_distribuida, verificar_resultado,
)
from carga.usuarios.base import FluidocsUser
from locustfile import (
    ConversaUser, PainelUser, PesquisaHibridaUser, PesquisaLiteralUser, SaudeUser,
)


PROJETO = Path(__file__).resolve().parents[1]


def opcoes(**alteracoes):
    valores = dict(
        email="", password="", token="", api_key="", source_ids="",
        query="Consulta fictícia", queries_file="", api_prefix="", request_timeout=2,
        p95_limit_ms=None, p99_limit_ms=None,
    )
    valores.update(alteracoes)
    return SimpleNamespace(**valores)


class ClienteHTTPTest(unittest.TestCase):
    def setUp(self):
        self.chamadas = []
        self.chaves_recebidas = []
        self.status = 200
        self.falhas_login = 0
        self.corpo = None
        self.servidor = WSGIServer(("127.0.0.1", 0), self.aplicacao, log=None)
        self.servidor.start()
        self.host = f"http://127.0.0.1:{self.servidor.server_port}"
        self.addCleanup(setattr, FluidocsUser, "host", FluidocsUser.host)
        FluidocsUser.host = self.host
        self.ambiente = Environment(user_classes=[SaudeUser], host=self.host, parsed_options=opcoes())
        self.ambiente.create_local_runner()

    def tearDown(self):
        self.ambiente.runner.quit()
        self.servidor.stop()

    def aplicacao(self, environ, start_response):
        caminho = environ["PATH_INFO"].removeprefix("/proxy")
        tamanho = int(environ.get("CONTENT_LENGTH") or 0)
        corpo = environ["wsgi.input"].read(tamanho).decode()
        self.chamadas.append((environ["REQUEST_METHOD"], environ["PATH_INFO"], corpo, environ.get("HTTP_AUTHORIZATION")))
        self.chaves_recebidas.append(environ.get("HTTP_X_API_KEY"))
        if self.corpo is not None:
            resposta = self.corpo
        elif caminho == "/auth/login":
            if self.falhas_login:
                self.falhas_login -= 1
                resposta = {"access_token": ""}
            else:
                resposta = {"access_token": "jwt-ficticio", "token_type": "bearer"}
        elif caminho == "/health":
            resposta = {"dados": {"status_code": 200}}
        elif caminho == "/api/v1/conversas/perguntar":
            resposta = {"dados": {"conversa_id": 1, "resposta": "Resposta fictícia", "anexos": []}}
        else:
            resposta = {"dados": []}
        start_response(f"{self.status} Fixture", [("Content-Type", "application/json")])
        return [(resposta if isinstance(resposta, str) else json.dumps(resposta)).encode()]

    def usuario(self, classe=SaudeUser, **alteracoes):
        self.ambiente.user_classes = [classe]
        self.ambiente.parsed_options = opcoes(**alteracoes)
        configurar_execucao(self.ambiente)
        usuario = classe(self.ambiente)
        usuario.on_start()
        self.addCleanup(usuario.client.close)
        return usuario

    def test_saude_nao_faz_login(self):
        self.usuario().verificar_saude()
        self.assertEqual([(m, p) for m, p, _, _ in self.chamadas], [("GET", "/health")])
        self.assertEqual(self.ambiente.stats.total.num_failures, 0)

    def test_login_usa_formulario_oauth_e_reaproveita_jwt(self):
        usuario = self.usuario(PainelUser, api_key="chave-ficticia", email="carga@example.com", password="senha-ficticia")
        usuario.listar_fontes()
        formulario = parse_qs(self.chamadas[0][2])
        self.assertEqual(formulario, {"username": ["carga@example.com"], "password": ["senha-ficticia"]})
        self.assertEqual(self.chamadas[1][3], "Bearer jwt-ficticio")
        self.assertEqual(self.chaves_recebidas[1], "chave-ficticia")

    def test_painel_le_conversas_com_token_sem_login(self):
        usuario = self.usuario(PainelUser, api_key="chave-ficticia", token="jwt-ficticio")
        usuario.listar_conversas()
        self.assertEqual(len(self.chamadas), 1)
        self.assertEqual(self.chamadas[0][1], "/api/v1/conversas")

    def test_pesquisas_enviam_o_contrato_real_e_separam_estatisticas(self):
        for classe in (PesquisaLiteralUser, PesquisaHibridaUser):
            cenario = classe.tipo_pesquisa
            usuario = self.usuario(classe, api_key="chave-ficticia", source_ids="3,7", query="férias")
            usuario.pesquisar()
            self.assertEqual(json.loads(self.chamadas[-1][2]), {
                "q": "férias", "fonte_dados_ids": [3, 7], "tipo_pesquisa": cenario, "pagina": 1, "tamanho": 10,
            })
            self.assertEqual(self.chamadas[-1][1], "/api/v1/pesquisar")
            self.assertEqual(self.chaves_recebidas[-1], "chave-ficticia")
            self.assertIsNone(self.chamadas[-1][3])
            self.assertEqual(self.ambiente.stats.get(f"POST /api/v1/pesquisar [{cenario}]", "POST").num_requests, 1)
        self.assertEqual(self.ambiente.stats.total.num_failures, 0)

    def test_conversa_nao_compartilha_id_nem_aumenta_historico(self):
        usuario = self.usuario(ConversaUser, api_key="chave-ficticia", source_ids="3")
        usuario.perguntar()
        usuario.perguntar()
        for metodo, caminho, corpo, _ in self.chamadas:
            self.assertEqual((metodo, caminho), ("POST", "/api/v1/conversas/perguntar"))
            self.assertEqual(json.loads(corpo), {"pergunta": "Consulta fictícia", "fonte_dados_ids": [3]})
        self.assertEqual(self.ambiente.stats.total.num_failures, 0)

    def test_prefixo_e_aplicado_no_http(self):
        self.usuario(api_prefix="/proxy").verificar_saude()
        self.assertEqual(self.chamadas[0][1], "/proxy/health")

    def test_login_invalido_interrompe_usuario_e_reprova_execucao(self):
        self.corpo = {"access_token": ""}
        with self.assertRaises(StopUser):
            self.usuario(PainelUser, api_key="chave-ficticia", email="carga@example.com", password="senha-ficticia")
        self.assertTrue(self.ambiente.fluidocs_falha_preparacao)
        verificar_resultado(self.ambiente)
        self.assertEqual(self.ambiente.process_exit_code, 1)

    def test_erro_http_e_redirecionamento_contam_como_falha(self):
        usuario = self.usuario()
        for status in (302, 401, 403, 422, 503):
            self.status = status
            usuario.verificar_saude()
        self.assertEqual(self.ambiente.stats.total.num_failures, 5)

    def test_json_invalido_envelope_invalido_e_health_invalido_falham(self):
        usuario = self.usuario()
        for corpo in ("<html>login</html>", [], {"dados": []}, {"dados": {"status_code": 503}}):
            self.corpo = corpo
            usuario.verificar_saude()
        self.assertEqual(self.ambiente.stats.total.num_failures, 4)

    def test_sem_amostras_reprova_execucao(self):
        self.usuario()
        verificar_resultado(self.ambiente)
        self.assertEqual(self.ambiente.process_exit_code, 1)

    def test_limites_avaliam_operacoes_separadamente_e_ignoram_login(self):
        self.usuario(p95_limit_ms=500, p99_limit_ms=500)
        self.ambiente.stats.log_request("POST", LOGIN, 3000, 10)
        for _ in range(100):
            self.ambiente.stats.log_request("GET", "/operacao-rapida", 1, 10)
        self.ambiente.stats.log_request("GET", "/operacao-lenta", 500, 10)
        verificar_resultado(self.ambiente)
        self.assertIsNone(self.ambiente.process_exit_code)
        for percentil in (95, 99):
            self.ambiente.process_exit_code = None
            self.ambiente.fluidocs_configuracao = Configuracao.das_opcoes(opcoes(**{f"p{percentil}_limit_ms": 499}))
            verificar_resultado(self.ambiente)
            self.assertEqual(self.ambiente.process_exit_code, 1)

    def test_credenciais_e_fontes_sao_exigidas_por_classe(self):
        configuracao = Configuracao.das_opcoes(opcoes())
        SaudeUser.validar_configuracao(configuracao)
        with self.assertRaisesRegex(ValueError, "--token"):
            PainelUser.validar_configuracao(configuracao)
        with self.assertRaisesRegex(ValueError, "--api-key"):
            PainelUser.validar_configuracao(Configuracao.das_opcoes(opcoes(token="jwt-ficticio")))
        for classe in (PesquisaLiteralUser, PesquisaHibridaUser, ConversaUser):
            with self.subTest(classe=classe.__name__):
                with self.assertRaisesRegex(ValueError, "--api-key"):
                    classe.validar_configuracao(configuracao)
                with self.assertRaisesRegex(ValueError, "--source-ids"):
                    classe.validar_configuracao(Configuracao.das_opcoes(opcoes(api_key="chave-ficticia")))

    def test_validadores_sao_injetados_sem_depender_do_caminho(self):
        usuario = self.usuario()
        self.corpo = {"dados": {"valor": 42}}
        validar = Mock(return_value=None)
        usuario.requisitar("GET", "/outro-endpoint", validar=validar)
        validar.assert_called_once_with({"valor": 42})
        self.assertEqual(self.ambiente.stats.total.num_failures, 0)
        validar.return_value = "Conteúdo rejeitado pelo cenário."
        usuario.requisitar("GET", "/outro-endpoint", validar=validar)
        self.assertEqual(self.ambiente.stats.total.num_failures, 1)

    def test_envelope_ausente_nao_chama_validador(self):
        usuario = self.usuario()
        self.corpo = {"outro": []}
        validar = Mock()
        usuario.requisitar("GET", "/outro-endpoint", validar=validar)
        validar.assert_not_called()
        self.assertEqual(self.ambiente.stats.total.num_failures, 1)

    def test_conversa_valida_o_contrato_de_resposta_atual(self):
        usuario = self.usuario(ConversaUser, api_key="chave-ficticia", source_ids="3")
        for dados in (
            [], {"id": 1, "mensagens": []},
            {"conversa_id": True, "resposta": "ok", "anexos": []},
            {"conversa_id": 0, "resposta": "ok", "anexos": []},
            {"conversa_id": 1, "resposta": "", "anexos": []},
            {"conversa_id": 1, "resposta": "ok"},
        ):
            self.corpo = {"dados": dados}
            usuario.perguntar()
        self.assertEqual(self.ambiente.stats.total.num_failures, 6)
        self.assertTrue(all(chave == "chave-ficticia" for chave in self.chaves_recebidas))

    def test_falha_de_preparacao_chega_ao_master_mesmo_apos_reset_das_estatisticas(self):
        self.usuario()
        worker = Environment()
        registrar_preparacao_distribuida(worker)
        registrar_preparacao_distribuida(self.ambiente)
        worker.fluidocs_falha_preparacao = True
        worker.stats.reset_all()
        relatorio = {}
        worker.events.report_to_master.fire(client_id="worker-ficticio", data=relatorio)
        self.ambiente.events.worker_report.fire(client_id="worker-ficticio", data=relatorio)
        # Um worker saudável não deve apagar a falha de outro.
        self.ambiente.events.worker_report.fire(
            client_id="worker-saudavel", data={"fluidocs_falha_preparacao": False},
        )
        self.ambiente.stats.log_request("GET", "/health", 1, 10)
        self.assertEqual(self.ambiente.stats.total.num_failures, 0)
        verificar_resultado(self.ambiente)
        self.assertEqual(self.ambiente.process_exit_code, 1)
        configurar_execucao(self.ambiente)
        self.assertFalse(self.ambiente.fluidocs_falha_preparacao)

    def test_worker_valida_apenas_a_classe_que_for_iniciada(self):
        self.ambiente.user_classes = [SaudeUser, PainelUser, PesquisaLiteralUser, ConversaUser]
        with patch("carga.eventos.WorkerRunner", type(self.ambiente.runner)):
            configurar_execucao(self.ambiente)
        self.assertIsNotNone(self.ambiente.fluidocs_configuracao)
        usuario = SaudeUser(self.ambiente)
        self.addCleanup(usuario.client.close)
        usuario.on_start()
        usuario.verificar_saude()
        usuario_invalido = PesquisaLiteralUser(self.ambiente)
        self.addCleanup(usuario_invalido.client.close)
        with self.assertRaises(StopUser):
            usuario_invalido.on_start()
        self.assertTrue(self.ambiente.fluidocs_falha_preparacao)

    def test_cli_fontes_ausentes_falha_antes_de_requisitar(self):
        with tempfile.TemporaryDirectory() as pasta:
            resultado = self.executar_cli(pasta, "--api-key", "chave-ficticia", classe="ConversaUser")
        self.assertEqual(resultado.returncode, 2, resultado.stdout + resultado.stderr)
        self.assertEqual(self.chamadas, [])

    def test_perfis_de_cenario_sao_aceitos_pela_cli(self):
        for perfil, classe in (
            ("pesquisa-literal", "PesquisaLiteralUser"),
            ("pesquisa-hibrida", "PesquisaHibridaUser"),
            ("conversa", "ConversaUser"),
        ):
            with self.subTest(perfil=perfil), tempfile.TemporaryDirectory() as pasta:
                resultado = self.executar_cli(
                    pasta, "--config", f"cenarios/{perfil}.conf", "--list", classe=classe,
                )
                self.assertEqual(resultado.returncode, 0, resultado.stdout + resultado.stderr)
                self.assertIn(classe, resultado.stdout + resultado.stderr)

    def test_cli_distribuida_preserva_falha_de_login_apos_reset(self):
        self.falhas_login = 1
        ambiente = {k: v for k, v in os.environ.items() if not k.startswith(("LOCUST_", "FLUIDOCS_LOAD_"))}
        ambiente.update(
            PYTHONUTF8="1", FLUIDOCS_LOAD_EMAIL="carga@example.com",
            FLUIDOCS_LOAD_PASSWORD="senha-ficticia", FLUIDOCS_LOAD_API_KEY="chave-ficticia",
        )
        with socket.socket() as reserva:
            reserva.bind(("127.0.0.1", 0))
            porta = str(reserva.getsockname()[1])
        with tempfile.TemporaryDirectory() as pasta:
            comando = [
                sys.executable, "-m", "locust", "--master", "--master-bind-host", "127.0.0.1",
                "--master-bind-port", porta, "--headless", "--expect-workers", "1",
                "--expect-workers-max-wait", "10", "--host", self.host, "--users", "2",
                "--spawn-rate", "2", "--run-time", "5s", "--stop-timeout", "2",
                "--only-summary", "--csv", str(Path(pasta) / "distribuido"),
                "--html", str(Path(pasta) / "distribuido.html"), "PainelUser",
            ]
            mestre = subprocess.Popen(
                comando, cwd=PROJETO, env=ambiente, stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT, text=True, encoding="utf-8",
            )
            worker = subprocess.Popen(
                [sys.executable, "-m", "locust", "--worker", "--master-host", "127.0.0.1",
                 "--master-port", porta, "--csv=", "--html="],
                cwd=PROJETO, env=ambiente, stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT, text=True, encoding="utf-8",
            )
            try:
                saida_mestre, _ = mestre.communicate(timeout=35)
                saida_worker, _ = worker.communicate(timeout=10)
            finally:
                for processo in (mestre, worker):
                    if processo.poll() is None:
                        processo.kill()
                        processo.communicate(timeout=5)
            self.assertEqual(mestre.returncode, 1, saida_mestre + saida_worker)
            self.assertIn("com falha na preparação", saida_mestre)
            self.assertEqual(worker.returncode, 0, saida_worker)
            with (Path(pasta) / "distribuido_stats.csv").open(encoding="utf-8", newline="") as arquivo:
                agregado = next(linha for linha in csv.DictReader(arquivo) if linha["Name"] == "Aggregated")
            self.assertEqual(int(agregado["Failure Count"]), 0)
            self.assertGreater(int(agregado["Request Count"]), 0)
        self.assertEqual(self.falhas_login, 0)

    def executar_cli(self, pasta, *argumentos, classe="SaudeUser"):
        ambiente = {k: v for k, v in os.environ.items() if not k.startswith(("LOCUST_", "FLUIDOCS_LOAD_"))}
        ambiente["PYTHONUTF8"] = "1"
        return subprocess.run(
            [sys.executable, "-m", "locust", "--headless",
             "--host", self.host, "--users", "2", "--spawn-rate", "2", "--run-time", "2s",
             "--stop-timeout", "2", "--only-summary", "--csv", str(Path(pasta) / "execucao"),
             "--html", str(Path(pasta) / "execucao.html"), *argumentos, classe],
            cwd=PROJETO, env=ambiente, capture_output=True, text=True, encoding="utf-8", timeout=25,
        )

    def test_cli_headless_exporta_csv_com_percentis_e_html(self):
        with tempfile.TemporaryDirectory() as pasta:
            # Deixe tempo para o CSV periódico registrar as amostras após a entrada dos usuários.
            resultado = self.executar_cli(pasta, "--run-time", "5s")
            self.assertEqual(resultado.returncode, 0, resultado.stdout + resultado.stderr)
            with (Path(pasta) / "execucao_stats.csv").open(encoding="utf-8", newline="") as arquivo:
                linhas = list(csv.DictReader(arquivo))
            saude = next(linha for linha in linhas if linha["Name"] == "GET /health")
            self.assertGreater(int(saude["Request Count"]), 0)
            for coluna in ("50%", "90%", "95%", "99%"):
                self.assertIn(coluna, saude)
            self.assertGreater((Path(pasta) / "execucao.html").stat().st_size, 1000)
            self.assertTrue((Path(pasta) / "execucao_stats_history.csv").exists())

    def test_cli_falha_http_retorna_codigo_nao_zero(self):
        self.status = 503
        with tempfile.TemporaryDirectory() as pasta:
            resultado = self.executar_cli(pasta)
        self.assertEqual(resultado.returncode, 1, resultado.stdout + resultado.stderr)

    def test_cli_configuracao_invalida_falha_sem_enviar_carga(self):
        with tempfile.TemporaryDirectory() as pasta:
            resultado = self.executar_cli(pasta, classe="PesquisaLiteralUser")
        self.assertEqual(resultado.returncode, 2, resultado.stdout + resultado.stderr)
        self.assertEqual(self.chamadas, [])


if __name__ == "__main__":
    unittest.main()

"""Valida o gerador contra HTTP local; não mede desempenho do Fluidocs."""

# Importe Locust antes dos clientes HTTP para aplicar o monkey patch do gevent.
from locust.env import Environment
from locust.exception import StopUser

import csv
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from urllib.parse import parse_qs

from gevent.pywsgi import WSGIServer

from locustfile import (
    LOGIN, Configuracao, FluidocsUser, configurar_execucao, verificar_resultado,
)


PROJETO = Path(__file__).resolve().parents[1]


def opcoes(**alteracoes):
    valores = dict(
        scenario="saude", email="", password="", token="", source_ids="",
        query="Consulta fictícia", queries_file="", api_prefix="", request_timeout=2,
        p95_limit_ms=None, p99_limit_ms=None,
    )
    valores.update(alteracoes)
    return SimpleNamespace(**valores)


class ConfiguracaoTest(unittest.TestCase):
    def test_saude_dispensa_credenciais_e_fontes(self):
        self.assertEqual(Configuracao.das_opcoes(opcoes()).fontes, ())

    def test_painel_exige_autenticacao(self):
        with self.assertRaisesRegex(ValueError, "token"):
            Configuracao.das_opcoes(opcoes(scenario="painel"))

    def test_pesquisa_exige_ids_positivos(self):
        for ids in ("", "0", "-1", "abc", "1,,2"):
            with self.subTest(ids=ids), self.assertRaises(ValueError):
                Configuracao.das_opcoes(opcoes(scenario="literal", token="jwt-ficticio", source_ids=ids))
        config = Configuracao.das_opcoes(opcoes(scenario="hibrida", token="jwt-ficticio", source_ids="1, 2,1"))
        self.assertEqual(config.fontes, (1, 2))

    def test_consultas_do_arquivo_sao_validadas(self):
        with tempfile.TemporaryDirectory() as pasta:
            arquivo = Path(pasta) / "consultas.json"
            for valor in ([], {}, [" "], [123], ["x" * 2001], "json-invalido"):
                arquivo.write_text(json.dumps(valor), encoding="utf-8")
                with self.subTest(valor=type(valor).__name__), self.assertRaises(ValueError):
                    Configuracao.das_opcoes(opcoes(
                        scenario="conversa", token="jwt-ficticio", source_ids="1", queries_file=str(arquivo),
                    ))
            arquivo.write_text('["  pergunta A  ", "pergunta B"]', encoding="utf-8")
            config = Configuracao.das_opcoes(opcoes(
                scenario="literal", token="jwt-ficticio", source_ids="1", queries_file=str(arquivo),
            ))
            self.assertEqual(config.consultas, ("pergunta A", "pergunta B"))

    def test_limites_e_timeout_rejeitam_zero_negativos_e_nao_finitos(self):
        for campo in ("p95_limit_ms", "p99_limit_ms", "request_timeout"):
            for valor in (0, -1, float("nan"), float("inf")):
                with self.subTest(campo=campo, valor=valor), self.assertRaises(ValueError):
                    Configuracao.das_opcoes(opcoes(**{campo: valor}))

    def test_prefixo_nao_pode_ser_url_ou_query(self):
        for prefixo in ("https://example.invalid", "//example.invalid", "/api?q=x", "/api#x"):
            with self.subTest(prefixo=prefixo), self.assertRaises(ValueError):
                Configuracao.das_opcoes(opcoes(api_prefix=prefixo))
        self.assertEqual(Configuracao.das_opcoes(opcoes(api_prefix="/api/")).prefixo, "/api")


class ClienteHTTPTest(unittest.TestCase):
    def setUp(self):
        self.chamadas = []
        self.status = 200
        self.corpo = None
        self.servidor = WSGIServer(("127.0.0.1", 0), self.aplicacao, log=None)
        self.servidor.start()
        self.host = f"http://127.0.0.1:{self.servidor.server_port}"
        self.addCleanup(setattr, FluidocsUser, "host", FluidocsUser.host)
        FluidocsUser.host = self.host
        self.ambiente = Environment(user_classes=[FluidocsUser], host=self.host, parsed_options=opcoes())
        self.ambiente.create_local_runner()

    def tearDown(self):
        self.ambiente.runner.quit()
        self.servidor.stop()

    def aplicacao(self, environ, start_response):
        caminho = environ["PATH_INFO"].removeprefix("/api")
        tamanho = int(environ.get("CONTENT_LENGTH") or 0)
        corpo = environ["wsgi.input"].read(tamanho).decode()
        self.chamadas.append((environ["REQUEST_METHOD"], environ["PATH_INFO"], corpo, environ.get("HTTP_AUTHORIZATION")))
        if self.corpo is not None:
            resposta = self.corpo
        elif caminho == "/auth/login":
            resposta = {"access_token": "jwt-ficticio", "token_type": "bearer"}
        elif caminho == "/health":
            resposta = {"dados": {"status_code": 200}}
        elif caminho == "/conversas/perguntar":
            resposta = {"dados": {"id": 1, "mensagens": []}}
        else:
            resposta = {"dados": []}
        start_response(f"{self.status} Fixture", [("Content-Type", "application/json")])
        return [(resposta if isinstance(resposta, str) else json.dumps(resposta)).encode()]

    def usuario(self, **alteracoes):
        self.ambiente.parsed_options = opcoes(**alteracoes)
        configurar_execucao(self.ambiente)
        usuario = FluidocsUser(self.ambiente)
        usuario.on_start()
        self.addCleanup(usuario.client.close)
        return usuario

    def test_saude_nao_faz_login(self):
        self.usuario().executar_cenario()
        self.assertEqual([(m, p) for m, p, _, _ in self.chamadas], [("GET", "/health")])
        self.assertEqual(self.ambiente.stats.total.num_failures, 0)

    def test_login_usa_formulario_oauth_e_reaproveita_jwt(self):
        usuario = self.usuario(scenario="painel", email="carga@example.com", password="senha-ficticia")
        with patch("locustfile.random.choice", return_value="/fontes-dados/"):
            usuario.executar_cenario()
        formulario = parse_qs(self.chamadas[0][2])
        self.assertEqual(formulario, {"username": ["carga@example.com"], "password": ["senha-ficticia"]})
        self.assertEqual(self.chamadas[1][3], "Bearer jwt-ficticio")

    def test_painel_le_conversas_com_token_sem_login(self):
        usuario = self.usuario(scenario="painel", token="jwt-ficticio")
        with patch("locustfile.random.choice", return_value="/conversas"):
            usuario.executar_cenario()
        self.assertEqual(len(self.chamadas), 1)
        self.assertEqual(self.chamadas[0][1], "/conversas")

    def test_pesquisas_enviam_o_contrato_real_e_separam_estatisticas(self):
        for cenario in ("literal", "hibrida"):
            usuario = self.usuario(scenario=cenario, token="jwt-ficticio", source_ids="3,7", query="férias")
            usuario.executar_cenario()
            self.assertEqual(json.loads(self.chamadas[-1][2]), {
                "q": "férias", "fonte_dados_ids": [3, 7], "tipo_pesquisa": cenario, "pagina": 1, "tamanho": 10,
            })
            self.assertEqual(self.chamadas[-1][1], "/pesquisar")
            self.assertEqual(self.ambiente.stats.get(f"POST /pesquisar [{cenario}]", "POST").num_requests, 1)
        self.assertEqual(self.ambiente.stats.total.num_failures, 0)

    def test_conversa_nao_compartilha_id_nem_aumenta_historico(self):
        usuario = self.usuario(scenario="conversa", token="jwt-ficticio", source_ids="3")
        usuario.executar_cenario()
        usuario.executar_cenario()
        for metodo, caminho, corpo, _ in self.chamadas:
            self.assertEqual((metodo, caminho), ("POST", "/conversas/perguntar"))
            self.assertEqual(json.loads(corpo), {"pergunta": "Consulta fictícia", "fonte_dados_ids": [3]})
        self.assertEqual(self.ambiente.stats.total.num_failures, 0)

    def test_prefixo_e_aplicado_no_http(self):
        self.usuario(api_prefix="/api").executar_cenario()
        self.assertEqual(self.chamadas[0][1], "/api/health")

    def test_login_invalido_interrompe_usuario_e_reprova_execucao(self):
        self.corpo = {"access_token": ""}
        with self.assertRaises(StopUser):
            self.usuario(scenario="painel", email="carga@example.com", password="senha-ficticia")
        self.assertTrue(self.ambiente.fluidocs_falha_preparacao)
        verificar_resultado(self.ambiente)
        self.assertEqual(self.ambiente.process_exit_code, 1)

    def test_erro_http_e_redirecionamento_contam_como_falha(self):
        usuario = self.usuario()
        for status in (302, 401, 403, 422, 503):
            self.status = status
            usuario.executar_cenario()
        self.assertEqual(self.ambiente.stats.total.num_failures, 5)

    def test_json_invalido_envelope_invalido_e_health_invalido_falham(self):
        usuario = self.usuario()
        for corpo in ("<html>login</html>", [], {"dados": []}, {"dados": {"status_code": 503}}):
            self.corpo = corpo
            usuario.executar_cenario()
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

    def executar_cli(self, pasta, *argumentos):
        ambiente = {k: v for k, v in os.environ.items() if not k.startswith(("LOCUST_", "FLUIDOCS_LOAD_"))}
        ambiente["PYTHONUTF8"] = "1"
        return subprocess.run(
            [sys.executable, "-m", "locust", "--headless", "--scenario", "saude",
             "--host", self.host, "--users", "2", "--spawn-rate", "2", "--run-time", "2s",
             "--stop-timeout", "2", "--only-summary", "--csv", str(Path(pasta) / "execucao"),
             "--html", str(Path(pasta) / "execucao.html"), *argumentos],
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
            resultado = self.executar_cli(pasta, "--scenario", "literal")
        self.assertEqual(resultado.returncode, 2, resultado.stdout + resultado.stderr)
        self.assertEqual(self.chamadas, [])


if __name__ == "__main__":
    unittest.main()

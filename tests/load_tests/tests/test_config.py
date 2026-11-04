"""Parsing puro: estes testes não importam nem iniciam o Locust."""

import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

from carga.config import (
    Configuracao, _ler_consultas, _ler_fontes, _ler_limites, _ler_prefixo, _positivo_finito,
)


class ConfiguracaoTest(unittest.TestCase):
    def test_fontes_opcionais_positivas_e_sem_duplicatas(self):
        self.assertEqual(_ler_fontes(""), ())
        self.assertEqual(_ler_fontes("  "), ())
        self.assertEqual(_ler_fontes("1, 2,1"), (1, 2))
        for ids in ("0", "-1", "abc", "1,,2"):
            with self.subTest(ids=ids), self.assertRaises(ValueError):
                _ler_fontes(ids)

    def test_consulta_unica_e_arquivo(self):
        self.assertEqual(_ler_consultas("  pergunta  ", ""), ("pergunta",))
        with tempfile.TemporaryDirectory() as pasta:
            arquivo = Path(pasta) / "consultas.json"
            for valor in ([], {}, [" "], [123], ["x" * 2001], "json-invalido"):
                arquivo.write_text(json.dumps(valor), encoding="utf-8")
                with self.subTest(valor=valor), self.assertRaises(ValueError):
                    _ler_consultas("ignorada", arquivo)
            arquivo.write_text('["  pergunta A  ", "pergunta B"]', encoding="utf-8")
            self.assertEqual(_ler_consultas("ignorada", arquivo), ("pergunta A", "pergunta B"))
            arquivo.write_text("{", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "JSON UTF-8"):
                _ler_consultas("ignorada", arquivo)
            with self.assertRaisesRegex(ValueError, "JSON UTF-8"):
                _ler_consultas("ignorada", Path(pasta) / "ausente.json")
            arquivo.write_bytes(b"\xff")
            with self.assertRaisesRegex(ValueError, "JSON UTF-8"):
                _ler_consultas("ignorada", arquivo)

    def test_consulta_vazia_ou_longa_falha(self):
        for consulta in ("", " ", "x" * 2001):
            with self.subTest(consulta=consulta), self.assertRaises(ValueError):
                _ler_consultas(consulta, "")

    def test_limites_guardam_percentis_inteiros(self):
        self.assertEqual(_ler_limites(SimpleNamespace(p95_limit_ms=None, p99_limit_ms=None)), ())
        self.assertEqual(
            _ler_limites(SimpleNamespace(p95_limit_ms=800, p99_limit_ms=1500)),
            ((95, 800.0), (99, 1500.0)),
        )
        for campo in ("p95_limit_ms", "p99_limit_ms"):
            for valor in (0, -1, float("nan"), float("inf")):
                opcoes = SimpleNamespace(p95_limit_ms=None, p99_limit_ms=None)
                setattr(opcoes, campo, valor)
                with self.subTest(campo=campo, valor=valor), self.assertRaises(ValueError):
                    _ler_limites(opcoes)

    def test_timeout_rejeita_zero_negativos_e_nao_finitos(self):
        self.assertEqual(_positivo_finito(2, "--request-timeout"), 2)
        for valor in (0, -1, float("nan"), float("inf")):
            with self.subTest(valor=valor), self.assertRaisesRegex(ValueError, "--request-timeout"):
                _positivo_finito(valor, "--request-timeout")

    def test_prefixo_nao_pode_ser_url_query_ou_autoridade(self):
        for prefixo in ("https://example.invalid", "//example.invalid", "//", "/api?q=x", "/api#x"):
            with self.subTest(prefixo=prefixo), self.assertRaises(ValueError):
                _ler_prefixo(prefixo)
        self.assertEqual(_ler_prefixo("/api/"), "/api")
        self.assertEqual(_ler_prefixo("/"), "")
        self.assertEqual(_ler_prefixo(""), "")

    def test_configuracao_normaliza_sem_expor_segredos(self):
        config = Configuracao.das_opcoes(SimpleNamespace(
            email=" carga@example.com ", password="senha-ficticia", token=" jwt-ficticio ",
            api_key=" chave-ficticia ", source_ids="1, 2,1", query=" consulta ", queries_file="", api_prefix="/api/",
            request_timeout=2, p95_limit_ms=800, p99_limit_ms=None,
        ))
        self.assertEqual(config.email, "carga@example.com")
        self.assertEqual(config.token, "jwt-ficticio")
        self.assertEqual(config.fontes, (1, 2))
        self.assertEqual(config.consultas, ("consulta",))
        self.assertEqual(config.prefixo, "/api")
        self.assertEqual(config.chave_api, "chave-ficticia")
        self.assertNotIn("chave-ficticia", repr(config))
        self.assertNotIn("jwt-ficticio", repr(config))
        self.assertNotIn("senha-ficticia", repr(config))


if __name__ == "__main__":
    unittest.main()


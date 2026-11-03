"""Argumentos de CLI e parsing da configuração, sem dependência do Locust."""

import json
import math
from dataclasses import dataclass, field
from pathlib import Path


PERCENTIS_COM_LIMITE = (95, 99)


def adicionar_argumentos(parser):
    for argumento, sufixo, ajuda in [
        ("email", "EMAIL", "E-mail de uma conta de teste existente."),
        ("password", "PASSWORD", "Senha da conta de teste."),
        ("token", "TOKEN", "JWT existente; tem precedência sobre e-mail/senha."),
        ("api-key", "API_KEY", "Chave de API da conta de teste para pesquisa e conversas."),
        ("source-ids", "SOURCE_IDS", "IDs de fontes próprias, separados por vírgula."),
        ("queries-file", "QUERIES_FILE", "Arquivo JSON com uma lista de consultas."),
        ("api-prefix", "API_PREFIX", "Prefixo de um proxy que remova esse caminho; vazio na API e no Vite atuais."),
    ]:
        parser.add_argument(
            f"--{argumento}", default="", env_var=f"FLUIDOCS_LOAD_{sufixo}",
            is_secret=argumento in {"password", "token", "api-key"}, help=ajuda,
        )
    parser.add_argument(
        "--query", default="Como solicitar férias?", env_var="FLUIDOCS_LOAD_QUERY",
        help="Consulta usada quando --queries-file não é informado.",
    )
    parser.add_argument(
        "--request-timeout", type=float, default=120,
        env_var="FLUIDOCS_LOAD_REQUEST_TIMEOUT", help="Timeout de leitura em segundos.",
    )
    for percentil in PERCENTIS_COM_LIMITE:
        parser.add_argument(
            f"--p{percentil}-limit-ms", type=float, default=None,
            env_var=f"FLUIDOCS_LOAD_P{percentil}_LIMIT_MS",
            help=f"Falha se alguma operação medida ultrapassar este p{percentil}, em ms.",
        )


def _ler_fontes(valor):
    if not valor.strip():
        return ()
    try:
        fontes = tuple(dict.fromkeys(int(item.strip()) for item in valor.split(",")))
    except ValueError:
        raise ValueError("--source-ids deve conter inteiros positivos separados por vírgula.") from None
    if any(fonte <= 0 for fonte in fontes):
        raise ValueError("Informe apenas IDs positivos em --source-ids.")
    return fontes


def _ler_consultas(consulta, arquivo):
    valores = [consulta]
    if arquivo:
        try:
            valores = json.loads(Path(arquivo).read_text(encoding="utf-8"))
        except (OSError, UnicodeError, ValueError):
            raise ValueError("Não foi possível ler --queries-file como JSON UTF-8.") from None
    if (
        not isinstance(valores, list) or not valores
        or any(not isinstance(q, str) or not q.strip() or len(q) > 2000 for q in valores)
    ):
        raise ValueError("As consultas devem ser uma lista não vazia de textos com 1 a 2000 caracteres.")
    return tuple(q.strip() for q in valores)


def _ler_prefixo(valor):
    prefixo = valor.strip()
    if prefixo and (not prefixo.startswith("/") or prefixo.startswith("//") or "?" in prefixo or "#" in prefixo):
        raise ValueError("--api-prefix deve ser um caminho como /api, sem query ou fragmento.")
    return prefixo.rstrip("/")


def _positivo_finito(valor, argumento):
    numero = float(valor)
    if not math.isfinite(numero) or numero <= 0:
        raise ValueError(f"{argumento} deve ser positivo e finito.")
    return numero


def _ler_limites(opcoes):
    return tuple(
        (percentil, _positivo_finito(limite, f"--p{percentil}-limit-ms"))
        for percentil in PERCENTIS_COM_LIMITE
        if (limite := getattr(opcoes, f"p{percentil}_limit_ms")) is not None
    )


@dataclass(frozen=True)
class Configuracao:
    email: str
    senha: str = field(repr=False)
    token: str = field(repr=False)
    chave_api: str = field(repr=False)
    fontes: tuple[int, ...]
    consultas: tuple[str, ...]
    prefixo: str
    timeout: float
    limites: tuple[tuple[int, float], ...]

    @classmethod
    def das_opcoes(cls, opcoes):
        return cls(
            email=opcoes.email.strip(), senha=opcoes.password, token=opcoes.token.strip(),
            chave_api=opcoes.api_key.strip(),
            fontes=_ler_fontes(opcoes.source_ids),
            consultas=_ler_consultas(opcoes.query, opcoes.queries_file),
            prefixo=_ler_prefixo(opcoes.api_prefix),
            timeout=_positivo_finito(opcoes.request_timeout, "--request-timeout"),
            limites=_ler_limites(opcoes),
        )

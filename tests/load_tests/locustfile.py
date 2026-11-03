"""Ponto de entrada dos cenários de carga do Fluidocs."""

from carga import eventos  # noqa: F401 (registra os listeners)
from carga.usuarios.conversa import ConversaUser
from carga.usuarios.painel import PainelUser
from carga.usuarios.pesquisa import PesquisaHibridaUser, PesquisaLiteralUser
from carga.usuarios.saude import SaudeUser

"""Validadores retornam a mensagem de falha ou None para dados válidos."""


def lista_em_dados(dados):
    if not isinstance(dados, list):
        return "Resposta sem lista em 'dados'."


def health_ok(dados):
    if not isinstance(dados, dict) or dados.get("status_code") != 200:
        return "Health sem status_code 200."


def conversa_criada(dados):
    if not isinstance(dados, dict):
        return "Resposta sem objeto em 'dados'."
    conversa_id = dados.get("conversa_id")
    if type(conversa_id) is not int or conversa_id <= 0:
        return "Conversa sem conversa_id positivo."
    if not isinstance(dados.get("resposta"), str) or not dados["resposta"].strip():
        return "Conversa sem resposta."
    if not isinstance(dados.get("anexos"), list):
        return "Conversa sem lista de anexos."

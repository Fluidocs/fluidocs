from uuid import uuid4


def gerar_documento_id() -> str:
    return str(uuid4())

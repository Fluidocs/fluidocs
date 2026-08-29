from backend.api.services.usuario import ServicoUsuario


def obter_servico_usuario() -> ServicoUsuario:
    return ServicoUsuario()
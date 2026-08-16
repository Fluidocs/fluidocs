class CoreException(Exception):
    '''
    Exceção padrão para funções do núcleo da aplicação.
    '''


class MotorPesquisaIndisponivelError(CoreException):
    def __init__(self):
        super().__init__(
            f'O motor de pesquisa está indisponível no momento.'
        )

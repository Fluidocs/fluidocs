from functools import wraps

from elastic_transport import (
    ConnectionError,
    ConnectionTimeout
)
from backend.core.exceptions import (
    MotorPesquisaIndisponivelError
)


def tratar_motor_pesquisa(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except (
            ConnectionError,
            ConnectionTimeout,
        ) as erro:
            raise MotorPesquisaIndisponivelError() from erro

    return wrapper

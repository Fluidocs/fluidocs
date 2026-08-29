import base64
import hashlib
import hmac
import json
import secrets
from typing import Any


ALGORITMO_SENHA = 'pbkdf2_sha256'
ITERACOES_SENHA = 390_000
TAMANHO_SALT = 16
ALGORITMO_TOKEN = 'HS256'


def gerar_hash_senha(senha: str) -> str:
    salt = secrets.token_bytes(TAMANHO_SALT)
    digest = hashlib.pbkdf2_hmac(
        'sha256',
        senha.encode('utf-8'),
        salt,
        ITERACOES_SENHA,
    )

    return ':'.join(
        [
            ALGORITMO_SENHA,
            str(ITERACOES_SENHA),
            base64url_encode(salt),
            base64url_encode(digest),
        ]
    )


def validar_senha(senha: str, senha_hash: str) -> bool:
    try:
        algoritmo, iteracoes, salt, digest = senha_hash.split(':')
    except ValueError:
        return False

    if algoritmo != ALGORITMO_SENHA:
        return False

    digest_calculado = hashlib.pbkdf2_hmac(
        'sha256',
        senha.encode('utf-8'),
        base64url_decode(salt),
        int(iteracoes),
    )

    return hmac.compare_digest(
        base64url_encode(digest_calculado),
        digest,
    )


def codificar_jwt(
    payload: dict[str, Any],
    secret: str,
) -> str:
    header = {
        'alg': ALGORITMO_TOKEN,
        'typ': 'JWT',
    }
    header_codificado = base64url_encode_json(header)
    payload_codificado = base64url_encode_json(payload)
    assinatura = assinar_jwt(
        f'{header_codificado}.{payload_codificado}',
        secret,
    )

    return f'{header_codificado}.{payload_codificado}.{assinatura}'


def decodificar_jwt(
    token: str,
    secret: str,
) -> tuple[dict[str, Any], dict[str, Any]]:
    header_codificado, payload_codificado, assinatura = token.split('.')
    conteudo_assinado = f'{header_codificado}.{payload_codificado}'
    assinatura_esperada = assinar_jwt(conteudo_assinado, secret)

    if not hmac.compare_digest(assinatura, assinatura_esperada):
        raise ValueError('Assinatura invalida.')

    return (
        base64url_decode_json(header_codificado),
        base64url_decode_json(payload_codificado),
    )


def assinar_jwt(
    conteudo: str,
    secret: str,
) -> str:
    assinatura = hmac.new(
        secret.encode('utf-8'),
        conteudo.encode('ascii'),
        hashlib.sha256,
    ).digest()

    return base64url_encode(assinatura)


def base64url_encode_json(valor: dict[str, Any]) -> str:
    dados = json.dumps(
        valor,
        separators=(',', ':'),
        sort_keys=True,
    ).encode('utf-8')

    return base64url_encode(dados)


def base64url_decode_json(valor: str) -> dict[str, Any]:
    return json.loads(base64url_decode(valor))


def base64url_encode(valor: bytes) -> str:
    return base64.urlsafe_b64encode(valor).rstrip(b'=').decode('ascii')


def base64url_decode(valor: str) -> bytes:
    padding = '=' * (-len(valor) % 4)
    return base64.urlsafe_b64decode(valor + padding)

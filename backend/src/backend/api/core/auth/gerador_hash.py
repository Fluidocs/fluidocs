from pwdlib import PasswordHash

class GeradorHash:
    def __init__(self) -> None:
        self.hasher: PasswordHash = PasswordHash.recommended()

    def gerar_hash_senha(self, senha: str) -> str:
        return self.hasher.hash(senha)

    def validar_senha(self, senha: str, senha_hash: str) -> bool:
        return self.hasher.verify(senha, senha_hash)
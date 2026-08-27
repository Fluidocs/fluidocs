from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "integracao" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "nome_integracao" VARCHAR(60) NOT NULL
);
CREATE TABLE IF NOT EXISTS "organizacao" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "nome" VARCHAR(60) NOT NULL,
    "cnpj" VARCHAR(14),
    "email" VARCHAR(100) NOT NULL,
    "senha" VARCHAR(60) NOT NULL,
    "logo" VARCHAR(100)
);
CREATE TABLE IF NOT EXISTS "credencial_organizacao_integracao" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "access_token" VARCHAR(255) NOT NULL,
    "refresh_token" VARCHAR(255) NOT NULL,
    "data_expiracao" TIMESTAMPTZ,
    "integracao_id" INT NOT NULL REFERENCES "integracao" ("id") ON DELETE CASCADE,
    "organizacao_id" INT NOT NULL REFERENCES "organizacao" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "grupo_acesso" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "ativo" BOOL NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "descricao" VARCHAR(255),
    "organizacao_id" INT NOT NULL REFERENCES "organizacao" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "repositorio" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "descricao" VARCHAR(255) NOT NULL,
    "url_integracao" VARCHAR(255),
    "repositorio_integracao" VARCHAR(255),
    "credencial_integracao_id" INT REFERENCES "credencial_organizacao_integracao" ("id") ON DELETE CASCADE,
    "organizacao_id" INT REFERENCES "organizacao" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "usuario" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "ativo" BOOL NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "senha" VARCHAR(60) NOT NULL,
    "foto" VARCHAR(100),
    "organizacao_id" INT NOT NULL REFERENCES "organizacao" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "chat_llm" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "titulo" VARCHAR(60) NOT NULL,
    "historico" JSONB NOT NULL,
    "usuario_id" INT REFERENCES "usuario" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "aerich" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS "repositorio_grupo_acesso" (
    "repositorio_id" INT NOT NULL REFERENCES "repositorio" ("id") ON DELETE CASCADE,
    "grupoacesso_id" INT NOT NULL REFERENCES "grupo_acesso" ("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_repositorio_reposit_b5310a" ON "repositorio_grupo_acesso" ("repositorio_id", "grupoacesso_id");
CREATE TABLE IF NOT EXISTS "usuario_grupo_acesso" (
    "usuario_id" INT NOT NULL REFERENCES "usuario" ("id") ON DELETE CASCADE,
    "grupoacesso_id" INT NOT NULL REFERENCES "grupo_acesso" ("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_usuario_gru_usuario_ca32fc" ON "usuario_grupo_acesso" ("usuario_id", "grupoacesso_id");"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """

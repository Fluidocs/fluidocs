from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "usuario" ADD COLUMN IF NOT EXISTS "comportamento_ia" TEXT;
CREATE TABLE IF NOT EXISTS "conversa" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "titulo" VARCHAR(255) NOT NULL,
    "data_criacao" TIMESTAMPTZ NOT NULL,
    "data_ultima_interacao" TIMESTAMPTZ NOT NULL,
    "usuario_id" INT NOT NULL REFERENCES "usuario" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "mensagem" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "conteudo" TEXT NOT NULL,
    "papel" VARCHAR(1) NOT NULL,
    "data_envio" TIMESTAMPTZ NOT NULL,
    "conversa_id" INT NOT NULL REFERENCES "conversa" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "mensagem"."papel" IS 'USUARIO: U\nASSISTENTE: A';
CREATE TABLE IF NOT EXISTS "anexo" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "nome" VARCHAR(255) NOT NULL,
    "extensao" VARCHAR(4) NOT NULL,
    "mensagem_id" INT NOT NULL REFERENCES "mensagem" ("id") ON DELETE CASCADE
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "anexo";
DROP TABLE IF EXISTS "mensagem";
DROP TABLE IF EXISTS "conversa";
ALTER TABLE "usuario" DROP COLUMN IF EXISTS "comportamento_ia";"""

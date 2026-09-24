from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "chave_api" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "token" VARCHAR(255) NOT NULL UNIQUE,
    "nome" VARCHAR(60) NOT NULL,
    "descricao" VARCHAR(255),
    "usuario_id" INT NOT NULL REFERENCES "usuario" ("id") ON DELETE CASCADE
);
        ALTER TABLE "usuario" 
        ADD COLUMN IF NOT EXISTS"limite_chaves_api" 
        INT NOT NULL DEFAULT 5;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "usuario" DROP COLUMN "limite_chaves_api";
        DROP TABLE IF EXISTS "chave_api";"""


MODELS_STATE = (
    "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"
)

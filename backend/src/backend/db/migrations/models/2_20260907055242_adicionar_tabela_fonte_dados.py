from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "fontes_de_dados" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT NOT NULL,
    "data_criacao" TIMESTAMPTZ NOT NULL,
    "data_atualizacao" TIMESTAMPTZ NOT NULL,
    "usuario_id" INT NOT NULL REFERENCES "usuario" ("id") ON DELETE CASCADE
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "fontes_de_dados";"""


MODELS_STATE = (
    "eJztmVtP2zAUx79KlScmMQQdFLS30MvogHai2YaYJstN3NQisUviAB3rd5/tXJxr1yLK1t"
    "InmnNJTn4+DuefPGkutZDj73UoYaiFWtCivvax9qQR6CL+o9S/W9PgZKK8wsDg0JEJIxHp"
    "AwsBKwke+syDJuPuEXR8xE0W8k0PTximhFtJ4DjCSE0eiImtTAHBdwECjNqIjZHHHT9+cj"
    "MmFnpEfnw4uQUjjBwrUzm2xLWlHbDpRNq6hHVkoLjaEJjUCVyigidTNqYkicaECauNCPIg"
    "Q+L0zAtE+aK66IbjOworVSFhiakcC41g4LDU7Q6BsmkA9PoGGLQNALQlAJmUCLi81HDdbF"
    "HC+/rB4fHhyYfG4QkPkWUmluNZeGkFJkyUeHqGNpN+yGAYIRkrqITyvwWszTH0yrnG8Tmy"
    "vOQ82ZjjPLSxQbFV/fQacF34CBxEbDbmhwf7+3NQftOvmmf61Q6PeicuSfkGCDdIL3LVQ5"
    "/grfiGlZmQFiEb6LGieTNJG0F6DlijfW2IM7u+f+ekee5c6tcStTuNPBf93qc4PMW/edE/"
    "zWMX/c4LhaXkWxwcwy6qoJ/LzS2AFSXvxT/WcDk0D0GrT5xp9DSbtzzdy/bA0C+/ZNaopR"
    "tt4aln1ie27jRyWyQ5Se171ziricPaTb/Xlnipz2xPXlHFGTeaqAkGjAJCHwC0Ug/e2BpT"
    "K648ZAF08K9nr34uf9sB/0sHxIxSLRBVrzog8APoYQqWmheySX+fG9ZhiV9gdBDD2Oi2dH"
    "KIiBUZd6iHsE3O0VSi7vKiIDHLpoZoFv2qzrRmiGdxG8VW9ZDy4EMyw+a6ixPg941YOGrp"
    "g6beamsS9RCatw/Qs0CGufDQOs1Zktiiy627eQsk0JZ8xI2IsnPsSyRCalmq1UGqC7aqYK"
    "229lYVLKQKGouIgka1JmgUJAFyIXaWoZskvAzef9u5q5dcPiJjuAzfJGED27d+dLQAYR5V"
    "SVj6soRHlE9fE+SNluvjXNqzaEe9+oZgb6XsJgqZrZR96x1QJWULkqtaGKSfyIWX9NlOOY"
    "1O0Dm/Qg6UiIvdUPFtYM36oUqUzVapo3TkYXOslcioyLM7T0VBFbMVUa/23FixiLpHnh/t"
    "s0UnpFTKdhZdbDwSm2oJwlH4BtJdiZYyxb+CcGtnCX8e9HvlhFMp+WEDm6z2u+Zgfx1fp8"
    "6BK2DM/4SV/1qVGxXECU7LXre+5kvB2R8Sf07F"
)

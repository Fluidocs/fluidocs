from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "usuario" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "nome" VARCHAR(60) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "foto_perfil" VARCHAR(255),
    "data_criacao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_usuario_email_73f3f5" ON "usuario" ("email");
CREATE TABLE IF NOT EXISTS "chave_api" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "token" VARCHAR(255) NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "descricao" VARCHAR(255),
    "usuario_id" INT NOT NULL REFERENCES "usuario" ("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_chave_api_token_6e8d92" ON "chave_api" ("token");"""

async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "usuario";"""


MODELS_STATE = (
    "eJztV21P2zAQ/itRPjFpm6CDgvatQCeYRjtB9iImZF1jN7Vw7OA4g471v892XhxCAx1qx7"
    "TuU+q783Pn57HP7q0fC0xY+rpHJA0n/lvv1ock0d/C4b/0fA4xcZYyVDsUjJj1QGWiHJMb"
    "kmrjtws9jIFDRLAe8owxbYBRqiSESlvGwFKiTcklGlPCsE1e5qLYoGWcXmVmrGRmQjEZQ8"
    "aUg8vTYRdh7EVVJT4eoVCwLOYOF4tQl0F55JAiwokEVcfSE11CH6HBMEBn/QAhA2FLRmqa"
    "2HKPuXpn16A9oeBmjZSr1C4pMhGvOlvbu9t7b7rbezrE1ldZdmd2aWkoaaKo4K6oZKomgl"
    "dZNKSf1+Wy5zlsDYPAn83mr25ccOyE6cQNi+iIhgWDgprJifOdyNTUWVeoYrtdojLkMY1q"
    "8I8IVZu+qFIHE5CtUsVwgxjhkTInobOzs6gwGuQBYT73Tg+OeqcbGvCFCRP6AOTnZlC4Or"
    "nPqOdYNudwRQwX0M/J7tbm5nLZ1YCt7FrfXXZ1cYrk52kVDNfgl8/y+7PhoI3lRUnFNFTe"
    "T4/R9KGeYjIZd5ymV6zO6cZJ72uT7oMPw31jSkSqImlRLMC+pv6iraycfKRERNSEyLL3jC"
    "C8vAaJ0b3OVXkaDcssvLihPqUZSCoWus3K2Pp1ljnb//tsDe4zLvR3RY2gxH7OXttdcqvt"
    "tnfa7r1GS2KgbDWbv4Je54ssJXwCq9q9Ffg6P8TGQgmUEDlu7OOn8eyasaO5kWGdybZNWq"
    "eGEMRT2YZM08nF9W9s9Gba5UtwqKcqGpNWGSQBPORsWuyRhR9yBe7r8odfYwABvvsAmKdU"
    "cHzSPwt6Jx/vvPQOe0HfeDrWOm1YN7oNUSsQ78txcOSZoXc+HPSbD8IqLjifpzyoDBj9sS"
    "T1F7xH5mX+tzZArdy/bAf8gT8Gs1/FWQNX"
)

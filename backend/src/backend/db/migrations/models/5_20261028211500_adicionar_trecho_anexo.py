from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return 'ALTER TABLE "anexo" ADD COLUMN "trecho" TEXT;'


async def downgrade(db: BaseDBAsyncClient) -> str:
    return 'ALTER TABLE "anexo" DROP COLUMN "trecho";'


MODELS_STATE = (
    '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'
    'd2'
)

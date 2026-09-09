from tortoise import BaseDBAsyncClient


RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "fontes_de_dados"
        ADD "status" VARCHAR(10) NOT NULL DEFAULT 'ativa';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "fontes_de_dados" DROP COLUMN "status";"""


MODELS_STATE = (
    "eJztmVtP2zAUx79KlScmMQQdFLS30MtgQDvRbENMk+UmbmqR2CV2gI71u8/Opc59LaLdWv"
    "rU5lySk1/+Ts5JnjWXWshhex1KOGqhFrQo0z7WnjUCXST+FPp3axocj5VXGjgcOEHCUEYy"
    "YCFgzYIHjHvQ5MI9hA5DwmQhZnp4zDElwkp8x5FGaopATGxl8gm+9xHg1EZ8hDzh+PFTmD"
    "Gx0BNi8eb4DgwxcqxU5diSxw7sgE/Gge2c8E4QKI82ACZ1fJeo4PGEjyiZRWPCpdVGBHmQ"
    "I7l77vmyfFlddMLxGYWVqpCwxESOhYbQd3jidAdA2TQAuj0D9NsGANoCgExKJFxRanjdbF"
    "nC+/rB4fHhyYfG4YkICcqcWY6n4aEVmDAxwNM1tGnghxyGEQFjBZVQ8ZvD2hxBr5hrHJ8h"
    "K0rOko05VqGNDYqt0tMq4LrwCTiI2HwkNg/29ytQftOvm2f69Y6IeicPScUCCBdIN3LVQ5"
    "/krfiGlZmQ5iEb6KlEvKmkjSBdAdZo3xhyzy5j906S586VfhOgdieR57LX/RSHJ/g3L3un"
    "GeyMQ+6zRYStMlYHXIMcP0BtReqeS9wV2s5JW95TRGGwUN0twYpjF5UoPJObYW5FyXvxnz"
    "WUvOYhaPWIM4meGFVL4Pyq3Tf0qy+pddDSjbb01FNrILbuNDKXaraT2vdz46wmN2u3vW47"
    "wEsZt73giCrOuNVkTdDnFBD6CKCVeLjF1pha/sqL5QId/OvFVz+Tv1XA/6KAmFFCAlH1Sg"
    "E+86GHKVioJ0sn/b03W4dL/ArtmWx4h3eF3VlELM+4Qz2EbXKBJgHqc1EUJGZRZxb1+1/V"
    "ntYM8TSWUWxVNykPPs7mhIy6BAFx3oiHT32939RbbS1APYDm3SP0LJBiLj20TjOWWWze5d"
    "bdrAUSaAd85InIsjPsC8awxGUpn8ASKthOXmu1tHe3k9c8vWljnt60Ud6bNnK9KXIhdhah"
    "O0t4Hbz/VrnLH2sZIiO40HgVJ2ygfOtHR3MQFlGlhANfmvCQiu5rjLzhYjrOpL2IdqTVNw"
    "R7O8pu4iCzHWXfugLKRtncyFU+GCTvyLkPIWmlnEY76FxcIwcGiPNqKPn+smZ6KBvKpsuc"
    "o3TkYXOkFYxRkWe3aoqCKmY7RK3svrHkIeoBeSxaZ/N2SImUbS86X3skF9UChKPwDaS7lF"
    "nKlI+CcGmnCX/u97rFhBMp2WYDm7z2u+Zgto6vUyvgShjVnwmzXwQzrYLcwWnR69ZVvhSc"
    "/gGJ7r+o"
)

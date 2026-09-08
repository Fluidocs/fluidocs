from tortoise import fields, models

class ChaveAPI(models.Model):
    id = fields.IntField(pk=True)
    token = fields.CharField(null=False, max_length=255, unique=True)
    nome = fields.CharField(null=False, max_length=60)
    descricao = fields.CharField(null=True, max_length=255)

    usuario = fields.ForeignKeyField(
        'models.Usuario',
        related_name='chaves_api',
        on_delete=fields.CASCADE,
    )

    class Meta:
        table = "chave_api"